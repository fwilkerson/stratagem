import Marker from "./Marker";
import { getOffset, memoize, updateSquare } from "../utils/index";

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

export default Squares;
