export function createGrid(rows, cols, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const cells = [];

  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    container.appendChild(cell);
    cells.push(cell);
  }

  return cells;
}