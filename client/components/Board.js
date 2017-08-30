import Squares from "./Squares";

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

export default Board;
