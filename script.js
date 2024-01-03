let game = {};
let state = {};
let moveEvents = [];
let throttle;
const wait = (fn, delay) =>
  new Promise((resolve) =>
    setTimeout(() => {
      if (fn) fn();
      resolve();
    }, delay)
  );
const board = document.querySelector("#board");
const windowWidth = "100%";
const windowHeight = "100vh";
board.setAttribute("width", windowWidth);
board.setAttribute("height", windowHeight);
board.style.backgroundColor = "#121212";

const CROSS = "X";
const CIRCLE = "O";

function drawLine(x1, y1, x2, y2, color) {
  const line = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", color || "white");
  line.setAttribute("stroke-width", game.strokeWidth);
  board.appendChild(line);
}

async function drawMoves() {
  let moves = state.moves.slice();
  state.moves = [];
  for (let move of moves) {
    await wait(() => markCell(move.x, move.y), 100);
  }
}

function drawScore(player) {
  let scoreBoard = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  let xpos, ypos, fontSize;
  if (game.w > game.h) {
    xpos =
      player == CROSS
        ? (game.w - game.side) / 4
        : (3 * game.w + game.side) / 4;
    ypos = game.h / 2;
    fontSize = "5.5em";
  } else {
    xpos = game.w / 2;
    ypos =
      player == CROSS
        ? (game.h - game.side) / 4
        : (3 * game.h + game.side) / 4;
    fontSize = "3.5em";
  }
  score = state.winners.filter((winner) => winner === player).length;
  scoreBoard.setAttribute("y", ypos);
  scoreBoard.style.fontSize = fontSize;
  scoreBoard.innerHTML = `<tspan class="score" x=${xpos} dy="0">${score}</tspan><tspan x=${xpos} dy="0.6em">—</tspan><tspan x=${xpos} dy="0.7em">${player}</tspan>`;
  board.appendChild(scoreBoard);
}

async function drawBoard() {
  board.querySelectorAll("*").forEach((el) => el.remove());
  game.w = board.clientWidth;
  game.h = board.clientHeight;
  game.side = Math.min(game.w, game.h) / 1.2;
  game.boxSide = game.side / 3;
  game.cellPadding = game.boxSide / 6;
  game.strokeWidth = game.boxSide / 19;
  game.wBegin = (game.w - game.side) / 2;
  game.hBegin = (game.h - game.side) / 2;
  drawScore(CROSS);
  drawScore(CIRCLE);
  for (let i = 1; i <= 2; i++) {
    await wait(
      () =>
        drawLine(
          game.wBegin,
          game.hBegin + i * game.boxSide,
          game.wBegin + game.side,
          game.hBegin + i * game.boxSide
        ),
      (i - 1) * 250
    );
  }
  for (let i = 1; i <= 2; i++) {
    await wait(
      () =>
        drawLine(
          game.wBegin + i * game.boxSide,
          game.hBegin,
          game.wBegin + i * game.boxSide,
          game.hBegin + game.side
        ),
      300
    );
  }
  await wait(null, 1000);
  await drawMoves();
}

function drawCross(x, y) {
  const cross = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  cross.setAttribute(
    "d",
    `M${game.wBegin + game.cellPadding + x * game.boxSide},${
      game.hBegin + game.cellPadding + y * game.boxSide
    } L${game.wBegin - game.cellPadding + (x + 1) * game.boxSide},${
      game.hBegin - game.cellPadding + (y + 1) * game.boxSide
    } M${game.wBegin + game.cellPadding + x * game.boxSide},${
      game.hBegin - game.cellPadding + (y + 1) * game.boxSide
    } L${game.wBegin - game.cellPadding + (x + 1) * game.boxSide},${
      game.hBegin + game.cellPadding + y * game.boxSide
    }`
  );
  cross.setAttribute("stroke", "white");
  cross.setAttribute("stroke-width", game.strokeWidth);
  moveEvents.push(cross);
  board.appendChild(cross);
}

function drawCircle(x, y) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", game.wBegin + (x + 0.5) * game.boxSide);
  circle.setAttribute("cy", game.hBegin + (y + 0.5) * game.boxSide);
  circle.setAttribute("r", game.boxSide / 2 - game.cellPadding);
  circle.setAttribute("stroke", "white");
  circle.setAttribute("stroke-width", game.strokeWidth);
  circle.setAttribute("fill", "none");
  moveEvents.push(circle);
  board.appendChild(circle);
}

function switchPlayer(player) {
  if (player == CROSS) {
    return CIRCLE;
  } else {
    return CROSS;
  }
}

function isMoveValid(player, x, y) {
  for (let move of state.moves) {
    if (move.x == x && move.y == y) {
      return false;
    }
  }
  return true;
}

