import Squares from './Squares';

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

export default Board;
