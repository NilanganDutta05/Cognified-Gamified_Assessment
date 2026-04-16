export class ScoreManager {
  constructor(gameKey, scoreDisplayId, highDisplayId) {
    this.key = gameKey + "_highscore";
    this.scoreDisplayId = scoreDisplayId;
    this.highDisplayId = highDisplayId;
    this.currentScore = 0;
    this.highScore = parseInt(localStorage.getItem(this.key)) || 0;
    this.updateUI();
  }

  add(points) {
    this.currentScore += points;
    if (this.currentScore < 0) this.currentScore = 0;
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      localStorage.setItem(this.key, this.highScore);
    }
    this.updateUI();
  }

  resetSession() {
    this.currentScore = 0;
    this.updateUI();
  }

  updateUI() {
    const scoreEl = document.getElementById(this.scoreDisplayId);
    const highEl = document.getElementById(this.highDisplayId);
    if (scoreEl) scoreEl.textContent = "Score: " + this.currentScore;
    if (highEl) highEl.textContent = "High Score: " + this.highScore;
  }
}
