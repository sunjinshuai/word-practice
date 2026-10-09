const { wordParts } = require("../data/content.js");
function tagWord(word, index, words) {
  const lower = word.toLowerCase();
  if (/^[0-9]+$/.test(lower)) return "数词";
  if (lower.includes("'")) return "缩写";
  if (lower === "to") return "to 标记";
  if (
    lower === "like" &&
    ["i", "you", "we", "they"].includes(words[index - 1]?.toLowerCase())
  )
    return "动词";
  if (lower === "chinese") return "形容词";
  return wordParts[lower] || "词性待补充";
}
const posColors = [
  "#b8a0ef",
  "#f1a0dc",
  "#ffc27d",
  "#97c6f0",
  "#c7e984",
  "#89d9cc",
];

function spellingWords(item) {
  return item.en.replace("look/stand", "look").split(/\s+/);
}

module.exports = { tagWord, posColors, spellingWords };
