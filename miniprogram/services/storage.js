const KEY = "word-practice-native-v1";
function empty() {
  return { version: 1, events: [], reviews: {}, mistakes: {} };
}
class LearningStore {
  constructor(api) {
    this.api = api;
    this.warning = "";
    try {
      this.state = api.getStorageSync(KEY) || empty();
      if (
        this.state.version !== 1 ||
        !Array.isArray(this.state.events) ||
        !this.state.reviews ||
        !this.state.mistakes
      )
        throw new Error("Invalid storage");
    } catch {
      this.state = empty();
      this.warning = "无法读取本机记录，本次记录暂存内存。";
    }
  }
  save() {
    try {
      this.api.setStorageSync(KEY, this.state);
      this.warning = "记录已保存在当前微信设备。";
    } catch {
      this.warning = "保存失败，本次记录仅在内存中保留，请勿退出。";
    }
  }
  record(kind, payload) {
    const event = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2),
      occurred_at: new Date().toISOString(),
      kind,
      payload,
    };
    this.state.events.push(event);
    if (kind === "answer") {
      this.state.reviews[payload.direction + ":" + payload.item_id] =
        payload.review;
      if (!payload.correct) this.state.mistakes[payload.item_id] = true;
    } else if (kind === "mistake") {
      if (payload.active) this.state.mistakes[payload.item_id] = true;
      else delete this.state.mistakes[payload.item_id];
    }
    this.save();
    return event;
  }
}
module.exports = { LearningStore, KEY };
