// src/components/FactionSelect.js
import React from "react";
import { FACTION_TALENTS } from "../constants";

export default function FactionSelect({ onSelectFaction }) {
  return (
    <div className="App">
      {/* 🕯️ 這裡改成更有帶入感的史詩文字 */}
      <h1>🕯️ 命運的初始加護 </h1>
      <p
        style={{
          color: "#aaa",
          maxWidth: "600px",
          textAlign: "center",
          lineHeight: "1.6",
        }}
      >
        隨著世界核心崩毀，古老黑闇正步步蠶食這片大地。 你只有 7
        天的時間率軍突圍，迎擊終極的舊日支配者！
        每過一天，環境「黑闇值」便會無情加深，魔物將隨之狂暴暴走。
        請在這裡選擇命運給予你的第一道神聖加護，它將奠定你誓死不朽軍團的核心流派！
      </p>

      <div className="talent-container">
        {Object.values(FACTION_TALENTS).map((talent) => (
          <div
            key={talent.id}
            className="talent-card"
            onClick={() => onSelectFaction(talent)}
          >
            {/* 這裡會自動去 constants.js 抓「鋼鐵要塞」、「疾風之刃」、「嗜血戰歌」 */}
            <h3>{talent.name}</h3>
            <p style={{ color: "#cbd5e1" }}>{talent.desc}</p>
            <button className="select-btn">接受神諭</button>
          </div>
        ))}
      </div>
    </div>
  );
}
