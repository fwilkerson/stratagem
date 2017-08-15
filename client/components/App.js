import Board from "./Board";

export default function App(board, command) {
  return {
    el: "div",
    attributes: [{ class: "app" }],
    children: [Board(board, command)]
  };
}
