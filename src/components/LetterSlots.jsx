import { useEffect, useRef, useState } from "react";
import { tagWord, posColors, spellingWords } from "../domain/words";
export function PosTag({ word, index, words }) {
  const [color] = useState(
    () => posColors[Math.floor(Math.random() * posColors.length)],
  );
  return (
    <small
      className="completed-pos"
      style={{ backgroundColor: color, color: "#222632", borderRadius: 999 }}
    >
      {tagWord(word.replace(/[^a-z0-9']/gi, ""), index, words)}
    </small>
  );
}
export function LetterSlots({
  item,
  done,
  ok,
  onWrong,
  onComplete,
  onKey,
  onError,
  onAnswer,
}) {
  const words = spellingWords(item),
    expected = words.map((w) => w.replace(/[^a-z0-9]/gi, ""));
  const [values, setValues] = useState(() =>
      expected.map((w) => Array(w.length).fill("")),
    ),
    [valid, setValid] = useState([]),
    [invalid, setInvalid] = useState(-1);
  const refs = useRef([]);
  const lastErrors = useRef({});
  useEffect(() => {
    refs.current[0]?.[0]?.focus();
  }, []);
  function focus(word, letter) {
    const node = refs.current[word]?.[letter];
    node?.focus();
    if (node) node.setSelectionRange(node.value.length, node.value.length);
  }
  const answer = (rows) =>
    words
      .map((word, wi) => {
        let at = 0;
        return [...word]
          .map((c) => (/[a-z0-9]/i.test(c) ? rows[wi][at++] : c))
          .join("");
      })
      .join(" ");
  function validate(rows, wi) {
    if (!rows[wi].every(Boolean)) return "partial";
    const typed = rows[wi].join("");
    if (typed.toLowerCase() !== expected[wi].toLowerCase()) {
      setInvalid(wi);
      if (lastErrors.current[wi] !== typed) {
        lastErrors.current[wi] = typed;
        onWrong(answer(rows));
      }
      onError(words[wi]);
      if (!matchMedia("(prefers-reduced-motion:reduce)").matches)
        refs.current[wi]?.[0]?.parentElement.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-7px)" },
            { transform: "translateX(7px)" },
            { transform: "translateX(0)" },
          ],
          { duration: 300 },
        );
      focus(wi, rows[wi].length - 1);
      return "wrong";
    }
    setInvalid(-1);
    onError("");
    setValid((v) => [...new Set([...v, wi])]);
    if (wi === words.length - 1) onComplete(answer(rows));
    else setTimeout(() => focus(wi + 1, 0), 0);
    return "valid";
  }
  function change(wi, li, text, deleting) {
    if (done) return;
    const rows = values.map((v) => [...v]);
    rows[wi][li] = text.replace(/[^a-z0-9]/gi, "").slice(-1);
    setValues(rows);
    onAnswer(answer(rows));
    onKey(deleting);
    const result = validate(rows, wi);
    if (result === "partial" && rows[wi][li]) focus(wi, li + 1);
  }
  function paste(event, wi, li) {
    const letters = event.clipboardData
      .getData("text")
      .replace(/[^a-z0-9]/gi, "");
    if (!letters) return;
    event.preventDefault();
    const rows = values.map((v) => [...v]);
    let w = wi,
      l = li;
    for (const char of letters) {
      rows[w][l++] = char;
      if (l === rows[w].length) {
        const result = validate(rows, w);
        if (result === "wrong" || w === rows.length - 1) break;
        w++;
        l = 0;
      }
    }
    setValues(rows);
    onAnswer(answer(rows));
    onKey(false);
    if (rows[w].some((c) => !c))
      focus(
        w,
        rows[w].findIndex((c) => !c),
      );
  }
  return (
    <div
      id="word-slots"
      className={"word-slots" + (done && ok ? " answer-right" : "")}
      role="group"
      aria-labelledby="answer-label"
    >
      {words.map((word, wi) => {
        let li = 0;
        return (
          <div
            key={wi}
            data-expected={word}
            data-valid={valid.includes(wi) || undefined}
            className={"letter-word" + (invalid === wi ? " word-invalid" : "")}
          >
            {done && ok && <PosTag word={word} index={wi} words={words} />}{" "}
            {[...word].map((char, ci) => {
              if (!/[a-z0-9]/i.test(char))
                return (
                  <span className="letter-mark" key={ci}>
                    {char}
                  </span>
                );
              const at = li++;
              return (
                <input
                  key={ci}
                  ref={(node) => {
                    refs.current[wi] ||= [];
                    refs.current[wi][at] = node;
                  }}
                  value={values[wi][at]}
                  disabled={
                    done ||
                    valid.includes(wi) ||
                    (wi > 0 && !valid.includes(wi - 1))
                  }
                  maxLength={1}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label={`第 ${wi + 1} 个单词的第 ${at + 1} 个字母`}
                  onChange={(e) =>
                    change(
                      wi,
                      at,
                      e.target.value,
                      e.nativeEvent.inputType?.startsWith("delete"),
                    )
                  }
                  onPaste={(e) => paste(e, wi, at)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !values[wi][at] && at > 0) {
                      e.preventDefault();
                      change(wi, at - 1, "", true);
                      focus(wi, at - 1);
                    } else if (e.key === "ArrowLeft" && at > 0) {
                      e.preventDefault();
                      focus(wi, at - 1);
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      focus(wi, at + 1);
                    }
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
