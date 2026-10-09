const { units } = require("../../data/content.js");
Component({
  properties: { visible: Boolean },
  data: {
    units,
    choiceOpen: false,
    choiceOptions: [],
    choiceValue: [0],
    choiceKey: "",
    unitIndex: 0,
    scopeIndex: 0,
    scopes: ["全部"],
    modes: ["间隔复习", "随机默写", "错题练习"],
    modeIndex: 0,
    directions: ["中文 → 英文", "英文 → 中文"],
    directionIndex: 0,
    counts: ["10", "20", "全部"],
    countIndex: 0,
  },
  methods: {
    openChoice(e) {
      const key = e.currentTarget.dataset.key;
      const choices = {unitIndex:this.data.units.map(u=>u.title),scopeIndex:this.data.scopes,modeIndex:this.data.modes,directionIndex:this.data.directions,countIndex:this.data.counts};
      this.setData({choiceOpen:true,choiceKey:key,choiceOptions:choices[key],choiceValue:[this.data[key]]});
    },
    changeChoice(e) { this.setData({choiceValue:e.detail.value}); },
    cancelChoice() { this.setData({choiceOpen:false}); },
    confirmChoice() {
      this.pick({currentTarget:{dataset:{key:this.data.choiceKey}},detail:{value:this.data.choiceValue[0]}});
      this.setData({choiceOpen:false});
    },
    pick(e) {
      const key = e.currentTarget.dataset.key,
        index = Number(e.detail.value);
      const change = { [key]: index };
      if (key === "unitIndex") {
        change.scopeIndex = 0;
        change.scopes = ["全部", ...units[index].groups.map((g) => g[0])];
      }
      this.setData(change);
    },
    start() {
      const d = this.data;
      this.triggerEvent("start", {
        unit: units[d.unitIndex].id,
        scope: d.scopeIndex ? d.scopes[d.scopeIndex] : "all",
        mode: ["spaced", "random", "mistakes"][d.modeIndex],
        direction: d.directionIndex ? "zh" : "en",
        quantity: d.countIndex === 2 ? "all" : d.counts[d.countIndex],
      });
    },
    block() {},
  },
  lifetimes: {
    attached() {
      this.setData({ scopes: ["全部", ...units[0].groups.map((g) => g[0])] });
    },
  },
});
