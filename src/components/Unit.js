// src/components/Unit.js
import React from "react";

export default function Unit({ unit, dragging }) {
  const { shape, label, faction, hp, maxHp, proClass } = unit;
  // 如果有轉職，追加 'promoted' 的 CSS 樣式
  const unitClass = `unit shape-${shape} color-${faction} ${
    dragging ? "dragging" : ""
  } ${proClass ? "promoted" : ""}`;
  const hpPercent = (hp / maxHp) * 100;

  return (
    <div className="unit-container">
      {/* 🎯 關鍵修正：在這裡加上 label 和 data-label 屬性 */}
      <div className={unitClass} label={label} data-label={label}>
        <span className="unit-label">{label}</span>
      </div>
      {hp !== undefined && (
        <div className="unit-status-block">
          <div className="hp-bar-container">
            <div
              className="hp-bar"
              style={{ width: `${Math.max(0, hpPercent)}%` }}
            ></div>
          </div>
          <span className="hp-text-below">
            {Math.max(0, hp)}/{maxHp}
          </span>
        </div>
      )}
    </div>
  );
}
