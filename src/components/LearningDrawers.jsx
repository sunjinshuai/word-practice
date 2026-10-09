import { reviewKey } from "../domain/practice";
export function LearningDrawers({ items, learning, settings, onRetry }) {
  const mistakes = items.filter((v) => learning.mistakes[v.id]);
  return (
    <div className="learning-drawers">
      <details className="mistakes-drawer">
        <summary>
          错题本 <span id="mistake-count">{mistakes.length}</span>
        </summary>
        <aside>
          <div className="aside-top">
            <h2>错题本</h2>
            <button
              id="clear"
              className="text-btn"
              onClick={() => {
                if (confirm("清空所选范围的错题？复习计划和历史成绩会保留。"))
                  mistakes.forEach((v) =>
                    learning.record("mistake", {
                      item_id: v.id,
                      active: false,
                    }),
                  );
              }}
            >
              清空
            </button>
          </div>
          <p id="empty" hidden={!!mistakes.length}>
            还没有错题
          </p>
          <ul id="mistakes">
            {mistakes.map((v) => (
              <li key={v.id}>
                <strong>{v.en}</strong>
                <span>{v.zh}</span>
                <button
                  className="text-btn"
                  aria-label={"从错题本移除 " + v.en}
                  onClick={() =>
                    learning.record("mistake", { item_id: v.id, active: false })
                  }
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
          <button
            id="retry"
            className="secondary"
            disabled={!mistakes.length}
            onClick={onRetry}
          >
            只练错题 →
          </button>
        </aside>
      </details>
      <details className="word-bank">
        <summary>我的复习时间表</summary>
        <p className="hint">
          5 分钟 → 30 分钟 → 12 小时 → 1 / 2 / 4 / 7 / 15 / 30
          天。答错或跳过回到 5 分钟；提前练对保持原计划。
        </p>
        <div id="review-list">
          {items
            .filter((v) => learning.reviews[reviewKey(v, settings.direction)])
            .sort(
              (a, b) =>
                learning.reviews[reviewKey(a, settings.direction)].due -
                learning.reviews[reviewKey(b, settings.direction)].due,
            )
            .map((v) => (
              <p key={v.id}>
                <strong>{v.en}</strong>
                <span>
                  {new Date(
                    learning.reviews[reviewKey(v, settings.direction)].due,
                  ).toLocaleString("zh-CN")}
                </span>
              </p>
            ))}
        </div>
      </details>
      <details className="word-bank">
        <summary>
          查看所选范围词库 <span id="bank-count">{items.length} 项</span>
        </summary>
        <div id="bank">
          {items.map((v) => (
            <p key={v.id}>
              <strong>{v.en}</strong>
              <span>{v.zh}</span>
            </p>
          ))}
        </div>
      </details>
    </div>
  );
}
