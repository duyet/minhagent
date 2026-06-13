# Changelog

## [0.1.1](https://github.com/duyet/minhagent/compare/v0.1.0...v0.1.1) (2026-06-13)


### ✨ Features

* migrate to pnpm, add CI/CD, webhook secret rotation, fix assets deploy ([e973b57](https://github.com/duyet/minhagent/commit/e973b57de1a6833611f0c5e3d6c74d0024a3be0e))
* monorepo with minhagent.dev site and github webhook worker ([bb004ac](https://github.com/duyet/minhagent/commit/bb004ac09e518cc3c83e77bd2a228696c0ef1aa9))
* **release:** standardized auto-release pipeline (release-please + LLM notes) ([#5](https://github.com/duyet/minhagent/issues/5)) ([3fa8d7f](https://github.com/duyet/minhagent/commit/3fa8d7fd92dde9aa0f1da0384234be9bdfded57f))
* set live Clerk publishable key in web worker config ([12d9935](https://github.com/duyet/minhagent/commit/12d9935f8ac674250c0df398884aaf0733678cd9))
* **web:** profile page, global avatar dropdown, docs TOC + mobile fixes ([8989e70](https://github.com/duyet/minhagent/commit/8989e705d5b6909b1a717fa0e797551355c491fb))


### 🐛 Bug Fixes

* add packageManager field, custom domain route, fix CI deploy steps ([2793b6c](https://github.com/duyet/minhagent/commit/2793b6cbe5733974db444e86ce1c649419d28812))
* add workflows dir to CI path triggers ([e6c8fff](https://github.com/duyet/minhagent/commit/e6c8fff5f1ead6c7a898b6cacb2e31859eeddf7a))
* address review bot security findings ([fd42f56](https://github.com/duyet/minhagent/commit/fd42f565b8a00cca948d283a486346e6ce2be69f))
* CI build placeholder for vite-plugin main validation ([1fc8c21](https://github.com/duyet/minhagent/commit/1fc8c21eaa8dab480c7d5ba43bfc547e69a4f9ab))
* CI build+typecheck for @astrojs/cloudflare v13 ([4b531c7](https://github.com/duyet/minhagent/commit/4b531c736c55a48a1adb99c2fe348c116c482659))
* CI typecheck after build, add CLAUDE.md ([8571f7a](https://github.com/duyet/minhagent/commit/8571f7aef955ac2d8d01e3edbf058c570a4a95ba))
* **ci:** embed PUBLIC_CLERK_PUBLISHABLE_KEY at build so static pages init Clerk ([f555a6e](https://github.com/duyet/minhagent/commit/f555a6e09075425f617335ffd450e499b373bf59))
* **ci:** update web deploy for @astrojs/cloudflare v13 output structure ([4d73a7e](https://github.com/duyet/minhagent/commit/4d73a7e9ed9ec1e1fa881cc6ba85a8d43f604e46))
* **ci:** web deploy broken on main — stale dist/_worker.js entry path ([#4](https://github.com/duyet/minhagent/issues/4)) ([d811ef5](https://github.com/duyet/minhagent/commit/d811ef54212e1491831fe850124c7274a3a833ba))
* enable workers_dev route alongside minhagent.dev custom domain ([39653f6](https://github.com/duyet/minhagent/commit/39653f6056e6be591c8a371211b09dad666671b6))
* P1 PRD review — OAuth state loss, refresh rotation, revocation, CI config hack ([1f8180e](https://github.com/duyet/minhagent/commit/1f8180e243b1930fb1ca5af9d1eff971b57f7f5d))
* P1 PRD review — OAuth state loss, refresh rotation, revocation, CI hack ([4f8b6b9](https://github.com/duyet/minhagent/commit/4f8b6b9fa3780c269a5e43afef6e61f619ad0a77))
* remove main from wrangler config, inject at deploy time in CI ([3a9b4ca](https://github.com/duyet/minhagent/commit/3a9b4ca7c233ca9157fd9693f7eed8dc1caee07b))
* simplify cleanup from review ([347ed00](https://github.com/duyet/minhagent/commit/347ed0016037e2f40ce895239dc073004bef2e0e))
* **web:** repair Astro 6 SSR 500s; redesign homepage + add docs and dark mode toggle ([5905c2b](https://github.com/duyet/minhagent/commit/5905c2b3c73dc39c4c928a46ef8a916dd9fbf1ec))
* **web:** vertically center nav links with theme toggle and avatar ([#6](https://github.com/duyet/minhagent/issues/6)) ([73087db](https://github.com/duyet/minhagent/commit/73087db19feefb5fddef581990611dec615dee97))


### ♻️ Refactoring

* light-first design with dark mode, shared BaseLayout, compact UI ([9bec276](https://github.com/duyet/minhagent/commit/9bec276c0cc721618bd69c852208afdfa8bff2e5))

## Changelog

All notable changes to this project are documented here.

This file is maintained automatically by [release-please](https://github.com/googleapis/release-please)
from [Conventional Commits](https://www.conventionalcommits.org/). **Unreleased**
changes are previewed in the standing "chore(release): vX.Y.Z" pull request that
release-please keeps open — merging it promotes those entries here and tags the release.
