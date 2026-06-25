const STORAGE_KEY = "family-pages-progress-v1";

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
      "GitHub Pages is static hosting, so shared server-side storage is not available without adding an external backend.",
    ],
  },
  {
    id: "nasli-checklist",
    owner: "nasli",
    title: "Nasli checklist",
    description: "A markdown-like checklist that persists in this browser.",
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
      "Decide whether localStorage is enough or an external service is needed",
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

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function showDashboard(userKey) {
  currentUser = users[userKey];
  const visiblePages = pages.filter((page) => currentUser.canSee.includes(page.owner));

  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  welcomeTitle.textContent = `Hello, ${currentUser.displayName}`;
  accessSummary.textContent = `${currentUser.displayName} can see ${visiblePages.length} page${visiblePages.length === 1 ? "" : "s"}. Progress is saved in this browser with localStorage.`;

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
  const progress = loadProgress();
  const checklist = document.createElement("ul");
  checklist.className = "checklist";

  page.items.forEach((text, index) => {
    const key = `${page.id}:${index}`;
    const saved = progress[key];
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

    checkbox.addEventListener("change", () => {
      const nextProgress = loadProgress();
      if (checkbox.checked) {
        nextProgress[key] = {
          done: true,
          by: currentUser.displayName,
          at: new Date().toISOString(),
        };
      } else {
        delete nextProgress[key];
      }
      saveProgress(nextProgress);
      renderPage(currentPageId);
    });

    item.append(checkbox, label, meta);
    checklist.append(item);
  });

  return checklist;
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const userKey = normalizeName(nameInput.value);
  if (!users[userKey]) {
    nameInput.setCustomValidity("Please type Nasli or Shando.");
    nameInput.reportValidity();
    return;
  }
  nameInput.setCustomValidity("");
  showDashboard(userKey);
});

nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));

logoutButton.addEventListener("click", () => {
  currentUser = null;
  currentPageId = null;
  dashboardView.classList.add("hidden");
  loginView.classList.remove("hidden");
  nameInput.focus();
});
