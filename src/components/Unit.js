import React from "react";
import { UNIT_BLUEPRINTS, ENEMY_BLUEPRINTS } from "../constants"; // 確保路徑正確

// 🎯 中英名稱映射表（綁定實體 .png 檔名）
const labelToImageKeyMap = {
  坦克: "CIRCLE",
  戰士: "SQUARE",
  弓箭手: "TRI_UP",
  法師: "TRI_DOWN",
  刺客: "DIAMOND",
  牧師: "CROSS",
  "坦克+": "CIRCLE_PLUS",
  "戰士+": "SQUARE_PLUS",
  "弓箭手+": "TRI_UP_PLUS",
  "法師+": "TRI_DOWN_PLUS",
  "刺客+": "DIAMOND_PLUS",
  "牧師+": "CROSS_PLUS",
  狂戰士: "BERSERKER",
  大劍師: "BLADEMASTER",
  守護者: "GUARDIAN",
  黑暗十字軍: "CRUSADER",
  魔弓手: "MAGIC_ARCHER",
  遊俠: "RANGER",
  術士: "WARLOCK",
  元素使: "ELEMENTALIST",
  陷阱大師: "TRAPMASTER",
  送葬者: "UNDERTAKER",
  大賢者: "SAGE",
  血法師: "BLOOD_MAGE",
  龍騎士: "DRAGON_KNIGHT",
  忍者: "NINJA",
  浪人: "RONIN",
  聖堂武士: "TEMPLAR",
  機兵: "MECHANIZED",
  哥布林: "GOBLIN",
  哈比鷹身人: "HARPY",
  兇暴狼獸: "DIRE_WOLF",
  獸人戰士: "ORC",
  魅魔: "SUCCUBUS",
  石像鬼: "GARGOYLE",
  巨魔: "TROLL",
  骷髏暴君: "SKELETON_TYRANT",
  死靈刺客: "NECRO_ASSASSIN",
  巨魔祭司: "TROLL_PRIEST",
  風暴魔女: "STORM_WITCH",
  "鋼鐵傀儡·毀滅者": "IRON_GOLEM",
  "墮落大天使·路西法": "LUCIFER",
  "虛空吞噬者·卡薩丁": "KRAKEN",
  "煉獄炎魔·巴洛格": "BALROG",
  "滅世巨龍·奧杜因": "DRAGON_KING",
  雷霆祭司: "LUCIFER",
  護衛禁軍: "GUARD",
};

// 🎯 機制與屬性 Emoji 霓虹映射表
const tagToIconMap = {
  物理: "⚔️",
  火: "🔥",
  冰: "❄️",
  電: "⚡",
  毒: "☣️",
  暗: "😈",
  光明: "✨",
  魔力護盾: "🔮",
  格擋: "🛡️",
  補血: "💚",
  吸血: "🩸",
};

const monsterKeywords = [
  "哥布林",
  "哈比",
  "鷹身人",
  "狼獸",
  "獸人",
  "魅魔",
  "石像鬼",
  "巨魔",
  "骷髏",
  "死靈",
  "魔女",
  "傀儡",
  "路西法",
  "卡薩丁",
  "巴洛格",
  "奧杜因",
  "祭司",
  "護衛",
  "禁軍",
  "魔王",
  "巨龍",
  "天使",
];
const legendaryKeywords = [
  "龍騎士",
  "忍者",
  "浪人",
  "聖堂武士",
  "機兵",
  "靈魂",
];

