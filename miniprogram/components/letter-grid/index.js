Component({
  properties: { words: Array, value: String, judged: Boolean, ok: Boolean },
  data: { focused: true },
  methods: {
    input(e) {
      this.triggerEvent("typing", { value: e.detail.value });
    },
    focus() {
      this.setData({ focused: false }, () => this.setData({ focused: true }));
    },
  },
});
