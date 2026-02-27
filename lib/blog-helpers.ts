import fs from "fs";
import path from "path";

export const CATEGORY_GRADIENTS: Record<string, string> = {
  "AEO": "linear-gradient(135deg,#667eea,#764ba2)",
  "Strategy": "linear-gradient(135deg,#0055ff,#00d4aa)",
  "AI Automation": "linear-gradient(135deg,#f093fb,#f5576c)",
  "GEO": "linear-gradient(135deg,#4facfe,#00f2fe)",
  "Local SEO": "linear-gradient(135deg,#fa709a,#fee140)",
  "Technical SEO": "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "E-commerce SEO": "linear-gradient(135deg,#ffecd2,#fcb69f)",
};

export const CATEGORY_LABELS: Record<string, string> = {
  "AEO": "AEO",
  "Strategy": "SEO",
  "AI Automation": "AI",
  "GEO": "GEO",
  "Local SEO": "LOCAL",
  "Technical SEO": "TECH",
  "E-commerce SEO": "ECOM",
};

export interface BlogPost {
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

export function getAllPosts(contentDir: string): BlogPost[] {
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith(".json"));
  const posts: BlogPost[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(contentDir, file), "utf-8");
      posts.push(JSON.parse(raw));
    } catch {}
  }
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

export function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function buildBlogCard(post: BlogPost, index: number): string {
  const gradient = CATEGORY_GRADIENTS[post.category] || "linear-gradient(135deg,#667eea,#764ba2)";
  const label = CATEGORY_LABELS[post.category] || post.category;
  const initials = getInitials(post.author_name);
  const stagger = (index % 3) + 1;
  return `<article class="blog-card animate-on-scroll stagger-${stagger}" data-testid="card-blog-${index + 1}" data-category="${post.category}">
      <div class="blog-card__image" style="background:${gradient};display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.5rem;font-weight:800;font-family:var(--font-heading)">${label}</div>
      <div class="blog-card__content">
        <div class="blog-card__meta"><span class="blog-card__category">${post.category}</span><span>${post.read_time || ""}</span></div>
        <h3 class="blog-card__title"><a href="/blog/${post.slug}">${post.title}</a></h3>
        <p class="blog-card__excerpt">${post.excerpt}</p>
        <div class="blog-card__author"><div class="blog-card__author-avatar">${initials}</div><div><div class="blog-card__author-name">${post.author_name}</div><div class="blog-card__author-date">${formatDate(post.date)}</div></div></div>
        <a href="/blog/${post.slug}" class="blog-card__readmore" data-testid="link-readmore-${index + 1}">Read More <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></a>
      </div>
    </article>`;
}

export function buildLatestCard(post: BlogPost, index: number): string {
  const gradient = CATEGORY_GRADIENTS[post.category] || "linear-gradient(135deg,#667eea,#764ba2)";
  const label = CATEGORY_LABELS[post.category] || post.category;
  const initials = getInitials(post.author_name);
  return `<article class="blog-card animate-on-scroll stagger-${index + 1}" data-testid="card-latest-blog-${index + 1}" data-category="${post.category}">
      <div class="blog-card__image" style="background:${gradient};display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.5rem;font-weight:800;font-family:var(--font-heading)">${label}</div>
      <div class="blog-card__content">
        <div class="blog-card__meta"><span class="blog-card__category">${post.category}</span><span>${post.read_time || ""}</span></div>
        <h3 class="blog-card__title"><a href="/blog/${post.slug}" data-testid="link-latest-blog-${index + 1}">${post.title}</a></h3>
        <p class="blog-card__excerpt">${post.excerpt}</p>
        <div class="blog-card__author"><div class="blog-card__author-avatar">${initials}</div><div><div class="blog-card__author-name">${post.author_name}</div><div class="blog-card__author-date">${formatDate(post.date)}</div></div></div>
      </div>
    </article>`;
}

export function buildPaginationPath(currentPage: number, totalPages: number): string {
  if (totalPages <= 1) return "";
  let html = `<div class="pagination" data-testid="blog-pagination">`;
  if (currentPage > 1) {
    const prevHref = currentPage === 2 ? "/blog" : `/blog/page/${currentPage - 1}`;
    html += `<a href="${prevHref}" data-testid="pagination-prev">&laquo; Prev</a>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<span class="active">${i}</span>`;
    } else {
      const href = i === 1 ? "/blog" : `/blog/page/${i}`;
      html += `<a href="${href}">${i}</a>`;
    }
  }
  if (currentPage < totalPages) {
    html += `<a href="/blog/page/${currentPage + 1}" data-testid="pagination-next">Next &raquo;</a>`;
  }
  html += `</div>`;
  return html;
}

export function buildPaginationQuery(currentPage: number, totalPages: number): string {
  if (totalPages <= 1) return "";
  let html = `<div class="pagination" data-testid="blog-pagination">`;
  if (currentPage > 1) {
    html += `<a href="/blog?page=${currentPage - 1}" data-testid="pagination-prev">&laquo; Prev</a>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<span class="active">${i}</span>`;
    } else {
      html += `<a href="/blog?page=${i}">${i}</a>`;
    }
  }
  if (currentPage < totalPages) {
    html += `<a href="/blog?page=${currentPage + 1}" data-testid="pagination-next">Next &raquo;</a>`;
  }
  html += `</div>`;
  return html;
}

export function renderBlogPost(template: string, post: BlogPost, bodyHtml: string): string {
  const initials = getInitials(post.author_name);
  const dateFormatted = formatDate(post.date);

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

export function scanHtmlFiles(dir: string, base: string = ""): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === "admin") continue;
      results.push(...scanHtmlFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith(".html") && entry.name !== "blog-post.html") {
      results.push(rel);
    }
  }
  return results;
}
