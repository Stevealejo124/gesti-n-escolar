const board = document.querySelector('[data-schedule-board]');
const viewButtons = [...document.querySelectorAll('[data-view-button]')];
const weekGrid = document.querySelector('[data-week-grid]');
const agendaOverview = document.querySelector('[data-agenda-overview]');
const title = document.querySelector('#schedule-title');
const caption = document.querySelector('[data-view-caption]');
const overviewTitle = document.querySelector('[data-overview-title]');

const viewCopy = {
  day: {
    title: 'Viernes 16 de octubre',
    caption: 'Vista diaria · horarios ilustrativos',
    showWeek: true,
    overview: ''
  },
  week: {
    title: 'Semana del 12 al 16 de octubre',
    caption: 'Vista semanal · horarios ilustrativos',
    showWeek: true,
    overview: ''
  },
  month: {
    title: 'Agenda de octubre',
    caption: 'Vista mensual · eventos de muestra',
    showWeek: false,
    overview: 'Agenda institucional · mes'
  },
  quarter: {
    title: 'Agenda del trimestre',
    caption: 'Vista trimestral · eventos de muestra',
    showWeek: false,
    overview: 'Agenda institucional · trimestre'
  }
};

function setView(view) {
  if (!board || !viewCopy[view]) return;
  const content = viewCopy[view];
  board.dataset.view = view;
  viewButtons.forEach((button) => {
    const active = button.dataset.viewButton === view;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (title) title.textContent = content.title;
  if (caption) caption.textContent = content.caption;
  if (weekGrid) weekGrid.hidden = !content.showWeek;
  if (agendaOverview) agendaOverview.hidden = content.showWeek;
  if (overviewTitle && content.overview) overviewTitle.textContent = content.overview;
}

viewButtons.forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.viewButton));
});
