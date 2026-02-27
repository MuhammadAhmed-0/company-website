import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname);
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");
const CONTENT_DIR = path.join(ROOT, "content", "blog");

interface BlogPost {
  title: string;
  slug: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  canonical_url: string;
  category: string;
  author_name: string;
  author_role: string;
  author_bio: string;
  date: string;
  read_time: string;
  featured_image: string;
  excerpt: string;
  body: string;
  toc: Array<{ label: string; id: string }>;
  schema_type: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  "AEO": "linear-gradient(135deg,#667eea,#764ba2)",
  "Strategy": "linear-gradient(135deg,#0055ff,#00d4aa)",
  "AI Automation": "linear-gradient(135deg,#f093fb,#f5576c)",
  "GEO": "linear-gradient(135deg,#4facfe,#00f2fe)",
  "Local SEO": "linear-gradient(135deg,#fa709a,#fee140)",
  "Technical SEO": "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "E-commerce SEO": "linear-gradient(135deg,#ffecd2,#fcb69f)",
};

const CATEGORY_LABELS: Record<string, string> = {
  "AEO": "AEO",
  "Strategy": "SEO",
  "AI Automation": "AI",
  "GEO": "GEO",
  "Local SEO": "LOCAL",
  "Technical SEO": "TECH",
  "E-commerce SEO": "ECOM",
};

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

function writeHtml(destPath: string, html: string, depth: number) {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, fixPaths(html, depth));
}

function writeHtmlFromFile(destPath: string, srcPath: string, depth: number) {
  const html = fs.readFileSync(srcPath, "utf-8");
  writeHtml(destPath, html, depth);
}

function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".json"));
  const posts: BlogPost[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
      posts.push(JSON.parse(raw));
    } catch {}
  }
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildBlogCard(post: BlogPost, index: number): string {
  const gradient = CATEGORY_GRADIENTS[post.category] || "linear-gradient(135deg,#667eea,#764ba2)";
  const label = CATEGORY_LABELS[post.category] || post.category;
  const initials = getInitials(post.author_name);
  const stagger = (index % 3) + 1;
  return `<article class="blog-card animate-on-scroll stagger-${stagger}" data-testid="card-blog-${index + 1}" data-category="${post.category}">
      <div class="blog-card__image" style="background:${gradient};display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.5rem;font-weight:800;font-family:var(--font-heading)">${label}</div>
      <div class="blog-card__content">
        <div class="blog-card__meta"><span class="blog-card__category">${post.category}</span><span>${post.read_time || ""}</span></div>
        <h3 class="blog-card__title"><a href="/blog/${post.slug}.html">${post.title}</a></h3>
        <p class="blog-card__excerpt">${post.excerpt}</p>
        <div class="blog-card__author"><div class="blog-card__author-avatar">${initials}</div><div><div class="blog-card__author-name">${post.author_name}</div><div class="blog-card__author-date">${formatDate(post.date)}</div></div></div>
        <a href="/blog/${post.slug}.html" class="blog-card__readmore" data-testid="link-readmore-${index + 1}">Read More <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></a>
      </div>
    </article>`;
}

function buildLatestCard(post: BlogPost, index: number): string {
  const gradient = CATEGORY_GRADIENTS[post.category] || "linear-gradient(135deg,#667eea,#764ba2)";
  const label = CATEGORY_LABELS[post.category] || post.category;
  const initials = getInitials(post.author_name);
  return `<article class="blog-card animate-on-scroll stagger-${index + 1}" data-testid="card-latest-blog-${index + 1}" data-category="${post.category}">
      <div class="blog-card__image" style="background:${gradient};display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.5rem;font-weight:800;font-family:var(--font-heading)">${label}</div>
      <div class="blog-card__content">
        <div class="blog-card__meta"><span class="blog-card__category">${post.category}</span><span>${post.read_time || ""}</span></div>
        <h3 class="blog-card__title"><a href="/blog/${post.slug}.html" data-testid="link-latest-blog-${index + 1}">${post.title}</a></h3>
        <p class="blog-card__excerpt">${post.excerpt}</p>
        <div class="blog-card__author"><div class="blog-card__author-avatar">${initials}</div><div><div class="blog-card__author-name">${post.author_name}</div><div class="blog-card__author-date">${formatDate(post.date)}</div></div></div>
      </div>
    </article>`;
}

