import Board from './Board';

export default function App(props) {
  return {
    el: 'div',
    quirks: { class: 'app' },
    children: [Board(props)]
  };
}
