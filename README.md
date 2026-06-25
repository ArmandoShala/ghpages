# GitHub Pages family checklist

A small static website for GitHub Pages. It greets a visitor with a name input and opens simple pages for known users.

## How it works

- Type `Nasli` to see Nasli's overview and checklist.
- Type `Shando` to see Shando's pages plus Nasli's pages.
- Checklist changes are persisted with `localStorage`, so they survive reloads in the same browser.
- GitHub Pages only serves static files. A shared SQLite database cannot run directly on GitHub Pages; use an external backend (for example Supabase, Firebase, GitHub Issues, or a small API) if every visitor must see the same shared progress.

## Edit content

Update `users` and `pages` in `app.js` to add people, display pages, and checklist pages.
