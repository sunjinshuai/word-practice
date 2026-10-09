const { PracticeSession, selectItems } = require("../../domain/session");
const { LearningStore } = require("../../services/storage");
const { AudioService } = require("../../services/audio");
Page({
  data: {
    setup: true,
    state: {
      item: null,
      words: [],
      correct: 0,
      wrong: 0,
      total: 0,
      percent: 0,
      accuracy: 0,
    },
    settings: {},
    sound: true,
    chinese: "",
    notice: "",
    particles: 0,
    extra: false,
    bank: [],
    mistakes: [],
    reviews: [],
  },
  onLoad() {
    this.store =
      getApp().globalData.learningStore ||
      (getApp().globalData.learningStore = new LearningStore(wx));
    this.audio = new AudioService(wx, (notice) => this.setData({ notice }));
    this.refreshLists();
  },
  onHide() {
    this.audio.stop();
  },
  onUnload() {
    this.audio.destroy();
  },
  refreshLists() {
    const { vocabulary } = require("../../data/content.js");
    this.setData({
      reviews: vocabulary.flatMap((v) =>
        ["en", "zh"]
          .filter(
            (direction) => this.store.state.reviews[direction + ":" + v.id],
          )
          .map((direction) => ({
            id: direction + ":" + v.id,
            en: v.en,
            due: new Date(
              this.store.state.reviews[direction + ":" + v.id].due,
            ).toLocaleString(),
          })),
      ),
      mistakes: vocabulary.filter((v) => this.store.state.mistakes[v.id]),
      bank: this.data.settings.unit
        ? selectItems(this.data.settings)
        : vocabulary,
    });
  },
  sync() {
    this.setData({
      state: this.session.snapshot(),
      notice: this.store.warning || "",
    });
    this.refreshLists();
  },
  start(e) {
    this.audio.stop();
    this.session = new PracticeSession(this.store, e.detail);
    this.setData({ settings: e.detail, setup: false, chinese: "", notice: "" });
    this.sync();
    if (this.session.item) this.audio.read(this.session.item.en);
  },
  typing(e) {
    const old = this.data.state.inputValue || "",
      value = e.detail.value;
    this.audio.key(value.length < old.length);
    const result = this.session.input(value);
    this.sync();
    if (result.error) this.audio.error();
    if (result.success) {
      this.setData({ particles: this.data.particles + 1 });
      this.audio.read(this.session.item.en);
    }
  },
  chineseInput(e) {
    this.setData({ chinese: e.detail.value });
  },
  submit() {
    if (!this.data.chinese.trim()) return;
    this.session.submitChinese(this.data.chinese);
    this.sync();
    if (this.session.ok) {
      this.setData({ particles: this.data.particles + 1 });
      this.audio.read(this.session.item.en);
    } else this.audio.error();
  },
  skip() {
    this.session.skip(this.data.chinese);
    this.sync();
    this.audio.error();
  },
  next() {
    if (!this.session.next()) return;
    this.audio.stop();
    this.setData({ chinese: "" });
    this.sync();
    if (this.session.item) this.audio.read(this.session.item.en);
  },
  read() {
    if (this.session && this.session.item)
      this.audio.read(this.session.item.en);
  },
  toggleSound() {
    this.setData({ sound: this.audio.toggle() });
  },
  openSetup() {
    this.audio.stop();
    this.setData({ setup: true });
  },
  history() {
    wx.navigateTo({ url: "/pages/history/index" });
  },
  removeMistake(e) {
    this.store.record("mistake", {
      item_id: e.currentTarget.dataset.id,
      active: false,
    });
    this.refreshLists();
  },
  toggleExtra() {
    this.setData({ extra: !this.data.extra });
  },
});
