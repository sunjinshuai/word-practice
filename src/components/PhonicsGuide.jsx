import { useState } from "react";
import {
  analyzePhonics,
  cutsFor,
  splitAt,
  compareSplit,
} from "../domain/phonics";
function PhonicsWord({ word, onRead }) {
  const [cuts, setCuts] = useState([]),
    [hint, setHint] = useState(""),
    [reference, setReference] = useState(false);
  const analysis = analyzePhonics(word),
    data = analysis.data,
    model = analysis.reference;
  const parts = splitAt(word, cuts);
  const [checked, setChecked] = useState(false);
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
        <h4>① 找元音核 · 数发音，不数字母</h4>
        <div className="vowel-line">
          {[...word].map((c, i) => (
            <span key={i} className={/[aeiou]/.test(c) ? "vowel" : ""}>
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="phonics-step">
        <h4>② 一靠后，二分手 · 从后往前检查</h4>
        <p className="hint">
          {analysis.syllables === 1
            ? analysis.rule
            : hint ||
              analysis.rule ||
              "先听读确认音节，再从右往左试切；不根据元音字母数量直接判定。"}
        </p>
        <div className="cut-line">
          {analysis.syllables === 1 ? (
            <span>{word}</span>
          ) : (
            [...word].map((c, i) => (
              <span key={i}>
                {c}
                {i < word.length - 1 && (
                  <button
                    type="button"
                    aria-label={`在 ${word} 第 ${i + 1} 个字母后切分`}
                    aria-pressed={cuts.includes(i + 1)}
                    onClick={() => {
                      setChecked(false);
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
        {analysis.syllables !== 1 && (
          <p className="cut-result">{parts.join(" · ")}</p>
        )}
        {analysis.note && <p className="hint">{analysis.note}</p>}
        {analysis.syllables !== 1 && (
          <div className="phonics-actions">
            {analysis.candidate && (
              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  setCuts(cutsFor(analysis.candidate));
                  setChecked(false);
                  setHint("已按口诀试切，仍需听读校正。");
                }}
              >
                按口诀试切
              </button>
            )}
            <button
              type="button"
              className="text-btn"
              onClick={() => setChecked(true)}
            >
              对照检查
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setCuts([]);
                setChecked(false);
                setHint("");
              }}
            >
              重新切分
            </button>
          </div>
        )}
        {checked && (
          <p className="hint" role="status">
            {compareSplit(analysis, cuts).text}
          </p>
        )}
        {model && analysis.syllables !== 1 && (
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
        <h4>③ 逐块拼读 · 对照词典定读音</h4>
        <p className="phoneme-line">
          {analysis.ipa ||
            (data
              ? "美式音素：" + data.sounds
              : "此词暂无内置词典读音，请结合课本或老师示范。")}
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
        一靠后，二分手；单音的组合通常不拆，辅音连缀要看情况。切分帮助拼读，完整发音以词典和听读为准。
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
