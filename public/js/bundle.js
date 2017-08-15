(function () {
'use strict';

const PLAYER_ONE = "player-one";
const PLAYER_TWO = "player-two";

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

const getOffset = memoize(y => {
  return (y + 1) % 2;
});

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

function identity(a) {
  return a;
}

function updateSquare(target, board) {
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

const getMarkerStyle = memoize(
  (player, active) => `circle ${player}${active ? " active" : ""}`
);

function Marker(player, active) {
  return {
    el: "div",
    attributes: [{ class: getMarkerStyle(player, active) }]
  };
}

const getSquareStyle = memoize(
  (y, x) => `square${x % 2 === getOffset(y) ? " black" : ""}`
);

function Squares(row, command) {
  return row.map(square => ({
    el: "div",
    attributes: [
      { id: `${square.y}-${square.x}` },
      { class: getSquareStyle(square.y, square.x) }
    ],
    events: [{ click: () => command(updateSquare.bind(this, square)) }],
    children: square.player && Marker(square.player, square.active)
  }));
}

function Board(board, command) {
  return {
    el: "div",
    attributes: [{ class: "board" }],
    children: board.map(row => ({
      el: "div",
      attributes: [{ class: "row" }],
      children: Squares(row, command)
    }))
  };
}

function App(board, command) {
  return {
    el: "div",
    attributes: [{ class: "app" }],
    children: [Board(board, command)]
  };
}

function bootstrap(component, targetId) {
  function command(state, updateFunc) {
    // const start = new Date().valueOf();
    updateFunc = updateFunc || identity;
    const updatedState = updateFunc(state);
    update(
      component(updatedState, command.bind(this, updatedState)),
      document.getElementById(targetId)
    );
    // console.log(new Date().valueOf() - start);
  }
  return {
    start: command
  };
}

function update(rootComponent, target) {
  const app = render(rootComponent);
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

function renderElement(accumulator, next) {
  if (next.el) {
    const attributes = renderAttributes(next.attributes);
    const children = render(next.children);

    accumulator.events = Object.assign({}, accumulator.events, children.events);

    if (next.attributes && next.events) {
      const attribute = next.attributes.find(z => z["id"]);
      if (attribute) {
        accumulator.events[attribute.id] = handleEvents(next.events);
      }
    }

    accumulator.result += `<${next.el} ${attributes}>${children.result}</${next.el}>`;
  } else accumulator.result += next;

  return accumulator;
}

function renderAttributes(attributes) {
  attributes = attributes || [];
  return attributes.reduce((accumulator, next) => {
    const attributeList = [];
    Object.keys(next).forEach(key => {
      attributeList.push(`${key}="${next[key]}"`);
    });
    return accumulator + attributeList.join(" ");
  }, "");
}

function handleEvents(events) {
  events = events || [];
  return events.reduce((accumulator, next) => {
    Object.keys(next).forEach(key => {
      accumulator[key] = next[key];
    });
    return accumulator;
  }, {});
}

const board = getDefaultBoard();

bootstrap(App, "root").start(board);

}());
