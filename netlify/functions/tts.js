const crypto = require("crypto");
const { WebSocket } = require("./vendor/ws");
const { PHONETICS } = require("./phonetics.js");

const TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WIN_EPOCH = 11644473600;
const GEC_VERSION = "1-143.0.3650.75";

const VOICES = {
  en: "en-IN-NeerjaNeural",
  hi: "hi-IN-SwaraNeural",
  mr: "mr-IN-AarohiNeural",
  gu: "gu-IN-DhwaniNeural",
  ta: "ta-IN-PallaviNeural",
  te: "te-IN-ShrutiNeural",
  pa: "hi-IN-SwaraNeural",
  bn: "bn-IN-TanishaaNeural",
};

const cache = new Map();
const CACHE_MAX = 80;

function secMsGec() {
  let ticks = Date.now() / 1000 + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks = Math.floor(ticks * 1e7);
  return crypto.createHash("sha256").update(String(ticks) + TOKEN).digest("hex").toUpperCase();
}

function uuid() {
  return crypto.randomUUID().replace(/-/g, "");
}

function jsDate() {
  return new Date()
    .toUTCString()
    .replace(",", "")
    .replace("GMT", "GMT+0000 (Coordinated Universal Time)");
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gurmukhiToDevanagari(text) {
  return text.replace(/[\u0A00-\u0A7F]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x0100),
  );
}

/** Spoken form only — Edge TTS does not reliably honour IPA <phoneme> tags. */
function spokenForm(text) {
  let out = String(text);
  const terms = Object.keys(PHONETICS).sort((a, b) => b.length - a.length);
  for (const term of terms) {
    const entry = PHONETICS[term];
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    out = out.replace(re, entry.respelling);
  }
  return out;
}

function prepare(lang, text) {
  const id = VOICES[lang] ? lang : "en";
  let speak = spokenForm(text);
  if (id === "pa") speak = gurmukhiToDevanagari(speak);
  return { voice: VOICES[id], speak: speak.slice(0, 3500) };
}

function synthesize(text, voice) {
  const connId = uuid();
  const url =
    `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?TrustedClientToken=${TOKEN}&ConnectionId=${connId}` +
    `&Sec-MS-GEC=${secMsGec()}&Sec-MS-GEC-Version=${encodeURIComponent(GEC_VERSION)}`;

  const headers = {
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
    Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
    "Accept-Language": "en-US,en;q=0.9",
  };

  return new Promise((resolve, reject) => {
    const chunks = [];
    const ws = new WebSocket(url, { headers, perMessageDeflate: false });
    const timer = setTimeout(() => {
      try { ws.terminate(); } catch (_) {}
      if (chunks.length) resolve(Buffer.concat(chunks));
      else reject(new Error("TTS timed out"));
    }, 12000);

    const finish = (err) => {
      clearTimeout(timer);
      try { ws.close(); } catch (_) {}
      if (err && !chunks.length) reject(err);
      else resolve(Buffer.concat(chunks));
    };

    ws.on("open", () => {
      const ts = jsDate();
      ws.send(
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`,
      );
      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
        `<voice name='${voice}'><prosody rate='-2%'>${escapeXml(text)}</prosody></voice></speak>`;
      ws.send(
        `X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${ssml}`,
      );
    });

    ws.on("message", (data, isBinary) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const needle = Buffer.from("Path:audio\r\n");
      const idx = buf.indexOf(needle);
      if (idx >= 0) {
        const audio = buf.slice(idx + needle.length);
        if (audio.length) chunks.push(audio);
      } else if (isBinary && buf.length) {
        chunks.push(buf);
      }
      if (buf.toString("utf8").includes("Path:turn.end")) finish();
    });

    ws.on("error", (err) => finish(err));
    ws.on("close", () => finish());
  });
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "POST only" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: cors, body: "Invalid JSON" };
  }

  const text = String(body.text || "").trim();
  const lang = String(body.lang || "en");
  if (!text) {
    return { statusCode: 400, headers: cors, body: "Missing text" };
  }

  const { voice, speak } = prepare(lang, text);
  const key = `${lang}::${speak}`;
  if (cache.has(key)) {
    const hit = cache.get(key);
    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "audio/mpeg", "X-TTS-Cache": "hit" },
      body: hit.toString("base64"),
      isBase64Encoded: true,
    };
  }

  try {
    const audio = await synthesize(speak, voice);
    if (!audio.length) {
      return { statusCode: 502, headers: cors, body: "Empty audio" };
    }
    cache.set(key, audio);
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "audio/mpeg", "X-TTS-Voice": voice },
      body: audio.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: cors,
      body: String(err && err.message ? err.message : err),
    };
  }
};
