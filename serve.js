import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const publicDir = path.resolve(__dirname, 'public');
const contentDir = path.resolve(__dirname, 'content', 'blog');

const CATEGORY_GRADIENTS = {
  "AEO": "linear-gradient(135deg,#667eea,#764ba2)",
  "Strategy": "linear-gradient(135deg,#0055ff,#00d4aa)",
  "AI Automation": "linear-gradient(135deg,#f093fb,#f5576c)",
  "GEO": "linear-gradient(135deg,#4facfe,#00f2fe)",
  "Local SEO": "linear-gradient(135deg,#fa709a,#fee140)",
  "Technical SEO": "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "E-commerce SEO": "linear-gradient(135deg,#ffecd2,#fcb69f)",
};

const CATEGORY_LABELS = {
  "AEO": "AEO",
  "Strategy": "SEO",
  "AI Automation": "AI",
  "GEO": "GEO",
  "Local SEO": "LOCAL",
  "Technical SEO": "TECH",
  "E-commerce SEO": "ECOM",
};

function getAllPosts() {
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.json'));
  const posts = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(contentDir, file), 'utf-8');
      posts.push(JSON.parse(raw));
    } catch {}
  }
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildBlogCard(post, index) {
  const gradient = CATEGORY_GRADIENTS[post.category] || "linear-gradient(135deg,#667eea,#764ba2)";
  const label = CATEGORY_LABELS[post.category] || post.category;
  const initials = getInitials(post.author_name);
  const stagger = (index % 3) + 1;
  const imageHtml = post.featured_image
    ? `<div class="blog-card__image"><img src="${post.featured_image}" alt="${post.title}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>`
    : `<div class="blog-card__image" style="background:${gradient};display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.5rem;font-weight:800;font-family:var(--font-heading)">${label}</div>`;
  return `<article class="blog-card animate-on-scroll stagger-${stagger}" data-testid="card-blog-${index + 1}" data-category="${post.category}">
      ${imageHtml}
      <div class="blog-card__content">
        <div class="blog-card__meta"><span class="blog-card__category">${post.category}</span><span>${post.read_time || ""}</span></div>
        <h3 class="blog-card__title"><a href="/blog/${post.slug}">${post.title}</a></h3>
        <p class="blog-card__excerpt">${post.excerpt}</p>
        <div class="blog-card__author"><div class="blog-card__author-avatar">${initials}</div><div><div class="blog-card__author-name">${post.author_name}</div><div class="blog-card__author-date">${formatDate(post.date)}</div></div></div>
        <a href="/blog/${post.slug}" class="blog-card__readmore" data-testid="link-readmore-${index + 1}">Read More <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></a>
      </div>
    </article>`;
}

function buildLatestCard(post, index) {
  const gradient = CATEGORY_GRADIENTS[post.category] || "linear-gradient(135deg,#667eea,#764ba2)";
  const label = CATEGORY_LABELS[post.category] || post.category;
  const initials = getInitials(post.author_name);
  const imageHtml = post.featured_image
    ? `<div class="blog-card__image"><img src="${post.featured_image}" alt="${post.title}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>`
    : `<div class="blog-card__image" style="background:${gradient};display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.5rem;font-weight:800;font-family:var(--font-heading)">${label}</div>`;
  return `<article class="blog-card animate-on-scroll stagger-${index + 1}" data-testid="card-latest-blog-${index + 1}" data-category="${post.category}">
      ${imageHtml}
      <div class="blog-card__content">
        <div class="blog-card__meta"><span class="blog-card__category">${post.category}</span><span>${post.read_time || ""}</span></div>
        <h3 class="blog-card__title"><a href="/blog/${post.slug}" data-testid="link-latest-blog-${index + 1}">${post.title}</a></h3>
        <p class="blog-card__excerpt">${post.excerpt}</p>
        <div class="blog-card__author"><div class="blog-card__author-avatar">${initials}</div><div><div class="blog-card__author-name">${post.author_name}</div><div class="blog-card__author-date">${formatDate(post.date)}</div></div></div>
      </div>
    </article>`;
}

