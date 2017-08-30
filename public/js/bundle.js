(function () {
'use strict';

function memoize(func) {
  const cache = {};
  return function() {
    const key = JSON.stringify(arguments);
    if (cache[key]) return cache[key];
    const val = func.apply(this, arguments);
    cache[key] = val;
    return val;
  };
}

const getOffset = memoize(y => {
  return (y + 1) % 2;
});

const PLAYER_ONE = "player-one";
const PLAYER_TWO = "player-two";

function getPlayer(y, x) {
  if (x % 2 === getOffset(y)) {
    if (y < 3) return PLAYER_TWO;
    if (y > 4) return PLAYER_ONE;
  }
  return "";
}

function getDefaultBoard() {
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

function selectSquare(target, state) {
  if (!state.activePiece) return setActivePiece(target, state);
  if (target.player) return setActivePiece(target, state);
  if (isMoveValid(state.activePiece, target)) return claimSquare(target, state);

  const direction = isJumpLocationValid(state.activePiece, target);

  if (direction) {
    const jumpedSquare = getJumpedSquare(state, direction);
    if (jumpedSquare) return claimSquare(target, state, jumpedSquare);
  }

  return state;
}

function squaresMatch(first, second) {
  return first.y === second.y && first.x === second.x;
}

function setActivePiece(target, state) {
  let activePiece = null;
  const board = state.board.map(row =>
    row.map(square => {
      let active = false;
      if (squaresMatch(square, target)) {
        active = !target.active;
        if (active && square.player) activePiece = square;
      }
      return Object.assign({}, square, { active });
    })
  );
  return Object.assign({}, state, { board, activePiece });
}

function isMoveValid(activePiece, target) {
  if (target.player) return false;

  // moving along x axis is same for both players
  const xIsValid =
    target.x === activePiece.x + 1 || target.x === activePiece.x - 1;

  switch (activePiece.player) {
    case PLAYER_ONE:
      return target.y === activePiece.y - 1 && xIsValid;
    case PLAYER_TWO:
      return target.y === activePiece.y + 1 && xIsValid;
    default:
      return false;
  }
}

function claimSquare(target, state, jumpedSquare) {
  const activePiece = state.activePiece;
  const board = state.board.map(row =>
    row.map(square => {
      if (squaresMatch(square, target))
        return Object.assign({}, square, { player: activePiece.player });

      if (squaresMatch(square, activePiece))
        return Object.assign({}, square, { player: "" });

      if (jumpedSquare && squaresMatch(square, jumpedSquare))
        return Object.assign({}, square, { player: "" });

      return square;
    })
  );
  return Object.assign({}, state, { board, activePiece: null });
}

const LEFT = "LEFT";
const RIGHT = "RIGHT";

function isJumpLocationValid(activePiece, target) {
  let yIsValid;
  switch (activePiece.player) {
    case PLAYER_ONE:
      yIsValid = target.y === activePiece.y - 2;
      break;
    case PLAYER_TWO:
      yIsValid = target.y === activePiece.y + 2;
      break;
    default:
      return false;
  }

  if (!yIsValid) return false;

  if (target.x === activePiece.x + 2) return RIGHT;

  if (target.x === activePiece.x - 2) return LEFT;

  return false;
}

function getJumpedSquare(state, direction) {
  const activePiece = state.activePiece;

  let targetX;
  switch (direction) {
    case RIGHT:
      targetX = activePiece.x + 1;
      break;
    case LEFT:
      targetX = activePiece.x - 1;
      break;
    default:
      return null;
  }

  let targetY;
  switch (activePiece.player) {
    case PLAYER_ONE:
      targetY = activePiece.y - 1;
      break;
    case PLAYER_TWO:
      targetY = activePiece.y + 1;
      break;
    default:
      return null;
  }

  const jumpedSquare = state.board[targetY][targetX];

  if (jumpedSquare.player && jumpedSquare.player !== activePiece.player)
    return jumpedSquare;

  return null;
}

const getMarkerStyle = memoize(
  (player, active) => `circle ${player}${active ? " active" : ""}`
);

function Marker(player, active) {
  return {
    el: "div",
    attributes: { class: getMarkerStyle(player, active) }
  };
}

const getSquareStyle = memoize(
  (y, x) => `square${x % 2 === getOffset(y) ? " black" : ""}`
);

function Squares(row, command) {
  return row.map(square => ({
    el: "div",
    attributes: {
      id: `${square.y}-${square.x}`,
      class: getSquareStyle(square.y, square.x)
    },
    events: { click: () => command(selectSquare.bind(null, square)) },
    children: square.player && Marker(square.player, square.active)
  }));
}

function Board(state, command) {
  return {
    el: "div",
    attributes: { class: "board" },
    children: state.board.map(row => ({
      el: "div",
      attributes: { class: "row" },
      children: Squares(row, command)
    }))
  };
}

function App(state, command) {
  return {
    el: "div",
    attributes: { class: "app" },
    children: [Board(state, command)]
  };
}

const identity = a => a;

function bootstrap(component, targetId) {
  function command(state, updateFunc) {
    updateFunc = updateFunc || identity;
    const updatedState = updateFunc(state);
    update(
      component(updatedState, command.bind(null, updatedState)),
      document.getElementById(targetId)
    );
  }
  return {
    start: command
  };
}

function update(componentTree, target) {
  const app = render(componentTree);
  const listeners = {};
  const clone = target.cloneNode(false);

  for (let propName in app.events) {
    const prop = app.events[propName];
    for (let eventName in prop) {
      if (listeners[eventName]) continue;
      listeners[eventName] = 1;
      clone.addEventListener(eventName, e =>
        eventListener(app.events, e.target, e.type)
      );
    }
  }

  clone.innerHTML = app.result;

  target.parentNode.replaceChild(clone, target);
}

function eventListener(events, target, type) {
  if (!target) return;

  const eventHandlers = events[target.id];
  if (eventHandlers) {
    const handler = eventHandlers[type];
    if (handler) return handler();
  }

  eventListener(events, target.parentElement, type);
}

function render(elements) {
  elements = elements || [];
  if (!Array.isArray(elements)) elements = [elements];
  return elements.reduce(renderElement, { result: "", events: {} });
}

function renderElement(acc, next) {
  if (next.el) {
    const attr = renderAttributes(next.attributes);
    const children = render(next.children);

    acc.events = Object.assign({}, acc.events, children.events);

    if (next.attributes && next.events) {
      const id = next.attributes.id;
      if (id) acc.events[id] = next.events;
    }

    acc.result += `<${next.el} ${attr}>${children.result}</${next.el}>`;
  } else acc.result += next;

  return acc;
}

function renderAttributes(attr) {
  if (!attr) return "";
  return Object.keys(attr).reduce(
    (acc, next) => (acc += `${next}="${attr[next]}"`),
    ""
  );
}

const initialState = {
  activePiece: null,
  board: getDefaultBoard()
};

bootstrap(App, "root").start(initialState);

}());
