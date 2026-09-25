# Capital & Flag Quiz

A mobile-first geography quiz: guess capitals and flags. Built for phones, kids, and family play — no login, no API keys.

## Play

Open [the live site](https://abhimanyuchoudhary.github.io/capital-flag-quiz/) (GitHub Pages).

Or run locally:

```bash
python3 -m http.server 8765
```

Then visit `http://127.0.0.1:8765/`.

## What's included

- 168 countries with capitals, emoji flags, and a Tourist, Globetrotter, or Cartographer tier
- Difficulty: Tourist, Globetrotter, Cartographer, or Random. Random picks one level for the whole round and shows it on the HUD and results
- Tourist uses well-known countries and clearer choices (distant places, flags that look less alike). Globetrotter mixes familiarity. Cartographer uses less familiar countries and trickier choices (look-alike flags and nearby capitals)
- Round lengths: 5, 10, 15, 20, 40, or 50. A round is shortened if that difficulty does not have enough countries. Cartographer supports 50
- After the round, a review lists each question as right or wrong, with the correct answer and your pick when you missed it
- Flag choices stay flag-only until you answer. Country-from-flag choices stay text
- Leaderboard is localStorage on this device only: display name, score, difficulty, round length, and date. No account and no server

## Files

- `index.html` — screens
- `styles.css` — mobile-first UI
- `game.js` — quiz flow, review, and leaderboard
- `data.js` — country data and difficulty pools

## License

For personal / family use. No secrets in this repo.
