import { memoize } from "../utils/index";

const getMarkerStyle = memoize(
  (player, active) => `circle ${player}${active ? " active" : ""}`
);

function Marker(player, active) {
  return {
    el: "div",
    attributes: [{ class: getMarkerStyle(player, active) }]
  };
}

export default Marker;
