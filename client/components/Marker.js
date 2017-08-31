import { memoize } from '../utils/index';

const getMarkerStyle = memoize(
  (player, active) => `circle ${player}${active ? ' active' : ''}`
);

function Marker(player, active) {
  const style = getMarkerStyle(player, active);
  return {
    el: 'div',
    quirks: { class: style },
    children: []
  };
}

export default Marker;
