import { createGrid } from "../engine/grid.js";
import { startTimer } from "../engine/timer.js";
import { ScoreManager } from "../engine/score.js";

const ROWS = 6;
const COLS = 4;

const cells = createGrid(ROWS, COLS, "grid");
const scoreboard = new ScoreManager("motion", "score-display", "highscore-display");

// ================= GAME STATE =================

let state = {
  ball: { row: 5, col: 1 },
  exit: { row: 0, col: 3 },
  blocks: [],
  locked: [],
  selectedBlock: null,
  moves: 0
};

// ================= LEVEL GENERATION =================

let currentLevelIndex = 0;
let initialLevelState = null;

// ================= HELPERS =================

function index(row, col) {
  return row * COLS + col;
}

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function isOccupied(row, col, ignoreBlock = null) {
  if (state.locked.some(t => t.row === row && t.col === col)) return true;
  for (let b of state.blocks) {
    if (b === ignoreBlock) continue;
    for (let c of b.cells) {
      if (b.row + c[0] === row && b.col + c[1] === col) return true;
    }
  }
  return false;
}

function isFree(row, col, ignoreBlock = null) {
  if (!inBounds(row, col)) return false;
  if (row === state.ball.row && col === state.ball.col) return false;
  if (row === state.exit.row && col === state.exit.col) return false;
  if (isOccupied(row, col, ignoreBlock)) return false;
  return true;
}

function serializeState(ball, blks) {
  return `${ball.row},${ball.col}|` + blks.map(bl => `${bl.row},${bl.col}`).join(':');
}

function solveBFS(startBall, startBlocks, locked, exit) {
  let queue = [{ ball: {row: startBall.row, col: startBall.col}, blocks: startBlocks.map(b => ({...b, cells: b.cells})), moves: 0 }];
  let visited = new Set();
  
  visited.add(serializeState(startBall, startBlocks));

  function occ(r, c, blocks, ignoreIdx = -1) {
    if (locked.some(t => t.row === r && t.col === c)) return true;
    for (let i = 0; i < blocks.length; i++) {
      if (i === ignoreIdx) continue;
      for (let cell of blocks[i].cells) {
        if (blocks[i].row + cell[0] === r && blocks[i].col + cell[1] === c) return true;
      }
    }
    return false;
  }

  let iterations = 0;
  while (queue.length > 0) {
    if (iterations++ > 25000) return -1; // Prevent hanging on unconstrained boards
    let curr = queue.shift();

    if (curr.ball.row === exit.row && curr.ball.col === exit.col) return curr.moves; 
    if (curr.moves >= 17) continue; 

    let ballMoves = [[-1,0],[1,0],[0,-1],[0,1]];
    for (let m of ballMoves) {
      let nr = curr.ball.row + m[0];
      let nc = curr.ball.col + m[1];
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        if (!occ(nr, nc, curr.blocks) && !(nr === exit.row && nc === exit.col && occ(nr, nc, curr.blocks))) {
           let ns = { ball: {row: nr, col: nc}, blocks: curr.blocks, moves: curr.moves + 1 };
           let s = serializeState(ns.ball, ns.blocks);
           if (!visited.has(s)) {
             visited.add(s);
             queue.push(ns);
           }
        }
      }
    }

    // 4-way block movement
    for (let i = 0; i < curr.blocks.length; i++) {
      let b = curr.blocks[i];
      for (let m of ballMoves) {
        let canMove = true;
        for (let c of b.cells) {
          let nr = b.row + c[0] + m[0];
          let nc = b.col + c[1] + m[1];
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { canMove = false; break; }
          if (curr.ball.row === nr && curr.ball.col === nc) { canMove = false; break; }
          if (exit.row === nr && exit.col === nc) { canMove = false; break; }
          if (occ(nr, nc, curr.blocks, i)) { canMove = false; break; }
        }
        if (canMove) {
          let nb = curr.blocks.map(bl => ({...bl})); 
          nb[i].row += m[0]; 
          nb[i].col += m[1];
          let ns = { ball: curr.ball, blocks: nb, moves: curr.moves + 1 };
          let s = serializeState(ns.ball, ns.blocks);
          if (!visited.has(s)) { visited.add(s); queue.push(ns); }
        }
      }
    }
  }
  return -1;
}

