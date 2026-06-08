/* ============================================================
   app.js — interactive demos for "Stop Shy of the First Down"
   Each act gets its own init function. All numbers come from FD (data.js).
   ============================================================ */

(function () {
  "use strict";

  const fmt = (n, d = 2) => (n >= 0 ? "+" : "") + n.toFixed(d);
  const pts = (n) => n.toFixed(2);

  /* responsive svg helper */
  function makeSVG(parent, w, h) {
    return d3
      .select(parent)
      .append("svg")
      .attr("viewBox", `0 0 ${w} ${h}`)
      .attr("width", "100%")
      .style("display", "block")
      .style("height", "auto");
  }

  /* =====================================================================
     ACT 1 — The field. Drag the ball-carrier; watch expected points.
     Punch line: the contested yard at the marker is nearly worthless,
     while losing the ball costs ~2 points.
     ===================================================================== */
  function initFieldDemo() {
    const root = document.getElementById("field-demo");
    if (!root) return;
    const W = 1000, H = 320;
    const svg = makeSVG(root, W, H);

    // field window: yardlines (from own goal) 40 .. 75
    const ylMin = 40, ylMax = 75, marker = 60, los = 50;
    const x = d3.scaleLinear().domain([ylMin, ylMax]).range([55, W - 55]);
    const fieldTop = 40, fieldBot = 250, midY = (fieldTop + fieldBot) / 2;

    // turf
    svg.append("rect").attr("x", 0).attr("y", fieldTop).attr("width", W)
      .attr("height", fieldBot - fieldTop).attr("fill", "#16512c");
    // 5-yard stripes
    for (let yl = ylMin; yl <= ylMax; yl += 5) {
      svg.append("line").attr("x1", x(yl)).attr("x2", x(yl))
        .attr("y1", fieldTop).attr("y2", fieldBot)
        .attr("stroke", "rgba(255,255,255,.35)").attr("stroke-width", yl % 10 === 0 ? 2 : 1);
      const label = yl <= 50 ? yl : 100 - yl;
      svg.append("text").attr("x", x(yl)).attr("y", fieldBot + 22)
        .attr("text-anchor", "middle").attr("fill", "#9fb0a4")
        .attr("font-size", 13).text(label);
    }
    // line of scrimmage (blue) + first-down marker (yellow)
    svg.append("line").attr("x1", x(los)).attr("x2", x(los))
      .attr("y1", fieldTop).attr("y2", fieldBot).attr("stroke", "#46c3ff").attr("stroke-width", 3);
    svg.append("line").attr("x1", x(marker)).attr("x2", x(marker))
      .attr("y1", fieldTop).attr("y2", fieldBot).attr("stroke", "#ffd23f").attr("stroke-width", 4);
    svg.append("text").attr("x", x(marker)).attr("y", fieldTop - 12)
      .attr("text-anchor", "middle").attr("fill", "#ffd23f").attr("font-weight", 700)
      .attr("font-size", 14).text("◆ FIRST-DOWN MARKER");
    svg.append("text").attr("x", x(los)).attr("y", fieldTop - 12)
      .attr("text-anchor", "middle").attr("fill", "#46c3ff").attr("font-size", 13).text("line of scrimmage");

    // EP gauge below the field
    const gY = 290, gX0 = 55, gX1 = W - 55;
    const epScale = d3.scaleLinear().domain([-2, 6]).range([gX0, gX1]).clamp(true);
    svg.append("rect").attr("x", gX0).attr("y", gY).attr("width", gX1 - gX0).attr("height", 10)
      .attr("rx", 5).attr("fill", "url(#epgrad)");
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "epgrad");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#ff6b6b");
    grad.append("stop").attr("offset", "30%").attr("stop-color", "#3a3f2a");
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#57e08a");
    const gaugeDot = svg.append("circle").attr("cy", gY + 5).attr("r", 8)
      .attr("fill", "#fff").attr("stroke", "#0a0e0c").attr("stroke-width", 2);
    svg.append("text").attr("x", gX0).attr("y", gY + 32).attr("fill", "#6b7d70")
      .attr("font-size", 11).text("lost possession −2");
    svg.append("text").attr("x", gX1).attr("y", gY + 32).attr("text-anchor", "end")
      .attr("fill", "#6b7d70").attr("font-size", 11).text("touchdown territory +6");

    // ball-carrier
    let curYl = 52;
    const carrier = svg.append("g").style("cursor", "grab");
    carrier.append("circle").attr("r", 13).attr("fill", "#ff5b4a")
      .attr("stroke", "#fff").attr("stroke-width", 2.5);
    carrier.append("text").attr("text-anchor", "middle").attr("dy", 5)
      .attr("fill", "#fff").attr("font-size", 14).attr("font-weight", 700).text("●");

    // readout DOM
    const readout = document.createElement("div");
    readout.className = "stat-row";
    readout.innerHTML = `
      <div class="stat"><div class="stat__label">Down &amp; distance</div><div class="stat__value warn" id="fd-state">1st &amp; 10</div></div>
      <div class="stat"><div class="stat__label">Expected points</div><div class="stat__value" id="fd-ep">—</div></div>
      <div class="stat"><div class="stat__label">This yard is worth</div><div class="stat__value" id="fd-marg">—</div></div>`;
    root.appendChild(readout);
    const verdict = document.createElement("div");
    verdict.className = "verdict neutral";
    verdict.id = "fd-verdict";
    root.appendChild(verdict);

    function update() {
      carrier.attr("transform", `translate(${x(curYl)},${midY})`);
      const ep = FD.expectedPoints(curYl);
      gaugeDot.attr("cx", epScale(ep));
      const marg = ep - FD.expectedPoints(curYl - 1);
      document.getElementById("fd-ep").textContent = pts(ep);
      document.getElementById("fd-marg").textContent = fmt(marg) + " pt";
      const made = curYl >= marker;
      const dist = Math.max(0, marker - curYl);
      document.getElementById("fd-state").innerHTML = made
        ? "1st &amp; 10 (new)"
        : `2nd &amp; ${dist}`;
      const v = document.getElementById("fd-verdict");
      if (made) {
        v.className = "verdict neutral";
        v.innerHTML = `You crossed the line — but the marginal yard only added <strong>${fmt(marg)} pts</strong>. Was it worth the extra exposure to a hit and a fumble? A lost possession costs about <strong>−2 pts</strong> — that's ${Math.round(2 / Math.max(marg, 0.001))}× the value of this yard.`;
      } else {
        v.className = "verdict";
        v.innerHTML = `Down a yard short at <strong>2nd &amp; ${dist}</strong>. Act 4 shows this can beat taking the first down outright — because the conversion that follows is nearly automatic and lands you further downfield.`;
      }
    }

    carrier.call(
      d3.drag()
        .on("start", () => carrier.style("cursor", "grabbing"))
        .on("drag", (e) => {
          curYl = Math.max(ylMin + 5, Math.min(ylMax - 3, x.invert(e.x)));
          update();
        })
        .on("end", () => carrier.style("cursor", "grab"))
    );
    update();
  }

  /* =====================================================================
     ACT 2 — The notch histogram (first-and-ten rushing yards gained).
     ===================================================================== */
  function initNotchDemo() {
    const root = document.getElementById("notch-demo");
    if (!root) return;
    const data = FD.notch.bins, line = FD.notch.lineToGain;
    const W = 1000, H = 460, m = { t: 30, r: 20, b: 60, l: 70 };
    const svg = makeSVG(root, W, H);

    const x = d3.scaleBand().domain(data.map((d) => d.yards)).range([m.l, W - m.r]).padding(0.25);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.count) * 1.05]).range([H - m.b, m.t]);

    // axes
    svg.append("g").attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((g) => g.selectAll("text").attr("fill", "#9fb0a4").attr("font-size", 13))
      .call((g) => g.selectAll("line,path").attr("stroke", "rgba(255,255,255,.15)"));
    svg.append("g").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("~s")))
      .call((g) => g.selectAll("text").attr("fill", "#9fb0a4").attr("font-size", 12))
      .call((g) => g.selectAll("line,path").attr("stroke", "rgba(255,255,255,.15)"));

    svg.append("text").attr("x", (W) / 2).attr("y", H - 14).attr("text-anchor", "middle")
      .attr("class", "axis-label").text("Yards gained on a first-and-ten rush →");
    svg.append("text").attr("transform", "rotate(-90)").attr("x", -(H / 2)).attr("y", 20)
      .attr("text-anchor", "middle").attr("class", "axis-label").text("Number of plays");

    // bars
    svg.selectAll("rect.bar").data(data).join("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.yards))
      .attr("width", x.bandwidth())
      .attr("y", H - m.b)
      .attr("height", 0)
      .attr("rx", 3)
      .attr("fill", (d) => (d.yards === line ? "#ff5b4a" : "#46c3ff"))
      .attr("opacity", (d) => (d.yards === line ? 1 : 0.65))
      .transition().delay((d, i) => i * 55).duration(650)
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => H - m.b - y(d.count));

    // annotation on the notch bar
    const nb = data.find((d) => d.yards === line);
    const cx = x(line) + x.bandwidth() / 2;
    svg.append("line").attr("x1", cx).attr("x2", cx).attr("y1", m.t).attr("y2", y(nb.count) - 8)
      .attr("stroke", "#ff5b4a").attr("stroke-dasharray", "4 4").attr("opacity", 0)
      .transition().delay(900).duration(500).attr("opacity", 0.8);
    svg.append("text").attr("x", cx).attr("y", m.t + 4).attr("text-anchor", "middle")
      .attr("fill", "#ff5b4a").attr("font-weight", 700).attr("font-size", 14).attr("opacity", 0)
      .text("◀ the notch — right at the marker")
      .transition().delay(900).duration(500).attr("opacity", 1);

    const note = document.createElement("div");
    note.className = "verdict bad";
    note.innerHTML = `Plays that gain <strong>exactly ${line}</strong> yards crater. Carriers cross the line and immediately stop fighting — they leave free yards (and free expected points) on the turf, every single down.`;
    root.appendChild(note);
  }

  /* =====================================================================
     ACT 3 — Expected-points curve over the whole field, draggable ball.
     ===================================================================== */
  function initEPCurve() {
    const root = document.getElementById("ep-demo");
    if (!root) return;
    const W = 1000, H = 420, m = { t: 30, r: 30, b: 55, l: 60 };
    const svg = makeSVG(root, W, H);
    const x = d3.scaleLinear().domain([1, 99]).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([-1, 6.5]).range([H - m.b, m.t]);

    // gridlines + zero line
    svg.append("g").attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).tickValues([1, 20, 50, 80, 99]).tickFormat((d) => (d <= 50 ? `own ${d}` : `opp ${100 - d}`)))
      .call((g) => g.selectAll("text").attr("fill", "#9fb0a4").attr("font-size", 12))
      .call((g) => g.selectAll("line,path").attr("stroke", "rgba(255,255,255,.15)"));
    svg.append("g").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(6))
      .call((g) => g.selectAll("text").attr("fill", "#9fb0a4").attr("font-size", 12))
      .call((g) => g.selectAll("line,path").attr("stroke", "rgba(255,255,255,.15)"));
    svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(0)).attr("y2", y(0))
      .attr("stroke", "rgba(255,255,255,.25)").attr("stroke-dasharray", "3 3");
    svg.append("text").attr("transform", "rotate(-90)").attr("x", -(H / 2)).attr("y", 16)
      .attr("text-anchor", "middle").attr("class", "axis-label").text("Expected points on the drive");

    // curve
    const pts2 = d3.range(1, 100).map((yl) => [yl, FD.expectedPoints(yl)]);
    const line = d3.line().x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX);
    const path = svg.append("path").datum(pts2).attr("fill", "none")
      .attr("stroke", "#57e08a").attr("stroke-width", 3).attr("d", line);
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len)
      .transition().duration(1100).attr("stroke-dashoffset", 0);

    // draggable marker
    let curYl = 50;
    const guide = svg.append("line").attr("stroke", "#ffd23f").attr("stroke-width", 1.5).attr("stroke-dasharray", "4 4");
    const dot = svg.append("circle").attr("r", 9).attr("fill", "#ffd23f")
      .attr("stroke", "#1a1300").attr("stroke-width", 2).style("cursor", "grab");
    const tag = svg.append("text").attr("fill", "#ffd23f").attr("font-weight", 700).attr("font-size", 14);

    const readout = document.createElement("div");
    readout.className = "stat-row";
    readout.innerHTML = `
      <div class="stat"><div class="stat__label">Ball on</div><div class="stat__value warn" id="ep-pos">—</div></div>
      <div class="stat"><div class="stat__label">Expected points</div><div class="stat__value good" id="ep-val">—</div></div>
      <div class="stat"><div class="stat__label">Yards to +1 point</div><div class="stat__value" id="ep-next">≈15</div></div>
      <div class="stat"><div class="stat__label">A possession ≈</div><div class="stat__value">40 yds</div></div>`;
    root.appendChild(readout);

    function update() {
      const ep = FD.expectedPoints(curYl);
      dot.attr("cx", x(curYl)).attr("cy", y(ep));
      guide.attr("x1", x(curYl)).attr("x2", x(curYl)).attr("y1", y(ep)).attr("y2", H - m.b);
      tag.attr("x", x(curYl) + 12).attr("y", y(ep) - 10).text(pts(ep) + " pts");
      const slope = FD.expectedPoints(Math.min(99, curYl + 5)) - ep;
      const yardsToPoint = slope > 0.001 ? Math.round(5 / slope) : 99;
      document.getElementById("ep-pos").textContent = curYl <= 50 ? `own ${Math.round(curYl)}` : `opp ${Math.round(100 - curYl)}`;
      document.getElementById("ep-val").textContent = pts(ep);
      document.getElementById("ep-next").textContent = "≈" + yardsToPoint;
    }
    dot.call(
      d3.drag()
        .on("start", () => dot.style("cursor", "grabbing"))
        .on("drag", (e) => { curYl = Math.max(1, Math.min(99, x.invert(e.x))); update(); })
        .on("end", () => dot.style("cursor", "grab"))
    );
    update();
  }

  /* =====================================================================
     ACT 4 — Monte Carlo: 2nd-and-1 vs 1st-and-10.
     Both reduce to "expected points once you reach a fresh 1st-and-10",
     plus the short-yardage gamble's turnover risk for the 2nd-and-1 path.
     ===================================================================== */
  function initSimDemo() {
    const root = document.getElementById("sim-demo");
    if (!root) return;

    // controls
    const params = {
      yl: 60,                                    // yardline where the carrier could reach the marker
      p2: FD.secondAndOne.rush.convert,          // convert prob on 2nd-and-1
      g2: FD.secondAndOne.rush.yardsWhenConvert,
      p3: FD.thirdAndOne.rush.convert,           // convert prob on 3rd-and-1
      g3: FD.thirdAndOne.rush.yardsWhenConvert,
      lost: FD.ep.lostPossession,
    };

    const ctrls = document.createElement("div");
    ctrls.className = "controls";
    ctrls.innerHTML = `
      <div class="control"><label>Field position (own yardline) <span id="s-yl">${params.yl}</span></label>
        <input type="range" id="r-yl" min="25" max="80" step="1" value="${params.yl}"></div>
      <div class="control"><label>2nd-and-1 conversion rate <span id="s-p2">${(params.p2*100)|0}%</span></label>
        <input type="range" id="r-p2" min="0.5" max="0.95" step="0.01" value="${params.p2}"></div>
      <div class="control"><label>3rd-and-1 conversion rate <span id="s-p3">${(params.p3*100)|0}%</span></label>
        <input type="range" id="r-p3" min="0.5" max="0.95" step="0.01" value="${params.p3}"></div>
      <div class="control"><label>Cost of a lost possession (pts) <span id="s-lost">${params.lost}</span></label>
        <input type="range" id="r-lost" min="-3" max="-1" step="0.1" value="${params.lost}"></div>`;
    root.appendChild(ctrls);

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "▶ Run 10,000 drives";
    root.appendChild(btn);

    const W = 1000, H = 240, m = { t: 20, r: 20, b: 40, l: 130 };
    const svg = makeSVG(root, W, H);
    const stats = document.createElement("div");
    stats.className = "stat-row";
    stats.innerHTML = `
      <div class="stat"><div class="stat__label">Take it · 1st &amp; 10</div><div class="stat__value" id="o-a">—</div></div>
      <div class="stat"><div class="stat__label">Stop short · 2nd &amp; 1</div><div class="stat__value" id="o-b">—</div></div>
      <div class="stat"><div class="stat__label">Edge to stopping short</div><div class="stat__value" id="o-d">—</div></div>`;
    root.appendChild(stats);
    const verdict = document.createElement("div");
    verdict.className = "verdict neutral";
    verdict.id = "sim-verdict";
    verdict.textContent = "Press Run to simulate.";
    root.appendChild(verdict);

    // simple LCG so runs are smooth without Math.random nondeterminism worries
    let seed = 1234567;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.9; // ~N(0,~1)

    function sampleA() {
      // already 1st-and-10 one yard past the marker
      return FD.expectedPoints(params.yl);
    }
    function sampleB() {
      const start = params.yl - 1; // a yard short → 2nd-and-1
      if (rnd() < params.p2) {
        return FD.expectedPoints(start + Math.max(1, params.g2 + gauss()));
      }
      // failed 2nd down → 3rd-and-1
      if (rnd() < params.p3) {
        return FD.expectedPoints(start + Math.max(1, params.g3 + gauss()));
      }
      return params.lost; // turnover on downs
    }

    function run() {
      const N = 10000;
      let sumA = 0, sumB = 0;
      const binsA = {}, binsB = {};
      const bucket = (v) => Math.round(v * 2) / 2;
      for (let i = 0; i < N; i++) {
        const a = sampleA(); const b = sampleB();
        sumA += a; sumB += b;
        binsA[bucket(a)] = (binsA[bucket(a)] || 0) + 1;
        binsB[bucket(b)] = (binsB[bucket(b)] || 0) + 1;
      }
      const meanA = sumA / N, meanB = sumB / N, edge = meanB - meanA;
      animateBars(meanA, meanB);
      document.getElementById("o-a").textContent = pts(meanA);
      document.getElementById("o-b").textContent = pts(meanB);
      const od = document.getElementById("o-d");
      od.textContent = fmt(edge);
      od.className = "stat__value " + (edge >= 0 ? "good" : "bad");
      const v = document.getElementById("sim-verdict");
      if (edge >= 0.02) {
        v.className = "verdict";
        v.innerHTML = `<strong>Stopping a yard short wins</strong> by ${fmt(edge)} expected points per drive. Across a season that's real points — for giving up a yard you didn't need.`;
      } else if (edge <= -0.02) {
        v.className = "verdict bad";
        v.innerHTML = `Here, taking the first down edges ahead by ${pts(-edge)} pts. Push the conversion rates toward their real values and watch it flip.`;
      } else {
        v.className = "verdict neutral";
        v.innerHTML = `Essentially a dead heat (${fmt(edge)} pts) — which is already the upset. The "sacred" first down is worth no more than going down short.`;
      }
    }

    // horizontal bar chart of the two means
    const x = d3.scaleLinear().domain([0, 4]).range([m.l, W - m.r]);
    svg.append("g").attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).ticks(5))
      .call((g) => g.selectAll("text").attr("fill", "#9fb0a4"))
      .call((g) => g.selectAll("line,path").attr("stroke", "rgba(255,255,255,.15)"));
    svg.append("text").attr("x", (m.l + W - m.r) / 2).attr("y", H - 6)
      .attr("text-anchor", "middle").attr("class", "axis-label").text("Average expected points per drive");

    const rows = [
      { key: "A", label: "Take it (1st & 10)", color: "#46c3ff", yc: 60 },
      { key: "B", label: "Stop short (2nd & 1)", color: "#ff5b4a", yc: 130 },
    ];
    const barH = 44;
    rows.forEach((r) => {
      svg.append("text").attr("x", m.l - 12).attr("y", r.yc + 6).attr("text-anchor", "end")
        .attr("fill", "#eef3ee").attr("font-size", 13).text(r.label);
      r.rect = svg.append("rect").attr("x", m.l).attr("y", r.yc - barH / 2)
        .attr("height", barH).attr("rx", 6).attr("fill", r.color).attr("width", 0);
      r.txt = svg.append("text").attr("y", r.yc + 5).attr("fill", "#04212f")
        .attr("font-weight", 700).attr("font-size", 15).attr("font-family", "JetBrains Mono, monospace");
    });
    function animateBars(a, b) {
      const vals = { A: a, B: b };
      rows.forEach((r) => {
        const w = x(vals[r.key]) - m.l;
        r.rect.transition().duration(700).attr("width", Math.max(2, w));
        r.txt.transition().duration(700).tween("t", function () {
          const i = d3.interpolate(0, vals[r.key]);
          return (t) => { r.txt.attr("x", m.l + Math.max(2, w) - 8).attr("text-anchor", "end").text(pts(i(t))); };
        });
      });
    }

    // wire controls
    const bind = (id, key, span, fmtFn) => {
      const el = document.getElementById(id);
      el.addEventListener("input", () => {
        params[key] = +el.value;
        document.getElementById(span).textContent = fmtFn(params[key]);
      });
    };
    bind("r-yl", "yl", "s-yl", (v) => v | 0);
    bind("r-p2", "p2", "s-p2", (v) => Math.round(v * 100) + "%");
    bind("r-p3", "p3", "s-p3", (v) => Math.round(v * 100) + "%");
    bind("r-lost", "lost", "s-lost", (v) => v.toFixed(1));
    btn.addEventListener("click", () => { seed = 1234567; run(); });

    run(); // initial
  }

  /* =====================================================================
     ACT 5 — 3rd-and-1: run vs pass decision, in expected points.
     ===================================================================== */
  function initTreeDemo() {
    const root = document.getElementById("tree-demo");
    if (!root) return;
    let yl = 55, choice = "pass";

    const toggle = document.createElement("div");
    toggle.className = "toggle-group";
    toggle.innerHTML = `<button data-c="rush">Run it</button><button data-c="pass">Throw it</button>`;
    root.appendChild(toggle);

    const slider = document.createElement("div");
    slider.className = "control";
    slider.style.marginTop = "1rem";
    slider.innerHTML = `<label>Field position (own yardline) <span id="t-yl">55</span></label>
      <input type="range" id="t-r" min="25" max="80" step="1" value="55">`;
    root.appendChild(slider);

    const W = 1000, H = 300;
    const svg = makeSVG(root, W, H);
    const stats = document.createElement("div");
    stats.className = "stat-row";
    stats.innerHTML = `
      <div class="stat"><div class="stat__label">Run — expected pts</div><div class="stat__value" id="t-rush">—</div></div>
      <div class="stat"><div class="stat__label">Pass — expected pts</div><div class="stat__value" id="t-pass">—</div></div>`;
    root.appendChild(stats);
    const verdict = document.createElement("div");
    verdict.className = "verdict neutral";
    verdict.id = "t-verdict";
    root.appendChild(verdict);

    function ev(kind) {
      // Fail on 3rd-and-1 → 4th down → punt (not a flat turnover); the cost of
      // failing depends on field position, which is exactly the paper's point.
      const c = FD.thirdAndOne[kind];
      const success = FD.expectedPoints(yl + c.yardsWhenConvert);
      const fail = FD.puntValue(yl);
      return c.convert * success + (1 - c.convert) * fail;
    }

    function drawTree() {
      svg.selectAll("*").remove();
      const c = FD.thirdAndOne[choice];
      const startX = 90, midX = 420, endX = 820, cy = 150;
      const okY = 70, failY = 235;
      // start node
      const node = (cx, cyy, label, sub, col) => {
        svg.append("rect").attr("x", cx - 75).attr("y", cyy - 28).attr("width", 150).attr("height", 56)
          .attr("rx", 10).attr("fill", "#141b16").attr("stroke", col).attr("stroke-width", 2);
        svg.append("text").attr("x", cx).attr("y", cyy - 4).attr("text-anchor", "middle")
          .attr("fill", "#eef3ee").attr("font-size", 14).attr("font-weight", 600).text(label);
        svg.append("text").attr("x", cx).attr("y", cyy + 15).attr("text-anchor", "middle")
          .attr("fill", "#9fb0a4").attr("font-size", 12).text(sub);
      };
      const edge = (x1, y1, x2, y2, col, lab) => {
        svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
          .attr("stroke", col).attr("stroke-width", 2.5);
        svg.append("text").attr("x", (x1 + x2) / 2).attr("y", (y1 + y2) / 2 - 8)
          .attr("text-anchor", "middle").attr("fill", col).attr("font-size", 12).attr("font-weight", 700).text(lab);
      };
      const okPts = FD.expectedPoints(yl + c.yardsWhenConvert);
      edge(startX + 75, cy, midX - 75, okY, "#57e08a", `convert ${Math.round(c.convert * 100)}%`);
      edge(startX + 75, cy, midX - 75, failY, "#ff6b6b", `fail ${Math.round((1 - c.convert) * 100)}%`);
      node(startX, cy, choice === "rush" ? "Run" : "Pass", "3rd & 1", "#ffd23f");
      node(midX, okY, `+${c.yardsWhenConvert} yds`, `1st & 10 → ${pts(okPts)} pts`, "#57e08a");
      node(midX, failY, "4th down → punt", `${pts(FD.puntValue(yl))} pts`, "#ff6b6b");
      // expected value node
      const e = ev(choice);
      edge(midX + 75, okY, endX - 75, cy, "#9fb0a4", "");
      edge(midX + 75, failY, endX - 75, cy, "#9fb0a4", "");
      svg.append("rect").attr("x", endX - 80).attr("y", cy - 34).attr("width", 160).attr("height", 68)
        .attr("rx", 12).attr("fill", "#1f6b3a").attr("stroke", "#57e08a").attr("stroke-width", 2);
      svg.append("text").attr("x", endX).attr("y", cy - 8).attr("text-anchor", "middle")
        .attr("fill", "#cdeed8").attr("font-size", 12).text("expected points");
      svg.append("text").attr("x", endX).attr("y", cy + 18).attr("text-anchor", "middle")
        .attr("fill", "#fff").attr("font-size", 22).attr("font-weight", 700)
        .attr("font-family", "JetBrains Mono, monospace").text(pts(e));
    }

    function update() {
      drawTree();
      const r = ev("rush"), p = ev("pass");
      const ra = document.getElementById("t-rush"), pa = document.getElementById("t-pass");
      ra.textContent = pts(r); pa.textContent = pts(p);
      ra.className = "stat__value " + (r >= p ? "good" : "");
      pa.className = "stat__value " + (p >= r ? "good" : "");
      const v = document.getElementById("t-verdict");
      const diff = p - r;
      if (Math.abs(diff) < 0.05) {
        v.className = "verdict neutral";
        v.innerHTML = `It's a coin flip in expected points — and <em>that's</em> the point. Everyone runs here on autopilot, so the pass is free expected value: it keeps the defense honest and occasionally breaks huge.`;
      } else if (diff > 0) {
        v.className = "verdict";
        v.innerHTML = `The <strong>pass</strong> wins by ${fmt(diff)} pts. It converts a little less often, but gains far more when it lands — and the defense is selling out to stop the run.`;
      } else {
        v.className = "verdict bad";
        v.innerHTML = `At this spot the <strong>run</strong> is ${fmt(-diff)} pts better — deep in your own end, protecting the ball matters more. Slide toward midfield and the pass takes over.`;
      }
      toggle.querySelectorAll("button").forEach((b) =>
        b.classList.toggle("active", b.dataset.c === choice));
    }

    toggle.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => { choice = b.dataset.c; update(); }));
    document.getElementById("t-r").addEventListener("input", (e) => {
      yl = +e.target.value; document.getElementById("t-yl").textContent = yl; update();
    });
    update();
  }

  /* =====================================================================
     Footer links + scroll reveal
     ===================================================================== */
  function wireLinks() {
    const map = {
      "link-paper": FD.links.paper, "link-notebook": FD.links.notebook,
      "link-colab": FD.links.colab, "link-blog": FD.links.blog,
      "link-linkedin": FD.links.linkedin,
    };
    Object.entries(map).forEach(([id, href]) => {
      const el = document.getElementById(id);
      if (el) { el.href = href; if (href.startsWith("http")) { el.target = "_blank"; el.rel = "noopener"; } }
    });
  }

  function wireReveal() {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireLinks();
    wireReveal();
    initFieldDemo();
    initNotchDemo();
    initEPCurve();
    initSimDemo();
    initTreeDemo();
  });
})();
