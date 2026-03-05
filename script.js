/* ── MENU TOGGLE ── */
const btn = document.getElementById('menuBtn');
const overlay = document.getElementById('menuOverlay');
let menuOpen = false;

function openMenu() {
  menuOpen = true;
  overlay.classList.add('open');
  btn.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  menuOpen = false;
  overlay.classList.remove('open');
  btn.classList.remove('open');
  document.body.style.overflow = '';
}

btn.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

/* SWITCH BETWEEN BOTTONS (recentes / a-z) */
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});
