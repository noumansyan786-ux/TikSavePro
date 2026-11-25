(function () {
  "use strict";

  const API = (window.TIKSAVE_API || "").replace(/\/+$/, "");

  const form = document.getElementById("dl-form");
  const input = document.getElementById("url");
  const goBtn = document.getElementById("go-btn");
  const pasteBtn = document.getElementById("paste-btn");
  const statusEl = document.getElementById("status");
  const result = document.getElementById("result");

  const el = (id) => document.getElementById(id);
  document.getElementById("year").textContent = new Date().getFullYear();

  const TIKTOK_RE = /^https?:\/\/([a-z0-9-]+\.)*tiktok\.com\/\S+/i;

  function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("error", !!isError);
  }

  function safeName(s) {
    return (s || "tiktok").replace(/[^\w\-]+/g, "_").slice(0, 60) || "tiktok";
  }

  // Link that goes through the Worker so the browser saves the file
  function downloadLink(fileUrl, filename) {
    return API + "/download?u=" + encodeURIComponent(fileUrl) +
           "&name=" + encodeURIComponent(filename);
  }

  function setButton(id, fileUrl, filename) {
    const a = el(id);
    if (fileUrl) {
      a.href = downloadLink(fileUrl, filename);
      a.classList.remove("hidden");
    } else {
      a.removeAttribute("href");
      a.classList.add("hidden");
    }
  }

  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) input.value = text.trim();
      input.focus();
    } catch (e) {
      input.focus();
      setStatus("Press and hold in the box to paste.", false);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const link = input.value.trim();
    result.classList.add("hidden");

    if (!TIKTOK_RE.test(link)) {
      setStatus("Please paste a valid TikTok video link.", true);
      return;
    }
    if (!API || API.includes("YOUR-SUBDOMAIN")) {
      setStatus("Site setup not finished: set your Worker URL in config.js.", true);
      return;
    }

    goBtn.disabled = true;
    goBtn.textContent = "Loading...";
    setStatus("Fetching video, please wait...");

    try {
      const res = await fetch(API + "/api?url=" + encodeURIComponent(link));
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not get this video.");

      const base = "tiksavepro_" + safeName(data.id);

      el("r-cover").src = data.cover || "";
      el("r-title").textContent = data.title || "TikTok video";
      el("r-author").textContent = data.author ? "@" + data.author : "";

      setButton("b-video", data.play, base + ".mp4");
      setButton("b-hd", data.hdplay && data.hdplay !== data.play ? data.hdplay : "", base + "_hd.mp4");
      setButton("b-mp3", data.music, base + ".mp3");
      setButton("b-wm", data.wmplay, base + "_wm.mp4");

      result.classList.remove("hidden");
      setStatus("");
    } catch (err) {
      setStatus(err.message || "Something went wrong. Try again.", true);
    } finally {
      goBtn.disabled = false;
      goBtn.textContent = "Download";
    }
  });
})();
