const TOKENS = {
  greenCircle: { shape: "circle", color: "green", label: "Green Circle" },
  blueTriangle: { shape: "triangle", color: "blue", label: "Blue Triangle" },
  redSquare: { shape: "square", color: "red", label: "Red Square" }
};

const tokenKeys = Object.keys(TOKENS);

const state = {
  level: 1,
  score: 0,
  highScore: Number(localStorage.getItem("deductiveHighScore") || 0),
  currentPuzzle: null
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
const skipBtn = document.getElementById("skip-btn");
const restartBtn = document.getElementById("restart-btn");

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

function shuffle(array) {
  const values = [...array];

  for (let i = values.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [values[i], values[randomIndex]] = [values[randomIndex], values[i]];
  }

  return values;
}

function generateRowsPattern([a, b, c]) {
  return [a, a, a, b, b, b, c, c, c];
}

function generateColumnsPattern([a, b, c]) {
  return [a, b, c, a, b, c, a, b, c];
}

function generateLatinPattern([a, b, c]) {
  return [a, b, c, b, c, a, c, a, b];
}

function generatePuzzle() {
  const randomizedTokens = shuffle(tokenKeys);
  const builders = [generateRowsPattern, generateColumnsPattern, generateLatinPattern];
  const buildGrid = builders[Math.floor(Math.random() * builders.length)];

  const fullGrid = buildGrid(randomizedTokens);
  const missingIndex = Math.floor(Math.random() * fullGrid.length);
  const answer = fullGrid[missingIndex];

  const cells = [...fullGrid];
  cells[missingIndex] = null;

  return {
    cells,
    answer,
    options: shuffle(tokenKeys)
  };
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

  state.currentPuzzle.options.forEach((tokenKey) => {
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
    state.score = Math.max(0, state.score - 1);
    const answerLabel = TOKENS[state.currentPuzzle.answer].label;
    feedbackText.textContent = `Wrong answer. Correct answer: ${answerLabel}.`;
    showOverlay(`Correct: ${answerLabel}`);
  }

  saveHighScore();
  updateStats();
}

function loadPuzzle() {
  state.currentPuzzle = generatePuzzle();
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

function skipPuzzle() {
  state.score = Math.max(0, state.score - 1);
  state.level += 1;
  feedbackText.textContent = "Skipped. -1 point";
  hideOverlay();
  saveHighScore();
  loadPuzzle();
}

function resetGame() {
  state.level = 1;
  state.score = 0;
  feedbackText.textContent = "Game reset. New puzzle loaded.";
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
skipBtn.addEventListener("click", skipPuzzle);
restartBtn.addEventListener("click", resetGame);

applySavedTheme();
loadPuzzle();