app.get('/', function(req, res) {
  let html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
  const posts = getAllPosts();
  const latest = posts.slice(0, 3);
  const latestCardsHtml = latest.map((p, i) => buildLatestCard(p, i)).join('\n    ');
  html = html.replace('{{LATEST_POSTS}}', latestCardsHtml);
  res.send(html);
});

app.get('/blog', function(req, res) {
  let html = fs.readFileSync(path.join(publicDir, 'blog.html'), 'utf-8');
  const posts = getAllPosts();
  const cardsHtml = posts.map((p, i) => buildBlogCard(p, i)).join('\n    ');
  html = html.replace('{{BLOG_CARDS}}', cardsHtml);
  res.send(html);
});

app.get('/blog/:slug', function(req, res) {
  const slug = req.params.slug;
  const filePath = path.join(contentDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    res.status(404).sendFile(path.join(publicDir, 'index.html'));
    return;
  }
  let post;
  try {
    post = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    res.status(500).send('Error reading post');
    return;
  }
  const template = fs.readFileSync(path.join(publicDir, 'blog-post.html'), 'utf-8');
  const bodyHtml = marked.parse(post.body);
  const initials = getInitials(post.author_name);
  const dateFormatted = formatDate(post.date);
  let tocHtml = '';
  if (post.toc && post.toc.length > 0) {
    tocHtml = `<div class="blog-post__toc"><h4>Table of Contents</h4><ul>${post.toc.map(item => `<li><a href="#${item.id}">${item.label}</a></li>`).join('')}</ul></div>`;
  }
  const schemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": post.schema_type || "Article",
    "headline": post.title,
    "author": { "@type": "Person", "name": post.author_name, "jobTitle": post.author_role || "", "url": "/about" },
    "publisher": { "@type": "Organization", "name": "RankFlow", "url": "/" },
    "datePublished": post.date.split("T")[0],
    "dateModified": post.date.split("T")[0],
    "description": post.meta_description
  });
  const breadcrumbTitle = post.title.length > 40 ? post.title.substring(0, 40) + '...' : post.title;
  let rendered = template
    .replace(/\{\{TITLE\}\}/g, post.title)
    .replace(/\{\{META_DESCRIPTION\}\}/g, post.meta_description)
    .replace(/\{\{OG_TITLE\}\}/g, post.og_title || post.title)
    .replace(/\{\{OG_DESCRIPTION\}\}/g, post.og_description || post.meta_description)
    .replace(/\{\{CANONICAL_URL\}\}/g, post.canonical_url || `/blog/${post.slug}`)
    .replace(/\{\{AUTHOR_NAME\}\}/g, post.author_name)
    .replace(/\{\{AUTHOR_ROLE\}\}/g, post.author_role || '')
    .replace(/\{\{AUTHOR_BIO\}\}/g, post.author_bio || '')
    .replace(/\{\{AUTHOR_INITIALS\}\}/g, initials)
    .replace(/\{\{CATEGORY\}\}/g, post.category)
    .replace(/\{\{DATE_FORMATTED\}\}/g, dateFormatted)
    .replace(/\{\{READ_TIME\}\}/g, post.read_time || '')
    .replace(/\{\{EXCERPT\}\}/g, post.excerpt)
    .replace(/\{\{BREADCRUMB_TITLE\}\}/g, breadcrumbTitle)
    .replace('{{TOC_HTML}}', tocHtml)
    .replace('{{BODY_HTML}}', bodyHtml)
    .replace('{{SCHEMA_JSON}}', schemaJson);
  res.send(rendered);
});

app.use(express.static(publicDir, { extensions: ['html'] }));

app.use(function(req, res) {
  res.status(404).sendFile(path.join(publicDir, 'index.html'));
});

app.listen(5000, '0.0.0.0', function() {
  console.log('Serving on port 5000');
});
