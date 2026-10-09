const { aliases } = require("../data/content.js");
function normalize(s) {
  return s
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[。.!！?？,，;；:：]/g, "")
    .replace(/\s+/g, " ");
}
function accepts(item, answer, direction) {
  const expected = direction === "en" ? item.en : item.zh;
  const extras = (aliases[item.en] || []).filter((a) =>
    direction === "en" ? /[a-z]/i.test(a) : !/[a-z]/i.test(a),
  );
  return [
    expected,
    ...extras,
    ...(direction === "zh" ? expected.split("；") : []),
  ].some((a) => normalize(a) === normalize(answer));
}
function shuffled(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const reviewIntervals = [
  5 * 60e3,
  30 * 60e3,
  12 * 3600e3,
  86400e3,
  2 * 86400e3,
  4 * 86400e3,
  7 * 86400e3,
  15 * 86400e3,
  30 * 86400e3,
];
function reviewKey(item, direction) {
  return direction + ":" + item.id;
}
function scheduleReview(previous, ok, now = Date.now()) {
  if (ok && previous && previous.due > now)
    return { ...previous, last: now, attempts: previous.attempts + 1 };
  const stage = ok
    ? previous
      ? Math.min(previous.stage + 1, reviewIntervals.length - 1)
      : 0
    : 0;
  return {
    stage,
    due: now + reviewIntervals[stage],
    last: now,
    attempts: (previous?.attempts || 0) + 1,
  };
}
function reviewPool(items, records, direction, now = Date.now()) {
  const due = items
    .filter((v) => records[reviewKey(v, direction)]?.due <= now)
    .sort(
      (a, b) =>
        records[reviewKey(a, direction)].due -
        records[reviewKey(b, direction)].due,
    );
  const fresh = items.filter((v) => !records[reviewKey(v, direction)]);
  return { due, fresh };
}

module.exports = {
  normalize,
  accepts,
  shuffled,
  reviewIntervals,
  reviewKey,
  scheduleReview,
  reviewPool,
};
