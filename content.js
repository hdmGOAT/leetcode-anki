const PANEL_ID = "lca-panel";
const RATINGS = ["Again", "Hard", "Good", "Easy"];
let currentSlug = null;
let listOpen = false;
let undo = null; // { prev, label } for the card just rated, cleared on navigation

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

  const title = document.createElement("div");
  title.className = "lca-title";
  panel.append(title);

  if (!card) {
    title.textContent = "LeetCode Anki";
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
}

// LeetCode is a SPA, so watch for URL changes.
setInterval(() => {
  if (slugFromPath() !== currentSlug) {
    currentSlug = slugFromPath();
    undo = null;
    render();
  }
}, 500);
render();
