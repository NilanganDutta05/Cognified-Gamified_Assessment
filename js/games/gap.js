const TOKENS = {
  greenCircle: { shape: "circle", color: "green" },
  blueTriangle: { shape: "triangle", color: "blue" },
  redSquare: { shape: "square", color: "red" }
};

const puzzles = [
  {
    cells: ["greenCircle", null, null, null, null, null, "blueTriangle", null, "greenCircle"],
    answer: "blueTriangle",
    options: ["greenCircle", "blueTriangle", "redSquare"]
  },
  {
    cells: ["redSquare", null, "redSquare", null, null, null, "blueTriangle", null, "blueTriangle"],
    answer: "greenCircle",
    options: ["greenCircle", "blueTriangle", "redSquare"]
  },
  {
    cells: ["greenCircle", null, "blueTriangle", null, null, null, "redSquare", null, "greenCircle"],
    answer: "blueTriangle",
    options: ["redSquare", "blueTriangle", "greenCircle"]
  },
  {
    cells: ["blueTriangle", null, "greenCircle", null, null, null, "greenCircle", null, "redSquare"],
    answer: "redSquare",
    options: ["greenCircle", "redSquare", "blueTriangle"]
  }
];

const state = {
  level: 1,
  score: 0,
  highScore: Number(localStorage.getItem("deductiveHighScore") || 0),
  currentPuzzle: null,
  usedPuzzleIndexes: []
};

const levelDisplay = document.getElementById("level-display");
const scoreDisplay = document.getElementById("score-display");
const highScoreDisplay = document.getElementById("highscore-display");
const gridElement = document.getElementById("deductive-grid");
const optionsElement = document.getElementById("deductive-options");
const feedbackText = document.getElementById("feedback");
const overlay = document.getElementById("level-overlay");
const overlayMessage = document.getElementById("overlay-message");
const nextLevelBtn = document.getElementById("next-level-btn");
const themeToggleBtn = document.getElementById("theme-toggle");

function updateStats() {
  levelDisplay.textContent = `Level: ${state.level}`;
  scoreDisplay.textContent = `Score: ${state.score}`;
  highScoreDisplay.textContent = `High Score: ${state.highScore}`;
}

function saveHighScore() {
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem("deductiveHighScore", String(state.highScore));
  }
}

function getNextPuzzle() {
  if (state.usedPuzzleIndexes.length === puzzles.length) {
    state.usedPuzzleIndexes = [];
  }

  const remaining = puzzles
    .map((_, index) => index)
    .filter((index) => !state.usedPuzzleIndexes.includes(index));

  const selected = remaining[Math.floor(Math.random() * remaining.length)];
  state.usedPuzzleIndexes.push(selected);
  return puzzles[selected];
}

function buildToken(tokenKey) {
  const tokenData = TOKENS[tokenKey];
  const token = document.createElement("div");
  token.className = `token ${tokenData.shape} ${tokenData.color}`;
  return token;
}

function renderGrid() {
  gridElement.innerHTML = "";

  state.currentPuzzle.cells.forEach((tokenKey) => {
    const cell = document.createElement("div");
    cell.className = "deductive-cell";

    if (tokenKey) {
      cell.appendChild(buildToken(tokenKey));
    } else {
      const mark = document.createElement("span");
      mark.className = "missing-mark";
      mark.textContent = "?";
      cell.appendChild(mark);
      cell.classList.add("missing");
    }

    gridElement.appendChild(cell);
  });
}

function disableOptions() {
  optionsElement
    .querySelectorAll("button")
    .forEach((button) => (button.disabled = true));
}

function renderOptions() {
  optionsElement.innerHTML = "";
  const shuffled = [...state.currentPuzzle.options].sort(() => Math.random() - 0.5);

  shuffled.forEach((tokenKey) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "deductive-option";
    button.appendChild(buildToken(tokenKey));
    button.addEventListener("click", () => handleAnswer(tokenKey));
    optionsElement.appendChild(button);
  });
}

function showOverlay(message) {
  overlayMessage.textContent = message;
  overlay.classList.add("active");
}

function hideOverlay() {
  overlay.classList.remove("active");
}

function handleAnswer(selected) {
  disableOptions();

  if (selected === state.currentPuzzle.answer) {
    state.score += 1;
    feedbackText.textContent = "Correct! Great deduction.";
    showOverlay("Correct!");
  } else {
    feedbackText.textContent = "Not correct. Study the pattern and try the next one.";
    showOverlay("Nice Try!");
  }

  saveHighScore();
  updateStats();
}

function loadPuzzle() {
  state.currentPuzzle = getNextPuzzle();
  feedbackText.textContent = "";
  renderGrid();
  renderOptions();
  updateStats();
}

function nextPuzzle() {
  state.level += 1;
  hideOverlay();
  loadPuzzle();
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggleBtn.textContent = "Light Mode";
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    themeToggleBtn.textContent = "Dark Mode";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    themeToggleBtn.textContent = "Light Mode";
  }
}

nextLevelBtn.addEventListener("click", nextPuzzle);
themeToggleBtn.addEventListener("click", toggleTheme);

applySavedTheme();
loadPuzzle();
