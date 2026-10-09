const {
  analyzePhonics,
  splitAt,
  cutsFor,
  compareSplit,
} = require("../../domain/phonics");
Component({
  properties: {
    text: {
      type: String,
      observer(text) {
        this.analyses = (text.match(/[a-z]+/gi) || []).map(analyzePhonics);
        this.setData({
          rows: this.analyses.map((a) => ({
            word: a.word,
            vowels: a.word
              .replace(/[^aeiou]/g, "")
              .split("")
              .join(" · "),
            ipa: a.ipa || (a.data && a.data.sounds) || "",
            rule: a.rule,
            note: a.note,
            letters: a.word.split(""),
            cuts: [],
            parts: [a.word],
            feedback: "",
          })),
        });
      },
    },
  },
  data: { rows: [] },
  methods: {
    cut(e) {
      const { row, at } = e.currentTarget.dataset;
      const rows = this.data.rows;
      const r = rows[row];
      const n = Number(at) + 1;
      if (n >= r.word.length) return;
      r.cuts = r.cuts.includes(n)
        ? r.cuts.filter((v) => v !== n)
        : r.cuts.concat(n);
      r.parts = splitAt(r.word, r.cuts);
      r.feedback = "";
      this.setData({ rows });
    },
    reference(e) {
      const i = e.currentTarget.dataset.row,
        a = this.analyses[i],
        rows = this.data.rows;
      if (a.reference) {
        rows[i].cuts = cutsFor(a.reference);
        rows[i].parts = a.reference;
        rows[i].feedback = "参考切分；请结合完整读音。";
      } else rows[i].feedback = "暂无可靠参考，请对照词典读音。";
      this.setData({ rows });
    },
    check(e) {
      const i = e.currentTarget.dataset.row,
        rows = this.data.rows;
      rows[i].feedback = compareSplit(this.analyses[i], rows[i].cuts).text;
      this.setData({ rows });
    },
  },
});