const SHAPES = [
  [[0,0], [0,1], [1,0], [1,1]], // 2x2 Square
  [[0,0], [0,1]], // 1x2 Horizontal Rectangle
  [[0,0], [1,0]], // 2x1 Vertical Rectangle
  [[0,0], [0,1], [0,2]], // 1x3 Long rectangle
  [[0,0], [1,0], [2,0]], // 3x1 Long vertical
  [[0,0], [0,1], [1,0]] // Small L shape
];

function generateLevel() {
  let targetMinMoves = Math.min(4 + currentLevelIndex, 15);
  let bestLevel = null;
  let maxFoundMoves = -1;

  for (let attempt = 0; attempt < 300; attempt++) {
    let locked = [];
    let blocks = [];
    let exit = { row: Math.floor(Math.random() * 2), col: Math.floor(Math.random() * COLS) }; 
    let ball = { row: Math.floor(Math.random() * 2) + 4, col: Math.floor(Math.random() * COLS) }; 

    function collides(r, c) {
      if (r === exit.row && c === exit.col) return true;
      if (r === ball.row && c === ball.col) return true;
      if (locked.some(t => t.row === r && t.col === c)) return true;
      for (let b of blocks) {
        for (let cell of b.cells) {
          if (b.row + cell[0] === r && b.col + cell[1] === c) return true;
        }
      }
      return false;
    }

    for(let i = 0; i < 3; i++) {
      let r = Math.floor(Math.random() * ROWS);
      let c = Math.floor(Math.random() * COLS);
      if (!collides(r, c)) locked.push({row:r, col:c});
    }

    // Guaranteed multiple blocks
    let blockAttempts = 0;
    while(blocks.length < 3 && blockAttempts++ < 50) {
      let shapeCells = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      let r = Math.floor(Math.random() * ROWS);
      let c = Math.floor(Math.random() * COLS);
      
      let fits = true;
      for (let cell of shapeCells) {
        let rr = r + cell[0];
        let cc = c + cell[1];
        if (rr >= ROWS || cc >= COLS || collides(rr, cc)) { fits = false; break; }
      }
      if (fits) blocks.push({row: r, col: c, cells: shapeCells});
    }
    
    // Strict rejection if < 2 blocks
    if (blocks.length < 2) continue;

    let minMoves = solveBFS(ball, blocks, locked, exit);
    if (minMoves >= targetMinMoves) {
      bestLevel = { ball, exit, locked, blocks };
      break; 
    }
    if (minMoves > maxFoundMoves && minMoves !== -1) {
      maxFoundMoves = minMoves;
      bestLevel = { ball, exit, locked, blocks };
    }
  }

  if (!bestLevel) {
    bestLevel = {
      ball: {row: 5, col: 1}, exit: {row: 0, col: 2},
      locked: [ {row: 3, col: 1}, {row: 2, col: 2} ],
      blocks: [ 
        {row: 4, col: 0, cells: [[0,0], [0,1]]}, 
        {row: 1, col: 1, cells: [[0,0], [1,0], [0,1], [1,1]]} 
      ]
    };
  }

  state.ball = { ...bestLevel.ball };
  state.exit = { ...bestLevel.exit };
  state.locked = bestLevel.locked.map(t => ({...t}));
  state.blocks = bestLevel.blocks.map(b => ({...b, cells: b.cells}));
  
  state.moves = 0;
  state.selectedBlock = null;

  let levelEl = document.getElementById("level-display");
  if (levelEl) levelEl.textContent = "Level: " + (currentLevelIndex + 1);
  scoreboard.add(0);

  // Store untouched state for restart feature
  initialLevelState = { 
    ball: { ...state.ball }, 
    blocks: state.blocks.map(b => ({ ...b, cells: b.cells })) 
  };
}

