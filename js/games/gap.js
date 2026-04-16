const TIMER_DURATION = 60;

const puzzleTemplates = [
  {
    ruleText: "Arithmetic (+2)",
    sequence: [2, 4, null, 8, 10],
    answer: 6,
    options: [6, 7, 5, 9]
  },
  {
    ruleText: "Arithmetic (+3)",
    sequence: [3, null, 9, 12, 15],
    answer: 6,
    options: [6, 8, 5, 7]
  },
  {
    ruleText: "Squares",
    sequence: [1, 4, 9, null, 25],
    answer: 16,
    options: [12, 16, 18, 14]
  },
  {
    ruleText: "Fibonacci",
    sequence: [2, 3, 5, null, 13],
    answer: 8,
    options: [9, 6, 8, 7]
  },
  {
    ruleText: "Multiples of 4",
    sequence: [4, 8, null, 16, 20],
    answer: 12,
    options: [10, 12, 14, 8]
  },
  {
    ruleText: "Alternating (+1, +3)",
    sequence: [1, 2, 5, 6, null],
    answer: 9,
    options: [8, 7, 9, 10]
  },
  {
    ruleText: "Descending (-5)",
    sequence: [40, 35, null, 25, 20],
    answer: 30,
    options: [30, 32, 28, 33]
  },
  {
    ruleText: "Cubes",
    sequence: [1, 8, null, 64, 125],
    answer: 27,
    options: [36, 24, 27, 16]
  }
];

const state = {
  level: 1,
  score: 0,
  timeLeft: TIMER_DURATION,
  timerId: null,
  highScore: Number(localStorage.getItem("gapHighScore") || 0),
  currentPuzzle: null,
  usedPuzzleIndexes: []
};

const levelDisplay = document.getElementById("level-display");
const scoreDisplay = document.getElementById("score-display");
const highScoreDisplay = document.getElementById("highscore-display");
const timerDisplay = document.getElementById("timer");
const sequenceText = document.getElementById("sequence-text");
const promptTitle = document.getElementById("prompt-title");
const optionsContainer = document.getElementById("options");
const feedbackText = document.getElementById("feedback");
const overlay = document.getElementById("level-overlay");
const overlayMessage = document.getElementById("overlay-message");
const nextLevelBtn = document.getElementById("next-level-btn");
const skipBtn = document.getElementById("skip-btn");
const restartBtn = document.getElementById("restart-btn");
const themeToggleBtn = document.getElementById("theme-toggle");

function updateStats() {
  levelDisplay.textContent = `Level: ${state.level}`;
  scoreDisplay.textContent = `Score: ${state.score}`;
  highScoreDisplay.textContent = `High Score: ${state.highScore}`;
  timerDisplay.textContent = `Time: ${state.timeLeft}`;
}

function saveHighScore() {
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem("gapHighScore", String(state.highScore));
  }
}

function getNextPuzzle() {
  if (state.usedPuzzleIndexes.length === puzzleTemplates.length) {
    state.usedPuzzleIndexes = [];
  }

  const availableIndexes = puzzleTemplates
    .map((_, index) => index)
    .filter((index) => !state.usedPuzzleIndexes.includes(index));

  const selectedIndex =
    availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

  state.usedPuzzleIndexes.push(selectedIndex);
  return puzzleTemplates[selectedIndex];
}

function renderPuzzle() {
  state.currentPuzzle = getNextPuzzle();
  const sequenceLabel = state.currentPuzzle.sequence
    .map((item) => (item === null ? "__" : item))
    .join(", ");

  promptTitle.textContent = `Find the missing value (${state.currentPuzzle.ruleText})`;
  sequenceText.textContent = sequenceLabel;
  feedbackText.textContent = "";
  optionsContainer.innerHTML = "";

  const shuffledOptions = [...state.currentPuzzle.options].sort(
    () => Math.random() - 0.5
  );

  shuffledOptions.forEach((optionValue) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "gap-option";
    optionButton.textContent = String(optionValue);
    optionButton.addEventListener("click", () => handleAnswer(optionValue));
    optionsContainer.appendChild(optionButton);
  });
}

function disableOptions() {
  optionsContainer
    .querySelectorAll("button")
    .forEach((button) => (button.disabled = true));
}

function showOverlay(message) {
  overlayMessage.textContent = message;
  overlay.style.display = "flex";
}

function hideOverlay() {
  overlay.style.display = "none";
}

function handleAnswer(selectedValue) {
  if (!state.currentPuzzle) return;

  disableOptions();

  if (selectedValue === state.currentPuzzle.answer) {
    state.score += 3;
    saveHighScore();
    feedbackText.textContent = "Correct! +3 points";
    showOverlay("Correct!");
  } else {
    state.score = Math.max(0, state.score - 1);
    feedbackText.textContent = `Not quite. Correct answer: ${state.currentPuzzle.answer}`;
    showOverlay("Keep Going!");
  }

  updateStats();
}

function tick() {
  state.timeLeft -= 1;

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    updateStats();
    clearInterval(state.timerId);
    disableOptions();
    showOverlay("Time Up!");
    nextLevelBtn.textContent = "Restart";
    return;
  }

  updateStats();
}

function startTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
  }

  state.timerId = setInterval(tick, 1000);
}

function moveToNextLevel() {
  if (state.timeLeft === 0) {
    resetGame();
    return;
  }

  state.level += 1;
  renderPuzzle();
  updateStats();
  hideOverlay();
}

function resetGame() {
  state.level = 1;
  state.score = 0;
  state.timeLeft = TIMER_DURATION;
  state.usedPuzzleIndexes = [];

  nextLevelBtn.textContent = "Next Level";
  renderPuzzle();
  updateStats();
  hideOverlay();
  startTimer();
}

function skipPuzzle() {
  state.score = Math.max(0, state.score - 1);
  state.level += 1;
  feedbackText.textContent = "Skipped. -1 point";
  saveHighScore();
  renderPuzzle();
  updateStats();
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

nextLevelBtn.addEventListener("click", moveToNextLevel);
skipBtn.addEventListener("click", skipPuzzle);
restartBtn.addEventListener("click", resetGame);
themeToggleBtn.addEventListener("click", toggleTheme);

applySavedTheme();
resetGame();
