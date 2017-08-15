import Squares from "./Squares";

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

export default Board;