// ================= RENDER =================

function render() {
  cells.forEach(cell => {
    cell.className = "cell";
    cell.textContent = "";
  });

  // Ball
  cells[index(state.ball.row, state.ball.col)].classList.add("ball");

  // Exit
  cells[index(state.exit.row, state.exit.col)].classList.add("exit");

  // Locked
  state.locked.forEach(t => {
    cells[index(t.row, t.col)].classList.add("locked");
  });

  // Polyomino Blocks
  state.blocks.forEach((block, idx) => {
    let colorClass = "block-color-" + (idx % 6);
    
    block.cells.forEach(c => {
      let r = block.row + c[0];
      let col = block.col + c[1];
      let cell = cells[index(r, col)];
      
      cell.classList.add("block", colorClass);

      // Bridges mapping for 2D arbitrary shapes
      if (block.cells.length > 1) {
        let hasRight = block.cells.some(cc => cc[0] === c[0] && cc[1] === c[1] + 1);
        let hasBottom = block.cells.some(cc => cc[0] === c[0] + 1 && cc[1] === c[1]);
        let hasLeft = block.cells.some(cc => cc[0] === c[0] && cc[1] === c[1] - 1);
        let hasTop = block.cells.some(cc => cc[0] === c[0] - 1 && cc[1] === c[1]);

        if (hasRight) cell.classList.add("bridge-right");
        if (hasBottom) cell.classList.add("bridge-bottom");
        if (hasLeft) cell.classList.add("unborder-left");
        if (hasTop) cell.classList.add("unborder-top");
      }

      if (block === state.selectedBlock) {
        cell.classList.add("selected");
      }
    });
  });

  // 4-Way Direction Arrows
  if (state.selectedBlock) {
    let b = state.selectedBlock;
    let bMoves = [[-1,0,"↑"], [1,0,"↓"], [0,-1,"←"], [0,1,"→"]];
    
    for (let m of bMoves) {
       let dr = m[0], dc = m[1], icon = m[2];
       let canMove = true;
       for (let c of b.cells) {
           if (!isFree(b.row + c[0] + dr, b.col + c[1] + dc, b)) { canMove = false; break; }
       }
       if (canMove) {
           for (let c of b.cells) {
               let destR = b.row + c[0] + dr;
               let destC = b.col + c[1] + dc;
               if (!b.cells.some(bc => b.row+bc[0] === destR && b.col+bc[1] === destC)) {
                   let arrowCell = cells[index(destR, destC)];
                   if (!arrowCell.classList.contains("arrow") && !arrowCell.textContent) {
                      arrowCell.classList.add("arrow");
                      arrowCell.textContent = icon;
                      break; 
                   }
               }
           }
       }
    }
  } else {
    // Ball active
    let br = state.ball.row;
    let bc = state.ball.col;
    let bMoves = [[-1,0,"↑"], [1,0,"↓"], [0,-1,"←"], [0,1,"→"]];
    for (let m of bMoves) {
      if (inBounds(br + m[0], bc + m[1]) && !isOccupied(br + m[0], bc + m[1])) {
        let arrowCell = cells[index(br + m[0], bc + m[1])];
        if (!arrowCell.classList.contains("arrow")) {
            arrowCell.classList.add("arrow");
            arrowCell.textContent = m[2];
        }
      }
    }
  }

  document.getElementById("moves").textContent = "Moves: " + state.moves;
}

// ================= BALL =================

function moveBall(dr, dc) {
  let nr = state.ball.row + dr;
  let nc = state.ball.col + dc;

  if (!inBounds(nr, nc)) return;
  if (isOccupied(nr, nc)) return;

  state.ball.row = nr;
  state.ball.col = nc;

  state.moves++;

  if (nr === state.exit.row && nc === state.exit.col) {
    scoreboard.add(4);
    let overlay = document.getElementById("level-overlay");
    if (overlay) {
      overlay.classList.add("active");
    } else {
      alert("Level Complete!");
      generateLevel();
    }
  }

  render();
}

