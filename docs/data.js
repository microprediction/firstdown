/*
 * data.js — calibrated constants for the "Stop Shy of the First Down" demos.
 *
 * These numbers are drawn from the analysis in Stop_shy_of_the_first_down.ipynb
 * and the draft paper. They are deliberately exposed here so the argument is
 * transparent and easy to stress-test: every interactive widget reads from
 * this object, so you can change an assumption and watch every demo respond.
 *
 * Where a figure is a ball-park from the paper it is marked "approx".
 */
const FD = {
  // ---- The exchange rate: field position -> expected points on the drive ----
  // Roughly 0 points at your own ~20, climbing to ~4 near the opponent's ~20.
  // i.e. about 15 yards is worth ~1 point. A lost possession is worth ~ -2.
  ep: {
    ownGoal: 0,        // yardline measured 0..100 from own goal line
    minEP: -0.6,       // backed up near own goal
    maxEP: 6.0,        // expected points goal-to-go
    lostPossession: -2.0, // approx value of turning the ball over on downs
    yardsPerPoint: 15, // approx (1 point ~ 15 yards of field position)
    yardsPerPossession: 40, // approx (a possession ~ 40 yards of value)
    // Anchor points (yardline 0-100 from own goal, expected points) used to
    // draw a smooth, slightly S-shaped expected-points curve.
    anchors: [
      [2, -0.5],
      [20, 0.3],
      [50, 2.0],
      [80, 3.9],
      [95, 5.6],
      [99, 6.4],
    ],
  },

  // ---- 3rd and 1 ----
  thirdAndOne: {
    rush: { convert: 0.72, yardsWhenConvert: 5.0, meanYards: 3.5 },
    // Passing converts less often but pays off far bigger when it lands.
    pass: { convert: 0.61, yardsWhenConvert: 12.75, meanYards: 7.75 },
  },

  // ---- 2nd and 1 (the state you LAND in if you stop shy) ----
  secondAndOne: {
    rush: { convert: 0.80, yardsWhenConvert: 4.7, meanYards: 4.0 },
  },

  // ---- 1st and 10 (the state you land in if you DO take the first down) ----
  firstAndTen: {
    rush: { meanYards: 4.2 },
  },

  // ---- The implied value of possession (the central argument) ----
  // Plausible worth of one possession, expressed in yards of field position.
  // The paper uses ~40 yards (≈ 2 points); a generous range is shown as a band.
  possession: {
    plausibleLo: 25,
    plausibleHi: 50,
    typical: 40,
    avgYardsWhenConvert: 4.9, // blend of 4.7 (2nd-and-1) and 5.0 (3rd-and-1)
  },

  /*
   * The Notch — REAL counts (not estimated).
   * Distribution of yards gained on first-and-ten rushing plays, computed from
   * the play-by-play used by the paper:
   *   pbp_nfldb_2009_2013.csv  (microprediction/nflMarkov, seasons 2009-2013),
   *   filtered to dwn==1, ytg==10, type=="RUSH".
   * Exact integer-yard counts (n = 33,951 such rushes overall). The window
   * shown (6-15 yds) matches the paper's chart, which excludes yds<=5.
   * Note the pronounced local minimum at exactly 10 — the line to gain: gains of
   * 9 yds (1058) and 11 yds (634) are far more common than gains of exactly
   * 10 yds (383). The dip is present in the raw integer data, not an artifact of
   * histogram binning.
   */
  notch: {
    lineToGain: 10,
    bins: [
      { yards: 6, count: 1824 },
      { yards: 7, count: 1390 },
      { yards: 8, count: 1010 },
      { yards: 9, count: 1058 },
      { yards: 10, count: 383 },  // <-- local minimum, exactly at the marker
      { yards: 11, count: 634 },
      { yards: 12, count: 444 },
      { yards: 13, count: 384 },
      { yards: 14, count: 291 },
      { yards: 15, count: 222 },
    ],
  },

  // External links. The PDF/notebook live in the repo root, which is NOT part of
  // the published /docs site, so these point at GitHub rather than relative paths.
  links: {
    // Book chapter: Cotton, P. "Stop Shy of the First Down", in Sports Analytics
    // (MacLean & Ziemba, eds.), World Scientific Series in Finance Vol. 18 (2021).
    book: "https://www.worldscientific.com/worldscibooks/10.1142/12566",
    // Magazine: Cotton, P. (2022) "Stop Shy of the First Down", Wilmott, Jan 2022, pp. 44-49.
    wilmott: "https://github.com/microprediction/firstdown/raw/main/wilmott_paper/44-49_Cotton_PDF5_Jan22%20(2).pdf",
    paper: "https://github.com/microprediction/firstdown/raw/main/Stop_Shy_of_the_First_Down_2021_07.pdf",
    notebook: "https://github.com/microprediction/firstdown/blob/main/Stop_shy_of_the_first_down.ipynb",
    colab: "https://colab.research.google.com/github/microprediction/firstdown/blob/main/Stop_shy_of_the_first_down.ipynb",
    blog: "https://www.microprediction.com/blog/nine",
    linkedin: "https://www.linkedin.com/company/65109690",
    data: "https://github.com/microprediction/nflMarkov",
    dataFile: "https://github.com/microprediction/nflMarkov/blob/master/inputData/pbp_nfldb_2009_2013.csv",
    dilday: "https://github.com/bdilday/nflMarkov", // Ben Dilday's original repo (the "Dilday 2016" source)
  },
};

