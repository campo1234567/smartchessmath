# Deployment Guide

## Cloudflare Pages

The website is deployed from GitHub using Cloudflare Pages.

Settings:

- Framework preset: None
- Build command: leave empty
- Build output directory: /
- Production branch: main

## Cloudflare Worker API

The Worker API is stored in this repository for version control under:

`worker/worker.js`

However, the live API is still managed separately inside Cloudflare Workers. When `worker/worker.js` changes, the Worker must be updated in Cloudflare.

## Safe Deployment Policy

1. Test locally or in preview first.
2. Commit changes to GitHub.
3. Let Cloudflare Pages deploy automatically.
4. Verify the Pages preview link.
5. Only then consider moving or updating the production domain.
