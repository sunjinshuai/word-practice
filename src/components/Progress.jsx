export function Progress({ completed, total }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="session-progress">
      <div className="progress-caption">
        <span>本轮进度</span>
        <span id="progress-text">
          已完成 {completed} / {total} 题 · {percent}%
        </span>
      </div>
      <progress
        id="progress"
        aria-label="本轮进度"
        aria-valuetext={`${completed} / ${total} 题，${percent}%`}
        value={completed}
        max={total || 1}
      />
    </div>
  );
}
export function Stats({ total, correct, wrong }) {
  return (
    <>
      <div className="stats" aria-label="本轮统计">
        {[
          ["total", "总题数", total],
          ["correct", "正确", correct],
          ["wrong", "错误 / 跳过", wrong],
          [
            "accuracy",
            "正确率",
            (correct + wrong
              ? Math.round((correct / (correct + wrong)) * 100)
              : 0) + "%",
          ],
        ].map(([id, label, value]) => (
          <div key={id}>
            <span>{label}</span>
            <strong id={id}>{value}</strong>
          </div>
        ))}
      </div>
      <p className="hint">正确率按已作答题目计算；不会 / 跳过计为错误。</p>
    </>
  );
}
