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

export default frankenApp;
