
// Collapse/expand behavior for each section card
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card').forEach(card => {
    const btn = card.querySelector('.toggle');
    const content = card.querySelector('.content');
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.textContent = expanded ? 'Expand' : 'Collapse';
      content.style.display = expanded ? 'none' : '';
    });
  });
});
