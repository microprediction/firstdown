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

  /*
   * The Notch.
   * Distribution of yards gained on FIRST-AND-TEN rushing plays, as seen in
   * images/first_and_ten_rushing_1200.png. The line to gain is 10 yards.
   * Note the dip right at the marker: ball-carriers treat the first-down line
   * as a finish line and stop the instant they cross it, so the bin just past
   * the line is suppressed. Counts are read approximately from the chart.
   */
  notch: {
    lineToGain: 10,
    bins: [
      { yards: 4, count: 2050 },
      { yards: 5, count: 2380 },
      { yards: 6, count: 1820 },
      { yards: 7, count: 1390 },
      { yards: 8, count: 1010 },
      { yards: 9, count: 1060 },
      { yards: 10, count: 380 },  // <-- the notch, right at the marker
      { yards: 11, count: 640 },
      { yards: 12, count: 440 },
      { yards: 13, count: 380 },
      { yards: 14, count: 290 },
      { yards: 15, count: 210 },
    ],
  },

  // External links. The PDF/notebook live in the repo root, which is NOT part of
  // the published /docs site, so these point at GitHub rather than relative paths.
  links: {
    paper: "https://github.com/microprediction/firstdown/raw/main/Stop_Shy_of_the_First_Down_2021_07.pdf",
    notebook: "https://github.com/microprediction/firstdown/blob/main/Stop_shy_of_the_first_down.ipynb",
    colab: "https://colab.research.google.com/github/microprediction/firstdown/blob/main/Stop_shy_of_the_first_down.ipynb",
    blog: "https://www.microprediction.com/blog/nine",
    linkedin: "https://www.linkedin.com/company/65109690",
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

