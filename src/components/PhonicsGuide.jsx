import { useState } from "react";
import { pronunciationData, syllableModels } from "../data/content";
function PhonicsWord({ word, onRead }) {
  const [cuts, setCuts] = useState([]),
    [hint, setHint] = useState(""),
    [reference, setReference] = useState(false);
  const data = pronunciationData[word],
    model = syllableModels[word];
  let start = 0;
  const parts = [...cuts]
    .sort((a, b) => a - b)
    .map((at) => {
      const part = word.slice(start, at);
      start = at;
      return part;
    });
  parts.push(word.slice(start));
  return (
    <article className="phonics-word">
      <h3>
        {word}{" "}
        <button
          type="button"
          className="text-btn"
          aria-label={"朗读 " + word}
          onClick={() => onRead(word)}
        >
          ♬ 朗读
        </button>
      </h3>
      <div className="phonics-step">
        <h4>① 找元音 · a e i o u</h4>
        <div className="vowel-line">
          {[...word].map((c, i) => (
            <span key={i} className={/[aeiou]/.test(c) ? "vowel" : ""}>
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="phonics-step">
        <h4>② 判断音节 · 再从后往前切</h4>
        <p className="hint">
          {data?.syllables === 1
            ? "这个词只有一个读音音节，整体保留；元音组合和词尾静音 e 不单独切开。"
            : hint ||
              "从右往左检查，点击字母间的切分线。元音组合、静音 e 和辅音组合要一起考虑。"}
        </p>
        <div className="cut-line">
          {data?.syllables === 1 ? (
            <span>{word}</span>
          ) : (
            [...word].map((c, i) => (
              <span key={i}>
                {c}
                {i < word.length - 1 && (
                  <button
                    type="button"
                    aria-pressed={cuts.includes(i + 1)}
                    onClick={() => {
                      if (cuts.includes(i + 1))
                        setCuts(cuts.filter((at) => at !== i + 1));
                      else if (cuts.length && i + 1 >= Math.min(...cuts))
                        setHint("先从右边开始，再向左切；可先取消已有切分。");
                      else setCuts([...cuts, i + 1]);
                    }}
                  >
                    │
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        {data?.syllables !== 1 && (
          <p className="cut-result">{parts.join(" · ")}</p>
        )}
        {model && (
          <>
            <button
              type="button"
              className="text-btn"
              onClick={() => setReference(true)}
            >
              看参考切分
            </button>
            {reference && <p className="cut-result">{model.join(" · ")}</p>}
          </>
        )}
      </div>
      <div className="phonics-step">
        <h4>③ 定读音 · 对照读音再拼</h4>
        <p className="phoneme-line">
          {data
            ? "美式音素：" + data.sounds
            : "此词暂无内置词典读音，请结合课本或老师示范。"}
        </p>
        {data && (
          <p className="hint">
            读音共 {data.syllables} 个音节
            {data.stress ? "，重读第 " + data.stress + " 个音节。" : "。"}
          </p>
        )}
      </div>
    </article>
  );
}
export function PhonicsGuide({ text, onRead }) {
  return (
    <section id="phonics-guide" hidden={!text} aria-label="错词三步拼读">
      <h3>用三步，把这个词记牢</h3>
      <p className="hint">
        先找元音，再从后往前切，最后听读确认。元音字母的个数不一定等于读音音节数。
      </p>
      <div id="phonics-content">
        {(text?.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []).map(
          (word, i) => (
            <PhonicsWord key={word + i} word={word} onRead={onRead} />
          ),
        )}
      </div>
    </section>
  );
}
