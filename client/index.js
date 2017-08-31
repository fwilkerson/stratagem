import frankenApp from './core/franken-app.js';
import App from './components/App.js';
import { getDefaultBoard } from './utils/index.js';

const state = {
  activePiece: null,
  board: getDefaultBoard()
};

frankenApp({ id: 'root', func: App, state })();
