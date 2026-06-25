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

## Deploy the shared Node app

The easiest shared-progress deployment is to host the whole app on a Node host. In that setup, `server.js` serves both the frontend and `/progress`, so `config.js` can stay blank.

This repo includes `package.json` and `render.yaml` so Render can run the app with:

```sh
npm start
```

### Free hosting option: Render

Render has a free web service plan that is good for a small personal app or test deployment. Free services can sleep when inactive and may take a little time to wake up. For durable production data, use a paid persistent disk/database or another always-on host.

Minimum Render setup:

1. Push this repo to GitHub.
2. Sign in to Render with GitHub.
3. Create a **New → Blueprint** and select this repo. Render will read `render.yaml`.
4. Deploy.
5. Open the Render URL. Because the frontend and API are on the same URL, leave `window.CHECKLIST_API_URL = ""` in `config.js`.

After deploy, test shared progress like this:

1. Open the Render URL.
2. Type `Nasli`, check an item, then switch user.
3. Type `Shando`; Shando should see Nasli's saved checklist progress.

### If you still want GitHub Pages for the frontend

This repo also includes a GitHub Actions workflow at `.github/workflows/pages.yml` that deploys the static frontend to GitHub Pages whenever you push to `main`.

Minimum GitHub Pages setup:

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`, or open **Actions → Deploy GitHub Pages → Run workflow**.

Important: GitHub Actions can deploy the frontend, but it cannot keep `server.js` running as a live backend after the workflow ends. If you use GitHub Pages for the frontend and Render for the backend, set this in `config.js` before deploying Pages:

```js
window.CHECKLIST_API_URL = "https://your-render-service.onrender.com";
```

For tighter CORS, set Render's `ALLOWED_ORIGIN` environment variable to your GitHub Pages origin, for example `https://yourname.github.io`. If you skip the backend, the GitHub Pages frontend still works, but progress is saved in each visitor's browser with `localStorage`.

## Edit content

Update `users` and `pages` in `app.js` to add people, display pages, and checklist pages.
