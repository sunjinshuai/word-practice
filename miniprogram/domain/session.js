const { vocabulary } = require("../data/content.js");
const {
  reviewPool,
  shuffled,
  accepts,
  scheduleReview,
  reviewKey,
} = require("./practice");
const { tagWord, posColors, spellingWords } = require("./words");
function selectItems(settings) {
  return vocabulary.filter(
    (v) =>
      (settings.unit === "all" || v.unit === settings.unit) &&
      (settings.scope === "all" || v.group === settings.scope),
  );
}
class PracticeSession {
  constructor(store, settings) {
    this.store = store;
    this.settings = { ...settings };
    this.id = Date.now() + "-" + Math.random().toString(36).slice(2);
    let pool = selectItems(settings);
    if (settings.mode === "spaced") {
      const { due, fresh } = reviewPool(
        pool,
        store.state.reviews,
        settings.direction,
      );
      pool = [...due, ...shuffled(fresh)];
    } else if (settings.mode === "mistakes")
      pool = shuffled(pool.filter((v) => store.state.mistakes[v.id]));
    else pool = shuffled(pool);
    this.queue = pool.slice(
      0,
      settings.quantity === "all" ? pool.length : Number(settings.quantity),
    );
    this.index = 0;
    this.correct = 0;
    this.wrong = 0;
    this.streak = 0;
    store.record("session", {
      session_id: this.id,
      action: "start",
      ...settings,
      total: this.queue.length,
    });
    this.resetQuestion();
    if (!this.item) this.complete();
  }
  get item() {
    return this.queue[this.index];
  }
  resetQuestion() {
    this.judged = false;
    this.ok = false;
    this.hadError = false;
    this.started = Date.now();
    this.activeWord = 0;
    const words = this.item ? spellingWords(this.item) : [];
    this.words = words.map((text, i) => ({
      text,
      expected: text.replace(/[^a-z0-9]/gi, ""),
      typed: "",
      valid: false,
      invalid: false,
      pos: tagWord(text.replace(/[^a-z0-9']/gi, ""), i, words),
      color: posColors[Math.floor(Math.random() * posColors.length)],
    }));
    this.phonics = "";
  }
  answer() {
    return this.words
      .map((w) => {
        let i = 0;
        return [...w.text]
          .map((c) => (/[a-z0-9]/i.test(c) ? w.typed[i++] || "" : c))
          .join("");
      })
      .join(" ");
  }
  recordAnswer(ok, typed, skipped = false) {
    const v = this.item,
      review = scheduleReview(
        this.store.state.reviews[reviewKey(v, this.settings.direction)],
        ok,
      );
    this.store.record("answer", {
      session_id: this.id,
      item_id: v.id,
      en: v.en,
      zh: v.zh,
      unit: v.unit,
      direction: this.settings.direction,
      typed,
      correct: ok,
      skipped,
      review,
      seconds: Math.min(1800, Math.round((Date.now() - this.started) / 1000)),
    });
  }
  input(value) {
    if (this.judged || !this.item) return {};
    const letters = value.replace(/[^a-z0-9]/gi, "");
    const result = {};
    let remaining = letters;
    while (remaining.length || !result.valid) {
      const word = this.words[this.activeWord];
      word.typed = remaining.slice(0, word.expected.length);
      remaining = remaining.slice(word.expected.length);
      if (word.typed.length < word.expected.length) {
        word.invalid = false;
        result.partial = true;
        break;
      }
      if (word.typed.toLowerCase() !== word.expected.toLowerCase()) {
        word.invalid = true;
        this.phonics = word.text;
        if (!this.hadError) {
          this.recordAnswer(false, this.answer());
          this.hadError = true;
          this.wrong++;
          this.streak = 0;
        }
        result.error = true;
        break;
      }
      word.valid = true;
      word.invalid = false;
      this.phonics = "";
      result.valid = true;
      if (this.activeWord === this.words.length - 1) {
        this.finish(true, this.answer());
        result.success = true;
        break;
      }
      this.activeWord++;
      if (!remaining) break;
    }
    return result;
  }
  finish(ok, typed, skipped = false) {
    if (this.judged || !this.item) return;
    if (!this.hadError) this.recordAnswer(ok, typed, skipped);
    if (ok && !this.hadError) {
      this.correct++;
      this.streak++;
    } else {
      if (!this.hadError) this.wrong++;
      this.streak = 0;
    }
    if (ok && this.settings.direction === "zh")
      this.words.forEach((w) => {
        w.typed = w.expected;
        w.valid = true;
      });
    this.ok = ok;
    this.judged = true;
    if (!ok) this.phonics = this.item.en;
  }
  submitChinese(answer) {
    if (!answer.trim() || this.judged) return;
    this.finish(accepts(this.item, answer, "zh"), answer);
  }
  skip(typed) {
    this.finish(false, typed || this.answer(), true);
  }
  next() {
    if (!this.judged) return false;
    this.index++;
    this.resetQuestion();
    if (!this.item) this.complete();
    return true;
  }
  complete() {
    this.store.record("session", { session_id: this.id, action: "finish" });
  }
  snapshot() {
    const completed = Math.min(
      this.index + (this.judged ? 1 : 0),
      this.queue.length,
    );
    return {
      item: this.item || null,
      words: this.words.map((w, wi) => {
        let li = 0;
        return {
          ...w,
          cells: [...w.text].map((char) =>
            /[a-z0-9]/i.test(char)
              ? {
                  char: w.typed[li++] || "",
                  editable: true,
                  focused:
                    wi === this.activeWord &&
                    li === Math.min(w.typed.length + 1, w.expected.length) &&
                    !this.judged,
                }
              : { char, editable: false },
          ),
          active: wi === this.activeWord,
        };
      }),
      activeWord: this.activeWord,
      inputValue: this.words[this.activeWord]?.typed || "",
      judged: this.judged,
      ok: this.ok,
      correct: this.correct,
      wrong: this.wrong,
      total: this.queue.length,
      completed,
      percent: this.queue.length
        ? Math.round((completed / this.queue.length) * 100)
        : 0,
      accuracy:
        this.correct + this.wrong
          ? Math.round((this.correct / (this.correct + this.wrong)) * 100)
          : 0,
      phonics: this.phonics,
      last: this.index === this.queue.length - 1,
    };
  }
}
module.exports = { PracticeSession, selectItems };
