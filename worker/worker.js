/**
 * TikSavePro API – Cloudflare Worker
 *
 *  GET /api?url=<tiktok link>          -> JSON with video / HD / MP3 links
 *  GET /download?u=<file url>&name=x   -> streams the file as a download
 *
 * Video info comes from the public tikwm.com API.
 */

// Sites allowed to call this Worker (your domain)
const ALLOWED_ORIGINS = [
  "https://tiksavepro.online",
  "https://www.tiksavepro.online",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

// Only files from these hosts can be downloaded through /download
// (stops other people from using your Worker as an open proxy)
const ALLOWED_FILE_HOSTS = [
  "tikwm.com",
  "tiktokcdn.com",
  "tiktokcdn-us.com",
  "tiktokcdn-eu.com",
  "tiktokv.com",
  "tiktokv.us",
  "tiktokv.eu",
  "ibytedtos.com",
  "byteoversea.com",
  "muscdn.com",
];

const TIKTOK_RE = /^https?:\/\/([a-z0-9-]+\.)*tiktok\.com\/\S+/i;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request) },
  });
}

function absolute(u) {
  if (!u) return "";
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("/")) return "https://www.tikwm.com" + u;
  return u;
}

function hostAllowed(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return ALLOWED_FILE_HOSTS.some((d) => h === d || h.endsWith("." + d));
  } catch {
    return false;
  }
}

async function handleApi(request, url) {
  const link = (url.searchParams.get("url") || "").trim();
  if (!TIKTOK_RE.test(link)) {
    return json(request, { ok: false, error: "Please paste a valid TikTok video link." }, 400);
  }

  const form = new URLSearchParams({ url: link, hd: "1" });
  let data;
  try {
    const r = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
      body: form.toString(),
    });
    data = await r.json();
  } catch (e) {
    return json(request, { ok: false, error: "Server busy. Please try again in a moment." }, 502);
  }

  if (!data || data.code !== 0 || !data.data) {
    return json(
      request,
      { ok: false, error: (data && data.msg) || "Video not found. Is it public?" },
      404
    );
  }

  const d = data.data;
  return json(request, {
    ok: true,
    id: d.id || "",
    title: d.title || "",
    author: (d.author && (d.author.unique_id || d.author.nickname)) || "",
    cover: absolute(d.origin_cover || d.cover),
    play: absolute(d.play),
    hdplay: absolute(d.hdplay),
    wmplay: absolute(d.wmplay),
    music: absolute(d.music || (d.music_info && d.music_info.play)),
  });
}

async function handleDownload(request, url) {
  const fileUrl = url.searchParams.get("u") || "";
  let name = (url.searchParams.get("name") || "tiksavepro.mp4").replace(/[^\w.\-]+/g, "_");
  if (!/\.(mp4|mp3)$/i.test(name)) name += ".mp4";

  if (!hostAllowed(fileUrl)) {
    return new Response("File host not allowed", { status: 403, headers: corsHeaders(request) });
  }

  const upstream = await fetch(fileUrl, {
    headers: { "User-Agent": UA, Referer: "https://www.tiktok.com/" },
    redirect: "follow",
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("Could not fetch file. Try again.", {
      status: 502,
      headers: corsHeaders(request),
    });
  }

  const headers = new Headers(corsHeaders(request));
  headers.set(
    "Content-Type",
    upstream.headers.get("Content-Type") ||
      (name.endsWith(".mp3") ? "audio/mpeg" : "video/mp4")
  );
  const len = upstream.headers.get("Content-Length");
  if (len) headers.set("Content-Length", len);
  headers.set("Content-Disposition", `attachment; filename="${name}"`);
  headers.set("Cache-Control", "no-store");

  return new Response(upstream.body, { status: 200, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/api") return handleApi(request, url);
    if (url.pathname === "/download") return handleDownload(request, url);

    return new Response("TikSavePro API is running.", {
      headers: { "Content-Type": "text/plain", ...corsHeaders(request) },
    });
  },
};
