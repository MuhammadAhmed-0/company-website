# Objective
Fix Decap CMS so blog entries save to GitHub, and make sitemap.xml auto-update when new blog posts are published.

## Root Cause Analysis

**Issue 1 — CMS saves don't reach GitHub:**
The file `public/admin/config.yml` has `backend: name: test-repo`. The `test-repo` backend is a local-only test mode that stores data in the browser's memory — it never connects to GitHub. This is why entries appear "saved" but nothing shows up in the repo.

**Issue 2 — Blog posts don't appear on the website:**
The current server (`serve.js`) is a simple static file server. It serves pre-built HTML files from `public/`. The dynamic blog rendering logic exists in `server/routes.ts` (reads JSON from `content/blog/`, converts markdown to HTML, generates sitemap dynamically) but it is NOT wired into `serve.js` at all. So even if CMS did save a new JSON file, nothing would render it.

**Issue 3 — Sitemap is static:**
The `public/sitemap.xml` is a static file. The dynamic sitemap endpoint exists in `server/routes.ts` but isn't used. New blog posts won't appear in the sitemap.

## Solution Approach
- Switch the CMS backend to `github` so content commits to the repo
- Update the server to dynamically serve blog posts from `content/blog/` JSON files (using the existing helper logic in `lib/blog-helpers.ts` and `server/routes.ts`)
- Dynamic sitemap generation is already implemented in `server/routes.ts` — just needs to be wired in

# Tasks

### T001: Fix Decap CMS backend config to use GitHub
- **Blocked By**: []
- **Details**:
  - Update `public/admin/config.yml`: change `backend.name` from `test-repo` to `github`
  - Add required GitHub backend fields: `repo` (user's GitHub repo), `branch` (main or master)
  - Need to ask the user for their GitHub repo name (e.g., `username/repo-name`)
  - Files: `public/admin/config.yml`
  - Acceptance: CMS config points to GitHub backend with correct repo

### T002: Wire up dynamic blog rendering and sitemap into the server
- **Blocked By**: []
- **Details**:
  - Update `serve.js` to use the dynamic blog routes from `server/routes.ts` — specifically the `/blog`, `/blog/:slug`, `/sitemap.xml`, and `/robots.txt` endpoints
  - This means `serve.js` needs to read blog JSON files from `content/blog/`, render them using the template in `public/blog-post.html`, and generate the sitemap dynamically
  - Install `marked` package (used by routes.ts for markdown-to-HTML conversion)
  - Remove the static `public/sitemap.xml` and `public/robots.txt` (they'll be generated dynamically)
  - Ensure the homepage `/` route injects latest blog posts via `{{LATEST_POSTS}}` template
  - Files: `serve.js`, `server/routes.ts`, `lib/blog-helpers.ts`
  - Acceptance: Blog posts render dynamically from JSON, sitemap includes all blog posts automatically, new JSON files in `content/blog/` appear immediately

### T003: Test end-to-end and verify
- **Blocked By**: [T001, T002]
- **Details**:
  - Restart the server
  - Verify blog listing page works at `/blog`
  - Verify individual blog post pages work at `/blog/<slug>`
  - Verify `/sitemap.xml` includes all blog posts dynamically
  - Verify `/admin` loads the CMS with GitHub backend configured
  - Files: none (testing only)
  - Acceptance: All blog pages render, sitemap is dynamic, CMS admin page shows GitHub login
