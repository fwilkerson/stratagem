(function () {
'use strict';

const CREATE_NODE = 'CREATE_NODE';
const REMOVE_NODE = 'REMOVE_NODE';
const REPLACE_NODE = 'REPLACE_NODE';
const UPDATE_NODE = 'UPDATE_NODE';
const SET_QUIRK = 'SET_QUIRK';
const REMOVE_QUIRK = 'REMOVE_QUIRK';

function diff(oldView, newView) {
  if (!oldView) return { type: CREATE_NODE, newView };
  if (!newView) return { type: REMOVE_NODE };
  if (changed(oldView, newView)) return { type: REPLACE_NODE, newView };
  if (newView.el) {
    return {
      type: UPDATE_NODE,
      children: diffChildren(oldView, newView),
      quirks: diffQuirks(oldView, newView)
    };
  }
}

function changed(oldView, newView) {
  return (
    typeof oldView !== typeof newView ||
    (typeof newView === 'string' && oldView !== newView) ||
    oldView.type !== newView.type
  );
}

function diffChildren(oldView, newView) {
  const patches = [];

  const length = Math.max(oldView.children.length, newView.children.length);
  for (let i = 0; i < length; i++) {
    patches.push(diff(oldView.children[i], newView.children[i]));
  }

  return patches;
}

function diffQuirks(oldView, newView) {
  const patches = [];
  const quirks = Object.assign({}, oldView.quirks, newView.quirks);
  Object.keys(quirks).forEach(key => {
    const oldVal = oldView.quirks[key];
    const newVal = newView.quirks[key];

    if (!newVal) {
      patches.push({ type: REMOVE_QUIRK, key, value: oldVal });
    } else if (!oldVal || oldVal !== newVal) {
      patches.push({ type: SET_QUIRK, key, value: newVal });
    }
  });
  return patches;
}

function patch(parent, patches, index = 0) {
  if (!patches) return;

  const el =
    parent.childNodes[index] || parent.childNodes[parent.childNodes.length - 1];

  switch (patches.type) {
    case CREATE_NODE:
      parent.appendChild(createElement(patches.newView));
      break;
    case REMOVE_NODE:
      if (el) parent.removeChild(el);
      break;
    case REPLACE_NODE:
      parent.replaceChild(createElement(patches.newView), el);
      break;
    case UPDATE_NODE:
      const { children, quirks } = patches;
      quirks.forEach(patchQuirk.bind(null, el));
      for (let i = 0, l = children.length; i < l; i++) {
        patch(el, children[i], i);
      }
      break;
    default:
      break;
  }
}

function patchQuirk(el, patch) {
  switch (patch.type) {
    case SET_QUIRK:
      el.setAttribute(patch.key, patch.value);
      break;
    case REMOVE_QUIRK:
      el.removeAttribute(patch.key);
      break;
  }
}

function createElement(view) {
  if (!view.el) return document.createTextNode(view);

  const node = document.createElement(view.el);
  setQuirks(node, view.quirks);
  view.children.map(createElement).forEach(node.appendChild.bind(node));
  return node;
}

function setQuirks(node, quirks) {
  if (!quirks) return;
  Object.keys(quirks).forEach(key => {
    node.setAttribute(key, quirks[key]);
  });
}

function getEventMap(view) {
  let events = {};
  let uniqueEvents = [];

  function mapEvents(view) {
    if (!view.el) return;

    if (view.events && view.quirks && view.quirks.id) {
      events[view.quirks.id] = view.events;
      uniqueEvents = uniqueEvents.concat(
        Object.keys(view.events).filter(key => {
          return !uniqueEvents.some(x => x === key);
        })
      );
    }

    view.children.forEach(mapEvents);
  }

  mapEvents(view);
  return { events, uniqueEvents };
}

// Consider requiring children be an array like elm does

function frankenApp({ id, func, state, actions }) {
  let _view;
  let _eventMap;

  let _target = document.getElementById(id);
  let _func = func;
  let _state = state || {};
  let _actions = actions || {};

  function render(view, target) {
    _eventMap = getEventMap(view);
    listenForEvents(_eventMap, target);
    target.appendChild(createElement(view));
  }

  function update(view) {
    _eventMap = getEventMap(view);
    const patches = diff(_view, view);
    patch(_target, patches);
    _view = view;
  }

  // TODO: Patch event listeners on update
  function listenForEvents({ events, uniqueEvents }, target) {
    uniqueEvents.forEach(event => {
      target.addEventListener(event, e => routeEvent(e, e.target));
    });
  }

  function routeEvent(e, target) {
    if (!target) return;

    const eventHandlers = _eventMap.events[target.id];
    if (eventHandlers && eventHandlers[e.type]) {
      return eventHandlers[e.type](e);
    }

    routeEvent(e, target.parentElement);
  }

  function dispatch(updateFunc) {
    _state = updateFunc(_state);
    update(_func({ actions: _actions, state: _state, dispatch }));
  }

  return function() {
    _view = _func({ actions: _actions, state: _state, dispatch });
    render(_view, _target);
  };
}

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

const PLAYER_ONE = 'player-one';
const PLAYER_TWO = 'player-two';

function getPlayer(y, x) {
  if (x % 2 === getOffset(y)) {
    if (y < 3) return PLAYER_TWO;
    if (y > 4) return PLAYER_ONE;
  }
  return '';
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
  console.log(target);
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
        if (active && square.player)
          activePiece = Object.assign({}, square, { active });
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
        return Object.assign({}, square, { player: '' });

      if (jumpedSquare && squaresMatch(square, jumpedSquare))
        return Object.assign({}, square, { player: '' });

      return square;
    })
  );
  return Object.assign({}, state, { board, activePiece: null });
}

const LEFT = 'LEFT';
const RIGHT = 'RIGHT';

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
  (player, active) => `circle ${player}${active ? ' active' : ''}`
);

function Marker(player, active) {
  const style = getMarkerStyle(player, active);
  return {
    el: 'div',
    quirks: { class: style },
    children: []
  };
}

const getSquareStyle = memoize(
  (y, x) => `square${x % 2 === getOffset(y) ? ' black' : ''}`
);

function Squares(row, dispatch) {
  return row.map(square => ({
    el: 'div',
    quirks: {
      id: `${square.y}-${square.x}`,
      class: getSquareStyle(square.y, square.x)
    },
    events: {
      click: () => dispatch(state => selectSquare(square, state))
    },
    children: square.player ? [Marker(square.player, square.active)] : []
  }));
}

function Board({ state, dispatch }) {
  return {
    el: 'div',
    quirks: { class: 'board' },
    children: state.board.map(row => ({
      el: 'div',
      quirks: { class: 'row' },
      children: Squares(row, dispatch)
    }))
  };
}

function App(props) {
  return {
    el: 'div',
    quirks: { class: 'app' },
    children: [Board(props)]
  };
}

const state = {
  activePiece: null,
  board: getDefaultBoard()
};

frankenApp({ id: 'root', func: App, state })();

}());
