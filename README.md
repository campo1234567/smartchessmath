# Smart Chess Math

Educational Chess, Mathematics and Logic Platform.

## Current Stable Version

**v86 — V82 Print OK + V46 Resume Timer**

This repository contains the stable front-end website files for Smart Chess Math and a reference copy of the current Cloudflare Worker API.

## Core Philosophy

**Chess serves Education — Education does not serve Chess.**

Smart Chess Math uses chess-based educational programs to improve mathematical thinking, logical reasoning, planning, focus, problem solving, and 21st-century learning skills.

## Main Components

- `index.html` — Main website landing page.
- `knight.html` — Knight Number Quest program.
- `knight-online-test.html` — Online live class/championship interface.
- `dashboard.html` — Teacher dashboard / school pilot interface.
- `admin.html` — Admin entry page.
- `admin/index.html` — Admin route support.
- `assets/` — Website slides and media assets.
- `data/` — CSV templates and supporting data files.
- `worker/worker.js` — Reference Cloudflare Worker API file.
- `docs/` — Project planning, architecture and deployment documentation.

## Deployment Notes

This repository is connected to Cloudflare Pages.

Cloudflare Pages settings:

- Framework preset: `None`
- Build command: empty
- Build output directory: `/`
- Production branch: `main`

The existing Cloudflare Worker API remains separate and should be updated in Cloudflare Workers when the API changes.

## Development Rule

The `main` branch must always represent the stable deployable version.
Experimental changes should be tested before merging into `main`.
GitHub Desktop Test
