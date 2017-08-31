import Marker from './Marker';
import { getOffset, memoize, selectSquare } from '../utils/index';

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

export default Squares;
