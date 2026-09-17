const views = document.querySelectorAll('.view');
const navs = document.querySelectorAll('.nav[data-view]');
function go(id) {
  views.forEach(view => view.classList.toggle('active', view.id === id));
  navs.forEach(nav => nav.classList.toggle('active', nav.dataset.view === (['campaigns','customers'].includes(id) ? 'inbox' : id)));
  document.querySelectorAll('.wa-tabs button[data-go]').forEach(button => button.classList.toggle('selected', button.dataset.go === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
const originalTabs = document.querySelector('.wa-tabs');
originalTabs.querySelector('button').dataset.go = 'inbox';
['campaigns', 'customers'].forEach(id => {
  const target = document.getElementById(id);
  target.querySelector('.page-title').after(originalTabs.cloneNode(true));
});
navs.forEach(button => button.addEventListener('click', () => go(button.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
const toast = document.querySelector('#toast');
document.querySelectorAll('.soon-tab').forEach(button => button.addEventListener('click', () => notify('هذه الميزة قريبًا في واتساب بزنس')));
document.querySelector('.mobile-menu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('mobile-open'));
function notify(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); }
document.querySelector('#new-campaign').addEventListener('click', () => notify('منشئ الحملات سيكون الخطوة التالية في النسخة التجريبية'));
document.querySelectorAll('.conversation').forEach(item => item.addEventListener('click', () => { document.querySelectorAll('.conversation').forEach(x => x.classList.remove('selected')); item.classList.add('selected'); }));