/* Expected points at a yardline (0..100 from own goal), via monotone
 * interpolation over the anchor points above. Clamped to the field. */
FD.expectedPoints = function (yardline) {
  const a = FD.ep.anchors;
  const x = Math.max(1, Math.min(99, yardline));
  if (x <= a[0][0]) return a[0][1];
  if (x >= a[a.length - 1][0]) return a[a.length - 1][1];
  for (let i = 0; i < a.length - 1; i++) {
    const [x0, y0] = a[i];
    const [x1, y1] = a[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      // smoothstep for a gentle curve
      const s = t * t * (3 - 2 * t);
      return y0 + (y1 - y0) * s;
    }
  }
  return 0;
};

/* Probability of gaining exactly the d yards you still need on a single
 * short-yardage rush. Calibrated so 2nd-and-1 ≈ 80% and it decays with distance. */
FD.convByDistance = function (d) {
  const p = 0.8 * Math.exp(-0.26 * (d - 1));
  return Math.max(0.12, Math.min(0.85, p));
};

/* THE key function for Act 1.
 * Expected points for the whole drive as a function of where the ball-carrier
 * chooses to go down on a first-down play. ONE consistent metric.
 *   - Reach the marker  -> a fresh 1st-and-10 at that spot: value = EP(spot).
 *   - Stop short        -> 2nd-and-(short), then rush it out (2nd, then 3rd,
 *                          else punt). value accounts for the whole sequence.
 * Because converting short yardage is near-automatic AND lands you further
 * downfield, this curve PEAKS a yard or two SHORT of the marker, dips as you
 * cross into 1st-and-10, and only recovers once you're well past it. */
FD.driveValueByGain = function (gain, los, marker) {
  los = los == null ? 50 : los;
  marker = marker == null ? los + 10 : marker;
  const yl = los + gain;
  if (yl >= marker) return FD.expectedPoints(yl); // made it: fresh 1st-and-10
  const d = marker - yl; // yards still needed
  const p2 = FD.convByDistance(d);
  const g2 = Math.max(d, FD.secondAndOne.rush.yardsWhenConvert);
  const p3 = FD.convByDistance(d) * 0.9; // defense keys on the run
  const g3 = Math.max(d, FD.thirdAndOne.rush.yardsWhenConvert);
  const v3 = p3 * FD.expectedPoints(yl + g3) + (1 - p3) * FD.puntValue(yl);
  return p2 * FD.expectedPoints(yl + g2) + (1 - p2) * v3;
};

/* THE central calculation.
 * If you are downed a yard short (2nd-and-1) and rush it out, you convert with
 * probability P(convert) and otherwise lose the ball (punt) with probability
 * P(lose). Converting advances you, on average, g yards — i.e. (g - 1) yards
 * beyond where reaching the marker would have left you.
 * Reaching for the first down is therefore worthwhile ONLY IF a possession is
 * worth more than this many yards of field position:
 *     breakeven = [P(convert) / P(lose)] * (g - 1)
 * With p2 = 0.80, p3 = 0.72, g = 4.9 this is ≈ 66 yards (the paper's 66.3). */
FD.impliedBreakeven = function (p2, p3, g) {
  p2 = p2 == null ? FD.secondAndOne.rush.convert : p2;
  p3 = p3 == null ? FD.thirdAndOne.rush.convert : p3;
  g = g == null ? FD.possession.avgYardsWhenConvert : g;
  const pConvert = p2 + (1 - p2) * p3;      // convert on 2nd, else on 3rd
  const pLose = (1 - p2) * (1 - p3);        // fail both -> punt on 4th
  if (pLose <= 0) return Infinity;
  return (pConvert / pLose) * (g - 1);
};

/* Net value (to us) of failing to convert and then PUNTING from yardline yl.
 * A punt nets ~40 yards; if it would sail into the end zone it's a touchback to
 * the 20. The opponent then owns the ball, so our value is the negative of THEIR
 * expected points from where they take over. Deep in our own end this is a real
 * cost; near midfield a punt pins them and the cost is small. */
FD.puntValue = function (yl) {
  const netPunt = 40;
  let landing = yl + netPunt;            // measured from our own goal
  let oppOwn = landing >= 100 ? 20 : 100 - landing; // opp distance from their goal
  oppOwn = Math.max(3, oppOwn);          // can't pin them inside ~the 3
  return -FD.expectedPoints(oppOwn);
};

