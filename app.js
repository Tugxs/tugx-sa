const views = document.querySelectorAll('.view');
const navs = document.querySelectorAll('.nav[data-view]');
function go(id) {
  views.forEach(view => view.classList.toggle('active', view.id === id));
  navs.forEach(nav => nav.classList.toggle('active', nav.dataset.view === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
navs.forEach(button => button.addEventListener('click', () => go(button.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
const toast = document.querySelector('#toast');
function notify(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); }
document.querySelector('#save-business').addEventListener('click', () => notify('تم حفظ صفحة الأعمال بنجاح'));
document.querySelector('#new-campaign').addEventListener('click', () => notify('منشئ الحملات سيكون الخطوة التالية في النسخة التجريبية'));
document.querySelector('#business-name').addEventListener('input', event => document.querySelector('#preview-name').textContent = event.target.value || 'اسم النشاط');
document.querySelectorAll('.conversation').forEach(item => item.addEventListener('click', () => { document.querySelectorAll('.conversation').forEach(x => x.classList.remove('selected')); item.classList.add('selected'); }));
