const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const srcDir = path.join(rootDir, "src");
const stylesDir = path.join(rootDir, "styles");

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(path.join(distDir, "src"), { recursive: true });
fs.mkdirSync(path.join(distDir, "styles"), { recursive: true });

fs.copyFileSync(path.join(rootDir, "index.html"), path.join(distDir, "index.html"));
fs.cpSync(srcDir, path.join(distDir, "src"), { recursive: true });
fs.cpSync(stylesDir, path.join(distDir, "styles"), { recursive: true });

const searchApiOrigin = process.env.SEARCH_API_ORIGIN || "";
fs.writeFileSync(
  path.join(distDir, "runtime-config.js"),
  `window.__LOCAL_EXPLORER_API_ORIGIN__ = ${JSON.stringify(searchApiOrigin)};\n`,
  "utf8"
);

console.log(`Built static site into ${distDir}`);
