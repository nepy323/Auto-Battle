// src/components/MapView.js
import React from "react";

export default function MapView({
  daysLeft,
  darkness,
  maxDeployLimit,
  currentWave,
  onMapEvent,
  score,
  hasPromotedThisGame,
}) {
  const promotionCost = 100; // 設定轉職需要 100 分

  return (
    <div className="App">
      {/* 升級版頂部 HUD，加入戰鬥積分顯示 */}
      <div className="hardcore-hud">
        <div>
          ⏳ 追殺者抵達：
          <span className="hud-value highlight">{daysLeft} 天</span>
        </div>
        <div>
          🔮 世界黑暗值：<span className="hud-value danger">{darkness}%</span>
        </div>
        <div>
          👥 上陣人數：<span className="hud-value">{maxDeployLimit} 人</span>
        </div>
        <div>
          🎯 戰鬥積分：
          <span className="hud-value" style={{ color: "#4ade80" }}>
            {score} / {promotionCost} 分
          </span>
        </div>
      </div>

      <h1>🗺️ 區域選擇 (第 {currentWave} 波)</h1>
      <p style={{ color: "#999" }}>
        所有區域皆充斥敵軍，請依據部隊狀態選擇突圍路徑：
      </p>

      <div className="map-routes">
        {/* 選項一：一般戰區 */}
        <div
          className="route-node enemy"
          onClick={() => onMapEvent("battle_normal")}
        >
          <h3>🪨 碎石區 (難度: 普通)</h3>
          <p>穩健突圍。戰勝獲得基礎戰鬥積分，小幅削減世界黑暗值。</p>
        </div>

        {/* 選項二：高危戰區 */}
        <div
          className="route-node enemy"
          style={{ borderColor: "#ef4444" }}
          onClick={() => onMapEvent("battle_elite")}
        >
          <h3>🌲 黑暗森林 (難度: 困難)</h3>
          <p>高風險。敵軍數值全面提升，但戰勝可奪取雙倍戰鬥積分！</p>
        </div>

        {/* 選項三：未知戰區 */}
        <div
          className="route-node purify"
          style={{ borderColor: "#a855f7" }}
          onClick={() => onMapEvent("battle_unknown")}
        >
          <h3>❓ 神祕洞穴 (難度: 隨機)</h3>
          <p>
            不可預測。可能遭遇普通敵人，亦有機率【亂入】極度危險的古老強敵！
          </p>
        </div>

        {/* 轉職不再是地圖方格，而是當積分足夠時，在下方解鎖的特殊聖壇按鈕 */}
        <button
          className="click-confirm"
          disabled={score < promotionCost || hasPromotedThisGame}
          onClick={() => onMapEvent("altar_trigger")}
          style={{
            marginTop: "15px",
            background:
              score >= promotionCost && !hasPromotedThisGame
                ? "#f59e0b"
                : "#333",
            color:
              score >= promotionCost && !hasPromotedThisGame ? "black" : "#777",
            cursor:
              score >= promotionCost && !hasPromotedThisGame
                ? "pointer"
                : "not-allowed",
            border: "none",
            fontSize: "15px",
            display: "block",
            width: "100%",
            padding: "12px",
          }}
        >
          {hasPromotedThisGame
            ? "🏰 遠古聖壇（本局轉職次數已用盡）"
            : score >= promotionCost
            ? "⚡【聖壇共鳴】消耗 100 積分，立刻指定一名英雄轉職！"
            : `🏰 遠古聖壇（需要累積 ${promotionCost} 戰鬥積分，尚缺 ${
                promotionCost - score
              } 分）`}
        </button>
      </div>
    </div>
  );
}
