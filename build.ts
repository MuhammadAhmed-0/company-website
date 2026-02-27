import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname);
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");

function cleanDist() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });
}

function copyDir(src: string, dest: string, exclude: string[] = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, []);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getRelativePrefix(depth: number): string {
  if (depth === 0) return "./";
  return "../".repeat(depth);
}

function fixPaths(html: string, depth: number): string {
  const prefix = getRelativePrefix(depth);
  return html
    .replace(/href="\/css\//g, `href="${prefix}css/`)
    .replace(/href="\/js\//g, `href="${prefix}js/`)
    .replace(/src="\/js\//g, `src="${prefix}js/`)
    .replace(/href="\/images\//g, `href="${prefix}images/`)
    .replace(/src="\/images\//g, `src="${prefix}images/`)
    .replace(/href="\/uploads\//g, `href="${prefix}uploads/`)
    .replace(/src="\/uploads\//g, `src="${prefix}uploads/`)
    .replace(/href="\/services\/([\w-]+)(\.html)?"/g, `href="${prefix}services/$1.html"`)
    .replace(/href="\/locations\/([\w-]+)(\.html)?"/g, `href="${prefix}locations/$1.html"`)
    .replace(/href="\/resources\/([\w-]+)(\.html)?"/g, `href="${prefix}resources/$1.html"`)
    .replace(/href="\/blog\/([\w-]+)(\.html)?"/g, `href="${prefix}blog/$1.html"`)
    .replace(/href="\/blog"/g, `href="${prefix}blog/index.html"`)
    .replace(/href="\/about(\.html)?"/g, `href="${prefix}about.html"`)
    .replace(/href="\/contact(\.html)?"/g, `href="${prefix}contact.html"`)
    .replace(/href="\/case-studies(\.html)?"/g, `href="${prefix}case-studies.html"`)
    .replace(/href="\/"/g, `href="${prefix}index.html"`)
    ;
}

function writeHtml(destPath: string, srcPath: string, depth: number) {
  const html = fs.readFileSync(srcPath, "utf-8");
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, fixPaths(html, depth));
}

function main() {
  const baseUrl = process.argv[2] || "https://rankflow.pages.dev";

  console.log("RankFlow Static Site Build");
  console.log("=========================");
  console.log(`Base URL: ${baseUrl}`);
  console.log("");

  console.log("1. Cleaning dist/...");
  cleanDist();

  console.log("2. Copying static assets...");
  copyDir(path.join(PUBLIC, "css"), path.join(DIST, "css"));
  copyDir(path.join(PUBLIC, "js"), path.join(DIST, "js"));
  copyDir(path.join(PUBLIC, "images"), path.join(DIST, "images"));
  copyDir(path.join(PUBLIC, "data"), path.join(DIST, "data"));
  copyDir(path.join(PUBLIC, "admin"), path.join(DIST, "admin"));
  copyDir(path.join(PUBLIC, "uploads"), path.join(DIST, "uploads"));

  console.log("3. Copying HTML pages...");

  writeHtml(path.join(DIST, "index.html"), path.join(PUBLIC, "index.html"), 0);
  console.log("  index.html");

  const standalonePages = ["about.html", "contact.html", "case-studies.html"];
  for (const file of standalonePages) {
    const srcPath = path.join(PUBLIC, file);
    if (!fs.existsSync(srcPath)) continue;
    writeHtml(path.join(DIST, file), srcPath, 0);
    console.log(`  ${file}`);
  }

  const staticDirs = ["services", "locations", "resources"];
  for (const dir of staticDirs) {
    const srcDir = path.join(PUBLIC, dir);
    if (!fs.existsSync(srcDir)) continue;
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith(".html"));
    for (const file of files) {
      writeHtml(path.join(DIST, dir, file), path.join(srcDir, file), 1);
      console.log(`  ${dir}/${file}`);
    }
  }

  console.log("4. Copying blog pages...");
  const blogDir = path.join(PUBLIC, "blog");
  if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith(".html"));
    for (const file of blogFiles) {
      writeHtml(path.join(DIST, "blog", file), path.join(blogDir, file), 1);
      console.log(`  blog/${file}`);
    }
  }

  console.log("5. Generating sitemap.xml...");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n`;

  const sitemapPages = [
    { p: "/about", pr: "0.6" }, { p: "/contact", pr: "0.6" }, { p: "/case-studies", pr: "0.6" }, { p: "/blog", pr: "0.8" },
  ];
  ["saas-seo", "local-seo", "technical-seo", "ecommerce-seo", "aeo", "geo", "ai-automation"].forEach(s => sitemapPages.push({ p: `/services/${s}`, pr: "0.8" }));
  ["portugal", "london", "dubai", "new-york", "singapore"].forEach(l => sitemapPages.push({ p: `/locations/${l}`, pr: "0.7" }));
  ["tools", "free-resources"].forEach(r => sitemapPages.push({ p: `/resources/${r}`, pr: "0.6" }));

  for (const pg of sitemapPages) {
    xml += `  <url><loc>${baseUrl}${pg.p}</loc><changefreq>monthly</changefreq><priority>${pg.pr}</priority></url>\n`;
  }

  if (fs.existsSync(blogDir)) {
    const blogPosts = fs.readdirSync(blogDir).filter(f => f.endsWith(".html") && f !== "index.html");
    for (const file of blogPosts) {
      const slug = file.replace(".html", "");
      xml += `  <url><loc>${baseUrl}/blog/${slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
    }
  }

  xml += `</urlset>`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);
  console.log("  sitemap.xml");

  console.log("6. Generating robots.txt...");
  fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
  console.log("  robots.txt");

  console.log("7. Creating 404 page...");
  const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Page Not Found | RankFlow</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="icon" href="./images/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="./css/style.css">
</head>
<body>
<header class="header" style="position:relative;background:var(--dark)">
<div class="container">
<nav class="nav">
  <a href="./index.html" class="nav__logo"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="currentColor" stroke-width="2"/><path d="M9 18l3-8 3 5 4-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Rank<span>Flow</span></a>
  <div class="header__cta"><a href="./index.html" class="btn btn--primary">Back to Home</a></div>
</nav>
</div>
</header>
<section class="hero hero--page" style="min-height:60vh;display:flex;align-items:center">
<div class="container">
  <div class="hero__content" style="text-align:center">
    <h1 class="hero__title" style="font-size:6rem;margin-bottom:16px">404</h1>
    <p class="hero__subtitle" style="margin-bottom:32px">The page you're looking for doesn't exist or has been moved.</p>
    <a href="./index.html" class="btn btn--primary btn--lg">Back to Homepage</a>
  </div>
</div>
</section>
<footer class="footer">
<div class="container">
  <div class="footer__bottom"><p>&copy; 2026 RankFlow. All rights reserved.</p></div>
</div>
</footer>
<script src="./js/main.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(DIST, "404.html"), notFoundHtml);
  console.log("  404.html");

  console.log("");
  console.log("Build complete! Output in dist/");

  let fileCount = 0;
  function countFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) countFiles(path.join(dir, e.name));
      else fileCount++;
    }
  }
  countFiles(DIST);
  console.log(`Total files: ${fileCount}`);
}

main();
