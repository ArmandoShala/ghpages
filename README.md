# GitHub Pages family checklist

A small checklist website. It greets a visitor with a name input and opens simple pages for known users.

## How it works

- Type `Nasli` to see Nasli's overview and checklist.
- Type `Shando` to see Shando's pages plus Nasli's pages.
- If you open the HTML file directly, checklist changes use `localStorage` and only stay in that browser.
- If you run `server.js`, the frontend can write through `/progress` and everyone sees the same checklist state. No API keys are needed.

## Shared progress with a writable file

GitHub Pages is static, so it cannot write to SQLite or a text file by itself. This repo now includes the simplest "API or sum" option: a tiny Node server that serves the frontend and writes checklist progress to `data/progress.json`.

Start it with:

```sh
node server.js
```

Then open:

```text
http://localhost:8787
```

Check an item as Nasli, switch to Shando, and Shando will see the same saved progress because both users are reading and writing the same JSON file through `/progress`.

For a real deployment, host this repo somewhere that can run Node (Render, Fly.io, Railway, a VPS, your own computer with port forwarding, etc.) and start the same command:

```sh
PORT=8787 node server.js
```

Optional environment variables:

- `DATA_FILE=/path/to/progress.json` changes where the shared file is saved.
- `ALLOWED_ORIGIN="https://yourname.github.io"` restricts cross-origin API calls if you still serve the frontend from GitHub Pages.

If you deploy the frontend and backend separately, set `window.CHECKLIST_API_URL` in `config.js` to the backend URL. If you run `server.js` normally, you can leave `config.js` blank because the app automatically uses the same origin.

## Edit content

Update `users` and `pages` in `app.js` to add people, display pages, and checklist pages.
