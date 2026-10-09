import { pronunciationData, syllableModels } from "../data/content.js";

// Teaching splits are spelling aids; they are not an IPA segmentation algorithm.
const examples = {
  letter: { parts: ["let", "ter"], syllables: 2 },
  student: { parts: ["stu", "dent"], syllables: 2 },
  lettuce: {
    parts: ["let", "tuce"],
    syllables: 2,
    ipa: "/ˈlet.ɪs/（英音）",
    note: "lettuce 的第二块 tuce 实际读 /ɪs/，不能按普通 u 的读音硬拼。",
  },
};
const digraphs = new Set(["sh", "ch", "th", "ck", "ph", "wh"]);
const blends = new Set([
  "br",
  "bl",
  "cr",
  "cl",
  "dr",
  "fr",
  "fl",
  "gr",
  "gl",
  "pr",
  "pl",
  "tr",
  "st",
  "sp",
  "sk",
]);
export function splitAt(word, cuts) {
  let start = 0;
  const parts = [...new Set(cuts)]
    .filter((at) => Number.isInteger(at) && at > 0 && at < word.length)
    .sort((a, b) => a - b)
    .map((at) => {
      const part = word.slice(start, at);
      start = at;
      return part;
    });
  return [...parts, word.slice(start)];
}
export function cutsFor(parts) {
  let offset = 0;
  return parts.slice(0, -1).map((part) => (offset += part.length));
}
export function analyzePhonics(input) {
  const word = input.toLowerCase(),
    example = examples[word],
    data = pronunciationData[word];
  const syllables = example?.syllables ?? data?.syllables;
  const rawModel = example?.parts ?? syllableModels[word];
  const reference =
    syllables === 1
      ? [word]
      : rawModel?.join("") === word && rawModel.length === syllables
        ? rawModel
        : null;
  const result = {
    word,
    data,
    syllables,
    reference,
    candidate: null,
    rule: "",
    note: example?.note || "",
    ipa: example?.ipa,
  };
  if (syllables === 1)
    return {
      ...result,
      rule: "词典读音只有一个音节，整个词保留。词尾静音 e 不单独算音节。",
    };
  // Only offer a simple two-nucleus trial when it agrees with the dictionary's syllable count.
  // Adjacent vowels, y and consonant-le require additional patterns and are deferred.
  const nuclei = [...word.matchAll(/[aeiouy]+/g)].filter(
    (m) => !(m[0] === "y" && m.index === 0),
  );
  if (
    nuclei.at(-1)?.[0] === "e" &&
    nuclei.at(-1).index === word.length - 1 &&
    !word.endsWith("le")
  )
    nuclei.pop();
  if (
    syllables !== 2 ||
    nuclei.length !== 2 ||
    nuclei.some((m) => m[0].length !== 1 || m[0] === "y")
  )
    return result;
  const left = nuclei[0].index + 1,
    right = nuclei[1].index,
    between = word.slice(left, right);
  if (between.length === 1)
    return {
      ...result,
      candidate: splitAt(word, [left]),
      rule: "一靠后：先试在中间辅音前切；若读音不对，再试归前。",
    };
  if (between.length === 2 && digraphs.has(between))
    return {
      ...result,
      candidate: splitAt(word, [left]),
      rule: "这两个字母通常表示一个辅音，不从组合内部切开，再听读确认。",
    };
  if (between.length === 2 && blends.has(between))
    return {
      ...result,
      rule: "这里含辅音连缀，各字母仍发音；是否保持完整须结合词义结构和读音，不能只凭字母决定。",
    };
  if (between.length === 2)
    return {
      ...result,
      candidate: splitAt(word, [left + 1]),
      rule: "二分手：两个中间辅音先各分一个；最后对照完整读音确认。",
    };
  return result;
}
export function compareSplit(analysis, cuts) {
  if (!analysis.reference)
    return {
      matches: null,
      text: "此词暂无可核对的参考切分，试切不自动判定正误，请听完整读音确认。",
    };
  const matches =
    splitAt(analysis.word, cuts).join("|") === analysis.reference.join("|");
  return {
    matches,
    text: matches
      ? "与当前参考切分一致，请再听完整读音。"
      : "与当前参考切分不同，请看参考并听读校正；切分方法可能不唯一。",
  };
}
