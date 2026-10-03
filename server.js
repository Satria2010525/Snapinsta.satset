const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const youtubedl = require("youtube-dl-exec");
const ffmpegPath = require("ffmpeg-static");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DOWNLOAD_DIR = path.join(__dirname, "downloads");

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(PUBLIC_DIR));

function isInstagramUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return (
      (host === "instagram.com" || host.endsWith(".instagram.com")) &&
      /^\/(reel|reels|p|tv)\//i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function cleanName(name) {
  return String(name || "instagram-video")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "instagram-video";
}

function removeFile(file) {
  fs.unlink(file, () => {});
}

app.post("/api/info", async (req, res) => {
  const url = String(req.body?.url || "").trim();

  if (!isInstagramUrl(url)) {
    return res.status(400).json({
      success: false,
      message: "Masukkan URL Instagram Reels, Post, atau Video yang valid."
    });
  }

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      skipDownload: true,
      preferFreeFormats: true,
      noPlaylist: true
    });

    res.json({
      success: true,
      data: {
        title: info.title || "Instagram Video",
        thumbnail: info.thumbnail || "",
        uploader: info.uploader || info.channel || "",
        duration: info.duration || 0,
        webpageUrl: info.webpage_url || url
      }
    });
  } catch (error) {
    console.error(error.stderr || error.message || error);

    res.status(500).json({
      success: false,
      message:
        "Video tidak dapat diakses. Pastikan URL bersifat publik dan masih tersedia. Beberapa konten Instagram memerlukan autentikasi."
    });
  }
});

app.post("/api/download", async (req, res) => {
  const url = String(req.body?.url || "").trim();

  if (!isInstagramUrl(url)) {
    return res.status(400).json({
      success: false,
      message: "URL Instagram tidak valid."
    });
  }

  const id = crypto.randomBytes(8).toString("hex");
  const outputTemplate = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);

  try {
    await youtubedl(url, {
      output: outputTemplate,
      format: "bestvideo+bestaudio/best",
      mergeOutputFormat: "mp4",
      noPlaylist: true,
      noWarnings: true,
      noCheckCertificates: true,
      restrictFilenames: true,
      ffmpegLocation: ffmpegPath
    });

    const possibleFiles = fs
      .readdirSync(DOWNLOAD_DIR)
      .filter((file) => file.startsWith(id + "."));

    if (!possibleFiles.length) {
      throw new Error("File hasil download tidak ditemukan.");
    }

    const filePath = path.join(DOWNLOAD_DIR, possibleFiles[0]);
    const finalName = cleanName(`instagram-video-${id}`) + path.extname(filePath);

    res.download(filePath, finalName, (err) => {
      removeFile(filePath);
      if (err && !res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Gagal mengirim file hasil download."
        });
      }
    });
  } catch (error) {
    console.error(error.stderr || error.message || error);

    // Bersihkan file sementara jika proses gagal.
    fs.readdirSync(DOWNLOAD_DIR)
      .filter((file) => file.startsWith(id + "."))
      .forEach((file) => removeFile(path.join(DOWNLOAD_DIR, file)));

    res.status(500).json({
      success: false,
      message:
        "Download gagal. Pastikan konten Instagram dapat diakses secara publik dan Anda memiliki hak untuk mengunduhnya."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\nInstagram Downloader berjalan di: http://localhost:${PORT}`);
  console.log("Tekan Ctrl+C untuk menghentikan server.\n");
});
module.exports = app;