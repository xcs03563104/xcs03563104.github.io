(function () {
  'use strict';

  const RULES = {
    '1.html': ['music1.mp3', 'music2.mp3', 'music3.mp3'],
  };
  const DEFAULT_LIST = ['yy/Girl In The Dark For The Light - HyuN.wav','yy/Love Sacrifice - sky_delta,RANASOL.wav'];

  function getFileName() {
    const name = location.pathname.split('/').pop();
    return name || 'index.html';
  }

  const listKey = getFileName();
  const playlist = RULES[listKey] || DEFAULT_LIST;

  const listId = RULES[listKey] ? listKey : '__default__';

  const btn = document.createElement('div');
  btn.id = 'musicBtn';

  const ball = document.createElement('div');
  ball.className = 'ball';
  ball.textContent = '♪';

  btn.appendChild(ball);
  document.body.appendChild(btn);

  const audio = document.createElement('audio');
  audio.id = 'audio';
  document.body.appendChild(audio);

  const KEY = 'music_player_state';

  let saved = {
    listId: '',
    index: 0,
    time: 0,
    playing: false,
    angle: 0
  };

  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) saved = Object.assign(saved, s);
  } catch (e) {}

  // 只有歌单标识一致才恢复
  let index = 0;
  if (saved.listId === listId && playlist[saved.index] !== undefined) {
    index = saved.index;
  }

  audio.src = playlist[index];
  audio.preload = 'metadata';

  let angle = saved.angle || 0;

  let spinning = false;
  let lastT = 0;
  const SPEED = 60;

  function loop(t) {
    if (!lastT) lastT = t;
    const dt = (t - lastT) / 1000;
    lastT = t;
    if (spinning) {
      angle = (angle + SPEED * dt) % 360;
      btn.style.transform = 'rotate(' + angle + 'deg)';
    }
    requestAnimationFrame(loop);
  }
  btn.style.transform = 'rotate(' + angle + 'deg)';
  requestAnimationFrame(loop);

  function startSpin() { spinning = true; lastT = 0; }
  function stopSpin()  { spinning = false; }

  function play() {
    audio.play()
      .then(function () { startSpin(); save(); })
      .catch(function (err) { console.log('播放被拦截：', err); });
  }

  function pause() {
    audio.pause();
    stopSpin();
    save();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        listId: listId, 
        index: index,
        time: audio.currentTime || 0,
        playing: !audio.paused,
        angle: angle
      }));
    } catch (e) {}
  }

  setInterval(save, 1000);
  window.addEventListener('beforeunload', save);
  window.addEventListener('pagehide', save);

  function next() {
    if (playlist.length <= 1) return;
    index = (index + 1) % playlist.length;
    audio.src = playlist[index];
    audio.currentTime = 0;
    play();
  }

  function prev() {
    if (playlist.length <= 1) return;
    index = (index - 1 + playlist.length) % playlist.length;
    audio.src = playlist[index];
    audio.currentTime = 0;
    play();
  }

  let count = 0;
  let timer = null;

  btn.addEventListener('click', function () {
    ball.classList.add('clicked');
    setTimeout(function () { ball.classList.remove('clicked'); }, 160);

    count++;
    if (timer) clearTimeout(timer);

    timer = setTimeout(function () {
      if (count === 1) {
        audio.paused ? play() : pause();
      } else if (count === 2) {
        next();
      } else {
        prev();
      }
      count = 0;
      timer = null;
    }, 500);
  });

  function watchOthers() {
    const others = document.querySelectorAll('audio, video');
    others.forEach(function (m) {
      if (m === audio) return;
      if (m.dataset.watched) return;
      m.dataset.watched = '1';

      m.addEventListener('play', function () {
        if (!audio.paused) {
          audio.pause();
          stopSpin();
          save();
        }
      });
    });
  }

  watchOthers();

  const mo = new MutationObserver(watchOthers);
  mo.observe(document.body, { childList: true, subtree: true });

  audio.addEventListener('play', function () {
  document.querySelectorAll('audio, video').forEach(function (m) {
    if (m !== audio && !m.paused) m.pause();
  });
});

audio.addEventListener('ended', function () {
  if (playlist.length <= 1) {
    audio.currentTime = 0;
    play();
    return;
  }
  index = (index + 1) % playlist.length;
  audio.src = playlist[index];
  audio.currentTime = 0;
  play();
});

  function restore() {
    if (saved.listId !== listId) return; 
    if (!saved.playing) return; 

    const targetTime = saved.time || 0;

    function seekAndPlay() {
      try { audio.currentTime = targetTime; } catch (e) {}
      audio.play().then(function () {
        startSpin();
        save();
      }).catch(function () {
        const once = function () {
          try { audio.currentTime = targetTime; } catch (e) {}
          play();
          document.removeEventListener('click', once);
          document.removeEventListener('touchstart', once);
        };
        document.addEventListener('click', once);
        document.addEventListener('touchstart', once);
      });
    }

    if (audio.readyState >= 1) {
      seekAndPlay();
    } else {
      audio.addEventListener('loadedmetadata', seekAndPlay, { once: true });
    }
  }

  restore(); 

  window.addEventListener('visibilitychange', function () {
    if (document.hidden) save();
  });

})();