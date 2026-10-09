import { Modal } from "./Modal";
export function HistoryDialog({ open, onClose, events, status }) {
  const answers = events.filter(
      (e) => e.kind === "answer" && !e.payload.imported,
    ),
    correct = answers.filter((e) => e.payload.correct).length,
    days = new Set(
      answers.map((e) => new Date(e.occurred_at).toLocaleDateString()),
    ).size,
    seconds = answers.reduce((n, e) => n + (e.payload.seconds || 0), 0),
    sessions = new Map();
  for (const e of [...events].sort((a, b) =>
    a.occurred_at.localeCompare(b.occurred_at),
  )) {
    const p = e.payload;
    if (p.imported || !p.session_id) continue;
    const session = sessions.get(p.session_id) || {
      start: e.occurred_at,
      answers: [],
    };
    if (e.kind === "session" && p.action === "start")
      Object.assign(session, {
        start: e.occurred_at,
        unit: p.unit,
        total: p.total,
        scope: p.scope,
      });
    if (e.kind === "session" && p.action === "finish") session.complete = true;
    if (e.kind === "answer") session.answers.push(e);
    sessions.set(p.session_id, session);
  }
  return (
    <Modal id="account-dialog" open={open} onClose={onClose} label="默写记录">
      <div className="account-heading">
        <h2>默写记录</h2>
        <button id="close-account" className="text-btn" onClick={onClose}>
          关闭
        </button>
      </div>
      <p className="hint">自动记录每轮默写，无需登录</p>
      <p id="cloud-status" role="status" className="hint">
        {status}
      </p>
      <div className="history-stats">
        {[
          ["history-total", answers.length, "累计题量"],
          [
            "history-accuracy",
            (answers.length
              ? Math.round((correct / answers.length) * 100)
              : 0) + "%",
            "正确率",
          ],
          ["history-days", days, "学习天数"],
          ["history-time", Math.round(seconds / 60) + " 分钟", "答题用时"],
        ].map(([id, value, label]) => (
          <div key={id}>
            <strong id={id}>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p id="history-sessions" className="hint">
        {sessions.size} 轮练习 · 正确 {correct} · 错误{" "}
        {answers.length - correct}
      </p>
      <div id="history-units">
        {["u1", "u2", "u3"].map((unit) => {
          const rows = answers.filter((e) => e.payload.unit === unit);
          return (
            <p key={unit}>
              {unit.toUpperCase()}：{rows.length} 题 · 正确率{" "}
              {rows.length
                ? Math.round(
                    (rows.filter((e) => e.payload.correct).length /
                      rows.length) *
                      100,
                  )
                : 0}
              %
            </p>
          );
        })}
      </div>
      <p className="hint">
        拼错后订正仍计为错题；旧版本只导入错题和复习计划，不推算历史成绩。
      </p>
      <h3>每次默写</h3>
      <p id="history-empty" hidden={!!sessions.size} className="hint">
        还没有默写记录，开始一轮练习后自动保存。
      </p>
      <div id="session-history">
        {[...sessions.entries()].reverse().map(([id, s]) => {
          const count = s.answers.length,
            ok = s.answers.filter((e) => e.payload.correct).length,
            time = s.answers.reduce((n, e) => n + (e.payload.seconds || 0), 0);
          return (
            <details key={id}>
              <summary>
                {new Date(s.start).toLocaleString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {s.unit === "all" ? "全部单元" : s.unit?.toUpperCase()} ·{" "}
                {s.complete ? "已完成" : "未完成"}
              </summary>
              <p className="hint">
                已判分 {count} / {s.total || count} 题 · 正确 {ok} · 错误/跳过{" "}
                {count - ok} · 正确率{" "}
                {count ? Math.round((ok / count) * 100) : 0}% · 用时{" "}
                {Math.floor(time / 60)} 分 {time % 60} 秒
              </p>
              {s.answers.map((e) => (
                <div key={e.id} className="history-answer">
                  <strong>
                    {e.payload.correct ? "✓" : "✕"} {e.payload.en} ·{" "}
                    {e.payload.zh}
                  </strong>
                  <p>
                    {e.payload.skipped
                      ? "不会 / 跳过"
                      : "首次填写：" +
                        (e.payload.typed || "（未填写）") +
                        (e.payload.correct
                          ? ""
                          : "；正确答案：" +
                            (e.payload.direction === "zh"
                              ? e.payload.zh
                              : e.payload.en))}
                  </p>
                </div>
              ))}
            </details>
          );
        })}
      </div>
    </Modal>
  );
}
