Component({
  properties: {
    trigger: {
      type: Number,
      observer(value) {
        if (!value) return;
        clearTimeout(this.timer);
        this.setData({
          particles: Array.from({ length: 36 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            color: ["#a8dbb7", "#f5c578", "#cbafea"][i % 3],
            delay: Math.random() * 0.4,
          })),
        });
        this.timer = setTimeout(() => this.setData({ particles: [] }), 2300);
      },
    },
  },
  data: { particles: [] },
  lifetimes: {
    detached() {
      clearTimeout(this.timer);
    },
  },
});
