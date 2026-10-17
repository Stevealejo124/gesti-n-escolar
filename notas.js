const rows = [...document.querySelectorAll('[data-grade-row]')];
const classAverage = document.querySelector('[data-class-average]');
let groupTotal = 0;
let groupCount = 0;

rows.forEach((row) => {
  const values = (row.dataset.grades || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  const cell = row.querySelector('[data-grade-average]');
  if (!values.length || !cell) return;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  cell.textContent = average.toFixed(1);
  groupTotal += average;
  groupCount += 1;
});

if (classAverage && groupCount) {
  classAverage.textContent = (groupTotal / groupCount).toFixed(1);
}
