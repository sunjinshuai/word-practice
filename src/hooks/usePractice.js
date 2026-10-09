import { useRef, useState } from "react";
import { vocabulary } from "../data/content";
import {
  reviewPool,
  shuffled,
  scheduleReview,
  reviewKey,
} from "../domain/practice";
export function selectItems(settings) {
  return vocabulary.filter(
    (v) =>
      (settings.unit === "all" || v.unit === settings.unit) &&
      (settings.scope === "all" || v.group === settings.scope),
  );
}
function storedUnit() {
  try {
    return localStorage.getItem("practice-unit") || "u2";
  } catch {
    return "u2";
  }
}
export function usePractice(learning, audio) {
  const [settings, setSettings] = useState({
    unit: storedUnit(),
    scope: "all",
    mode: "spaced",
    direction: "en",
    quantity: "10",
  });
  const [session, setSession] = useState(null);
  const active = useRef(null);
  const item = session?.queue[session.index];
  function update(next) {
    active.current = next;
    setSession(next);
  }
  function start(options = settings) {
    audio.stop();
    let pool = selectItems(options);
    if (options.mode === "mistakes")
      pool = shuffled(pool.filter((v) => learning.mistakes[v.id]));
    else if (options.mode === "spaced") {
      const { due, fresh } = reviewPool(
        pool,
        learning.reviews,
        options.direction,
      );
      pool = [...due, ...shuffled(fresh)];
    } else pool = shuffled(pool);
    const queue = pool.slice(
      0,
      options.quantity === "all" ? pool.length : Number(options.quantity),
    );
    setSettings(options);
    try {
      localStorage.setItem("practice-unit", options.unit);
    } catch {}
    const next = {
      id: crypto.randomUUID(),
      queue,
      index: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      judged: false,
      hadError: false,
      ok: false,
      started: Date.now(),
    };
    update(next);
    learning.record("session", {
      session_id: next.id,
      action: "start",
      unit: options.unit,
      total: queue.length,
      direction: options.direction,
      mode: options.mode,
      scope: options.scope,
    });
    if (queue[0]) audio.read(queue[0].en);
    else learning.record("session", { session_id: next.id, action: "finish" });
  }
  function recordAnswer(ok, typed, skipped) {
    const s = active.current,
      v = s.queue[s.index],
      review = scheduleReview(
        learning.reviews[reviewKey(v, settings.direction)],
        ok,
      );
    learning.record("answer", {
      session_id: s.id,
      item_id: v.id,
      en: v.en,
      zh: v.zh,
      unit: v.unit,
      direction: settings.direction,
      correct: ok,
      typed,
      skipped,
      review,
      seconds: Math.min(
        1800,
        Math.max(0, Math.round((Date.now() - s.started) / 1000)),
      ),
    });
  }
  function wrongWord(typed) {
    const s = active.current;
    if (!s || s.judged) return;
    if (!s.hadError) {
      recordAnswer(false, typed, false);
      update({ ...s, hadError: true, wrong: s.wrong + 1, streak: 0 });
    }
    audio.feedback(false);
  }
  function finish(ok, typed, skipped = false) {
    const s = active.current;
    if (!s || s.judged) return;
    if (!s.hadError) recordAnswer(ok, typed, skipped);
    update({
      ...s,
      judged: true,
      ok,
      correct: s.correct + (ok && !s.hadError ? 1 : 0),
      wrong: s.wrong + (!ok && !s.hadError ? 1 : 0),
      streak: ok && !s.hadError ? s.streak + 1 : 0,
    });
    if (!skipped) audio.feedback(ok);
    if (ok) audio.read(s.queue[s.index].en);
  }
  function next() {
    const s = active.current;
    if (!s?.judged) return;
    audio.stop();
    const index = s.index + 1;
    update({
      ...s,
      index,
      judged: false,
      ok: false,
      hadError: false,
      started: Date.now(),
    });
    if (index < s.queue.length) audio.read(s.queue[index].en);
    else learning.record("session", { session_id: s.id, action: "finish" });
  }
  return { settings, session, item, start, wrongWord, finish, next };
}
