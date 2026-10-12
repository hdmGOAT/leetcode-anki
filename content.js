const PANEL_ID = "lca-panel";
const RATINGS = ["Again", "Hard", "Good", "Easy"];
let currentSlug = null;
let listOpen = false;
let undo = null; // { prev, label } for the card just rated, cleared on navigation
let ui = { collapsed: false, x: null, y: null }; // persisted panel state

async function loadUi() {
  const { ui: saved } = await browser.storage.local.get("ui");
  ui = { ...ui, ...saved };
}

function saveUi() {
  return browser.storage.local.set({ ui });
}

function applyPosition(panel) {
  if (ui.x === null) return;
  const x = Math.min(Math.max(0, ui.x), window.innerWidth - panel.offsetWidth);
  const y = Math.min(Math.max(0, ui.y), window.innerHeight - panel.offsetHeight);
  Object.assign(panel.style, { left: x + "px", top: y + "px", right: "auto", bottom: "auto" });
}

function makeHeader(panel) {
  const header = document.createElement("div");
  header.className = "lca-header";
  const name = document.createElement("span");
  name.textContent = "LeetCode Anki";
  const toggle = button(ui.collapsed ? "+" : "\u2013", (e) => {
    e.stopPropagation();
    ui.collapsed = !ui.collapsed;
    saveUi();
    render();
  });
  toggle.className = "lca-collapse";
  toggle.title = ui.collapsed ? "Expand" : "Collapse";
  header.append(name, toggle);

  header.onpointerdown = (e) => {
    if (e.target === toggle) return;
    const rect = panel.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    header.setPointerCapture(e.pointerId);
    header.onpointermove = (m) => {
      ui.x = m.clientX - dx;
      ui.y = m.clientY - dy;
      applyPosition(panel);
    };
    header.onpointerup = () => {
      header.onpointermove = header.onpointerup = null;
      if (ui.x !== null) {
        // store the clamped position actually applied
        const r = panel.getBoundingClientRect();
        ui.x = r.left;
        ui.y = r.top;
      }
      saveUi();
    };
  };
  return header;
}

function slugFromPath() {
  const m = location.pathname.match(/^\/problems\/([^/]+)/);
  return m ? m[1] : null;
}

function button(text, onclick) {
  const b = document.createElement("button");
  b.textContent = text;
  b.onclick = onclick;
  return b;
}

function fmtDue(ms) {
  const mins = Math.round((ms - Date.now()) / 60000);
  if (mins < 60) return `in ${Math.max(mins, 1)}m`;
  if (mins < 24 * 60) return `in ${Math.round(mins / 60)}h`;
  return "on " + new Date(ms).toLocaleDateString();
}

function dueList(cards, slug) {
  const due = Object.values(cards)
    .filter((c) => c.due <= Date.now() && c.slug !== slug)
    .sort((a, b) => a.due - b.due);
  const ul = document.createElement("ul");
  ul.className = "lca-list";
  if (!due.length) {
    const li = document.createElement("li");
    li.textContent = "Nothing else due";
    ul.append(li);
  }
  for (const c of due) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "/problems/" + c.slug + "/";
    a.textContent = c.title;
    li.append(a);
    ul.append(li);
  }
  return ul;
}

async function render() {
  const slug = slugFromPath();
  const existing = document.getElementById(PANEL_ID);
  if (!slug) {
    existing?.remove();
    return;
  }
  const cards = await getCards();
  const card = cards[slug];
  const dueCount = Object.values(cards).filter((c) => c.due <= Date.now() && c.slug !== slug).length;
  const panel = existing || Object.assign(document.createElement("div"), { id: PANEL_ID });
  panel.textContent = "";

  panel.append(makeHeader(panel));
  panel.classList.toggle("lca-collapsed", ui.collapsed);
  if (ui.collapsed) {
    if (!existing) document.body.append(panel);
    applyPosition(panel);
    return;
  }

  const title = document.createElement("div");
  title.className = "lca-title";
  panel.append(title);

  if (!card) {
    title.textContent = "Not in your reviews yet";
    panel.append(button("Add to reviews", async () => {
      await saveCard(newCard(slug));
      render();
    }));
  } else if (card.due <= Date.now()) {
    title.textContent = "Due now: how did it go?";
    const row = document.createElement("div");
    row.className = "lca-row";
    RATINGS.forEach((label, rating) => {
      row.append(button(`${label} (${previewInterval(card, rating)})`, async () => {
        const updated = review(card, rating);
        await saveCard(updated);
        undo = { prev: card, label: `${label}: next review ${fmtDue(updated.due)}` };
        render();
      }));
    });
    panel.append(row);
  } else {
    title.textContent = undo ? undo.label : "Next review " + fmtDue(card.due);
    if (undo) {
      panel.append(button("Undo", async () => {
        await saveCard(undo.prev);
        undo = null;
        render();
      }));
    }
  }

  const toggle = button(`${listOpen ? "Hide" : "Show"} due problems (${dueCount})`, () => {
    listOpen = !listOpen;
    render();
  });
  toggle.className = "lca-toggle";
  panel.append(toggle);
  if (listOpen) panel.append(dueList(cards, slug));

  if (!existing) document.body.append(panel);
  applyPosition(panel);
}

// LeetCode is a SPA, so watch for URL changes.
setInterval(() => {
  if (slugFromPath() !== currentSlug) {
    currentSlug = slugFromPath();
    undo = null;
    render();
  }
}, 500);
loadUi().then(render);
