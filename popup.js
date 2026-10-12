async function draw() {
  const cards = Object.values(await getCards());
  const due = cards.filter((c) => c.due <= Date.now()).sort((a, b) => a.due - b.due);
  document.getElementById("count").textContent = due.length;
  document.getElementById("total").textContent = cards.length;
  const list = document.getElementById("list");
  list.textContent = "";
  for (const c of due) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "https://leetcode.com/problems/" + c.slug + "/";
    a.textContent = c.title;
    a.onclick = (e) => {
      e.preventDefault();
      browser.tabs.create({ url: a.href });
    };
    const meta = document.createElement("small");
    meta.textContent = ` ${c.interval}d, ${c.lapses} lapses`;
    li.append(a, meta);
    list.append(li);
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
