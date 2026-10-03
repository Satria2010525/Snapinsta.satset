const urlInput = document.getElementById("urlInput");
const processBtn = document.getElementById("processBtn");
const btnText = processBtn.querySelector(".btn-text");
const spinner = processBtn.querySelector(".spinner");
const clearBtn = document.getElementById("clearBtn");
const message = document.getElementById("message");

const resultSection = document.getElementById("resultSection");
const thumbnail = document.getElementById("thumbnail");
const videoTitle = document.getElementById("videoTitle");
const uploader = document.getElementById("uploader");
const duration = document.getElementById("duration");
const downloadBtn = document.getElementById("downloadBtn");
const newBtn = document.getElementById("newBtn");

let currentUrl = "";

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `message ${type}`;
}

function hideMessage() {
  message.className = "message hidden";
  message.textContent = "";
}

function setLoading(loading) {
  processBtn.disabled = loading;
  btnText.classList.toggle("hidden", loading);
  spinner.classList.toggle("hidden", !loading);
}

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(Number(seconds))) return "00:00";

  const total = Math.floor(Number(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function validInstagramUrl(value) {
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

function updateClearButton() {
  clearBtn.style.display = urlInput.value.trim() ? "block" : "none";
}

async function processVideo() {
  const url = urlInput.value.trim();

  hideMessage();

  if (!url) {
    showMessage("Masukkan URL Instagram terlebih dahulu.");
    urlInput.focus();
    return;
  }

  if (!validInstagramUrl(url)) {
    showMessage("URL tidak valid. Contoh: https://www.instagram.com/reel/...");
    urlInput.focus();
    return;
  }

  currentUrl = url;
  setLoading(true);
  resultSection.classList.add("hidden");

  try {
    const response = await fetch("/api/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Video tidak dapat diproses.");
    }

    const data = result.data;

    videoTitle.textContent = data.title || "Instagram Video";
    uploader.textContent = data.uploader ? `@${data.uploader}` : "";
    duration.textContent = formatDuration(data.duration);

    if (data.thumbnail) {
      thumbnail.src = data.thumbnail;
      thumbnail.alt = data.title || "Instagram Video";
    } else {
      thumbnail.removeAttribute("src");
    }

    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({ behavior: "smooth", block: "center" });

    showMessage("Video berhasil ditemukan. Kamu bisa melanjutkan download.", "success");
  } catch (error) {
    showMessage(error.message || "Terjadi kesalahan pada server.");
  } finally {
    setLoading(false);
  }
}

async function downloadVideo() {
  if (!currentUrl) return;

  const original = downloadBtn.innerHTML;
  downloadBtn.disabled = true;
  downloadBtn.innerHTML = "⏳ Menyiapkan video...";

  try {
    const response = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: currentUrl })
    });

    if (!response.ok) {
      let errorMessage = "Download gagal.";

      try {
        const data = await response.json();
        errorMessage = data.message || errorMessage;
      } catch {}

      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = "instagram-video.mp4";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    showMessage("Video berhasil diunduh.", "success");
  } catch (error) {
    showMessage(error.message || "Download gagal.");
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = original;
  }
}

urlInput.addEventListener("input", updateClearButton);

urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    processVideo();
  }
});

clearBtn.addEventListener("click", () => {
  urlInput.value = "";
  currentUrl = "";
  resultSection.classList.add("hidden");
  hideMessage();
  updateClearButton();
  urlInput.focus();
});

processBtn.addEventListener("click", processVideo);
downloadBtn.addEventListener("click", downloadVideo);

newBtn.addEventListener("click", () => {
  resultSection.classList.add("hidden");
  urlInput.value = "";
  currentUrl = "";
  hideMessage();
  updateClearButton();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => urlInput.focus(), 400);
});

updateClearButton();
