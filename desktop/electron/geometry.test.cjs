const assert = require("node:assert/strict");
const { COLLAPSED, EXPANDED, boundsFor, defaultAnchor, anchorFromBounds, clampAnchor } = require("./geometry.cjs");

const area = { x: 0, y: 0, width: 1440, height: 900 };
const anchor = defaultAnchor(area, "bottom-right");

assert.equal(anchor.x, 1440 - COLLAPSED - 24);
assert.equal(anchor.y, 900 - COLLAPSED - 24);

const collapsed = boundsFor(anchor, false, "bottom-right");
assert.deepEqual(collapsed, { x: anchor.x, y: anchor.y, width: COLLAPSED, height: COLLAPSED });

const expanded = boundsFor(anchor, true, "bottom-right");
assert.equal(expanded.width, EXPANDED.width);
assert.equal(expanded.height, EXPANDED.height);
assert.equal(expanded.x + expanded.width, anchor.x + COLLAPSED);
assert.equal(expanded.y + expanded.height, anchor.y + COLLAPSED);

const restored = anchorFromBounds(expanded, true, "bottom-right");
assert.deepEqual(restored, anchor);

const topLeft = defaultAnchor(area, "top-left");
const opened = boundsFor(topLeft, true, "top-left");
assert.deepEqual(opened, { x: topLeft.x, y: topLeft.y, width: EXPANDED.width, height: EXPANDED.height });

const clamped = clampAnchor({ x: -100, y: 5000 }, area);
assert.equal(clamped.x, 8);
assert.ok(clamped.y <= area.height - COLLAPSED);

console.log("geometry ok");
