# Objective
Fix Decap CMS GitHub authentication to work on Cloudflare Pages by switching to PKCE auth flow.

# Tasks

### T001: Update Decap CMS config for PKCE auth
- **Blocked By**: []
- **Details**:
  - Update `public/admin/config.yml` backend section to add `auth_type: pkce` and `app_id: Ov23liROna9lmHiBO8qh`
  - Files: `public/admin/config.yml`
  - Acceptance: Config has PKCE auth with the correct Client ID

### T002: Rebuild dist and verify
- **Blocked By**: [T001]
- **Details**:
  - Run `npm run build` to regenerate `dist/` with updated admin config
  - Restart the server and verify the admin page loads with GitHub PKCE login
  - Files: none (build + test)
  - Acceptance: Admin page shows GitHub login that works via PKCE (no Netlify redirect)