function renderBlogPost(template: string, post: BlogPost): string {
  const initials = getInitials(post.author_name);
  const dateFormatted = formatDate(post.date);
  const bodyHtml = marked.parse(post.body) as string;

  let tocHtml = "";
  if (post.toc && post.toc.length > 0) {
    tocHtml = `<div class="blog-post__toc">
      <h4>Table of Contents</h4>
      <ul>
        ${post.toc.map(item => `<li><a href="#${item.id}">${item.label}</a></li>`).join("\n        ")}
      </ul>
    </div>`;
  }

  const schemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": post.schema_type || "Article",
    "headline": post.title,
    "author": {
      "@type": "Person",
      "name": post.author_name,
      "jobTitle": post.author_role || "",
      "url": "/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "RankFlow",
      "url": "/"
    },
    "datePublished": post.date.split("T")[0],
    "dateModified": post.date.split("T")[0],
    "description": post.meta_description
  });

  const breadcrumbTitle = post.title.length > 40 ? post.title.substring(0, 40) + "..." : post.title;

  return template
    .replace(/\{\{TITLE\}\}/g, post.title)
    .replace(/\{\{META_DESCRIPTION\}\}/g, post.meta_description)
    .replace(/\{\{OG_TITLE\}\}/g, post.og_title || post.title)
    .replace(/\{\{OG_DESCRIPTION\}\}/g, post.og_description || post.meta_description)
    .replace(/\{\{CANONICAL_URL\}\}/g, post.canonical_url || `/blog/${post.slug}`)
    .replace(/\{\{AUTHOR_NAME\}\}/g, post.author_name)
    .replace(/\{\{AUTHOR_ROLE\}\}/g, post.author_role || "")
    .replace(/\{\{AUTHOR_BIO\}\}/g, post.author_bio || "")
    .replace(/\{\{AUTHOR_INITIALS\}\}/g, initials)
    .replace(/\{\{CATEGORY\}\}/g, post.category)
    .replace(/\{\{DATE_FORMATTED\}\}/g, dateFormatted)
    .replace(/\{\{READ_TIME\}\}/g, post.read_time || "")
    .replace(/\{\{EXCERPT\}\}/g, post.excerpt)
    .replace(/\{\{BREADCRUMB_TITLE\}\}/g, breadcrumbTitle)
    .replace("{{TOC_HTML}}", tocHtml)
    .replace("{{BODY_HTML}}", bodyHtml)
    .replace("{{SCHEMA_JSON}}", schemaJson);
}

function scanHtmlFiles(dir: string, base: string = ""): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === "admin" || entry.name === "blog") continue;
      results.push(...scanHtmlFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith(".html") && entry.name !== "blog-post.html" && entry.name !== "blog.html") {
      results.push(rel);
    }
  }
  return results;
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

  const posts = getAllPosts();
  console.log(`\n3. Found ${posts.length} blog posts in content/blog/`);

  console.log("4. Generating blog post pages...");
  const blogTemplate = fs.readFileSync(path.join(PUBLIC, "blog-post.html"), "utf-8");
  for (const post of posts) {
    const rendered = renderBlogPost(blogTemplate, post);
    writeHtml(path.join(DIST, "blog", `${post.slug}.html`), rendered, 1);
    console.log(`  blog/${post.slug}.html`);
  }

  console.log("5. Generating blog listing page...");
  let blogListingHtml = fs.readFileSync(path.join(PUBLIC, "blog.html"), "utf-8");
  const blogCardsHtml = posts.map((p, i) => buildBlogCard(p, i)).join("\n    ");
  blogListingHtml = blogListingHtml.replace("{{BLOG_CARDS}}", blogCardsHtml);
  writeHtml(path.join(DIST, "blog", "index.html"), blogListingHtml, 1);
  console.log("  blog/index.html");

  console.log("6. Generating homepage with latest posts...");
  let indexHtml = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf-8");
  const latestPosts = posts.slice(0, 3);
  const latestCardsHtml = latestPosts.map((p, i) => buildLatestCard(p, i)).join("\n    ");
  indexHtml = indexHtml.replace("{{LATEST_POSTS}}", latestCardsHtml);
  writeHtml(path.join(DIST, "index.html"), indexHtml, 0);
  console.log("  index.html");

  console.log("7. Copying other HTML pages...");
  const standalonePages = ["about.html", "contact.html", "case-studies.html"];
  for (const file of standalonePages) {
    const srcPath = path.join(PUBLIC, file);
    if (!fs.existsSync(srcPath)) continue;
    writeHtmlFromFile(path.join(DIST, file), srcPath, 0);
    console.log(`  ${file}`);
  }

  const staticDirs = ["services", "locations", "resources"];
  for (const dir of staticDirs) {
    const srcDir = path.join(PUBLIC, dir);
    if (!fs.existsSync(srcDir)) continue;
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith(".html"));
    for (const file of files) {
      writeHtmlFromFile(path.join(DIST, dir, file), path.join(srcDir, file), 1);
      console.log(`  ${dir}/${file}`);
    }
  }

  console.log("8. Generating sitemap.xml from content...");
  const today = new Date().toISOString().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  const sitemapPages = [
    { p: "/about", pr: "0.6" }, { p: "/contact", pr: "0.6" }, { p: "/case-studies", pr: "0.6" }, { p: "/blog", pr: "0.8" },
  ];
  ["saas-seo", "local-seo", "technical-seo", "ecommerce-seo", "aeo", "geo", "ai-automation"].forEach(s => sitemapPages.push({ p: `/services/${s}`, pr: "0.8" }));
  ["portugal", "london", "dubai", "new-york", "singapore"].forEach(l => sitemapPages.push({ p: `/locations/${l}`, pr: "0.7" }));
  ["tools", "free-resources"].forEach(r => sitemapPages.push({ p: `/resources/${r}`, pr: "0.6" }));

  for (const pg of sitemapPages) {
    xml += `  <url>\n    <loc>${baseUrl}${pg.p}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${pg.pr}</priority>\n  </url>\n`;
  }

  for (const post of posts) {
    const lastmod = post.date.split("T")[0];
    xml += `  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);
  console.log("  sitemap.xml");

  console.log("9. Generating robots.txt...");
  fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
  console.log("  robots.txt");

  console.log("10. Creating 404 page...");
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
