# The interactive site

An interactive, scrollytelling case for *Stop Shy of the First Down*. Five "acts",
each a live JavaScript demo you can drag and tune:

1. **The hook** — drag a ball-carrier on the field and watch expected points; the
   contested yard at the marker is nearly worthless, a lost possession is not.
2. **The notch** — the real first-and-ten rushing distribution, with the dip right
   at the marker where carriers stop fighting.
3. **The currency** — the field-position → expected-points curve (the exchange rate).
4. **The showdown** — a Monte Carlo comparing 2nd-and-1 vs 1st-and-10. Tune the
   conversion rates; stopping a yard short keeps winning.
5. **Bonus** — a 3rd-and-1 run-vs-pass decision tree in expected points.

## Files
- `index.html` — page structure / copy
- `style.css` — dark editorial theme
- `app.js` — the five D3-powered demos
- `data.js` — **all** the constants. Every claim reads from here, so you can
  stress-test the argument by editing one file. Figure 2's distribution holds the
  **exact** integer-yard counts of first-and-ten rushes (dwn = 1, ytg = 10, type =
  RUSH; n = 33,951) computed from
  [`microprediction/nflMarkov`](https://github.com/microprediction/nflMarkov)'s
  `inputData/pbp_nfldb_2009_2013.csv` (NFL play-by-play, 2009–2013). The expected-points
  curve and conversion rates are approximate, calibrated to
  `../Stop_shy_of_the_first_down.ipynb`.

## Run locally
```bash
python3 -m http.server 8099 --directory docs
# open http://localhost:8099
```
(D3 loads from a CDN, so you need a network connection.)

## Publish on GitHub Pages
Repo → **Settings → Pages → Build and deployment** → Source: *Deploy from a branch*,
Branch: `main`, Folder: `/docs`. Save. The site appears at
`https://<user>.github.io/firstdown/` within a minute or two.
