let activeInterval = null;

export function startTimer(duration, displayId, onEnd) {
  if (activeInterval) clearInterval(activeInterval);

  let time = duration;
  const display = document.getElementById(displayId);

  if (display) display.textContent = "Time: " + time;

  activeInterval = setInterval(() => {
    time--;
    if (display) display.textContent = "Time: " + time;

    if (time <= 0) {
      clearInterval(activeInterval);
      activeInterval = null;
      if (onEnd) onEnd();
    }
  }, 1000);
}