const searchInput = document.querySelector('[data-student-search]');
const gradeFilter = document.querySelector('[data-grade-filter]');
const studentRows = [...document.querySelectorAll('[data-student-row]')];
const emptyState = document.querySelector('[data-student-empty]');

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function filterStudents() {
  const query = normalize(searchInput?.value);
  const grade = gradeFilter?.value || 'all';
  let visibleCount = 0;

  studentRows.forEach((row) => {
    const searchableText = `${row.dataset.search || ''} ${row.textContent || ''}`;
    const matchesText = normalize(searchableText).includes(query);
    const matchesGrade = grade === 'all' || row.dataset.grade === grade;
    const show = matchesText && matchesGrade;
    row.hidden = !show;
    if (show) visibleCount += 1;
  });

  if (emptyState) emptyState.hidden = visibleCount > 0;
}

searchInput?.addEventListener('input', filterStudents);
gradeFilter?.addEventListener('change', filterStudents);
