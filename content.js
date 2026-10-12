const PANEL_ID = "lca-panel";
let currentSlug = null;

function slugFromPath() {
  const m = location.pathname.match(/^\/problems\/([^/]+)/);
  return m ? m[1] : null;
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
  const panel = existing || Object.assign(document.createElement("div"), { id: PANEL_ID });
  panel.textContent = "";

  const title = document.createElement("div");
  title.className = "lca-title";
  panel.append(title);

  if (!card) {
    title.textContent = "LeetCode Anki";
    const add = document.createElement("button");
    add.textContent = "Add to reviews";
    add.onclick = async () => {
      await saveCard(newCard(slug));
      render();
    };
    panel.append(add);
  } else {
    const due = new Date(card.due);
    const isDue = card.due <= Date.now();
    title.textContent = isDue ? "Due now: how did it go?" : "Next review " + due.toLocaleDateString();
    const row = document.createElement("div");
    row.className = "lca-row";
    ["Again", "Hard", "Good", "Easy"].forEach((label, rating) => {
      const b = document.createElement("button");
      b.textContent = `${label} (${previewInterval(card, rating)})`;
      b.onclick = async () => {
        await saveCard(review(card, rating));
        render();
      };
      row.append(b);
    });
    panel.append(row);
  }
  if (!existing) document.body.append(panel);
}

// LeetCode is a SPA, so watch for URL changes.
setInterval(() => {
  if (slugFromPath() !== currentSlug) {
    currentSlug = slugFromPath();
    render();
  }
}, 500);
render();
