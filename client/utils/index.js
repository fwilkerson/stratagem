export const PLAYER_ONE = "player-one";
export const PLAYER_TWO = "player-two";

export function getDefaultBoard() {
  const board = [];
  for (let y = 0; y < 8; y++) {
    board.push([]);
    for (let x = 0; x < 8; x++) {
      board[y].push({
        active: false,
        player: getPlayer(y, x),
        x,
        y
      });
    }
  }
  return board;
}

export const getOffset = memoize(y => {
  return (y + 1) % 2;
});

export function memoize(func) {
  const cache = {};
  return function() {
    const key = JSON.stringify(arguments);
    if (cache[key]) return cache[key];
    const val = func.apply(this, arguments);
    cache[key] = val;
    return val;
  };
}

export function identity(a) {
  return a;
}

export function updateSquare(target, board) {
  return board.map(row => {
    return row.map(square => {
      let active = square.active;
      if (square.x === target.x && square.y === target.y)
        active = !target.active;
      return Object.assign({}, square, { active });
    });
  });
}

function getPlayer(y, x) {
  if (x % 2 === getOffset(y)) {
    if (y < 3) return PLAYER_TWO;
    if (y > 4) return PLAYER_ONE;
  }
  return "";
}
