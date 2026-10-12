function addItem(list, c, meta) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = "https://leetcode.com/problems/" + c.slug + "/";
  a.textContent = c.title;
  a.onclick = (e) => {
    e.preventDefault();
    browser.tabs.create({ url: a.href });
  };
  const small = document.createElement("small");
  small.textContent = " " + meta;
  li.append(a, small);
  list.append(li);
}

function addHeading(list, text) {
  const li = document.createElement("li");
  li.className = "heading";
  li.textContent = text;
  list.append(li);
}

async function draw() {
  const cards = Object.values(await getCards());
  const now = Date.now();
  const due = cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
  const upcoming = cards.filter((c) => c.due > now).sort((a, b) => a.due - b.due);
  document.getElementById("count").textContent = due.length;
  document.getElementById("total").textContent = cards.length;
  const list = document.getElementById("list");
  list.textContent = "";
  if (!cards.length) {
    const li = document.createElement("li");
    li.textContent = "No problems yet. Open a LeetCode problem and click \"Add to reviews\" in the corner panel.";
    list.append(li);
    return;
  }
  if (!due.length) {
    const li = document.createElement("li");
    li.textContent = "Nothing due. All caught up!";
    list.append(li);
  }
  for (const c of due) addItem(list, c, `${c.interval}d, ${c.lapses} lapses`);
  if (upcoming.length) {
    addHeading(list, "Upcoming");
    for (const c of upcoming) addItem(list, c, "due " + new Date(c.due).toLocaleDateString());
  }
}

document.getElementById("export").onclick = async () => {
  const blob = new Blob([JSON.stringify(await getCards(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: "leetcode-anki.json" });
  a.click();
  URL.revokeObjectURL(url);
};

const file = document.getElementById("file");
document.getElementById("import").onclick = () => file.click();
file.onchange = async () => {
  const imported = JSON.parse(await file.files[0].text());
  const cards = { ...(await getCards()), ...imported };
  await browser.storage.local.set({ cards });
  draw();
};

draw();
