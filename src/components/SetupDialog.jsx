import { useState } from "react";
import { units } from "../data/content";
import { Modal } from "./Modal";
function Choices({ name, title, choices, value, onChange }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="setup-segments">
        {choices.map(([id, text]) => (
          <label key={id}>
            <input
              type="radio"
              name={"setup-" + name}
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function SetupDialog({ open, settings, onClose, onStart, ready }) {
  const [draft, setDraft] = useState(settings);
  const set = (key, value) =>
    setDraft((s) => ({
      ...s,
      [key]: value,
      ...(key === "unit" ? { scope: "all" } : {}),
    }));
  const scopes = [
    ...new Set(
      units
        .filter((u) => draft.unit === "all" || u.id === draft.unit)
        .flatMap((u) => u.groups.map((g) => g[0])),
    ),
  ];
  return (
    <Modal id="setup-dialog" open={open} onClose={onClose} label="开始一轮练习">
      <h2>开始一轮练习</h2>
      <p className="hint">选好内容，开始默写。</p>
      <div id="setup-options">
        <Choices
          name="unit"
          title="学习单元"
          choices={units
            .map((u) => [u.id, u.id.toUpperCase() + " " + u.zh])
            .concat([["all", "全部"]])}
          value={draft.unit}
          onChange={(v) => set("unit", v)}
        />
        <Choices
          name="scope"
          title="学习范围"
          choices={[
            ["all", "全部内容"],
            ...scopes.map((s) => [
              s,
              s === "主题词"
                ? "Topic words · 主题词"
                : s === "时态"
                  ? "Tense · 时态"
                  : s === "语法"
                    ? "Grammar · 语法"
                    : s,
            ]),
          ]}
          value={draft.scope}
          onChange={(v) => set("scope", v)}
        />
        <Choices
          name="learning-mode"
          title="练习方式"
          choices={[
            ["spaced", "间隔复习"],
            ["all", "随机默写"],
          ]}
          value={draft.mode}
          onChange={(v) => set("mode", v)}
        />
        <Choices
          name="direction"
          title="默写方向"
          choices={[
            ["en", "中文 → 英文"],
            ["zh", "英文 → 中文"],
          ]}
          value={draft.direction}
          onChange={(v) => set("direction", v)}
        />
        <Choices
          name="quantity"
          title="本轮题量"
          choices={[
            ["10", "10 题"],
            ["20", "20 题"],
            ["all", "全部"],
          ]}
          value={draft.quantity}
          onChange={(v) => set("quantity", v)}
        />
      </div>
      <div className="setup-actions">
        <button id="setup-cancel" className="text-btn" onClick={onClose}>
          取消
        </button>
        <button
          id="setup-start"
          className="primary"
          disabled={!ready}
          onClick={() => onStart(draft)}
        >
          {ready ? "开始学习 →" : "正在加载记录…"}
        </button>
      </div>
    </Modal>
  );
}
