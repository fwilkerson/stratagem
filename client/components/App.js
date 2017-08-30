import Board from "./Board";

export default function App(state, command) {
  return {
    el: "div",
    attributes: { class: "app" },
    children: [Board(state, command)]
  };
}
