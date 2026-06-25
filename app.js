const STORAGE_KEY = "family-pages-progress-v1";
const configuredApiUrl = window.CHECKLIST_API_URL ?? "";
const API_URL = (configuredApiUrl || (window.location.protocol.startsWith("http") ? window.location.origin : "")).replace(/\/$/, "");

const users = {
  nasli: {
    displayName: "Nasli",
    canSee: ["nasli"],
  },
  shando: {
    displayName: "Shando",
    canSee: ["shando", "nasli"],
  },
};

const pages = [
  {
    id: "nasli-welcome",
    owner: "nasli",
    title: "Nasli overview",
    description: "A display-only page with useful starter information.",
    type: "display",
    body: [
      "This page is visible when Nasli signs in.",
      "Shando can also see it because Shando has overview access.",
      "When this site is opened through server.js, checklist progress is shared through a small file-backed API instead of only this browser.",
    ],
  },
  {
    id: "nasli-checklist",
    owner: "nasli",
    title: "Nasli checklist",
    description: "A markdown-like checklist that can be shared through the progress API.",
    type: "checklist",
    items: [
      "Read the welcome information",
      "Prepare the first document",
      "Tell Shando when the page looks right",
    ],
  },
  {
    id: "shando-plan",
    owner: "shando",
    title: "Shando plan",
    description: "Planning notes only visible to Shando.",
    type: "checklist",
    items: [
      "Review Nasli's progress",
      "Add more people and pages in app.js",
      "Run server.js so the progress API can save everyone's checklist state to a file",
    ],
  },
];

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginForm = document.querySelector("#login-form");
const nameInput = document.querySelector("#name-input");
const welcomeTitle = document.querySelector("#welcome-title");
const accessSummary = document.querySelector("#access-summary");
const pageButtons = document.querySelector("#page-buttons");
const pageContent = document.querySelector("#page-content");
const logoutButton = document.querySelector("#logout-button");
const unknownTemplate = document.querySelector("#unknown-user-template");

let currentUser = null;
let currentPageId = null;
let progressCache = {};
let storageNotice = "";

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function loadLocalProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveLocalProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

async function loadProgress() {
  if (!API_URL) {
    storageNotice = "Progress is saved in this browser with localStorage.";
    return loadLocalProgress();
  }

  try {
    const response = await fetch(`${API_URL}/progress`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Progress API returned ${response.status}`);
    storageNotice = "Progress is shared through the file-backed progress API, so Shando can see Nasli's completed items.";
    return await response.json();
  } catch (error) {
    console.warn(error);
    storageNotice = "Progress API is unavailable, so this browser is temporarily using localStorage.";
    return loadLocalProgress();
  }
}

async function saveProgress(progress) {
  if (!API_URL) {
    saveLocalProgress(progress);
    return;
  }

  const response = await fetch(`${API_URL}/progress`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progress),
  });

  if (!response.ok) throw new Error(`Progress API returned ${response.status}`);
}

async function showDashboard(userKey) {
  currentUser = users[userKey];
  progressCache = await loadProgress();
  const visiblePages = pages.filter((page) => currentUser.canSee.includes(page.owner));

  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  welcomeTitle.textContent = `Hello, ${currentUser.displayName}`;
  accessSummary.textContent = `${currentUser.displayName} can see ${visiblePages.length} page${visiblePages.length === 1 ? "" : "s"}. ${storageNotice}`;

  pageButtons.innerHTML = "";
  visiblePages.forEach((page) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-tab";
    button.textContent = page.title;
    button.dataset.pageId = page.id;
    button.addEventListener("click", () => renderPage(page.id));
    pageButtons.append(button);
  });

  if (visiblePages.length === 0) {
    pageContent.replaceChildren(unknownTemplate.content.cloneNode(true));
    return;
  }

  renderPage(visiblePages[0].id);
}

function renderPage(pageId) {
  const page = pages.find((candidate) => candidate.id === pageId);
  if (!page) return;

  currentPageId = pageId;
  document.querySelectorAll(".page-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.pageId === pageId);
  });

  pageContent.innerHTML = `
    <header>
      <p class="eyebrow">${page.owner}</p>
      <h2>${page.title}</h2>
      <p class="muted">${page.description}</p>
    </header>
  `;

  if (page.type === "display") {
    const list = document.createElement("ul");
    page.body.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      list.append(item);
    });
    pageContent.append(list);
  }

  if (page.type === "checklist") {
    pageContent.append(renderChecklist(page));
  }

  pageContent.focus();
}

function renderChecklist(page) {
  const checklist = document.createElement("ul");
  checklist.className = "checklist";

  page.items.forEach((text, index) => {
    const key = `${page.id}:${index}`;
    const saved = progressCache[key];
    const item = document.createElement("li");
    item.className = `check-item${saved?.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = key;
    checkbox.checked = Boolean(saved?.done);

    const label = document.createElement("label");
    label.htmlFor = key;
    label.textContent = text;

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = saved?.done ? `Done by ${saved.by} on ${new Date(saved.at).toLocaleString()}` : "Not done yet";

    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;
      const nextProgress = { ...progressCache };
      if (checkbox.checked) {
        nextProgress[key] = {
          done: true,
          by: currentUser.displayName,
          at: new Date().toISOString(),
        };
      } else {
        delete nextProgress[key];
      }

      try {
        await saveProgress(nextProgress);
        progressCache = nextProgress;
      } catch (error) {
        console.error(error);
        alert("Could not save that change. Please try again.");
      }
      renderPage(currentPageId);
    });

    item.append(checkbox, label, meta);
    checklist.append(item);
  });

  return checklist;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const userKey = normalizeName(nameInput.value);
  if (!users[userKey]) {
    nameInput.setCustomValidity("Please type Nasli or Shando.");
    nameInput.reportValidity();
    return;
  }
  nameInput.setCustomValidity("");
  await showDashboard(userKey);
});

nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));

logoutButton.addEventListener("click", () => {
  currentUser = null;
  currentPageId = null;
  progressCache = {};
  dashboardView.classList.add("hidden");
  loginView.classList.remove("hidden");
  nameInput.focus();
});
