(function () {
  'use strict';

  const RULES = {
    '1.html': ['music1.mp3', 'music2.mp3', 'music3.mp3'],
  };
  const DEFAULT_LIST =  ['yy/Become Friends - 高田雅史.mp3',
    'yy/絶望Searching - 高田雅史.mp3',
    'yy/Soulwind - HyuN.mp3',
  'yy/COLOR - sleepyyer',
'yy/AIR - SHIKI.mp3',
'yy/[2024 April Fools] Algebra - Function Phantom - PuronotPuro.mp3',
'yy/永久の宴 (Zekk Remix) - Aiobahn,YUC’e,Zekk.mp3',
'yy/Whispers from a Distant Star - Fractal Dreamers.mp3',
'yy/Cross†Over - HyuN,LyuU.mp3',
'yy/Intergalactic Bound (feat. Hatsune Miku) - 雄之助,CircusP,初音ミク.mp3',
'yy/失楽園 - Reol.mp3',
'yy/Valhalla - Xomu,Retrograde.mp3'];

  const KEY = 'music_player_state';
  const SPEED = 60;
  const SAVE_INTERVAL = 3000; 

  function getPageId() {
    return (location.pathname || '/').replace(/\/+$/, '') || '/';
  }

  const pageId = getPageId();
  const fileName = pageId.split('/').pop() || 'index.html';
  const playlist = RULES[fileName] || DEFAULT_LIST;
  const listId = RULES[fileName] ? fileName : '__default__';

  const btn = document.createElement('div');
  btn.id = 'musicBtn';
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-label', '音乐播放器');

  const ball = document.createElement('div');
  ball.className = 'ball';
  ball.textContent = '♪';
  btn.appendChild(ball);
  document.body.appendChild(btn);

  const audio = document.createElement('audio');
  audio.id = 'audio';
  audio.preload = 'metadata';
  audio.id = 'musicPlayerAudio_' + Math.random().toString(36).slice(2, 8);
  document.body.appendChild(audio);

  let index = 0;
  let angle = 0;
  let spinning = false;
  let lastT = 0;
  let rafId = 0;
  let currentSrcToken = 0;

  let saved = {
    listId: '',
    index: 0,
    time: 0,
    playing: false,
    angle: 0
  };
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === 'object') {
      if (typeof s.listId === 'string') saved.listId = s.listId;
      if (Number.isFinite(s.index)) saved.index = s.index;
      if (Number.isFinite(s.time)) saved.time = s.time;
      if (typeof s.playing === 'boolean') saved.playing = s.playing;
      if (Number.isFinite(s.angle)) saved.angle = s.angle;
    }
  } catch (e) {  }

  if (saved.listId === listId && playlist[saved.index] !== undefined) {
    index = saved.index;
  }
  angle = saved.angle % 360;

  audio.src = playlist[index];

  function loop(t) {
    if (!spinning) { rafId = 0; return; }
    if (!lastT) lastT = t;
    const dt = Math.min((t - lastT) / 1000, 0.1);
    lastT = t;
    angle = (angle + SPEED * dt) % 360;
    btn.style.transform = 'rotate(' + angle + 'deg)';
    rafId = requestAnimationFrame(loop);
  }
  btn.style.transform = 'rotate(' + angle + 'deg)';

  function startSpin() {
    if (spinning) return;
    spinning = true;
    lastT = 0;
    if (!rafId) rafId = requestAnimationFrame(loop);
  }
  function stopSpin() {
    spinning = false;
  }

  let lastSave = 0;
  function save(force) {
    const now = Date.now();
    if (!force && now - lastSave < SAVE_INTERVAL) return;
    lastSave = now;
    try {
      localStorage.setItem(KEY, JSON.stringify({
        listId: listId,
        index: index,
        time: audio.currentTime || 0,
        playing: !audio.paused && !audio.ended,
        angle: angle
      }));
    } catch (e) {}
  }

  function play() {
    audio.play().then(function () {
      startSpin();
      save(true);
    }).catch(function (err) {
      console.log('播放被拦截：', err);
    });
  }

  function pause() {
    audio.pause();
    stopSpin();
    save(true);
  }

  function loadTrack(i, autoplay) {
    index = (i + playlist.length) % playlist.length;
    const token = ++currentSrcToken;
    audio.src = playlist[index];
    audio.load();

    const onMeta = function () {
      if (token !== currentSrcToken) return; 
      audio.removeEventListener('loadedmetadata', onMeta);
      if (autoplay) {
        play();
      } else {
        save(true);
      }
    };

    if (audio.readyState >= 1) {
      onMeta();
    } else {
      audio.addEventListener('loadedmetadata', onMeta, { once: true });
    }
  }

  function next() {
    if (playlist.length <= 1) { audio.currentTime = 0; play(); return; }
    loadTrack(index + 1, true);
  }
  function prev() {
    if (playlist.length <= 1) { audio.currentTime = 0; play(); return; }
    loadTrack(index - 1, true);
  }

  audio.addEventListener('play', function () {
    document.querySelectorAll('audio, video').forEach(function (m) {
      if (m !== audio && !m.paused) {
        try { m.pause(); } catch (e) {}
      }
    });
    startSpin();
  });

  audio.addEventListener('playing', function () {
    startSpin();
    save(true);
  });

  audio.addEventListener('pause', function () {
    if (audio.paused && !audio.seeking) stopSpin();
    save(true);
  });

  audio.addEventListener('ended', function () {
    next();
  });

  audio.addEventListener('error', function () {
    console.log('音频加载失败：', audio.src);
    if (playlist.length > 1) next();
  });

  audio.addEventListener('timeupdate', function () {
    save(false);
  });

  let clickCount = 0;
  let clickTimer = null;

  btn.addEventListener('click', function () {
    ball.classList.add('clicked');
    setTimeout(function () { ball.classList.remove('clicked'); }, 160);

    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);

    clickTimer = setTimeout(function () {
      const n = clickCount;
      clickCount = 0;
      clickTimer = null;

      if (n === 1) {
        audio.paused ? play() : pause();
      } else if (n === 2) {
        next();
      } else {
        prev();
      }
    }, 400);
  });

  function watchOne(m) {
    if (m === audio || m.dataset.musicWatched) return;
    m.dataset.musicWatched = '1';
    m.addEventListener('play', function () {
      if (!audio.paused) pause();
    });
  }

  function watchOthers(root) {
    if (root.nodeType === 1 && (root.tagName === 'AUDIO' || root.tagName === 'VIDEO')) {
      watchOne(root);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll('audio, video').forEach(watchOne);
    }
  }

  watchOthers(document.body);

  const mo = new MutationObserver(function (mutations) {
    for (let i = 0; i < mutations.length; i++) {
      const added = mutations[i].addedNodes;
      for (let j = 0; j < added.length; j++) {
        watchOthers(added[j]);
      }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  function restore() {
    if (saved.listId !== listId || !saved.playing) return;

    const targetTime = saved.time || 0;
    const token = ++currentSrcToken;

    function seekAndPlay() {
      if (token !== currentSrcToken) return;
      try { audio.currentTime = targetTime; } catch (e) {}
      audio.play().then(function () {
        startSpin();
        save(true);
      }).catch(function () {
        const once = function () {
          document.removeEventListener('click', once);
          document.removeEventListener('touchstart', once);
          if (token !== currentSrcToken) return;
          try { audio.currentTime = targetTime; } catch (e) {}
          play();
        };
        document.addEventListener('click', once, { once: true });
        document.addEventListener('touchstart', once, { once: true, passive: true });
      });
    }

    if (audio.readyState >= 1) {
      seekAndPlay();
    } else {
      audio.addEventListener('loadedmetadata', seekAndPlay, { once: true });
    }
  }
  restore();

  window.addEventListener('pagehide', function () { save(true); });
  window.addEventListener('beforeunload', function () { save(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) save(true);
  });

})();