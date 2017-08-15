import { identity } from "../utils/index";

export function bootstrap(component, targetId) {
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
