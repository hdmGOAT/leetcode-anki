// SM-2 style scheduler. Ratings: 0 Again, 1 Hard, 2 Good, 3 Easy.
const DAY = 24 * 60 * 60 * 1000;

function newCard(slug) {
  return {
    slug,
    title: slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
    ease: 2.5,
    interval: 0, // days
    reps: 0,
    lapses: 0,
    due: Date.now(),
    last: null,
  };
}

function review(card, rating, now = Date.now()) {
  const c = { ...card, last: now };
  if (rating === 0) {
    c.lapses += 1;
    c.reps = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.interval = 0;
    c.due = now + 10 * 60 * 1000; // see again in 10 min
    return c;
  }
  if (rating === 1) c.ease = Math.max(1.3, c.ease - 0.15);
  if (rating === 3) c.ease += 0.15;
  if (c.reps === 0) c.interval = rating === 3 ? 4 : 1;
  else if (c.reps === 1) c.interval = rating === 3 ? 8 : 3;
  else {
    const mult = rating === 1 ? 1.2 : rating === 3 ? c.ease * 1.3 : c.ease;
    c.interval = Math.max(c.interval + 1, Math.round(c.interval * mult));
  }
  c.reps += 1;
  c.due = now + c.interval * DAY;
  return c;
}

function previewInterval(card, rating) {
  const c = review(card, rating);
  return rating === 0 ? "10m" : c.interval + "d";
}

async function getCards() {
  const { cards } = await browser.storage.local.get("cards");
  return cards || {};
}

async function saveCard(card) {
  const cards = await getCards();
  cards[card.slug] = card;
  await browser.storage.local.set({ cards });
}
