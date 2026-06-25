#!/usr/bin/env node
const http = require("node:http");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT ?? 8787);
const PUBLIC_DIR = __dirname;
const DATA_FILE = process.env.DATA_FILE ?? path.join(__dirname, "data", "progress.json");
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";

const publicFiles = new Set(["/", "/index.html", "/styles.css", "/app.js", "/config.js"]);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

let writeQueue = Promise.resolve();

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  response.end(payload);
}

function sendStatic(response, status, body, filePath) {
  response.writeHead(status, {
    "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  response.end(body);
}

async function readProgress() {
  try {
    return JSON.parse(await readFile(DATA_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function writeProgress(progress) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(progress, null, 2)}\n`, "utf8");
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function handleProgressRequest(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, await readProgress());
    return;
  }

  if (request.method === "PUT") {
    const nextProgress = JSON.parse(await readRequestBody(request));
    if (!nextProgress || typeof nextProgress !== "object" || Array.isArray(nextProgress)) {
      sendJson(response, 400, { error: "Progress must be a JSON object." });
      return;
    }

    writeQueue = writeQueue.then(() => writeProgress(nextProgress));
    await writeQueue;
    sendJson(response, 200, nextProgress);
    return;
  }

  sendJson(response, 405, { error: "Method not allowed" });
}

async function handleStaticRequest(url, response) {
  if (!publicFiles.has(url.pathname)) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(PUBLIC_DIR, requestedPath);

  try {
    sendStatic(response, 200, await readFile(filePath), filePath);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      sendJson(response, 404, { error: "Not found" });
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname === "/progress") {
      await handleProgressRequest(request, response);
      return;
    }

    await handleStaticRequest(url, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Checklist app running at http://localhost:${PORT}`);
  console.log(`Saving progress to ${DATA_FILE}`);
});