function drawWinnerLine(winner) {
  switch (winner.type) {
    case "row":
      drawLine(
        game.wBegin + game.boxSide / 2,
        game.hBegin + (winner.y + 0.5) * game.boxSide,
        game.wBegin + game.side - game.boxSide / 2,
        game.hBegin + (winner.y + 0.5) * game.boxSide,
        "red"
      );
      break;
    case "col":
      drawLine(
        game.wBegin + (winner.x + 0.5) * game.boxSide,
        game.hBegin + game.boxSide / 2,
        game.wBegin + (winner.x + 0.5) * game.boxSide,
        game.hBegin + game.side - game.boxSide / 2,
        "red"
      );
      break;
    case "diag":
      switch (winner.slope) {
        case -1:
          drawLine(
            game.wBegin + game.boxSide / 2,
            game.hBegin + game.boxSide / 2,
            game.wBegin + game.side - game.boxSide / 2,
            game.hBegin + game.side - game.boxSide / 2,
            "red"
          );
          break;
        case 1:
          drawLine(
            game.wBegin + game.boxSide / 2,
            game.hBegin + game.side - game.boxSide / 2,
            game.wBegin + game.side - game.boxSide / 2,
            game.hBegin + game.boxSide / 2,
            "red"
          );
          break;
      }
      break;
  }
}

function markCell(x, y) {
  let player = [state.begin, switchPlayer(state.begin)][
    state.moves.length % 2
  ];
  if (isMoveValid(player, x, y)) {
    if (player == CROSS) {
      drawCross(x, y);
    } else {
      drawCircle(x, y);
    }
    state.moves.push({ x, y });
    let status = isPlayerWinning(player, getBoard());
    if (status || state.moves.length == 9) {
      if (status) {
        drawWinnerLine(status);
        state.winners.push(player);
      }
      state.moves = [];
      setTimeout(drawBoard, 1000);
    } else if (state.isAI && state.moves.length % 2 == 1) {
      board.removeEventListener("click", handleClick);
      wait(null, 500).then(() => {
        let bestMove = AI();
        markCell(bestMove.x, bestMove.y);
        board.addEventListener("click", handleClick);
      });
    }
  }
}

function undo() {
  if (state.moves.length > 0) {
    let move = state.moves.pop();
    let player = [state.begin, switchPlayer(state.begin)][
      state.moves.length % 2
    ];
    let status = isPlayerWinning(player, getBoard());
    if (status) {
      state.winners.pop();
    }
    moveEvents.pop().remove();
  }
}

function isPlayerWinning(player, gameBoard) {
  for (let i = 0; i < 3; i++) {
    if (
      gameBoard[i][0] == player &&
      gameBoard[i][1] == player &&
      gameBoard[i][2] == player
    ) {
      return { type: "row", y: i };
    }
  }
  for (let i = 0; i < 3; i++) {
    if (
      gameBoard[0][i] == player &&
      gameBoard[1][i] == player &&
      gameBoard[2][i] == player
    ) {
      return { type: "col", x: i };
    }
  }
  if (
    gameBoard[0][0] == player &&
    gameBoard[1][1] == player &&
    gameBoard[2][2] == player
  ) {
    return { type: "diag", slope: -1 };
  }
  if (
    gameBoard[0][2] == player &&
    gameBoard[1][1] == player &&
    gameBoard[2][0] == player
  ) {
    return { type: "diag", slope: 1 };
  }
  return false;
}

function minimax(player, gameBoard, empty) {
  if (empty.length == 0) {
    if (isPlayerWinning(CROSS, gameBoard)) {
      return { score: Infinity };
    } else if (isPlayerWinning(CIRCLE, gameBoard)) {
      return { score: -Infinity };
    } else {
      return { score: 0 };
    }
  }
  let scores = JSON.parse(JSON.stringify(empty));
  for (let cell in empty) {
    let newGameBoard = JSON.parse(JSON.stringify(gameBoard));
    newGameBoard[empty[cell].y][empty[cell].x] = player;
    scores[cell].score = minimax(
      switchPlayer(player),
      newGameBoard,
      empty.filter((c, i) => cell != i)
    ).score;
  }
  if (player == CROSS) {
    return scores.reduce((a, b) => (a.score > b.score ? a : a.score < b.score ? b : Math.random() > 0.5 ? a : b));
  } else {
    return scores.reduce((a, b) => (a.score < b.score ? a : a.score > b.score ? b : Math.random() > 0.5 ? a : b));
  }
}

function getBoard() {
  let gameBoard = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
  let player = state.begin;
  for (let move of state.moves) {
    gameBoard[move.y][move.x] = player;
    player = switchPlayer(player);
  }
  return gameBoard;
}

function AI() {
  let player = [state.begin, switchPlayer(state.begin)][
    state.moves.length % 2
  ];
  gameBoard = getBoard();
  empty = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!gameBoard[i][j]) {
        empty.push({ x: j, y: i, score: -Infinity });
      }
    }
  }
  let bestMove = minimax(player, gameBoard, empty);
  console.log(bestMove);
  return bestMove;
}

function handleClick(e) {
  const y = Math.floor((e.clientY - game.hBegin) / game.boxSide);
  const x = Math.floor((e.clientX - game.wBegin) / game.boxSide);
  if (x >= 0 && x <= 2 && y >= 0 && y <= 2) {
    markCell(x, y);
  }
}

function initGame() {
  state.begin = CROSS;
  state.moves = [];
  state.winners = [];
  state.isAI = true;
  drawBoard();
  board.addEventListener("click", handleClick);
  window.addEventListener("keydown", (e) => {
    if (e.keyCode == 27) {
      undo();
    }
  });
  window.addEventListener("resize", () => {
    clearTimeout(throttle);
    throttle = setTimeout(() => {
      drawBoard();
    }, 100);
  });
}

window.onload = initGame;