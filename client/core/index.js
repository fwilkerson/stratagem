const identity = a => a;

export function bootstrap(component, targetId) {
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
