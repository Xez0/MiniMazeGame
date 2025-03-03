document.addEventListener("DOMContentLoaded", function () {
  // Initialize canvas and drawing context
  const canvas = document.getElementById("mazeCanvas");
  const ctx = canvas.getContext("2d");
  let canvasWidth = (canvas.width = canvas.offsetWidth);
  let canvasHeight = (canvas.height = canvas.offsetHeight);

  // Maze configuration: set number of columns and rows
  const cols = 15;
  const rows = 10;
  const cellSize = Math.min(canvasWidth / cols, canvasHeight / rows);
  let grid = [];
  let stack = [];

  // Variables for player and exit point
  let player = {};
  let exit = {};

  // Variables for timer and score
  let startTime = 0;
  let timerInterval = null;
  let timerStarted = false;

  // Variables for mobile button status
  let controlsVisible = true;

  // Function to set random start and finish positions
  function setRandomStartAndFinish() {
    let playerRow = Math.floor(Math.random() * rows);
    let playerCol = Math.floor(Math.random() * cols);
    let exitRow, exitCol;
    const minDistance = 7; // Minimum Manhattan distance between start and finish
    do {
      exitRow = Math.floor(Math.random() * rows);
      exitCol = Math.floor(Math.random() * cols);
    } while (Math.abs(exitRow - playerRow) + Math.abs(exitCol - playerCol) < minDistance);
    player = {
      row: playerRow,
      col: playerCol,
      color: "#FF5722",
    };
    exit = {
      row: exitRow,
      col: exitCol,
    };
  }

  // Constructor for maze cell object
  function Cell(row, col) {
    this.row = row;
    this.col = col;
    this.walls = [true, true, true, true]; // [top, right, bottom, left]
    this.visited = false;
  }

  // Create maze grid
  function createGrid() {
    grid = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid.push(new Cell(r, c));
      }
    }
  }

  // Get cell index in grid array
  function index(row, col) {
    if (row < 0 || col < 0 || row >= rows || col >= cols) return -1;
    return row * cols + col;
  }

  // Maze generation using recursive backtracking algorithm
  function generateMaze() {
    let startIndex = Math.floor(Math.random() * grid.length);
    let current = grid[startIndex];
    current.visited = true;
    stack.push(current);

    while (stack.length > 0) {
      current = stack[stack.length - 1];
      let next = checkNeighbors(current);
      if (next) {
        next.visited = true;
        stack.push(next);
        removeWalls(current, next);
      } else {
        stack.pop();
      }
    }
  }

  // Check unvisited neighbors of a cell
  function checkNeighbors(cell) {
    let neighbors = [];
    let top = grid[index(cell.row - 1, cell.col)];
    let right = grid[index(cell.row, cell.col + 1)];
    let bottom = grid[index(cell.row + 1, cell.col)];
    let left = grid[index(cell.row, cell.col - 1)];

    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom); // Small bug here, should be 'bottom'
    if (left && !left.visited) neighbors.push(left);

    return neighbors.length > 0
      ? neighbors[Math.floor(Math.random() * neighbors.length)]
      : undefined;
  }

  // Remove walls between two adjacent cells
  function removeWalls(current, next) {
    let x = current.col - next.col;
    let y = current.row - next.row;
    if (x === 1) {
      current.walls[3] = false;
      next.walls[1] = false;
    } else if (x === -1) {
      current.walls[1] = false;
      next.walls[3] = false;
    }
    if (y === 1) {
      current.walls[0] = false;
      next.walls[2] = false;
    } else if (y === -1) {
      current.walls[2] = false;
      next.walls[0] = false;
    }
  }

  // Draw the maze on the canvas
  function drawMaze() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    grid.forEach((cell) => {
      let x = cell.col * cellSize;
      let y = cell.row * cellSize;
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 2;
      if (cell.walls[0]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
        ctx.stroke();
      }
      if (cell.walls[1]) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      if (cell.walls[2]) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y + cellSize);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();
      }
      if (cell.walls[3]) {
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    });
  }

  // Draw the finish marker
  function drawFinish() {
    let finishX = exit.col * cellSize + cellSize / 2;
    let finishY = exit.row * cellSize + cellSize / 2;
    let radius = cellSize / 4;
    ctx.beginPath();
    ctx.arc(finishX, finishY, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = "#28a745";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }

  // Draw the player
  function drawPlayer() {
    let x = player.col * cellSize + cellSize / 4;
    let y = player.row * cellSize + cellSize / 4;
    let size = cellSize / 2;
    ctx.fillStyle = player.color;
    ctx.fillRect(x, y, size, size);
  }

  // Update game display
  function updateGame() {
    drawMaze();
    drawFinish();
    drawPlayer();
    checkWin();
  }

  // Update timer
  function updateTimer() {
    const elapsed = (Date.now() - startTime) / 1000;
    document.getElementById("timer").textContent = `Time: ${elapsed.toFixed(1)}s`;
  }

  // Detect mobile device
  function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  // Show virtual arrow buttons on mobile
  function showMobileControls() {
    if (isMobileDevice()) {
      document.getElementById("mobile-controls").style.display = "block";
    }
  }

  // Move player based on direction
  function movePlayer(direction) {
    let prevRow = player.row;
    let prevCol = player.col;
    let currentCell = grid[index(player.row, player.col)];
    if (direction === "up" && !currentCell.walls[0]) {
      player.row--;
    } else if (direction === "right" && !currentCell.walls[1]) {
      player.col++;
    } else if (direction === "down" && !currentCell.walls[2]) {
      player.row++;
    } else if (direction === "left" && !currentCell.walls[3]) {
      player.col--;
    }
    if (
      (player.row !== prevRow || player.col !== prevCol) &&
      !timerStarted
    ) {
      timerStarted = true;
      startTime = Date.now();
      timerInterval = setInterval(updateTimer, 100);
    }
    updateGame();
  }

  // Handle keyboard input
  function handleKeyDown(e) {
    let direction;
    if (e.key === "ArrowUp" || e.key === "w") direction = "up";
    else if (e.key === "ArrowRight" || e.key === "d") direction = "right";
    else if (e.key === "ArrowDown" || e.key === "s") direction = "down";
    else if (e.key === "ArrowLeft" || e.key === "a") direction = "left";
    if (direction) movePlayer(direction);
  }

  // Check if player wins and disable movement
  function checkWin() {
    if (player.row === exit.row && player.col === exit.col) {
      clearInterval(timerInterval);
      const elapsed = (Date.now() - startTime) / 1000;
      document.getElementById("message").textContent =
        "Congratulations! You escaped the maze!";
      document.getElementById("score").textContent = `Your Time: ${elapsed.toFixed(1)}s`;

      // Stop keyboard input
      document.removeEventListener("keydown", handleKeyDown);

      // Disable mobile buttons
      if (isMobileDevice()) {
        document.getElementById("upBtn").disabled = true;
        document.getElementById("rightBtn").disabled = true;
        document.getElementById("downBtn").disabled = true;
        document.getElementById("leftBtn").disabled = true;
      }
    }
  }

  // Restart the game
  function restartGame() {
    clearInterval(timerInterval);
    timerStarted = false;
    createGrid();
    generateMaze();
    setRandomStartAndFinish();
    updateGame();
    document.getElementById("message").textContent =
      "Enjoy the game! Find the exit...";
    document.getElementById("score").textContent = "";
    document.getElementById("timer").textContent = "Time: 0.0s";
    document.addEventListener("keydown", handleKeyDown);

    // Re-enable mobile buttons
    if (isMobileDevice()) {
      document.getElementById("upBtn").disabled = false;
      document.getElementById("rightBtn").disabled = false;
      document.getElementById("downBtn").disabled = false;
      document.getElementById("leftBtn").disabled = false;
    }
  }

  // Setup mobile controls
  function setupMobileControls() {
    if (isMobileDevice()) {
      document
        .getElementById("upBtn")
        .addEventListener("click", () => movePlayer("up"));
      document
        .getElementById("rightBtn")
        .addEventListener("click", () => movePlayer("right"));
      document
        .getElementById("downBtn")
        .addEventListener("click", () => movePlayer("down"));
      document
        .getElementById("leftBtn")
        .addEventListener("click", () => movePlayer("left"));

      // Setup toggle button
      document
        .getElementById("toggleBtn")
        .addEventListener("click", function () {
          const arrowBtns = document.querySelectorAll(".arrow-btn");
          if (controlsVisible) {
            arrowBtns.forEach((btn) => (btn.style.display = "none"));
            this.textContent = "Show Controls";
          } else {
            arrowBtns.forEach(
              (btn) => (btn.style.display = "inline-block")
            );
            this.textContent = "Hide Controls";
          }
          controlsVisible = !controlsVisible;
        });
    }
  }

  // Initialize the game
  function init() {
    createGrid();
    generateMaze();
    setRandomStartAndFinish();
    updateGame();
    document.addEventListener("keydown", handleKeyDown);
    document
      .getElementById("restartBtn")
      .addEventListener("click", restartGame);
    showMobileControls();
    setupMobileControls();
  }

  // Adjust canvas size on window resize
  window.addEventListener("resize", function () {
    canvasWidth = canvas.width = canvas.offsetWidth;
    canvasHeight = canvas.height = canvas.offsetHeight;
    updateGame();
  });

  // Start the game
  init();
});
