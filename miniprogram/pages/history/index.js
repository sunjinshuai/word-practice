const { LearningStore } = require("../../services/storage");
Page({
  data: { rounds: [] },
  onShow() {
    const store = getApp().globalData.learningStore || new LearningStore(wx),
      rounds = [];
    for (const stored of store.state.events) {
      const event = {
        id: stored.id,
        at: stored.occurred_at,
        kind: stored.kind,
        ...stored.payload,
      };
      if (event.kind === "session" && event.action === "start") {
        rounds.unshift({
          ...event,
          date: new Date(event.at).toLocaleString(),
          answers: [],
          correct: 0,
          wrong: 0,
          seconds: 0,
          open: false,
          finished: false,
        });
      } else {
        const r = rounds.find((r) => r.session_id === event.session_id);
        if (!r) continue;
        if (event.kind === "answer") {
          r.answers.push(event);
          r.correct += event.correct ? 1 : 0;
          r.wrong += event.correct ? 0 : 1;
          r.seconds += event.seconds || 0;
        }
        if (event.kind === "session" && event.action === "finish")
          r.finished = true;
      }
    }
    this.setData({
      rounds: rounds.map((r) => ({
        ...r,
        accuracy: r.answers.length
          ? Math.round((r.correct / r.answers.length) * 100)
          : 0,
      })),
    });
  },
  toggle(e) {
    const i = e.currentTarget.dataset.index;
    this.setData({ ["rounds[" + i + "].open"]: !this.data.rounds[i].open });
  },
});
