import App from "./components/App.js";
import { bootstrap } from "./core/index.js";
import { getDefaultBoard } from "./utils/index.js";

const board = getDefaultBoard();

bootstrap(App, "root").start(board);
