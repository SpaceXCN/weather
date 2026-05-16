const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
};

const siteLinks = [
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
  '</llms.txt>; rel="llms-txt"; type="text/markdown"',
  '</index.md>; rel="alternate"; type="text/markdown"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
].join(", ");

const server = http.createServer((req, res) => {
  const url = new URL(req.url, originFor(req));
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/" && wantsMarkdown(req)) {
    return sendFile(res, "index.md", {
      "Content-Type": types[".md"],
      Link: siteLinks,
      Vary: "Accept",
    }, req.method);
  }

  if (pathname === "/") {
    return sendFile(res, "index.html", {
      Link: siteLinks,
      Vary: "Accept",
    }, req.method);
  }

  if (pathname === "/robots.txt") {
    return sendText(res, dynamicRobots(req), {
      "Content-Type": types[".txt"],
    }, req.method);
  }

  if (pathname === "/sitemap.xml") {
    return sendText(res, dynamicSitemap(req), {
      "Content-Type": types[".xml"],
    }, req.method);
  }

  if (pathname === "/.well-known/api-catalog") {
    return sendText(res, apiCatalog(req), {
      "Content-Type": "application/linkset+json; charset=utf-8",
      Link: siteLinks,
    }, req.method);
  }

  const file = safePath(pathname);
  if (!file) {
    return sendText(res, "Forbidden", { "Content-Type": types[".txt"] }, req.method, 403);
  }

  return sendFile(res, file, {}, req.method);
});

server.listen(port, host, () => {
  console.log(`China Weather Desk: http://${host}:${port}/`);
});

function wantsMarkdown(req) {
  const accept = req.headers.accept || "";
  return accept.includes("text/markdown") && !accept.includes("text/html");
}

function safePath(pathname) {
  let file = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  file = path.normalize(file);

  if (!file || file.startsWith("..") || path.isAbsolute(file)) {
    return null;
  }

  return file;
}

function sendFile(res, file, headers = {}, method = "GET") {
  const full = path.join(root, file);

  fs.readFile(full, (error, data) => {
    if (error) {
      return sendText(res, "Not found", { "Content-Type": types[".txt"] }, method, 404);
    }

    const contentType = headers["Content-Type"] || types[path.extname(full)] || "application/octet-stream";
    sendBuffer(res, data, { ...headers, "Content-Type": contentType }, method);
  });
}

function sendText(res, text, headers = {}, method = "GET", status = 200) {
  sendBuffer(res, Buffer.from(text, "utf8"), headers, method, status);
}

function sendBuffer(res, buffer, headers = {}, method = "GET", status = 200) {
  res.writeHead(status, {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });

  if (method !== "HEAD") {
    res.end(buffer);
  } else {
    res.end();
  }
}

function originFor(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const requestHost = req.headers["x-forwarded-host"] || req.headers.host || `${host}:${port}`;
  return `${proto}://${requestHost}`;
}

function dynamicRobots(req) {
  return `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Content-Signal: search=yes, ai-input=yes, ai-train=no
Sitemap: ${originFor(req)}/sitemap.xml
`;
}

function dynamicSitemap(req) {
  const origin = originFor(req);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>2026-05-13</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/index.md</loc>
    <lastmod>2026-05-13</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
`;
}

function apiCatalog(req) {
  const origin = originFor(req);
  return JSON.stringify({
    linkset: [
      {
        anchor: `${origin}/`,
        describedby: [
          {
            href: `${origin}/index.md`,
            type: "text/markdown",
            title: "China Weather Desk markdown description",
          },
          {
            href: `${origin}/llms.txt`,
            type: "text/markdown",
            title: "Agent-readable site overview",
          },
        ],
        "service-doc": [
          {
            href: "https://open-meteo.com/en/docs",
            type: "text/html",
            title: "Open-Meteo Forecast API documentation",
          },
          {
            href: "https://open-meteo.com/en/docs/geocoding-api",
            type: "text/html",
            title: "Open-Meteo Geocoding API documentation",
          },
        ],
        alternate: [
          {
            href: `${origin}/index.md`,
            type: "text/markdown",
            title: "Markdown version",
          },
        ],
      },
    ],
  }, null, 2);
}
