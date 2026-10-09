const test = require("node:test"),
  assert = require("node:assert/strict");
const { PracticeSession } = require("../domain/session");
const { LearningStore } = require("../services/storage");
const { AudioService } = require("../services/audio");
function store() {
  let saved;
  return new LearningStore({
    getStorageSync: () => saved,
    setStorageSync: (k, v) => {
      saved = v;
    },
  });
}
function session(en = "use all my strength", direction = "en") {
  const s = new PracticeSession(store(), {
    unit: "u1",
    scope: "all",
    mode: "random",
    direction,
    quantity: "10",
  });
  s.queue = [{ id: "fixture", en, zh: "使用全部力量", unit: "u1" }];
  s.resetQuestion();
  return s;
}
test("wrong word blocks progress; correction preserves first-attempt statistics", () => {
  const s = session();
  assert.equal(s.input("xxx").error, true);
  assert.equal(s.activeWord, 0);
  assert.equal(s.next(), false);
  assert.equal(s.input("use").valid, true);
  assert.equal(s.activeWord, 1);
  assert.equal(s.input("allmystrength").success, true);
  assert.equal(s.judged, true);
  assert.equal(s.index, 0);
  assert.equal(s.wrong, 1);
  assert.equal(s.correct, 0);
  assert.equal(
    s.store.state.events.filter((e) => e.kind === "answer").length,
    1,
  );
  assert.equal(s.next(), true);
  assert.equal(s.item, undefined);
});
test("paste and case insensitive success await manual next", () => {
  const s = session();
  assert.equal(s.input("USE all MY strength").success, true);
  assert.equal(s.correct, 1);
  assert.equal(s.snapshot().percent, 100);
  assert.equal(s.index, 0);
  assert.equal(
    s.snapshot().words.every((w) => w.valid),
    true,
  );
});
test("delete clears red state and cursor value retains last typed character", () => {
  const s = session("all");
  s.input("xxx");
  s.input("xx");
  assert.equal(s.snapshot().inputValue, "xx");
  assert.equal(s.words[0].invalid, false);
  s.input("all");
  assert.equal(s.ok, true);
});
test("Chinese success reveals English words and skip counts once", () => {
  const s = session("all", "zh");
  s.submitChinese(" 使用全部力量 ");
  assert.equal(s.correct, 1);
  assert.equal(s.words[0].typed, "all");
  s.skip();
  assert.equal(s.correct, 1);
  const skipped = session();
  skipped.skip();
  assert.equal(skipped.wrong, 1);
  assert.equal(
    skipped.store.state.events.filter((e) => e.kind === "answer")[0].payload
      .skipped,
    true,
  );
});
test("storage failures preserve in-memory events", () => {
  const s = new LearningStore({
    getStorageSync() {
      throw Error();
    },
    setStorageSync() {
      throw Error();
    },
  });
  s.record("session", { action: "start" });
  assert.equal(s.state.events.length, 1);
  assert.match(s.warning, /保存失败/);
});
test("reading always stops prior voice and effect; mute suppresses playback", () => {
  const contexts = [];
  const a = new AudioService(
    {
      createInnerAudioContext() {
        const c = {
          plays: 0,
          stops: 0,
          onError() {},
          play() {
            this.plays++;
          },
          stop() {
            this.stops++;
          },
          destroy() {},
        };
        contexts.push(c);
        return c;
      },
    },
    () => {},
  );
  a.read("art");
  a.read("art");
  assert.equal(contexts[0].plays, 2);
  assert.equal(contexts[0].stops, 2);
  a.toggle();
  a.read("art");
  assert.equal(contexts[0].plays, 2);
  a.destroy();
});
test("phonics references do not split a one-syllable word", () => {
  const { analyzePhonics } = require("../domain/phonics");
  assert.deepEqual(analyzePhonics("more").reference, ["more"]);
  assert.deepEqual(analyzePhonics("lettuce").reference, ["let", "tuce"]);
});
test("history page groups nested persisted events correctly", () => {
  const fs = require("node:fs"),
    vm = require("node:vm");
  let page;
  const s = session("all");
  s.input("all");
  s.next();
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../pages/history/index.js"), "utf8"),
    {
      require: require("node:module").createRequire(
        require.resolve("../pages/history/index.js"),
      ),
      Page: (p) => (page = p),
      getApp: () => ({ globalData: { learningStore: s.store } }),
      wx: {},
      Date,
    },
  );
  page.setData = (data) => Object.assign(page.data, data);
  page.onShow();
  assert.equal(page.data.rounds[0].correct, 1);
  assert.equal(page.data.rounds[0].answers.length, 1);
  assert.equal(page.data.rounds[0].finished, true);
});
