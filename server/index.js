const http = require("http");
const { PORT } = require("./config.js");
const { orchestrateSearch } = require("./services/searchOrchestrator.js");

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Body too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    writeJson(response, 404, { error: "not_found" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && request.url === "/api/search") {
    const controller = new AbortController();
    request.on("aborted", () => controller.abort());

    try {
      const payload = await readJson(request);
      const result = await orchestrateSearch(payload, { signal: controller.signal });
      writeJson(response, result.statusCode, result.body);
      return;
    } catch (error) {
      writeJson(response, 400, {
        error: "bad_request",
        message: error.message
      });
      return;
    }
  }

  writeJson(response, 404, { error: "not_found" });
});

server.listen(PORT, () => {
  console.log(`Search API listening on http://localhost:${PORT}`);
});
