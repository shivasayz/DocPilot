const COLLAPSED = 96;
const EXPANDED = { width: 380, height: 550 };

function growsLeft(position) {
  return position === "top-right" || position === "bottom-right";
}

function growsUp(position) {
  return position === "bottom-left" || position === "bottom-right";
}

function defaultAnchor(workArea, position, margin = 24) {
  const right = workArea.x + workArea.width - COLLAPSED - margin;
  const bottom = workArea.y + workArea.height - COLLAPSED - margin;
  const left = workArea.x + margin;
  const top = workArea.y + margin;
  if (position === "top-left") return { x: left, y: top };
  if (position === "top-right") return { x: right, y: top };
  if (position === "bottom-left") return { x: left, y: bottom };
  return { x: right, y: bottom };
}

function boundsFor(anchor, expanded, position) {
  const width = expanded ? EXPANDED.width : COLLAPSED;
  const height = expanded ? EXPANDED.height : COLLAPSED;
  const x = expanded && growsLeft(position) ? anchor.x + COLLAPSED - width : anchor.x;
  const y = expanded && growsUp(position) ? anchor.y + COLLAPSED - height : anchor.y;
  return {
    x: Math.round(x),
    y: Math.round(y),
    width,
    height,
  };
}

function anchorFromBounds(bounds, expanded, position) {
  return {
    x: expanded && growsLeft(position) ? bounds.x + bounds.width - COLLAPSED : bounds.x,
    y: expanded && growsUp(position) ? bounds.y + bounds.height - COLLAPSED : bounds.y,
  };
}

function clampAnchor(anchor, workArea, margin = 8) {
  const maxX = workArea.x + workArea.width - COLLAPSED - margin;
  const maxY = workArea.y + workArea.height - COLLAPSED - margin;
  return {
    x: Math.round(Math.min(Math.max(anchor.x, workArea.x + margin), maxX)),
    y: Math.round(Math.min(Math.max(anchor.y, workArea.y + margin), maxY)),
  };
}

module.exports = {
  COLLAPSED,
  EXPANDED,
  defaultAnchor,
  boundsFor,
  anchorFromBounds,
  clampAnchor,
};
