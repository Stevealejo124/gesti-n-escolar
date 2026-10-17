const filterButtons = [...document.querySelectorAll('[data-filter]')];
const reportCards = [...document.querySelectorAll('[data-report-card]')];
const emptyState = document.querySelector('[data-report-empty]');

function setReportFilter(category) {
  let visibleCount = 0;
  reportCards.forEach((card) => {
    const show = category === 'all' || card.dataset.category === category;
    card.hidden = !show;
    if (show) visibleCount += 1;
  });

  filterButtons.forEach((button) => {
    const active = button.dataset.filter === category;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (emptyState) emptyState.hidden = visibleCount > 0;
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => setReportFilter(button.dataset.filter));
});
