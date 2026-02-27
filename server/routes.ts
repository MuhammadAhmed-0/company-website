import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { marked } from "marked";
import {
  getAllPosts, buildBlogCard, buildLatestCard, buildPaginationQuery,
  renderBlogPost, scanHtmlFiles, type BlogPost
} from "../lib/blog-helpers";

const publicDir = path.resolve(import.meta.dirname, "..", "public");
const contentDir = path.resolve(import.meta.dirname, "..", "content/blog");

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/", (req, res) => {
    const posts = getAllPosts(contentDir);
    const latest = posts.slice(0, 3);
    let html = fs.readFileSync(path.join(publicDir, "index.html"), "utf-8");

    if (latest.length > 0) {
      const latestCardsHtml = latest.map((p, i) => buildLatestCard(p, i)).join("\n    ");
      html = html.replace("{{LATEST_POSTS}}", latestCardsHtml);
    }

    res.send(html);
  });

  app.get("/blog", (req, res) => {
    const allPosts = getAllPosts(contentDir);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = 6;
    const totalPages = Math.max(1, Math.ceil(allPosts.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * perPage;
    const pagePosts = allPosts.slice(start, start + perPage);

    let html = fs.readFileSync(path.join(publicDir, "blog.html"), "utf-8");

    const cardsHtml = pagePosts.map((p, i) => buildBlogCard(p, start + i)).join("\n    ");
    html = html.replace("{{BLOG_CARDS}}", cardsHtml);

    const paginationHtml = buildPaginationQuery(currentPage, totalPages);
    html = html.replace("{{PAGINATION}}", paginationHtml);

    res.send(html);
  });

  app.get("/blog/:slug", (req, res) => {
    const slug = req.params.slug;
    const filePath = path.join(contentDir, `${slug}.json`);

    if (!fs.existsSync(filePath)) {
      res.status(404).send("Post not found");
      return;
    }

    let post: BlogPost;
    try {
      post = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      res.status(500).send("Error reading post");
      return;
    }

    const template = fs.readFileSync(path.join(publicDir, "blog-post.html"), "utf-8");
    const bodyHtml = marked.parse(post.body) as string;
    const rendered = renderBlogPost(template, post, bodyHtml);

    res.send(rendered);
  });

  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const htmlFiles = scanHtmlFiles(publicDir);
    const posts = getAllPosts(contentDir);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    for (const file of htmlFiles) {
      let urlPath = "/" + file.replace(/\.html$/, "");
      if (urlPath === "/index") continue;
      if (urlPath === "/blog") continue;

      let priority = "0.5";
      let changefreq = "monthly";
      if (urlPath.startsWith("/services/")) {
        priority = "0.8";
        changefreq = "monthly";
      } else if (urlPath.startsWith("/locations/")) {
        priority = "0.7";
        changefreq = "monthly";
      } else if (urlPath === "/about" || urlPath === "/contact" || urlPath === "/case-studies") {
        priority = "0.6";
        changefreq = "monthly";
      } else if (urlPath.startsWith("/resources/")) {
        priority = "0.6";
        changefreq = "monthly";
      }

      xml += `  <url>\n    <loc>${baseUrl}${urlPath}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    }

    xml += `  <url>\n    <loc>${baseUrl}/blog</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

    for (const post of posts) {
      const lastmod = post.date.split("T")[0];
      xml += `  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  });

  app.get("/robots.txt", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const robots = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
    res.set("Content-Type", "text/plain");
    res.send(robots);
  });

  return httpServer;
}