export default function Unit({ unit, dragging }) {
  if (!unit) return null;

  let {
    type,
    shape,
    label,
    faction,
    hp,
    maxHp,
    proClass,
    enemyType,
    isAttacking,
    cellId,
    targetCellId,
    blueprintKey,
  } = unit;
  const displayLabel = label ? String(label) : "";

  // 1. 🔍 透過內建的包含判定直接鎖死字典
  let mappedKey = null;
  const sortedKeys = Object.keys(labelToImageKeyMap).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sortedKeys) {
    if (displayLabel.includes(key)) {
      mappedKey = labelToImageKeyMap[key];
      break;
    }
  }
  const safeProClass = proClass ? String(proClass).toUpperCase() : "";
  const imageKey = (
    mappedKey ||
    safeProClass ||
    enemyType ||
    type ||
    shape ||
    "SQUARE"
  ).toUpperCase();

  // 2. 🔍 動態提取該角色的藍圖數據，以取得隨身 tags 陣列
  const currentKey = blueprintKey || enemyType || imageKey;
  const bp =
    UNIT_BLUEPRINTS[currentKey] ||
    ENEMY_BLUEPRINTS[currentKey.toLowerCase()] ||
    ENEMY_BLUEPRINTS[currentKey];

  // 3. 🎯 攻擊向量角度計算維持原樣
  let arrowRotation = 0;
  let showArrow = false;
  if (isAttacking && cellId && targetCellId) {
    const s = cellId.split("-"),
      t = targetCellId.split("-");
    if (s.length >= 3 && t.length >= 3) {
      const dRow = Number(t[1]) - Number(s[1]),
        dCol = Number(t[2]) - Number(s[2]);
      if (dRow < 0 && dCol === 0) arrowRotation = 0;
      if (dRow > 0 && dCol === 0) arrowRotation = 180;
      if (dRow === 0 && dCol > 0) arrowRotation = 90;
      if (dRow === 0 && dCol < 0) arrowRotation = -90;
      if (dRow < 0 && dCol > 0) arrowRotation = 45;
      if (dRow < 0 && dCol === 0) arrowRotation = 0; // 保險兜底
      showArrow = true;
    }
  }

  // 4. 顏色與陣營判定
  const fUpper = faction ? String(faction).toUpperCase() : "";
  const isEnemy =
    fUpper === "ENEMY" ||
    fUpper === "MONSTER" ||
    fUpper === "BOSS" ||
    monsterKeywords.some((k) => displayLabel.includes(k));
  const isLegendary =
    !isEnemy && legendaryKeywords.some((k) => displayLabel.includes(k));

  let labelColor = "#ffffff";
  if (isEnemy) labelColor = "#ff6b6b";
  else if (isLegendary) labelColor = "#fbbf24";

  return (
    <div className={`unit-container ${dragging ? "dragging" : ""}`}>
      {/* 💅 1:1 正方形外殼 */}
      <div
        className={`unit shape-square color-${faction || "default"} ${
          proClass ? "promoted" : ""
        }`}
        style={{
          position: "relative",
          background: "rgba(26, 28, 35, 0.65)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
          overflow: "hidden",
          aspectRatio: "1 / 1",
          width: "100%",
        }}
      >
        <img
          src={`/assets/units/${imageKey}.png`}
          alt={displayLabel}
          onError={(e) => {
            e.target.style.display = "none";
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            mixBlendMode: "screen",
            imageRendering: "pixelated",
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 2,
          }}
        />
        {showArrow && (
          <div
            className="attack-dir-arrow"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transform: `rotate(${arrowRotation}deg)`,
              zIndex: 10,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="arrow-neon-core">▲</div>
          </div>
        )}
      </div>

      {/* 📊 下方換行置中血條區 */}
      {hp !== undefined && (
        <div
          className="unit-status-block"
          style={{ marginTop: "4px", width: "100%" }}
        >
          <div className="hp-bar-container">
            <div
              className="hp-bar"
              style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
            ></div>
          </div>
          <span
            className="hp-text-below"
            style={{ display: "block", textAlign: "center", lineHeight: "1.3" }}
          >
            {/* 💎 核心新增：屬性標籤展示列（渲染在名字正上方） */}
            {bp && bp.tags && (
              <div
                style={{
                  display: "flex",
                  gap: "3px",
                  justifyContent: "center",
                  marginBottom: "2px",
                }}
              >
                {bp.tags.map((t) => (
                  <span
                    key={t}
                    title={t}
                    style={{
                      fontSize: "11px",
                      filter: "drop-shadow(0 0 2px rgba(255,255,255,0.3))",
                    }}
                  >
                    {tagToIconMap[t]}
                  </span>
                ))}
              </div>
            )}

            <div
              style={{
                fontWeight: "700",
                color: labelColor,
                textShadow: isLegendary
                  ? "0 0 6px rgba(251, 191, 36, 0.4)"
                  : "none",
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: "11px", opacity: 0.85 }}>
              {Math.max(0, hp)}/{maxHp}
            </div>
          </span>
        </div>
      )}
    </div>
  );
}
