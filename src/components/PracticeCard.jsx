import { useEffect, useRef, useState } from "react";
import { accepts } from "../domain/practice";
import { tagWord, spellingWords } from "../domain/words";
import { LetterSlots, PosTag } from "./LetterSlots";
import { PhonicsGuide } from "./PhonicsGuide";
export function PracticeCard({
  item,
  session,
  direction,
  finish,
  wrongWord,
  next,
  audio,
}) {
  const [answer, setAnswer] = useState(""),
    [phonics, setPhonics] = useState("");
  const nextRef = useRef();
  const words = spellingWords(item);
  useEffect(() => {
    if (session.judged) nextRef.current?.focus();
  }, [session.judged]);
  return (
    <div id="exercise">
      <div className="question-meta">
        <span id="group">
          {item.unit.toUpperCase()} · {item.group}
        </span>
      </div>
      <h2 id="prompt">{direction === "en" ? item.zh : item.en}</h2>
      <p id="word-kind" className="word-kind">
        {words.length === 1
          ? tagWord(item.en, 0, words)
          : /[.!?]$/.test(item.en)
            ? "句子"
            : "短语"}
      </p>
      <div className="reading-tools">
        <button
          id="read-current"
          type="button"
          className="text-btn"
          onClick={() => audio.read(item.en)}
        >
          ♬ 朗读
        </button>
        <small>Aria 美式英语</small>
      </div>
      <p id="speech-status" role="status">
        {audio.status}
      </p>
      <form
        id="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (answer.trim()) finish(accepts(item, answer, direction), answer);
        }}
      >
        <label id="answer-label" htmlFor="answer">
          {direction === "en" ? "每格填一个字母" : "写出对应的中文"}
        </label>
        <p id="word-warning" hidden />
        {direction === "en" ? (
          <LetterSlots
            item={item}
            done={session.judged}
            ok={session.ok}
            onWrong={wrongWord}
            onComplete={(text) => finish(true, text)}
            onKey={audio.key}
            onError={setPhonics}
            onAnswer={setAnswer}
          />
        ) : (
          <input
            id="answer"
            autoFocus
            autoComplete="off"
            value={answer}
            disabled={session.judged}
            onChange={(e) => {
              audio.key(e.nativeEvent.inputType?.startsWith("delete"));
              setAnswer(e.target.value);
            }}
          />
        )}
        <div className="actions">
          <button
            id="submit"
            className="primary"
            hidden={direction === "en"}
            disabled={session.judged}
          >
            提交答案 ↵
          </button>
          <button
            id="skip"
            type="button"
            className="text-btn"
            disabled={session.judged}
            onClick={() => {
              setPhonics(item.en);
              finish(false, answer, true);
            }}
          >
            不会 / 跳过
          </button>
        </div>
      </form>
      <div
        id="feedback"
        className="feedback bad"
        role="status"
        hidden={!session.judged || session.ok}
      >
        <span id="feedback-icon">!</span>
        <strong>这题先记进错题本</strong>
        <p>正确答案：{direction === "en" ? item.en : item.zh}</p>
      </div>
      <PhonicsGuide
        text={phonics || (session.judged && !session.ok ? item.en : "")}
        onRead={audio.read}
      />
      <section
        id="success-details"
        hidden={direction === "en" || !session.judged || !session.ok}
      >
        <div id="success-words">
          {session.judged &&
            session.ok &&
            words.map((word, i) => (
              <span className="word-info" key={i}>
                <PosTag word={word} index={i} words={words} />
                <strong>{word}</strong>
              </span>
            ))}
        </div>
      </section>
      <button
        id="next"
        ref={nextRef}
        className="primary next"
        hidden={!session.judged}
        onClick={next}
      >
        {session.index === session.queue.length - 1
          ? "查看本轮结果 →"
          : "下一题 →"}
      </button>
    </div>
  );
}
