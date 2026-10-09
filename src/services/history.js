// Reuse the original database and event schema so earlier records remain readable.
let database;
const requestResult = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
export async function loadHistory() {
  const request = indexedDB.open("word-practice-learning", 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    const store = db.createObjectStore("events", { keyPath: "key" });
    store.createIndex("scope", "scope");
    db.createObjectStore("meta");
  };
  database = await requestResult(request);
  return (
    await requestResult(
      database
        .transaction("events")
        .objectStore("events")
        .index("scope")
        .getAll("guest"),
    )
  ).map((row) => row.event);
}
export function persistEvents(events) {
  return new Promise((resolve, reject) => {
    if (!database) {
      reject(new Error("Database unavailable"));
      return;
    }
    const tx = database.transaction("events", "readwrite");
    for (const event of events)
      tx.objectStore("events").put({
        key: "guest:" + event.id,
        scope: "guest",
        event,
      });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export function newEvent(kind, payload, time = Date.now()) {
  return {
    id: crypto.randomUUID(),
    occurred_at: new Date(time).toISOString(),
    kind,
    payload,
  };
}
export function deriveLearning(events) {
  const reviews = {},
    mistakes = {};
  for (const e of [...events].sort(
    (a, b) =>
      a.occurred_at.localeCompare(b.occurred_at) || a.id.localeCompare(b.id),
  )) {
    const p = e.payload;
    if (e.kind === "answer") {
      reviews[p.direction + ":" + p.item_id] = p.review;
      if (!p.correct) mistakes[p.item_id] = true;
    } else if (e.kind === "mistake") {
      if (p.active) mistakes[p.item_id] = true;
      else delete mistakes[p.item_id];
    }
  }
  return { reviews, mistakes };
}
export function readLegacy(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}
export async function migrateLegacy(events) {
  const done = await requestResult(
    database.transaction("meta").objectStore("meta").get("legacy-migrated"),
  );
  if (done) return events;
  const imported = [];
  for (const [key, review] of Object.entries(readLegacy("u2-reviews-v1"))) {
    const at = key.indexOf(":");
    imported.push(
      newEvent(
        "answer",
        {
          item_id: key.slice(at + 1),
          direction: key.slice(0, at),
          correct: true,
          review,
          imported: true,
        },
        review.last,
      ),
    );
  }
  for (const item_id of Object.keys(readLegacy("u2-mistakes-v1")))
    imported.push(
      newEvent("mistake", { item_id, active: true, imported: true }),
    );
  await persistEvents(imported);
  await new Promise((resolve, reject) => {
    const tx = database.transaction("meta", "readwrite");
    tx.objectStore("meta").put(true, "legacy-migrated");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return [...events, ...imported];
}
