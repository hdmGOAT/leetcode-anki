# LeetCode Anki

A tiny Firefox / LibreWolf extension that adds spaced repetition to LeetCode.
Rate a problem after you solve it and it comes back for review right before you
would forget it.

## Features

- **Rating panel on problem pages**: *Again / Hard / Good / Easy*, with the next
  interval previewed on each button.
- **Due queue in the toolbar popup**: see what's due today and jump straight to
  the problem.
- **SM-2 style scheduler**: ease factor and interval grow as you succeed and
  reset on lapses.
- **Export / import** your cards as JSON for backup or moving between profiles.
- No account, no tracking, no network requests. Data lives in
  `browser.storage.local`.

## Install

### Temporary (for trying it out)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `manifest.json`.

### Permanent

Build the package:

```sh
zip leetcode-anki.xpi manifest.json scheduler.js content.js content.css popup.html popup.js
```

Then in `about:addons` choose the gear icon, **Install Add-on From File…**, and
pick the `.xpi`.

The package is unsigned. Either set `xpinstall.signatures.required` to `false`
in `about:config` (works in LibreWolf), or have Mozilla sign it as an unlisted
add-on:

```sh
npx web-ext sign --channel=unlisted --api-key=<JWT issuer> --api-secret=<JWT secret>
```

## Usage

1. Open any problem at `leetcode.com/problems/<slug>/`.
2. Click **Add to reviews** in the panel at the bottom right.
3. When the problem is due, open it and rate how it went.
4. Use the toolbar icon to see everything due today.

## How scheduling works

| Rating | Effect |
| ------ | ------ |
| Again  | Lapse: ease -0.20, interval reset, retry in 10 minutes |
| Hard   | Ease -0.15, interval x1.2 |
| Good   | Interval x ease |
| Easy   | Ease +0.15, interval x ease x 1.3 |

New cards start at ease 2.5. The first two successful reviews use fixed steps
(1 then 3 days, or 4 then 8 days on Easy).

## Roadmap

- Import already-solved problems from LeetCode
- Store state in LeetCode problem notes so it follows your account
- Prompt for a rating after an Accepted submission
- Track difficulty and real problem titles

## License

[MIT](LICENSE)
