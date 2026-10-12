const menuItems = [
  { text: '首页', href: '../../index.html' },
  { text: '关于我', href: '../../about.html' },
  { text: '我的作品', href: '../../works.html' },
  { text: 'OC', href: '../../oc.html' },
  { text: '动态 / 文章', href: '../../posts.html' },
];

const menuItemsen = [
  { text: 'Home', href: '../../index_en.html' },
  { text: 'About Me', href: '../../about_en.html' },
  { text: 'My Works', href: '../../works_en.html' },
  { text: 'My OCs', href: '../../oc_en.html' },
  { text: 'Updates / Articles', href: '../../posts_en.html' },
];

function buildMenu(items) {
  const menu = document.getElementById('sideMenu');
  if (!menu) return;
  menu.innerHTML = ''; 
  items.forEach(item => {
    const a = document.createElement('a');
    a.textContent = item.text;
    a.href = item.href;
    menu.appendChild(a);
  });
}

(function () {
  const lang = window.MENU_LANG || 'zh';
  buildMenu(lang === 'en' ? menuItemsen : menuItems);
})();

const menuBtn  = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay  = document.getElementById('overlay');

function toggleMenu() {
  if (menuBtn)  menuBtn.classList.toggle('open');
  if (sideMenu) sideMenu.classList.toggle('open');
  if (overlay)  overlay.classList.toggle('show');
}

if (menuBtn)  menuBtn.addEventListener('click', toggleMenu);
if (overlay)  overlay.addEventListener('click', toggleMenu);

const langSwitch = document.getElementById('langSwitch');

if (langSwitch) {
  langSwitch.addEventListener('click', function (e) {
    langSwitch.classList.toggle('reverse');
    langSwitch.classList.remove('pop');
    void langSwitch.offsetWidth; 
    langSwitch.classList.add('pop');
    setTimeout(() => langSwitch.classList.remove('pop'), 400);
  });
}

  const modalOverlay = document.getElementById('modalOverlay');
  const modal        = document.getElementById('modal');
  const modalBody    = document.getElementById('modalBody');
  const agreeCheck   = document.getElementById('agreeCheck');
  const modalConfirm = document.getElementById('modalConfirm');
  const modalError   = document.getElementById('modalError');

  function openModal() {
    modalOverlay.classList.add('show');
    document.body.classList.add('modal-lock');
    modalBody.scrollTop = 0;
    agreeCheck.checked = false;
  }

  window.addEventListener('load', openModal);

  modalConfirm.addEventListener('click', function () {
    if (!agreeCheck.checked) {
      modalError.classList.remove('show');
      void modalError.offsetWidth;
      modalError.classList.add('show');
      return;
    }

    modal.classList.add('closing');
    setTimeout(() => {
      modalOverlay.classList.remove('show');
      modal.classList.remove('closing');
      document.body.classList.remove('modal-lock');
    }, 400);
  });