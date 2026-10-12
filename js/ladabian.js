(function () {

  const AGREEMENT_TEXT = {
    zh: {
      title: '请阅读后继续',
      paragraphs: [
        '我发的所有作品和内容仅供同好观赏娱乐',
        '请不要以任何方式保存、复制、转载，也禁止拍摄，截图，复印，也不要对它们使用 AI',
        '如果你想给别人分享我的作品，请给他分享我在cara的帖子链接，如果没找到那就是不公开',
        '请勿将我发布的内容转载至 Danbooru 或类似网站（比如 Pinterest）',
        '违者会追究法律责任',
        '最终解释权属于我',
        '本页面可能含有少儿不宜以及在公共场合不适合展示的内容，请确保你已满18，且处于不会发生尴尬事件的场合',
        '可能存在令人难以接受，感到不适的内容',
        '点击确认后默认已读以上全部内容',
        '有些内容可能只有一种语言',
        '为了避免误会，请注意，时间顺序为 年/月/日',
      ],
      agreeText: '我已阅读并同意以上全部内容',
      confirmText: '确认',
      errorText: '请阅读并同意后继续',
    },
    en: {
      title: 'Please read before continuing',
      paragraphs: [
        'All my works and content are for fellow fans to view and enjoy only.',
        'Please do not save, copy, or repost them in any way. Photography, screenshots, photocopying, and the use of AI on them are also prohibited.',
        'If you want to share my works with others, please share the link to my post on Cara. If you can\'t find it, it means it\'s not public.',
        'Please do not repost my content to Danbooru or similar sites (such as Pinterest).',
        'By clicking confirm, you acknowledge that you have read all of the above.',
        'Those who violate this rule will be held legally responsible.',
        'The final interpretation rights belong to me.',
        'This page may contain content that is not suitable for children and is inappropriate for public display. Please ensure that you are over 18 years old and in an environment where no embarrassing situations may occur.',
        'and, There may be content that is unacceptable and causes discomfort.',
        'After clicking "Confirm", it is assumed that you have read all the above contents.',
        'Some of the content may be available in only one language.',
        'To avoid any misunderstandings, please note that the chronological order is Year/Month/Day.',
      ],
      agreeText: 'I have read and agree to the above',
      confirmText: 'Confirm',
      errorText: 'Please read and agree before continuing',
    },
  };

  let currentLang = 'zh';

  let AGREEMENT_CONFIG = {};

  function syncConfig() {
    AGREEMENT_CONFIG = Object.assign({}, AGREEMENT_TEXT[currentLang]);
  }
  syncConfig();

  const AGREEMENT_CSS = `
    .modal-overlay {
      position: fixed; inset: 0;
      width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
      opacity: 0; pointer-events: none;
      transition: opacity 0.35s ease;
    }
    .modal-overlay.show { opacity: 1; pointer-events: auto; }

    .modal {
      width: 90%; max-width: 480px; max-height: 80vh;
      background: #fff;
      border: 2px solid #1a1a1a;
      border-radius: 14px;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      transform: translateY(30px) scale(0.96);
      opacity: 0;
      transition: transform 0.45s cubic-bezier(0.22, 1.2, 0.36, 1),
                  opacity 0.25s ease;
    }
    .modal-overlay.show .modal { transform: translateY(0) scale(1); opacity: 1; }
    .modal.closing { animation: modalClose 0.4s ease forwards; }
    @keyframes modalClose {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.05); }
      100% { transform: scale(0); opacity: 0; }
    }

    .modal-body {
      padding: 28px 28px 20px;
      overflow-y: auto;
      font-size: 15px; line-height: 1.9; color: #2b2b2b;
    }
    .modal-body h2 {
      font-size: 18px; font-weight: 600; margin-bottom: 16px;
    }
    .modal-body p { margin-bottom: 1.2em; }

    .modal-footer {
      padding: 16px 28px 22px;
      border-top: 1px solid #ececec;
      display: flex; flex-direction: column;
      gap: 12px; align-items: center;
    }

    .agree-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; color: #1a1a1a;
      cursor: pointer; user-select: none;
    }
    .agree-row input[type="checkbox"] {
      width: 16px; height: 16px;
      accent-color: #1a1a1a; cursor: pointer;
    }

    .modal-btn {
      padding: 12px 44px;
      border: 2px solid #1a1a1a; border-radius: 14px;
      background: #fff; color: #1a1a1a;
      font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all 0.25s ease;
    }
    .modal-btn:hover { background: #1a1a1a; color: #fff; }

    .modal-error {
      font-size: 12px; color: #e03e3e;
      opacity: 0; transform: translateY(6px);
      pointer-events: none;
    }
    .modal-error.show { animation: errorPop 2s ease forwards; }
    @keyframes errorPop {
      0%   { opacity: 0; transform: translateY(6px); }
      10%  { opacity: 1; transform: translateY(0); }
      20%  { opacity: 1; transform: translateY(0); }
      70%  { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-4px); }
    }
    body.modal-lock { overflow: hidden; }

    .modal-lang-switch {
      position: absolute;
      top: 14px; right: 16px;
      display: flex; gap: 6px;
      font-size: 12px;
    }
    .modal-lang-switch button {
      padding: 4px 10px;
      border: 1.5px solid #1a1a1a; border-radius: 999px;
      background: #fff; color: #1a1a1a;
      font-size: 12px; cursor: pointer;
      transition: all 0.2s ease;
    }
    .modal-lang-switch button.active,
    .modal-lang-switch button:hover {
      background: #1a1a1a; color: #fff;
    }
    .modal { position: relative; }
  `;

  let cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    const style = document.createElement('style');
    style.textContent = AGREEMENT_CSS;
    document.head.appendChild(style);
    cssInjected = true;
  }

  let overlayEl = null; 

  function buildDOM() {
    if (overlayEl) return overlayEl;

    const cfg = AGREEMENT_CONFIG;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const langSwitch = document.createElement('div');
    langSwitch.className = 'modal-lang-switch';
    const btnZh = document.createElement('button');
    btnZh.textContent = '中文';
    btnZh.dataset.lang = 'zh';
    const btnEn = document.createElement('button');
    btnEn.textContent = 'EN';
    btnEn.dataset.lang = 'en';
    langSwitch.appendChild(btnZh);
    langSwitch.appendChild(btnEn);

    const body = document.createElement('div');
    body.className = 'modal-body';

    const h2 = document.createElement('h2');
    h2.textContent = cfg.title;
    body.appendChild(h2);

    cfg.paragraphs.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      body.appendChild(p);
    });

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const agreeRow = document.createElement('label');
    agreeRow.className = 'agree-row';
    const check = document.createElement('input');
    check.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = cfg.agreeText;
    agreeRow.appendChild(check);
    agreeRow.appendChild(span);

    const btn = document.createElement('button');
    btn.className = 'modal-btn';
    btn.textContent = cfg.confirmText;

    const err = document.createElement('div');
    err.className = 'modal-error';
    err.textContent = cfg.errorText;

    footer.appendChild(agreeRow);
    footer.appendChild(btn);
    footer.appendChild(err);

    modal.appendChild(langSwitch);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function refreshLangUI() {
      btnZh.classList.toggle('active', currentLang === 'zh');
      btnEn.classList.toggle('active', currentLang === 'en');

      const c = AGREEMENT_CONFIG;
      h2.textContent = c.title;

      body.querySelectorAll('p').forEach(p => p.remove());
      c.paragraphs.forEach(text => {
        const p = document.createElement('p');
        p.textContent = text;
        body.appendChild(p);
      });

      span.textContent = c.agreeText;
      btn.textContent = c.confirmText;
      err.textContent = c.errorText;
      body.scrollTop = 0;
    }

    langSwitch.addEventListener('click', (e) => {
      const target = e.target.closest('button[data-lang]');
      if (!target) return;
      const lang = target.dataset.lang;
      if (lang === currentLang) return;
      currentLang = lang;
      syncConfig();
      refreshLangUI();
      if (typeof window.onAgreementLangChange === 'function') {
        window.onAgreementLangChange(currentLang);
      }
    });

    refreshLangUI();

    btn.addEventListener('click', () => {
      if (!check.checked) {
        err.classList.remove('show');
        void err.offsetWidth;
        err.classList.add('show');
        return;
      }
      modal.classList.add('closing');
      setTimeout(() => {
        overlay.classList.remove('show');
        modal.classList.remove('closing');
        document.body.classList.remove('modal-lock');
        overlay.remove();
        overlayEl = null;
        if (typeof AGREEMENT_CONFIG.onConfirm === 'function') {
          AGREEMENT_CONFIG.onConfirm();
        }
      }, 400);
    });

    overlayEl = overlay;
    return overlay;
  }

  window.showAgreement = function (options) {
    Object.assign(AGREEMENT_CONFIG, options || {});

    injectCSS();
    const overlay = buildDOM();
    const body  = overlay.querySelector('.modal-body');
    const check = overlay.querySelector('input[type="checkbox"]');

    body.scrollTop = 0;
    check.checked = false;
    overlay.querySelector('.modal-error').classList.remove('show');

    requestAnimationFrame(() => {
      overlay.classList.add('show');
      document.body.classList.add('modal-lock');
    });
  };

  window.setAgreementLang = function (lang) {
    if (!AGREEMENT_TEXT[lang]) return;
    currentLang = lang;
    syncConfig();

    if (overlayEl) {
      const btn = overlayEl.querySelector('.modal-lang-switch button[data-lang="' + lang + '"]');
      if (btn) btn.click();
      else {
        const body = overlayEl.querySelector('.modal-body');
        const h2 = body.querySelector('h2');
        const err = overlayEl.querySelector('.modal-error');
        const span = overlayEl.querySelector('.agree-row span');
        const confirmBtn = overlayEl.querySelector('.modal-btn');

        h2.textContent = AGREEMENT_CONFIG.title;
        body.querySelectorAll('p').forEach(p => p.remove());
        AGREEMENT_CONFIG.paragraphs.forEach(text => {
          const p = document.createElement('p');
          p.textContent = text;
          body.appendChild(p);
        });
        span.textContent = AGREEMENT_CONFIG.agreeText;
        confirmBtn.textContent = AGREEMENT_CONFIG.confirmText;
        err.textContent = AGREEMENT_CONFIG.errorText;
      }
    }
  };

  window.getAgreementLang = function () {
    return currentLang;
  };
})();