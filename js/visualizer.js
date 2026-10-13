(function () {
  'use strict';

  const CFG = {
    barCount: 64,
    height: 72,
    color: '170,170,170',
    maxAlpha: 0.85,
    minAlpha: 0,
    smooth: 0.8,
    threshold: 1,
    minFreq: 1000,
    maxFreq: 24000,
    mobileBreak: 768 
  };

  if (window.matchMedia('(max-width: ' + CFG.mobileBreak + 'px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wrap = document.createElement('div');
  wrap.id = 'musicVisualizerWrap';

  const canvas = document.createElement('canvas');
  canvas.id = 'musicVisualizer';
  wrap.appendChild(canvas);
  document.body.appendChild(wrap);

  const ctx = canvas.getContext('2d');
  let dpr = 1, W = 0, H = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = wrap.clientHeight || CFG.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  window.addEventListener('load', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);

  const AC = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  let freqData = null;
  let levels = new Array(CFG.barCount).fill(0);
  let rafId = 0;
  let barRanges = null;

  const activeNodes = new Set();

  function getCtx() {
    if (!audioCtx && AC) {
      audioCtx = new AC();
      freqData = new Uint8Array(analyserBinCount());
      buildBarRanges();
    }
    return audioCtx;
  }

  function analyserBinCount() {
    return 128;
  }

  function buildBarRanges() {
    if (!audioCtx) return;
    const bins = analyserBinCount();
    const nyquist = audioCtx.sampleRate / 2;
    const minF = CFG.minFreq;
    const maxF = Math.min(CFG.maxFreq, nyquist);
    const ratio = maxF / minF;

    const ranges = new Array(CFG.barCount);
    for (let i = 0; i < CFG.barCount; i++) {
      const f0 = minF * Math.pow(ratio, i / CFG.barCount);
      const f1 = minF * Math.pow(ratio, (i + 1) / CFG.barCount);
      let b0 = Math.floor(f0 / nyquist * bins);
      let b1 = Math.floor(f1 / nyquist * bins);
      if (b1 <= b0) b1 = b0 + 1;
      if (b0 < 0) b0 = 0;
      if (b1 > bins) b1 = bins;
      ranges[i] = [b0, b1];
    }
    barRanges = ranges;
  }

  function setupAudio(el) {
    if (!el || el.dataset.musicVisualized) return;
    el.dataset.musicVisualized = '1';

    const c = getCtx();
    if (!c) return;

    try {
      const source = c.createMediaElementSource(el);
      const analyser = c.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(c.destination);

      const node = { el: el, analyser: analyser };
      activeNodes.add(node);

      el.addEventListener('play', function () {
        if (c.state === 'suspended') c.resume().catch(function () {});
        start();
      });

      el.addEventListener('ended', function () {
      });

      if (!el.paused) start();
    } catch (e) {
      console.warn('可视化绑定失败：', e);
    }
  }

  function draw() {
    rafId = requestAnimationFrame(draw);

    if (!audioCtx || !freqData) return;
    if (audioCtx.state === 'suspended') {
      for (const n of activeNodes) {
        if (!n.el.paused) { audioCtx.resume().catch(function () {}); break; }
      }
    }

    freqData.fill(0);
    let anyPlaying = false;
    for (const n of activeNodes) {
      if (n.el.paused) continue;
      anyPlaying = true;
      const tmp = new Uint8Array(n.analyser.frequencyBinCount);
      n.analyser.getByteFrequencyData(tmp);
      for (let i = 0; i < freqData.length && i < tmp.length; i++) {
        if (tmp[i] > freqData[i]) freqData[i] = tmp[i];
      }
    }

    let sum = 0;
    for (let i = 0; i < freqData.length; i++) sum += freqData[i];
    const avg = sum / freqData.length;
    const hasSound = anyPlaying && avg > CFG.threshold;

    const targetAlpha = hasSound ? CFG.maxAlpha : CFG.minAlpha;
    const curAlpha = parseFloat(wrap.style.opacity || '0');
    const newAlpha = curAlpha + (targetAlpha - curAlpha) * 0.12;
    wrap.style.opacity = newAlpha.toFixed(3);

    if (newAlpha < 0.01 && !hasSound) {
      ctx.clearRect(0, 0, W, H);
      return;
    }

    ctx.clearRect(0, 0, W, H);

    const barW = W / CFG.barCount;

    for (let i = 0; i < CFG.barCount; i++) {
      const range = barRanges[i];
      let v = 0;
      for (let k = range[0]; k < range[1]; k++) {
        if (freqData[k] > v) v = freqData[k];
      }

      let n = v / 255;
      n = Math.pow(n, 4); 

      levels[i] = levels[i] * CFG.smooth + n * (1 - CFG.smooth);

      const barH = Math.max(1, levels[i] * H);
      const x = i * barW;
      const y = H - barH;

      const grad = ctx.createLinearGradient(0, H, 0, y);
      grad.addColorStop(0, 'rgba(' + CFG.color + ',0.95)');
      grad.addColorStop(1, 'rgba(' + CFG.color + ',0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, y, Math.max(1, barW - 2), barH);
    }
  }

  function start() {
    if (!rafId) rafId = requestAnimationFrame(draw);
  }

  function init() {
    document.querySelectorAll('audio').forEach(setupAudio);

    const mo = new MutationObserver(function (mutations) {
      for (let i = 0; i < mutations.length; i++) {
        const added = mutations[i].addedNodes;
        for (let j = 0; j < added.length; j++) {
          const node = added[j];
          if (node.nodeType !== 1) continue;
          if (node.tagName === 'AUDIO') {
            setupAudio(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('audio').forEach(setupAudio);
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    } else {
      const anyPlaying = Array.from(activeNodes).some(function (n) { return !n.el.paused; });
      if (anyPlaying) start();
    }
  });

})();