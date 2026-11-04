/* ==========================================================================
   ML interactive textbook — shared behaviour
   Search, progress, copy, quizzes, and four ML visualizers.
   ========================================================================== */
(function () {
  'use strict';

  var SEARCH_INDEX = window.ML_SEARCH || [];

  /* ---------------- search ---------------------------------------------- */
  function initSearch() {
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    if (!input || !results) return;

    function render(q) {
      var query = q.trim().toLowerCase();
      if (query.length < 2) { results.classList.remove('open'); results.innerHTML = ''; return; }
      var hits = SEARCH_INDEX.filter(function (item) {
        return (item.title + ' ' + item.topic + ' ' + (item.keywords || '')).toLowerCase().indexOf(query) !== -1;
      }).slice(0, 12);
      results.innerHTML = hits.length
        ? hits.map(function (h) {
            return '<a href="' + h.url + '"><span class="sr-topic">' + esc(h.topic) + '</span><br>' + esc(h.title) + '</a>';
          }).join('')
        : '<div class="sr-empty">No matches for \u201c' + esc(q) + '\u201d</div>';
      results.classList.add('open');
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('focus', function () { if (input.value.trim().length >= 2) render(input.value); });
    document.addEventListener('click', function (e) {
      if (!results.contains(e.target) && e.target !== input) results.classList.remove('open');
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
      if (e.key === 'Enter') { var a = results.querySelector('a'); if (a) window.location.href = a.getAttribute('href'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && ['INPUT', 'TEXTAREA'].indexOf(document.activeElement.tagName) === -1) {
        e.preventDefault(); input.focus();
      }
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ---------------- progress -------------------------------------------- */
  var KEY = 'ml-progress-v1';

  function getP() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function setP(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  function refresh() {
    var p = getP();
    document.querySelectorAll('[data-topic-id]').forEach(function (el) {
      el.classList.toggle('read', !!p[el.getAttribute('data-topic-id')]);
    });
    document.querySelectorAll('.sidebar a[data-topic-id]').forEach(function (el) {
      el.classList.toggle('done', !!p[el.getAttribute('data-topic-id')]);
    });
    var box = document.querySelector('[data-complete]');
    if (box) {
      box.checked = !!p[box.getAttribute('data-complete')];
      var label = box.closest('.chapter-check');
      if (label) {
        label.classList.toggle('is-done', box.checked);
        var t = label.querySelector('.cc-text');
        if (t) t.textContent = box.checked ? 'Chapter complete' : 'Mark this chapter complete';
      }
    }
    var counter = document.getElementById('progress-count');
    if (counter) {
      var total = parseInt(counter.getAttribute('data-total'), 10) || 14;
      var done = Object.keys(p).filter(function (k) { return k.indexOf('topic-') === 0; }).length;
      counter.textContent = done + ' of ' + total + ' chapters complete';
    }
  }

  function initProgress() {
    var box = document.querySelector('[data-complete]');
    if (box) {
      box.addEventListener('change', function () {
        var p = getP(), id = box.getAttribute('data-complete');
        if (box.checked) p[id] = Date.now(); else delete p[id];
        setP(p); refresh();
      });
    }
    var reset = document.getElementById('reset-progress');
    if (reset) reset.addEventListener('click', function () { setP({}); refresh(); });
    refresh();
  }

  /* ---------------- copy ------------------------------------------------- */
  function initCopy() {
    document.querySelectorAll('.codeblock').forEach(function (block) {
      var btn = block.querySelector('.copy-btn');
      var code = block.querySelector('pre code') || block.querySelector('pre');
      if (!btn || !code) return;
      btn.addEventListener('click', function () {
        var text = code.innerText;
        function done() { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1400); }
        function fb() {
          var ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb);
        else fb();
      });
    });
  }

  /* ---------------- quizzes ---------------------------------------------- */
  function initQuizzes() {
    document.querySelectorAll('.quiz').forEach(function (quiz) {
      var fb = quiz.querySelector('.fb');
      quiz.querySelectorAll('.opt').forEach(function (opt) {
        opt.addEventListener('click', function () {
          if (quiz.dataset.answered === '1') return;
          quiz.dataset.answered = '1';
          var ok = opt.hasAttribute('data-correct');
          opt.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) { var r = quiz.querySelector('.opt[data-correct]'); if (r) r.classList.add('correct'); }
          if (fb) fb.classList.add('show');
        });
      });
    });
  }

  /* ---------------- scroll spy ------------------------------------------- */
  function initSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.sidebar a[href^="#"]'));
    var secs = links.map(function (l) { return { link: l, el: document.getElementById(l.getAttribute('href').slice(1)) }; })
                     .filter(function (s) { return s.el; });
    if (!secs.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('active'); });
        var m = secs.find(function (s) { return s.el === en.target; });
        if (m) {
          m.link.classList.add('active');
          if (window.innerWidth <= 1000) m.link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    }, { rootMargin: '-8% 0px -82% 0px' });
    secs.forEach(function (s) { obs.observe(s.el); });
  }

  /* ================= VISUALIZER 1: gradient descent ===================== */
  function initGD() {
    var root = document.getElementById('viz-gd');
    if (!root) return;
    var DATA = [[1, 2], [2, 3], [3, 5], [4, 4], [5, 6]];
    var lrEl = root.querySelector('[data-gd="lr"]');
    var stepBtn = root.querySelector('[data-gd="step"]');
    var resetBtn = root.querySelector('[data-gd="reset"]');
    var runBtn = root.querySelector('[data-gd="run"]');
    var stage = root.querySelector('.viz-stage');
    var log = root.querySelector('.viz-log');
    var theta = [0, 0], iter = 0, timer = null;

    function cost(t) {
      var s = 0;
      for (var i = 0; i < DATA.length; i++) {
        var e = t[0] + t[1] * DATA[i][0] - DATA[i][1];
        s += e * e;
      }
      return s / DATA.length;
    }
    function grads(t) {
      var g0 = 0, g1 = 0;
      for (var i = 0; i < DATA.length; i++) {
        var x = DATA[i][0], y = DATA[i][1];
        var e = t[0] + t[1] * x - y;
        g0 += e; g1 += e * x;
      }
      return [2 * g0 / DATA.length, 2 * g1 / DATA.length];
    }
    function step() {
      var lr = parseFloat(lrEl.value);
      var g = grads(theta);
      theta = [theta[0] - lr * g[0], theta[1] - lr * g[1]];
      iter++;
      draw();
    }
    function draw() {
      var W = 460, H = 260, pad = 34;
      var xs = DATA.map(function (d) { return d[0]; });
      var ys = DATA.map(function (d) { return d[1]; });
      var x0 = 0, x1 = 6, y0 = 0, y1 = 7;
      function sx(v) { return pad + (v - x0) / (x1 - x0) * (W - 2 * pad); }
      function sy(v) { return H - pad - (v - y0) / (y1 - y0) * (H - 2 * pad); }
      var svg = ['<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gradient descent on a line fit">'];
      svg.push('<line x1="' + pad + '" y1="' + sy(0) + '" x2="' + (W - pad) + '" y2="' + sy(0) + '" stroke="var(--rule-2)" stroke-width="1"/>');
      svg.push('<line x1="' + sx(0) + '" y1="' + pad + '" x2="' + sx(0) + '" y2="' + (H - pad) + '" stroke="var(--rule-2)" stroke-width="1"/>');
      DATA.forEach(function (d) {
        svg.push('<circle cx="' + sx(d[0]) + '" cy="' + sy(d[1]) + '" r="5" fill="var(--accent-2)" opacity="0.85"/>');
      });
      var yA = theta[0] + theta[1] * x0, yB = theta[0] + theta[1] * x1;
      svg.push('<line x1="' + sx(x0) + '" y1="' + sy(yA) + '" x2="' + sx(x1) + '" y2="' + sy(yB) + '" stroke="var(--accent)" stroke-width="2.2"/>');
      svg.push('</svg>');
      stage.innerHTML = svg.join('');
      log.textContent = 'iteration ' + iter +
        '   theta0 = ' + theta[0].toFixed(4) +
        '   theta1 = ' + theta[1].toFixed(4) +
        '   J = ' + cost(theta).toFixed(5) +
        '   (optimum theta0 = 0.8667, theta1 = 1.0000)';
    }
    stepBtn.addEventListener('click', step);
    resetBtn.addEventListener('click', function () { theta = [0, 0]; iter = 0; draw(); });
    runBtn.addEventListener('click', function () {
      if (timer) { clearInterval(timer); timer = null; runBtn.textContent = 'Run'; return; }
      runBtn.textContent = 'Pause';
      timer = setInterval(function () { if (iter > 60) { clearInterval(timer); timer = null; runBtn.textContent = 'Run'; return; } step(); }, 140);
    });
    draw();
  }

  /* ================= VISUALIZER 2: k-means ============================== */
  function initKMeans() {
    var root = document.getElementById('viz-kmeans');
    if (!root) return;
    var PTS = [[1,1],[2,1],[4,3],[5,4],[1.5,3],[7,1],[8,2]];
    var K = 2, cents = [[1,1],[7,1]], assign = [], iter = 0;
    var stage = root.querySelector('.viz-stage'), log = root.querySelector('.viz-log');
    var btnStep = root.querySelector('[data-km="step"]'), btnReset = root.querySelector('[data-km="reset"]');
    var kSel = root.querySelector('[data-km="k"]');

    function dist2(a, b) { return (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]); }

    function assignAll() {
      assign = PTS.map(function (p) {
        var best = 0, bd = Infinity;
        cents.forEach(function (c, i) { var d = dist2(p, c); if (d < bd) { bd = d; best = i; } });
        return best;
      });
    }
    function updateCents() {
      var sum = [], cnt = [];
      for (var i = 0; i < K; i++) { sum.push([0,0]); cnt.push(0); }
      PTS.forEach(function (p, j) { var a = assign[j]; sum[a][0] += p[0]; sum[a][1] += p[1]; cnt[a]++; });
      cents = sum.map(function (s, i) { return cnt[i] ? [s[0]/cnt[i], s[1]/cnt[i]] : cents[i]; });
    }
    function sse() {
      var t = 0;
      PTS.forEach(function (p, j) { t += dist2(p, cents[assign[j]]); });
      return t;
    }
    function draw() {
      var W = 440, H = 280, pad = 30;
      function sx(v) { return pad + v / 9 * (W - 2 * pad); }
      function sy(v) { return H - pad - v / 6 * (H - 2 * pad); }
      var colours = ['var(--accent)', 'var(--accent-2)', 'var(--ok)'];
      var svg = ['<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="k-means clustering">'];
      PTS.forEach(function (p, j) {
        var c = colours[assign[j] % 3];
        svg.push('<circle cx="' + sx(p[0]) + '" cy="' + sy(p[1]) + '" r="6" fill="' + c + '" opacity="0.75"/>');
      });
      cents.forEach(function (c, i) {
        var col = colours[i % 3];
        svg.push('<rect x="' + (sx(c[0]) - 7) + '" y="' + (sy(c[1]) - 7) + '" width="14" height="14" fill="none" stroke="' + col + '" stroke-width="2.5"/>');
        svg.push('<line x1="' + (sx(c[0]) - 11) + '" y1="' + sy(c[1]) + '" x2="' + (sx(c[0]) + 11) + '" y2="' + sy(c[1]) + '" stroke="' + col + '" stroke-width="1.5"/>');
        svg.push('<line x1="' + sx(c[0]) + '" y1="' + (sy(c[1]) - 11) + '" x2="' + sx(c[0]) + '" y2="' + (sy(c[1]) + 11) + '" stroke="' + col + '" stroke-width="1.5"/>');
      });
      svg.push('</svg>');
      stage.innerHTML = svg.join('');
      log.textContent = 'iteration ' + iter + '   SSE = ' + sse().toFixed(3) +
        '   centroids: ' + cents.map(function (c) { return '(' + c[0].toFixed(2) + ', ' + c[1].toFixed(2) + ')'; }).join('  ');
    }
    btnStep.addEventListener('click', function () { assignAll(); updateCents(); iter++; draw(); });
    btnReset.addEventListener('click', function () {
      K = parseInt(kSel.value, 10);
      cents = K === 2 ? [[1,1],[7,1]] : [[1,1],[5,3],[8,2]];
      iter = 0; assignAll(); draw();
    });
    kSel.addEventListener('change', function () { btnReset.click(); });
    assignAll(); draw();
  }

  /* ================= VISUALIZER 3: metrics calculator =================== */
  function initMetrics() {
    var root = document.getElementById('viz-metrics');
    if (!root) return;
    var ids = ['tp', 'fp', 'fn', 'tn'];
    var stage = root.querySelector('.viz-stage'), log = root.querySelector('.viz-log');
    function val(id) { var el = root.querySelector('[data-m="' + id + '"]'); return parseInt(el.value, 10) || 0; }
    function draw() {
      var tp = val('tp'), fp = val('fp'), fn = val('fn'), tn = val('tn');
      var n = tp + fp + fn + tn;
      var acc = n ? (tp + tn) / n : 0;
      var prec = (tp + fp) ? tp / (tp + fp) : 0;
      var rec = (tp + fn) ? tp / (tp + fn) : 0;
      var f1 = (prec + rec) ? 2 * prec * rec / (prec + rec) : 0;
      var rows = [
        ['Accuracy', acc, '(TP + TN) / total'],
        ['Precision', prec, 'TP / (TP + FP)'],
        ['Recall', rec, 'TP / (TP + FN)'],
        ['F1', f1, '2PR / (P + R)']
      ];
      stage.innerHTML = '<div style="width:100%;max-width:520px">' + rows.map(function (r) {
        return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
          '<div style="width:88px;font-family:var(--font-mono);font-size:12px;color:var(--ink-2);text-align:right">' + r[0] + '</div>' +
          '<div style="flex:1;height:16px;background:var(--paper-2);border-radius:3px;overflow:hidden">' +
          '<div style="height:100%;width:' + (r[1] * 100).toFixed(1) + '%;background:var(--accent)"></div></div>' +
          '<div style="width:60px;font-family:var(--font-mono);font-size:12px;text-align:right">' + r[1].toFixed(3) + '</div>' +
          '<div style="width:130px;font-family:var(--font-mono);font-size:10.5px;color:var(--ink-3)">' + r[2] + '</div></div>';
      }).join('') + '</div>';
      log.textContent = 'TP=' + tp + '  FP=' + fp + '  FN=' + fn + '  TN=' + tn + '   total = ' + n;
    }
    ids.forEach(function (id) {
      var el = root.querySelector('[data-m="' + id + '"]');
      if (el) el.addEventListener('input', draw);
    });
    draw();
  }

  /* ================= VISUALIZER 4: entropy calculator =================== */
  function initEntropy() {
    var root = document.getElementById('viz-entropy');
    if (!root) return;
    var stage = root.querySelector('.viz-stage'), log = root.querySelector('.viz-log');
    var pEl = root.querySelector('[data-e="pos"]'), nEl = root.querySelector('[data-e="neg"]');

    function H(a, b) {
      var t = a + b;
      if (!t || a === 0 || b === 0) return 0;
      var p = a / t, q = b / t;
      return -(p * Math.log2(p) + q * Math.log2(q));
    }
    function draw() {
      var a = parseInt(pEl.value, 10) || 0, b = parseInt(nEl.value, 10) || 0;
      var h = H(a, b);
      var pct = (h / 1) * 100;
      stage.innerHTML = '<div style="width:100%;max-width:460px">' +
        '<div style="font-family:var(--font-mono);font-size:12px;color:var(--ink-3);margin-bottom:8px">' +
        'H(S) = \u2212(p log\u2082 p + q log\u2082 q)</div>' +
        '<div style="height:22px;background:var(--paper-2);border-radius:4px;overflow:hidden;margin-bottom:10px">' +
        '<div style="height:100%;width:' + pct.toFixed(1) + '%;background:var(--accent)"></div></div>' +
        '<div style="font-family:var(--font-mono);font-size:13px">H = ' + h.toFixed(4) + ' bits</div>' +
        '<div style="font-size:13px;color:var(--ink-2);margin-top:8px">' +
        (h === 0 ? 'Pure node \u2014 no information gain possible, the split is worthless here.'
                 : (h > 0.99 ? 'Almost perfectly mixed \u2014 maximum uncertainty for two classes.'
                             : 'Impure node \u2014 a split here could still reduce entropy.')) +
        '</div></div>';
      log.textContent = 'positive = ' + a + ', negative = ' + b + ', total = ' + (a + b) + '  \u00b7  H = ' + h.toFixed(4);
    }
    pEl.addEventListener('input', draw);
    nEl.addEventListener('input', draw);
    draw();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSearch(); initProgress(); initCopy(); initQuizzes(); initSpy();
    initGD(); initKMeans(); initMetrics(); initEntropy();
    if (window.Prism) { try { Prism.highlightAll(); } catch (e) {} }
  });
})();