// ================= BLOCK =================

function moveBlock(dr, dc) {
  let b = state.selectedBlock;
  if (!b) return;

  let canMove = true;
  for (let c of b.cells) {
     if (!isFree(b.row + c[0] + dr, b.col + c[1] + dc, b)) { canMove = false; break; }
  }

  if (canMove) {
    b.row += dr;
    b.col += dc;
    state.moves++;
    render();
  }
}

// ================= SELECTION =================

cells.forEach((cell, i) => {
  cell.addEventListener("click", () => {
    let row = Math.floor(i / COLS);
    let col = i % COLS;

    if (state.selectedBlock) {
      let b = state.selectedBlock;
      let clickedDir = null;
      // Infer intended move direction based on clicked adjacent cell
      for (let c of b.cells) {
         let cr = b.row + c[0]; let cc = b.col + c[1];
         if (row === cr - 1 && col === cc) clickedDir = [-1, 0];
         if (row === cr + 1 && col === cc) clickedDir = [1, 0];
         if (row === cr && col === cc - 1) clickedDir = [0, -1];
         if (row === cr && col === cc + 1) clickedDir = [0, 1];
      }
      if (clickedDir) {
         moveBlock(clickedDir[0], clickedDir[1]);
         return;
      }
    } else {
      let br = state.ball.row;
      let bc = state.ball.col;
      if (
        (row === br - 1 && col === bc) ||
        (row === br + 1 && col === bc) ||
        (row === br && col === bc - 1) ||
        (row === br && col === bc + 1)
      ) {
        if (!isOccupied(row, col)) {
          moveBall(row - br, col - bc);
          return;
        }
      }
    }

    state.selectedBlock = null;

    if (row === state.ball.row && col === state.ball.col) {
      render();
      return;
    }

    state.blocks.forEach(block => {
      block.cells.forEach(c => {
         if (block.row + c[0] === row && block.col + c[1] === col) {
            state.selectedBlock = block;
         }
      });
    });

    render();
  });
});

// ================= CONTROLS =================

document.addEventListener("keydown", e => {
  if (state.selectedBlock) {
    if (e.key === "ArrowUp") moveBlock(-1, 0);
    if (e.key === "ArrowDown") moveBlock(1, 0);
    if (e.key === "ArrowLeft") moveBlock(0, -1);
    if (e.key === "ArrowRight") moveBlock(0, 1);
  } else {
    if (e.key === "ArrowUp") moveBall(-1, 0);
    if (e.key === "ArrowDown") moveBall(1, 0);
    if (e.key === "ArrowLeft") moveBall(0, -1);
    if (e.key === "ArrowRight") moveBall(0, 1);
  }
});

// ================= INIT =================

generateLevel();

startTimer(360, "timer", () => {
  alert("Time up! Game Over.");
  scoreboard.add(-1);
  scoreboard.resetSession();
  currentLevelIndex = 0;
  generateLevel();
  render();
});

render();

// ================= UI CONTROLS =================

const skipBtn = document.getElementById("skip-btn");
if (skipBtn) {
  skipBtn.addEventListener("click", () => {
    scoreboard.add(-1);
    currentLevelIndex++;
    generateLevel();
    render();
  });
}

const restartBtn = document.getElementById("restart-btn");
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    if (!initialLevelState) return;
    state.ball = { ...initialLevelState.ball };
    state.blocks = initialLevelState.blocks.map(b => ({...b, cells: b.cells}));
    state.moves = 0;
    state.selectedBlock = null;
    render();
  });
}

const nextLevelBtn = document.getElementById("next-level-btn");
if (nextLevelBtn) {
  nextLevelBtn.addEventListener("click", () => {
    document.getElementById("level-overlay").classList.remove("active");
    currentLevelIndex++;
    generateLevel();
    render();
  });
}

const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.body.removeAttribute("data-theme");
      themeToggle.textContent = "Dark Mode";
    } else {
      document.body.setAttribute("data-theme", "dark");
      themeToggle.textContent = "Light Mode";
    }
  });
}