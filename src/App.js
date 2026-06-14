import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import {
  UNIT_BLUEPRINTS,
  PRO_CLASSES,
  FACTIONS,
  GRID_ROWS,
  GRID_COLS,
  createUnitInstance,
  ENEMY_BLUEPRINTS,
} from "./constants";
import Unit from "./components/Unit";
import FactionSelect from "./components/FactionSelect";
import MapView from "./components/MapView";
import { FACTION_TALENTS } from "./constants";

// 🎯 提案 B：四選一女神祝福庫
const GODDESS_BLESSINGS = {
  EARTH: {
    id: "EARTH",
    name: "🛡️ 大地女神的庇護",
    desc: "前排坦克與聖職者防禦力 (DEF) 額外 +6，硬如鋼鐵。",
  },
  STORM: {
    id: "STORM",
    name: "⚡ 風暴女神的狂熱",
    desc: "風暴降臨！全場藍方英雄普攻有 15% 機率連續射擊/劈砍 2 次！",
  },
  FORTUNE: {
    id: "FORTUNE",
    name: "🩸 財富女神的賭博",
    desc: "招募傳奇特種兵積分成本永久打 8 折！但每波怪物初始最大血量 +10%。",
  },
  VOID: {
    id: "VOID",
    name: "🔮 虛空之神的低語",
    desc: "藍方所有角色大招觸發所需的攻擊次數從 3 下降低至 2 下！",
  },
};

// 🎯 提案 C：完全體命運奇遇隨機事件庫（四合一終極版）
const RANDOM_EVENTS = [
  {
    title: "⛺ 帝國傷兵",
    text: "你在逃難的荒野中發現一名奄奄一息的帝國特種兵，他身上沾滿了魔物的黏液。是否花費 30 戰鬥積分使用醫療物資救治他？",
    options: [
      {
        text: "【救治】消耗 30 積分，免費獲得一尊 🤖 蒸汽機兵！",
        action: (s) => s.points >= 30,
        run: (s) => {
          s.points -= 30;
          s.gainUnit = "STEAM_MECH";
        },
      },
      {
        text: "【搜刮】不救他，冷酷地搶走他的遺物，獲得 40 戰鬥積分！",
        action: () => true,
        run: (s) => {
          s.points += 40;
        },
      },
    ],
  },
  {
    title: "🔮 遠古祭壇",
    text: "一座散發著不詳紫光的黑曜石祭壇擋住了去路。祭壇上刻著：『獻祭凡人的鮮血，換取弒神的力量。』",
    options: [
      {
        text: "【獻祭】全隊當前血量強行斬掉 20%，但全體永久獲得 ATK +8！",
        action: () => true,
        run: (s) => {
          s.hpPenalty = 0.2;
          s.globalAtkBonus = 8;
        },
      },
      {
        text: "【摧毀】砸碎祭壇，引發虛空反噬，但獲得 50 點戰鬥積分！",
        action: () => true,
        run: (s) => {
          s.points += 50;
        },
      },
    ],
  },
  {
    title: "🍷 遺落的聖杯",
    text: "你在廢墟的瓦礫堆中找到一只盛滿暗紅色液體的金樽。傳說喝下它的人，要麼覺醒神力，要麼全身潰爛。是否讓隊伍中的一人冒險飲用？",
    options: [
      {
        text: "【飲用】花費 20 積分引導儀式。50% 機率備戰區第一人免費覺醒轉職！50% 機率該英雄當場暴斃！",
        action: (s) => s.points >= 20,
        run: (s) => {
          s.points -= 20;
          s.gambleHolyGrail = true; // 這會在 App.js 後台觸發賭博覺醒/暴斃判定
        },
      },
      {
        text: "【倒掉】將這邪惡的液體淨化，神聖的光芒回饋你 30 點戰鬥積分。",
        action: () => true,
        run: (s) => {
          s.points += 30;
        },
      },
    ],
  },
  {
    title: "🎲 流浪地精商人",
    text: "一個背著巨大包袱的地精從陰影中鑽了出來：『嘿，逃難的將領！我這裡有剛從戰場扒下來的極品裝備，要打包嗎？便宜賣！』",
    options: [
      {
        text: "【大打包】花費 50 積分，直接隨機獲得 3 件高級裝備，全自動分發給軍隊！",
        action: (s) => s.points >= 50,
        run: (s) => {
          s.points -= 50;
          s.triggerMegaBundleItem = true; // 觸發全套裝備加持
        },
      },
      {
        text: "【黑吃黑】在荒野中沒人知道發生了什麼。直接動手搶劫他！獲得 75 戰鬥積分，但世界黑暗值強行暴增 15%！",
        action: () => true,
        run: (s) => {
          s.points += 75;
          s.darknessPenalty = 15; // 觸發黑暗值懲罰
        },
      },
    ],
  },
];

const SHOP_ITEMS = [
  {
    id: "it_atk",
    name: "⚔️ 弒神之刃",
    cost: 35,
    desc: "攻擊力永久 +8",
    effect: (u) => {
      u.atk += 8;
    },
  },
  {
    id: "it_def",
    name: "🛡️ 不熔合金盾",
    cost: 30,
    desc: "防禦永久 +3，格擋 +5%",
    effect: (u) => {
      u.def += 3;
      u.blk += 5;
    },
  },
  {
    id: "it_hp",
    name: "🧪 異星活性血清",
    cost: 30,
    desc: "最大血量永久 +45",
    effect: (u) => {
      u.maxHp += 45;
      u.hp += 45;
    },
  },
  {
    id: "it_speed",
    name: "⚡ 狂暴微型晶片",
    cost: 40,
    desc: "冷卻大幅縮短 150ms",
    effect: (u) => {
      u.cd = Math.max(200, u.cd - 150);
    },
  },
  {
    id: "it_vamp",
    name: "🧛 貪婪吸血勾爪",
    cost: 50,
    desc: "暴擊、閃避永久 +8%",
    effect: (u) => {
      u.eva += 8;
      u.blk += 8;
    },
  },
];

const BATTLE_DIALOGUES = [
  {
    trigger: "start",
    speaker: "我方前鋒",
    text: "穩住陣線！拉開身位，別擠在一起！",
  },
  {
    trigger: "start",
    speaker: "敵方先鋒",
    text: "黑夜已至...清除所有反抗火種！",
  },
  {
    trigger: "boss",
    speaker: "💀魔王",
    text: "無知螻蟻，竟敢直視深淵的意志？化為虛無吧！",
  },
  {
    trigger: "boss",
    speaker: "我方弓手",
    text: "那股能量波動...太不詳了，注意走位躲開重擊！",
  },
  {
    trigger: "mid",
    speaker: "我方戰士",
    text: "找到突破口了！撕裂他們的側翼！",
  },
];

function App() {
  // ─── 🎰 終極肉鴿全新狀態鏈（已精密修正回組件本體之內） ───
  const [activeBlessing, setActiveBlessing] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentBossType, setCurrentBossType] = useState("DRAGON_KING");
  // ─── 📜 戰鬥日誌系統全新狀態鏈 ───
  const [battleLogs, setBattleLogs] = useState([]);
  const logsEndRef = useRef(null);

  // 封裝一個通用的日誌推播函數
  const addLog = (msg) => {
    setBattleLogs((prev) => [
      ...prev.slice(-49),
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]); // 最多留50條防記憶體爆炸
  };

  // 原有系統狀態
  const [gameState, setGameState] = useState("title_screen"); // 👈 預設卡在封面
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [maxDeployLimit, setMaxDeployLimit] = useState(3);
  // 🎯 重新補上變數與 set 函數，並且讓初始黑闇值從 0% 開始
  const [darkness, setDarkness] = useState(0);
  const [daysLeft, setDaysLeft] = useState(7);
  const [currentWave, setCurrentWave] = useState(1);
  const [hasPromotedThisGame, setHasPromotedThisGame] = useState(false);
  const [isAltarActive, setIsAltarActive] = useState(false);

  const [score, setScore] = useState(0);
  const [currentBattleType, setCurrentBattleType] = useState("normal");
  const [benchUnits, setBenchUnits] = useState([]);
  // ─── 🛒 隨機商店全新狀態鏈 ───
  // 預設開局先隨機滾三個基礎職業
  const [shopPool, setShopPool] = useState(["TANK", "WARRIOR", "ASSASSIN"]);

  // 隨機刷新商店的函數（只從 5 個 0 元基礎兵種裡抽 3 個）
  const refreshShop = () => {
    // 🎯 1. 基礎 6 大職業池 (包含牧師 CROSS)
    const baseClasses = [
      "CIRCLE",
      "SQUARE",
      "TRI_UP",
      "TRI_DOWN",
      "DIAMOND",
      "CROSS",
    ];

    // 🎲 先骰出一個幸運職業，作為這次刷新的「雙生子保底核心」
    const luckyClass =
      baseClasses[Math.floor(Math.random() * baseClasses.length)];

    // 🎯 2. 判斷是否觸發雙生共鳴 (設定 70% 的極高機率前兩格完全相同)
    const triggerTwin = Math.random() < 0.7;

    const rolled = [
      {
        key: luckyClass, // 第一格一定是這個幸運職業
        exists: true,
      },
      {
        // 第二格：如果觸發共鳴，直接複製第一格；沒觸發就維持正常全隨機
        key: triggerTwin
          ? luckyClass
          : baseClasses[Math.floor(Math.random() * baseClasses.length)],
        exists: true,
      },
      {
        // 第三格：維持完全隨機，保留一點挑選其他掛件的彈性
        key: baseClasses[Math.floor(Math.random() * baseClasses.length)],
        exists: true,
      },
    ];

    setShopPool(rolled);
  };
  const [boardState, setBoardState] = useState({});
  const [draggingUnitId, setDraggingUnitId] = useState(null);
  const [floatingTexts, setFloatingTexts] = useState({});
  const [shakingCells, setShakingCells] = useState({});

  const [projectiles, setProjectiles] = useState([]);
  const [activeDialogue, setActiveDialogue] = useState(null);

  const [promotionTargetUnit, setPromotionTargetUnit] = useState(null);
  const timerRef = useRef(null);
  const gameTimeRef = useRef(0);
  const deploySnapshotRef = useRef(null);
  const setupTabRef = useRef("team");

  // 全域奇遇事件觸發快取器
  const [globalAtkBonus, setGlobalAtkBonus] = useState(0);

  const triggerFloatingText = (cellId, text, type = "damage") => {
    const fId = `${cellId}-${Date.now()}-${Math.random()}`;
    setFloatingTexts((prev) => ({
      ...prev,
      [cellId]: { id: fId, text, type },
    }));
  };

  const triggerCellShake = (cellId) => {
    setShakingCells((prev) => ({ ...prev, [cellId]: true }));
    setTimeout(() => {
      setShakingCells((prev) => ({ ...prev, [cellId]: false }));
    }, 200);
  };

  const showDialogue = (triggerType) => {
    const pool = BATTLE_DIALOGUES.filter((d) => d.trigger === triggerType);
    if (pool.length > 0) {
      const rolled = pool[Math.floor(Math.random() * pool.length)];
      setActiveDialogue(rolled);
      setTimeout(() => setActiveDialogue(null), 3000);
    }
  };

  const handleSelectFaction = (talent) => {
    setSelectedTalent(talent);
    const baseBench = [
      createUnitInstance(UNIT_BLUEPRINTS.CIRCLE, FACTIONS.PLAYER, "u1"),
      createUnitInstance(UNIT_BLUEPRINTS.TRI_UP, FACTIONS.PLAYER, "u2"),
      createUnitInstance(UNIT_BLUEPRINTS.SQUARE, FACTIONS.PLAYER, "u3"),
      createUnitInstance(UNIT_BLUEPRINTS.DIAMOND, FACTIONS.PLAYER, "u4"),
      createUnitInstance(UNIT_BLUEPRINTS.TRI_DOWN, FACTIONS.PLAYER, "u5"),
    ];
    baseBench.forEach((unit) => talent.effect(unit));
    setBenchUnits(baseBench);

    // 🎯 關鍵修正：選完初始陣型流派後，先強制進入整備階段，逼出女神祝福彈窗！
    setGameState("setup");
  };

  const recruitUnit = (unitKey, slotIndex = null) => {
    const bp = UNIT_BLUEPRINTS[unitKey];
    if (!bp) return;

    // 1. 核心售價計算管線（已修正重複宣告與分流邏輯）
    let finalPrice = bp.price || 0;
    if (
      ["CIRCLE", "SQUARE", "TRI_UP", "TRI_DOWN", "DIAMOND", "CROSS"].includes(
        unitKey
      )
    ) {
      finalPrice = 0; // 確保基礎測試兵絕對是 0 元，不受外界數據干擾
    } else {
      if (activeBlessing === "FORTUNE" && finalPrice > 0) {
        finalPrice = Math.floor(finalPrice * 0.8);
      }
    }

    // 🎯 核心修復防線：只有售價大於 0 的高級兵/傳奇兵才檢查積分。
    // 如果 finalPrice === 0 (基礎測試兵)，直接無視目前積分是 0 還是負數，強制放行！
    if (finalPrice > 0 && score < finalPrice) {
      addLog("🪙 積分不足，無法招募該單位！");
      return;
    }

    // 2. 檢查【獨立備戰區 benchUnits】空間限制
    if (benchUnits.length >= 12) {
      addLog(
        "⚠️ 備戰區冷板凳已滿！請先將英雄拖入戰場部署或販賣，才能繼續招募。"
      );
      return;
    }

    // 3. 扣除積分
    setScore((prev) => prev - finalPrice);

    // 🎯 核心修正：隨機商店庫存扣除管線（換關防卡死安全版）
    if (slotIndex !== null && shopPool) {
      // 確保要扣除的那個格子實體真的存在，才執行 exists: false
      if (shopPool[slotIndex]) {
        setShopPool((prevPool) => {
          // 防止換關時 prevPool 變成空陣列或 undefined 導致噴錯
          if (!prevPool || !prevPool[slotIndex]) return prevPool || [];

          const nextPool = [...prevPool];
          nextPool[slotIndex] = { ...nextPool[slotIndex], exists: false };
          return nextPool;
        });
      } else {
        // 💡 換關防卡死保險：如果 slotIndex 對不上，代表換關重置了！
        console.warn(
          `⚠️ 偵測到商店索引 [${slotIndex}] 異動，已自動切換為防卡死相容模式。`
        );
      }
    }

    // 4. 生成新兵實體（🎯 特徵修復補丁：全面繼承新藍圖的所有血統標籤）
    const newUnit = createUnitInstance(bp, FACTIONS.PLAYER);
    newUnit.id = `player-${Date.now()}-${Math.random()}`;
    newUnit.shape = bp.shape;
    newUnit.label = bp.label;
    newUnit.isPlus = bp.isPlus || false;
    newUnit.isAdvanced = bp.isAdvanced || false;
    newUnit.isLegendary = bp.isLegendary || false;
    newUnit.blueprintKey = unitKey; // 紀錄原始 Key，供後續轉職系統做精確咬合

    addLog(`📥 成功招募：【${bp.label}】已送往備戰區冷板凳！`);

    // 🔒 備戰區合成回寫核心
    setBenchUnits((prevBench) => {
      const safeBench = Array.isArray(prevBench)
        ? prevBench.filter(Boolean)
        : [];
      const updatedBench = [...safeBench, newUnit];

      // 1. 如果是開局自動塞兵（slotIndex === null 且 unitKey 是基本 Key），直接放行不合成
      if (
        slotIndex === null &&
        ["CIRCLE", "SQUARE", "TRI_UP", "TRI_DOWN", "DIAMOND", "CROSS"].includes(
          unitKey
        )
      ) {
        return updatedBench;
      }

      // 2. 如果買的是高級或傳奇獨立職業，直接放行
      if (bp.isAdvanced || bp.isLegendary || bp.isPlus) {
        return updatedBench;
      }

      // 🎯 【核心修復】改成用 label (例如 "坦克") 嚴格去數數量！
      // 只要名字相同、不是 PLUS、不是進階，就納入合成計數
      const sameTypeUnits = updatedBench.filter(
        (u) =>
          u &&
          u.label === bp.label &&
          !u.isPlus &&
          !u.isAdvanced &&
          !u.isLegendary
      );

      // 🚀 當滿 3 隻時，發動幾何共鳴熔煉
      if (sameTypeUnits.length >= 3) {
        // 精確抓出前 3 隻相同角色的實體 ID 作為祭品
        const discardIds = [
          sameTypeUnits[0].id,
          sameTypeUnits[1].id,
          sameTypeUnits[2].id,
        ];

        // 將這 3 隻從整備區抹除
        const cleanBench = updatedBench.filter(
          (u) => u && !discardIds.includes(u.id)
        );

        // 自動動態對齊 PLUS 進化型 Key (例如 CIRCLE_PLUS)
        const plusKey = `${unitKey}_PLUS`;
        const plusBlueprint = UNIT_BLUEPRINTS[plusKey] || bp;

        // 繼承原本的圖片 shape 屬性與原稿 PLUS 屬性，生成全新進階實體
        const newPlusUnit = {
          ...newUnit, // 承襲圖案與基礎陣營設定
          id: `plus-evolution-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 7)}`,
          blueprintKey: plusKey,
          label: plusBlueprint.label || `${bp.label}+`,
          maxHp: plusBlueprint.maxHp || bp.maxHp * 2,
          hp: plusBlueprint.maxHp || bp.maxHp * 2,
          atk: plusBlueprint.atk || bp.atk * 1.5,
          def: plusBlueprint.def || bp.def + 5,
          attackSpeed: plusBlueprint.attackSpeed || bp.attackSpeed,
          moveSpeed: plusBlueprint.moveSpeed || bp.moveSpeed,
          skillName: plusBlueprint.skillName,
          skillQuote: plusBlueprint.skillQuote,
          skillColor: plusBlueprint.skillColor,
          skillIcon: plusBlueprint.skillIcon,
          isPlus: true,
          shapes: [unitKey, unitKey], // T2 進階雙徽記
        };

        // 延遲跳出提示，防止卡死 UI
        setTimeout(() => {
          addLog(
            `🥇【幾何共鳴】三名【${bp.label}】成功融合成精英體【${newPlusUnit.label}】！`
          );
        }, 50);

        return [...cleanBench, newPlusUnit];
      }

      return updatedBench;
    });
  };
  const cloneBoardState = (source) => {
    const clone = {};
    Object.keys(source).forEach((key) => {
      clone[key] = source[key] ? { ...source[key] } : null;
    });
    return clone;
  };

  const executePromotion = (unitId, proClassKey) => {
    if (score < 100) return;

    // 🎯 1. 數據源頭對齊
    const proBlueprint = UNIT_BLUEPRINTS[proClassKey] || {
      label: "高級職業",
      maxHp: 2000,
      def: 10,
      atk: 80,
      cd: 1000,
    };

    // 🎯 2. 核心轉職邏輯：更新「備戰區 (benchUnits)」裡面的英雄
    setBenchUnits((prev) =>
      prev.map((u) => {
        if (u && u.id === unitId) {
          return {
            ...u,
            blueprintKey: proClassKey,
            proClass: proClassKey,
            label: proBlueprint.label || u.label,
            shape: proBlueprint.shape || u.shape,
            maxHp: proBlueprint.maxHp || u.maxHp,
            hp: proBlueprint.maxHp || u.maxHp,
            def: proBlueprint.def !== undefined ? proBlueprint.def : u.def,
            atk: proBlueprint.atk !== undefined ? proBlueprint.atk : u.atk,
            cd: proBlueprint.cd || u.cd,
            blk: proBlueprint.blk !== undefined ? proBlueprint.blk : u.blk || 0,
            eva: proBlueprint.eva !== undefined ? proBlueprint.eva : u.eva || 0,
            isAdvanced: true,
            visualState: "unit-promotion-glow",
          };
        }
        return u;
      })
    );

    // 🎯 補丁防線：同步更新「主戰場棋盤 (boardState)」上的英雄（解決上陣後改名無效的 Bug）
    setBoardState((prev) => {
      const nextBoard = { ...prev };
      // 遍歷棋盤上所有的格子 (cell-x-x)
      Object.keys(nextBoard).forEach((cellId) => {
        const u = nextBoard[cellId];
        // 如果格子上有人，且 ID 與當前轉職的英雄完全相同
        if (u && u.id === unitId) {
          nextBoard[cellId] = {
            ...u,
            blueprintKey: proClassKey,
            proClass: proClassKey,
            label: proBlueprint.label || u.label, // 🌟 讓戰場上的名字當場轉為【大賢者】或【聖堂武士】
            shape: proBlueprint.shape || u.shape,
            maxHp: proBlueprint.maxHp || u.maxHp,
            hp: proBlueprint.maxHp || u.maxHp, // 戰場上同步回滿血
            def: proBlueprint.def !== undefined ? proBlueprint.def : u.def,
            atk: proBlueprint.atk !== undefined ? proBlueprint.atk : u.atk,
            cd: proBlueprint.cd || u.cd,
            blk: proBlueprint.blk !== undefined ? proBlueprint.blk : u.blk || 0,
            eva: proBlueprint.eva !== undefined ? proBlueprint.eva : u.eva || 0,
            isAdvanced: true,
            visualState: "unit-promotion-glow",
          };
        }
      });
      return nextBoard;
    });

    // 🎯 3. 清理轉職聖壇狀態與點數扣除
    setScore((prev) => Math.max(0, prev - 100));

    setIsAltarActive(false);
    setPromotionTargetUnit(null);

    addLog(`🎉 轉職覺醒成功！【${proBlueprint.label}】已正式加入戰隊！`);
  };

  const handleUnitAltarClick = (unit) => {
    if (!isAltarActive) return;
    if (score < 100) {
      addLog(
        `🔮 遠古聖壇毫無反應... 轉職需要 100 戰鬥積分！你目前只有 ${score} 分。`
      );
      return;
    }
    setPromotionTargetUnit(unit);
  };

  const buyIndependentItem = (itemBlueprint, unitId) => {
    if (score < itemBlueprint.cost) {
      addLog("戰鬥積分不足！");
      return;
    }

    const applyEffect = (u) => {
      const upgraded = { ...u };
      itemBlueprint.effect(upgraded);
      return upgraded;
    };

    setBenchUnits((prev) =>
      prev.map((u) => (u.id === unitId ? applyEffect(u) : u))
    );
    setBoardState((prev) => {
      const nextBoard = cloneBoardState(prev);
      Object.keys(nextBoard).forEach((key) => {
        if (nextBoard[key] && nextBoard[key].id === unitId) {
          nextBoard[key] = applyEffect(nextBoard[key]);
        }
      });
      return nextBoard;
    });

    setScore((prev) => prev - itemBlueprint.cost);
    addLog(`🛒 購入成功！已將【${itemBlueprint.name}】裝備給該兵種。`);
  };

  const handleDragStart = (e, unitId) => {
    if (gameState !== "setup") return;
    e.dataTransfer.setData("text/plain", unitId);
    setDraggingUnitId(unitId);

    const handleGlobalDragEnd = () => {
      setDraggingUnitId(null);
      window.removeEventListener("mouseup", handleGlobalDragEnd);
      window.removeEventListener("touchend", handleGlobalDragEnd);
    };

    window.addEventListener("mouseup", handleGlobalDragEnd);
    window.addEventListener("touchend", handleGlobalDragEnd);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnBench = (e) => {
    e.preventDefault();
    if (gameState !== "setup") {
      setDraggingUnitId(null);
      return;
    }

    const unitId = e.dataTransfer.getData("text/plain") || draggingUnitId;
    if (!unitId) {
      setDraggingUnitId(null);
      return;
    }

    const isAlreadyInBench = benchUnits.some((u) => u.id === unitId);
    if (isAlreadyInBench) {
      setDraggingUnitId(null);
      return;
    }

    const boardUnits = Object.values(boardState).filter(Boolean);
    const draggedUnit = boardUnits.find((u) => u.id === unitId);
    if (!draggedUnit) {
      setDraggingUnitId(null);
      return;
    }

    setBenchUnits((prev) => [...prev, draggedUnit]);
    setBoardState((prev) => {
      const nextBoard = cloneBoardState(prev);
      const oldCellId = Object.keys(prev).find(
        (key) => prev[key]?.id === unitId
      );
      if (oldCellId) nextBoard[oldCellId] = null;
      return nextBoard;
    });

    setDraggingUnitId(null);
  };
  {
    /* 🎯 幾何共鳴（羈絆）即時監控看板 */
  }
  {
    ["setup", "battle", "win"].includes(gameState) && (
      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "15px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            color: "#94a3b8",
            marginBottom: "8px",
          }}
        >
          ✨ 當前上場隊伍幾何共鳴（2A1B 核心架構）
        </div>

        {(() => {
          // 1. 統計當前棋盤上（boardState）所有我方單位的幾何形狀
          const shapeCounts = {
            circle: 0,
            square: 0,
            "triangle-up": 0,
            "triangle-down": 0,
            diamond: 0,
          };
          Object.values(boardState).forEach((u) => {
            if (u && u.faction === FACTIONS.PLAYER) {
              // 支援兩種寫法，防止結構不同抓不到 shape
              const shape = u.shape || (u.blueprint && u.blueprint.shape);
              if (shape && shapeCounts[shape] !== undefined)
                shapeCounts[shape]++;
            }
          });

          // 2. 判斷羈絆是否解鎖
          let has重裝 =
            shapeCounts["square"] >= 2 && shapeCounts["circle"] >= 1;
          let has遊俠 =
            shapeCounts["triangle-up"] >= 2 && shapeCounts["diamond"] >= 1;
          let has元素 =
            shapeCounts["triangle-down"] >= 2 &&
            (shapeCounts["square"] >= 1 || shapeCounts["circle"] >= 1);
          let has五芒 = Object.values(shapeCounts).every((c) => c >= 1);

          // 3. 渲染徽章
          return (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* 徽章 A */}
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  background: has重裝 ? "#1e3a8a" : "#0f172a",
                  border: `1px solid ${has重裝 ? "#3b82f6" : "#1e293b"}`,
                  color: has重裝 ? "#60a5fa" : "#475569",
                  fontSize: "12px",
                }}
              >
                🛡️ 重裝突擊陣 (2方+1圓) :{" "}
                {has重裝 ? "🟢 已啟動 (+15%格擋)" : "⚪ 未達成"}
                <span
                  style={{
                    fontSize: "10px",
                    marginLeft: "5px",
                    color: "#64748b",
                  }}
                >
                  ({shapeCounts.square}方/{shapeCounts.circle}圓)
                </span>
              </div>

              {/* 徽章 B */}
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  background: has遊俠 ? "#14532d" : "#0f172a",
                  border: `1px solid ${has遊俠 ? "#22c55e" : "#1e293b"}`,
                  color: has遊俠 ? "#4ade80" : "#475569",
                  fontSize: "12px",
                }}
              >
                🏹 遊俠強襲陣 (2上三+1菱) :{" "}
                {has遊俠 ? "🟢 已啟動 (遠程射程+1)" : "⚪ 未達成"}
                <span
                  style={{
                    fontSize: "10px",
                    marginLeft: "5px",
                    color: "#64748b",
                  }}
                >
                  ({shapeCounts["triangle-up"]}上三/{shapeCounts.diamond}菱)
                </span>
              </div>

              {/* 徽章 C */}
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  background: has元素 ? "#581c87" : "#0f172a",
                  border: `1px solid ${has元素 ? "#a855f7" : "#1e293b"}`,
                  color: has元素 ? "#c084fc" : "#475569",
                  fontSize: "12px",
                }}
              >
                🔮 元素洪流陣 (2下三+1前排) :{" "}
                {has元素 ? "🟢 已啟動 (法系CD-150ms)" : "⚪ 未達成"}
                <span
                  style={{
                    fontSize: "10px",
                    marginLeft: "5px",
                    color: "#64748b",
                  }}
                >
                  ({shapeCounts["triangle-down"]}下三)
                </span>
              </div>

              {/* 徽章 D */}
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  background: has五芒 ? "#78350f" : "#0f172a",
                  border: `1px solid ${has五芒 ? "#eab308" : "#1e293b"}`,
                  color: has五芒 ? "#fde047" : "#475569",
                  fontSize: "12px",
                }}
              >
                🌌 幾何臨界點 (5型全齊) :{" "}
                {has五芒 ? "👑 臨界爆發 (全屬性+15%)" : "⚪ 未達成"}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }
  const handleDropOnGrid = (e, targetCellId) => {
    e.preventDefault();
    if (gameState !== "setup") {
      setDraggingUnitId(null);
      return;
    }

    const unitId = e.dataTransfer.getData("text/plain") || draggingUnitId;
    if (!unitId) {
      setDraggingUnitId(null);
      return;
    }

    const isFromBench = benchUnits.some((u) => u.id === unitId);
    const targetCellOccupant = boardState[targetCellId];
    const currentDeployedCount = Object.values(boardState).filter(
      (u) => u && u.faction === FACTIONS.PLAYER
    ).length;

    if (
      isFromBench &&
      !targetCellOccupant &&
      currentDeployedCount >= maxDeployLimit
    ) {
      addLog(`【限制】目前軍隊規模上限為 ${maxDeployLimit} 人！`);
      setDraggingUnitId(null);
      return;
    }

    const draggedUnit =
      benchUnits.find((u) => u.id === unitId) ||
      Object.values(boardState).find((u) => u?.id === unitId);

    if (!draggedUnit) {
      setDraggingUnitId(null);
      return;
    }

    if (isFromBench) {
      setBenchUnits((prev) => prev.filter((u) => u.id !== unitId));
      setBoardState((prev) => {
        const nextBoard = cloneBoardState(prev);
        if (targetCellOccupant)
          setBenchUnits((bench) => [...bench, targetCellOccupant]);
        nextBoard[targetCellId] = draggedUnit;
        return nextBoard;
      });
    } else {
      setBoardState((prev) => {
        const nextBoard = cloneBoardState(prev);
        const oldCellId = Object.keys(prev).find(
          (key) => prev[key]?.id === unitId
        );
        if (oldCellId) {
          if (targetCellOccupant) nextBoard[oldCellId] = targetCellOccupant;
          else nextBoard[oldCellId] = null;
        }
        nextBoard[targetCellId] = draggedUnit;
        return nextBoard;
      });
    }

    setDraggingUnitId(null);
  };

  // ==========================================
  // 🎯 核心核心戰鬥啟動引擎 (特效注入 + 鋼鐵鎖王完全體版)
  // ==========================================
  const startBattle = () => {
    const playerUnitsOnBoard = Object.values(boardState).filter(
      (u) => u && u.faction === FACTIONS.PLAYER
    );
    if (playerUnitsOnBoard.length === 0) return;
    deploySnapshotRef.current = cloneBoardState(boardState);
    gameTimeRef.current = 0;
    setProjectiles([]);
    setGameState("battle");

    if (daysLeft <= 1) showDialogue("boss");
    else showDialogue("start");

    // ─── 🌪️ 環境異變事件判定（【已優化】機率從 0.35 降到 0.20，減少連續被搞的挫折感） ───
    window.battleAnomaly = null;
    const anomalyRoll = Math.random();
    if (anomalyRoll < 0.2) {
      const anomalies = [
        {
          type: "BLOOD_MOON",
          name: "🩸 血月降臨",
          desc: "全場怪物攻擊力提升 10%！", // 微調 15% -> 10%
        },
        {
          type: "EMP_STORM",
          name: "⚡ 超自然干擾",
          desc: "電磁風暴！全場遠程施法單位冷卻 (CD) 拉長 200ms！", // 微調 300 -> 200
        },
        {
          type: "DARK_TIDE",
          name: "🔥 黑暗潮汐",
          desc: "黑夜侵蝕！全體藍方英雄初始血量削減 10%！", // 微調 15% -> 10%
        },
      ];
      const rolled = anomalies[Math.floor(Math.random() * anomalies.length)];
      window.battleAnomaly = rolled.type;
      addLog(`【戰場環境突變】\n⚠️ ${rolled.name} ── ${rolled.desc}`);
    }

    // ─── 🎲 棋盤數據洗入 ───
    setBoardState((prev) => {
      const nextBoard = cloneBoardState(prev);
      const isFinalBoss = daysLeft <= 1;

      const currentDarknessNum = Number(darkness) || 0;
      const currentWaveNum = Number(currentWave) || 1;

      // 1. 環境黑暗潮汐扣血修正
      if (window.battleAnomaly === "DARK_TIDE") {
        Object.keys(nextBoard).forEach((key) => {
          if (nextBoard[key] && nextBoard[key].faction === FACTIONS.PLAYER) {
            nextBoard[key].hp = Math.max(
              1,
              Math.floor(nextBoard[key].hp * 0.9) // 削弱改為平滑的 10%
            );
          }
        });
      }

// 2. 最終 BOSS 關卡：生成舊日支配者 + 機制破防隨從防線//

if (isFinalBoss) {
  const bossPool = ["KRAKEN", "BALROG", "DRAGON_KING"];
  const chosenBossKey =
    bossPool[Math.floor(Math.random() * bossPool.length)];
  const blueprint = ENEMY_BLUEPRINTS[chosenBossKey];
  const bossCellId = "cell-0-2";

  // ─── ⚖️ 【動態難度管線】根據玩家兵力動態修正魔王，防止數值指數型崩潰 ───
  const allPlayerUnits = [
    ...Object.values(nextBoard),
    ...(typeof benchUnits !== "undefined" ? benchUnits : [])
  ].filter(u => u && u.faction === FACTIONS.PLAYER);

  let playerStrengthScore = 0;
  allPlayerUnits.forEach(unit => {
    playerStrengthScore += 1; 
    if (unit.isPlus || unit.label?.includes("🌟")) playerStrengthScore += 1.5;
    if (unit.isPromoted || unit.promoted) playerStrengthScore += 3;
  });

  // 動態平滑係數：確保沒胡牌的玩家打魔王時血量會自動降溫
  const strengthFactor = Math.max(0.5, Math.min(1.4, playerStrengthScore / 14));
  // 核心調校：將除數擴大到 450，斬斷黑暗值過高時的畸形血量暴增
  const dynamicBossScale = (1 + currentDarknessNum / 450) * strengthFactor;

  // 🟢 正式指派給魔王，括號結構完美閉合，徹底洗掉舊版重複覆蓋的 bug
  nextBoard[bossCellId] = {
    id: "FINAL_BOSS_DOMINATOR",
    shape: blueprint.shape,
    label: blueprint.label,
    maxHp: Math.floor(blueprint.maxHp * dynamicBossScale * 0.75), // ⚖️ 整體血量平滑降溫 25%，拒絕無腦堆砌
    hp: Math.floor(blueprint.maxHp * dynamicBossScale * 0.75),
    def: blueprint.def,
    atk: Math.floor(blueprint.atk * (1 + currentDarknessNum / 450) * Math.min(1.1, strengthFactor)),
    range: blueprint.range || 1,
    cd: blueprint.cd || 1000,
    eva: blueprint.eva || 0,
    blk: blueprint.blk || 0,
    faction: FACTIONS.ENEMY,
    nextActionTime: 1400, // 給玩家多 400ms 的排兵布陣先手機會
    visualState: "boss-rage-glow",
    skillCount: 0,
    isBoss: true,
    enemyType: chosenBossKey.toLowerCase(),
    hasBossAura: true, // 👈 啟動隨從共生護盾機制標籤
  };

  // 隨從 A (左側)：雷霆祭司
  nextBoard["cell-0-0"] = {
    ...createUnitInstance(UNIT_BLUEPRINTS.TRI_DOWN, FACTIONS.ENEMY),
    id: `minion-${Date.now()}-left`,
    label: "🔮 雷霆祭司",
    maxHp: 320, 
    hp: 320,
    atk: 25,
    def: 4,
    range: 2,
    cd: 1400,
    faction: FACTIONS.ENEMY,
    nextActionTime: 1400,
    visualState: "minion-spark-effect",
  };

  // 隨從 B (右側)：護衛禁軍
  nextBoard["cell-0-4"] = {
    ...createUnitInstance(UNIT_BLUEPRINTS.CIRCLE, FACTIONS.ENEMY),
    id: `minion-${Date.now()}-right`,
    label: "🛡️ 護衛禁軍",
    maxHp: 480, 
    hp: 480,
    atk: 16,
    def: 12,
    range: 1,
    cd: 1600,
    faction: FACTIONS.ENEMY,
    nextActionTime: 1600,
    visualState: "minion-shield-iron",
  };

  alert(`🚨【支配者臨界點】\n【${blueprint.label}】降臨！隨從禁軍未破前魔王自帶遠古減傷護盾，請集中火力優先擊殺側翼隨從！`);
}else {
        // 🌲 常規波次模式
        let count = 0;
        let enemyCount = 3;
        const isAmbushed =
          currentBattleType === "unknown" && Math.random() < 0.25; // 亂入機率從 0.34 稍微降到 0.25
        if (isAmbushed) {
          enemyCount = 4;
          addLog("⚠️ 警告！未知強敵【👑亂入】戰場！");
        }

        const pool = Object.values(ENEMY_BLUEPRINTS);
        let availableMonsters = [];
        const safePool = pool.filter((m) => !m.isRaidBoss && !m.isBoss);

        // 難度機率平滑化防線
        if (
          currentWaveNum <= 2 &&
          currentBattleType !== "elite" &&
          !isAmbushed
        ) {
          availableMonsters = safePool.filter((m) =>
            ["goblin", "harpy", "direwolf", "orc"].includes(m.enemyType)
          );
        } else if (currentBattleType === "elite" || isAmbushed) {
          if (currentWaveNum <= 2) {
            availableMonsters = safePool.filter((m) =>
              ["goblin", "harpy", "direwolf", "orc"].includes(m.enemyType)
            );
          } else if (currentWaveNum <= 5) {
            availableMonsters = safePool.filter((m) =>
              ["gargoyle", "troll", "orc", "succubus"].includes(m.enemyType)
            );
          } else {
            availableMonsters = safePool.filter((m) =>
              ["gargoyle", "troll", "chimera", "wyvern", "succubus"].includes(
                m.enemyType
              )
            );
          }
          enemyCount = isAmbushed ? 4 : 3;
        } else {
          safePool.forEach((m) => {
            const isBigMonster = [
              "gargoyle",
              "troll",
              "succubus",
              "skeleton_tyrant",
              "necro_assassin",
            ].includes(m.enemyType);

            if (isBigMonster) {
              const spawnChance = Math.min(1, (currentWaveNum - 2) * 0.15); // 出現曲線拉平一點點
              if (Math.random() < spawnChance) {
                availableMonsters.push(m);
              }
            } else {
              availableMonsters.push(m);
            }
          });
        }

        if (availableMonsters.length === 0) {
          availableMonsters = safePool.filter((m) =>
            ["goblin", "harpy", "direwolf", "orc"].includes(m.enemyType)
          );
        }

        let attempts = 0;
        while (count < enemyCount && attempts < 100) {
          attempts++;
          const blueprint =
            availableMonsters[
              Math.floor(Math.random() * availableMonsters.length)
            ];
          if (!blueprint) continue;

          let targetRow = 1;
          if (
            ["succubus", "wyvern", "harpy", "kraken"].includes(
              blueprint.enemyType
            )
          ) {
            targetRow = 0;
          }

          const randomCol = Math.floor(Math.random() * GRID_COLS);
          const cellId = `cell-${targetRow}-${randomCol}`;

          if (!nextBoard[cellId]) {
            const enemy = createUnitInstance(blueprint, FACTIONS.ENEMY);
            enemy.enemyType = blueprint.enemyType;
            enemy.isElite = blueprint.isElite || false;

            // 🎯 【核心優化】改為線性疊加公式（1 + 波次加成 + 黑暗加成），徹底斬斷乘法導致的指數型膨脹！
            const blessingBonus = activeBlessing === "FORTUNE" ? 0.1 : 0.0;
            const waveBonus = (currentWaveNum - 1) * 0.04; // 每波成長從 5% 降至 4%
            const darknessBonus = currentDarknessNum / 120; // 黑暗數值除數從 100 擴大到 120，降溫整體強度

            const totalScale = 1 + waveBonus + darknessBonus + blessingBonus;

            let finalMaxHp = Math.floor(blueprint.maxHp * totalScale);
            let finalAtk = Math.floor(blueprint.atk * totalScale);
            let finalCd = blueprint.cd;

            // 狂暴判定（只有第 3 波後且黑暗 > 50 觸發）
            const isEnraged =
              currentDarknessNum > 50 &&
              currentWaveNum > 3 &&
              Math.random() < 0.35; // 機率稍微拉回 35%
            if (isEnraged) {
              finalMaxHp = Math.floor(finalMaxHp * 1.2); // 1.3 -> 1.2
              finalAtk = Math.floor(finalAtk * 1.15); // 1.2 -> 1.15
              finalCd = Math.floor(finalCd * 0.85);
              enemy.visualState = "enemy-enraged-aura";
            } else if (enemy.isElite) {
              enemy.visualState = "enemy-elite-shimmer";
            }

            enemy.maxHp = finalMaxHp;
            enemy.hp = finalMaxHp;
            enemy.atk = finalAtk;
            enemy.cd = finalCd;

            if (window.battleAnomaly === "BLOOD_MOON") {
              enemy.atk = Math.floor(enemy.atk * 1.1); // 1.15 -> 1.10
            }

            // 命名優化
            switch (enemy.enemyType) {
              case "goblin":
                enemy.label = isEnraged
                  ? `🔥狂暴·哥布林`
                  : `🏃${blueprint.label}`;
                break;
              case "succubus":
                enemy.label = isEnraged
                  ? `🔥狂暴·魅魔`
                  : `🔮${blueprint.label}`;
                break;
              case "gargoyle":
                enemy.label = isEnraged
                  ? `🔥狂暴·石像鬼`
                  : `🗿${blueprint.label}`;
                break;
              case "troll":
                enemy.label = isEnraged
                  ? `🔥狂暴·巨魔`
                  : `👹${blueprint.label}`;
                break;
              default:
                enemy.label = isEnraged
                  ? `🔥狂暴·${blueprint.label}`
                  : blueprint.label;
                break;
            }

            if (currentBattleType === "elite") {
              enemy.maxHp = Math.floor(enemy.maxHp * 1.12);
              enemy.hp = enemy.maxHp;
              enemy.atk = Math.floor(enemy.atk * 1.08);
            }

            // 🎯 【先手優化】讓怪物剛出生時的初次行動時間多加 200ms，確保玩家部隊能打出完美先手！
            enemy.nextActionTime = enemy.cd + 200;
            nextBoard[cellId] = enemy;
            count++;
          }
        }
      }

      // 重置行動軌跡與上膛冷卻
      Object.keys(nextBoard).forEach((key) => {
        if (nextBoard[key]) nextBoard[key].lastCellId = null;
      });
      Object.keys(nextBoard).forEach((key) => {
        if (nextBoard[key] && nextBoard[key].faction === FACTIONS.PLAYER)
          nextBoard[key].nextActionTime = nextBoard[key].cd;
      });

      const finalBoardWithSynergy = calculateSynergyEffects(nextBoard);
      return finalBoardWithSynergy;
    });
  };

  // ==========================================
  // 🥇 我方幾何共鳴（羈絆）計算核心（完全提升版）
  // ==========================================
  function calculateSynergyEffects(currentBoard) {
    const boardCopy = { ...currentBoard };

    // 1. 抓出目前留在戰場上的所有我方英雄
    const activePlayerUnits = Object.values(boardCopy).filter(
      (u) => u && u.faction === FACTIONS.PLAYER && u.hp > 0
    );

    if (activePlayerUnits.length === 0) return boardCopy;

    // 2. 統計五大基底幾何形狀的數量
    const shapeCounts = {
      circle: 0,
      square: 0,
      "triangle-up": 0,
      "triangle-down": 0,
      diamond: 0,
    };

    activePlayerUnits.forEach((u) => {
      let currentShape = u.shape;
      if (!currentShape && u.blueprint) currentShape = u.blueprint.shape;

      // 兜底血統盲猜防錯
      if (!currentShape && u.label) {
        if (u.label.includes("坦")) currentShape = "circle";
        if (u.label.includes("戰")) currentShape = "square";
        if (u.label.includes("弓") || u.label.includes("龍"))
          currentShape = "triangle-up";
        if (u.label.includes("法") || u.label.includes("魂"))
          currentShape = "triangle-down";
        if (u.label.includes("刺") || u.label.includes("忍"))
          currentShape = "diamond";
      }

      if (currentShape && shapeCounts[currentShape] !== undefined) {
        shapeCounts[currentShape]++;
      }
    });

    // 3. 判定解鎖
    let has重裝突擊 = shapeCounts["square"] >= 2 && shapeCounts["circle"] >= 1;
    let has遊俠強襲 =
      shapeCounts["triangle-up"] >= 2 && shapeCounts["diamond"] >= 1;
    let has元素洪流 =
      shapeCounts["triangle-down"] >= 2 &&
      (shapeCounts["square"] >= 1 || shapeCounts["circle"] >= 1);
    let has五芒星臨界 = Object.values(shapeCounts).every((count) => count >= 1);

    let synergyLogs = [];
    if (has五芒星臨界)
      synergyLogs.push("🌌【幾何臨界點】(全基底形狀集合：全體全面板 +15%)");
    if (has重裝突擊)
      synergyLogs.push("🛡️【重裝突擊陣】(2方+1圓：全體格擋率額外 +15%)");
    if (has遊俠強襲)
      synergyLogs.push("🏹【遊俠強襲陣】(2上三+1菱：遠程範圍 +1，防禦穿透)");
    if (has元素洪流)
      synergyLogs.push("🔮【元素洪流陣】(2下三+1前排：施法冷卻調校縮短 150ms)");

    if (synergyLogs.length > 0) {
      addLog(`✨【幾何共鳴發動】\n${synergyLogs.join("\n")}`);
    }

    // 4. 正式寫入屬性加成
    Object.keys(boardCopy).forEach((key) => {
      const u = boardCopy[key];
      if (u && u.faction === FACTIONS.PLAYER) {
        let updatedUnit = { ...u };

        if (has五芒星臨界) {
          updatedUnit.maxHp = Math.floor(updatedUnit.maxHp * 1.15);
          updatedUnit.hp = Math.floor(updatedUnit.hp * 1.15);
          updatedUnit.atk = Math.floor(updatedUnit.atk * 1.15);
          updatedUnit.def = updatedUnit.def + 2;
        }
        if (has重裝突擊) {
          updatedUnit.blk = (updatedUnit.blk || 0) + 15;
        }
        if (
          has遊俠強襲 &&
          (updatedUnit.shape === "triangle-up" || updatedUnit.range > 1)
        ) {
          updatedUnit.range = updatedUnit.range + 1;
          updatedUnit.atk = Math.floor(updatedUnit.atk * 1.1);
        }
        if (has元素洪流 && updatedUnit.shape === "triangle-down") {
          updatedUnit.cd = Math.max(200, updatedUnit.cd - 150);
        }

        boardCopy[key] = updatedUnit;
      }
    });

    return boardCopy;
  }

  useEffect(() => {
    if (gameState !== "battle") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const TICK_RATE = 200;

    timerRef.current = setInterval(() => {
      gameTimeRef.current += TICK_RATE;
      const currentTickTime = gameTimeRef.current;

      if (Math.random() < 0.05) showDialogue("mid");

      setBoardState((prevBoard) => {
        const nextBoard = cloneBoardState(prevBoard);

        const activeUnits = Object.values(nextBoard).filter(
          (u) => u && u.hp > 0
        );
        const hasPlayer = activeUnits.some(
          (u) => u.faction === FACTIONS.PLAYER
        );
        const hasEnemy = activeUnits.some((u) => u.faction === FACTIONS.ENEMY);

        if (!hasPlayer && !hasEnemy) return prevBoard;
        if (!hasPlayer) {
          clearInterval(timerRef.current);
          addLog("💀 🚨 【戰區警報】我方陣線徹底崩潰…… 軍隊慘遭黑暗吞噬！");
          setTimeout(() => setGameState("lose"), 500);
          return prevBoard;
        }
        if (!hasEnemy) {
          clearInterval(timerRef.current);
          addLog("🎉 ⚔️ 【戰報】突圍史詩大捷！全滅魔物，收兵重整！");
          setTimeout(() => setGameState("win"), 500);
          return prevBoard;
        }

        // ─── ⚔️ 核心物理/魔法傷害管道 ───
        const internalDamagePipeline = (
          attacker,
          targetUnit,
          rawAtk,
          targetCellId,
          currentBoard
        ) => {
          if (!targetUnit || targetUnit.hp <= 0) return;

          // ==========================================
          // 🛡️ 回應 1：【迴避】判定 (普攻、技能皆可迴避)
          // ==========================================
          // 優先讀取新工廠生成的動態 evasion 欄位，若無則兜底使用舊版 eva
          const targetEvasion =
            targetUnit.evasion !== undefined
              ? targetUnit.evasion
              : targetUnit.eva || 0;
          if (Math.random() * 100 < targetEvasion) {
            triggerFloatingText(targetCellId, "MISS 💨", "miss");
            addLog(
              `💨 【${targetUnit.label}】身形一閃，精確【迴避】了【${attacker.label}】的猛烈攻擊！`
            );
            return; // 觸發迴避，直接中斷管線，完全免疫傷害
          }

          let damage = rawAtk || attacker.atk || 10; // 基礎攻擊力
          let isBlocked = false;

          // ==========================================
          // 🛡️ 回應 2：【格擋】判定 (僅普攻，大招不觸發)
          // ==========================================
          // 判斷是否為技能大招（檢查當前攻擊是否帶有暴擊、大招特效標籤，或 attacker.visualState === "crit-hit"）
          const isSkillAttack = attacker.visualState === "crit-hit";

          if (!isSkillAttack) {
            const targetBlockRate =
              targetUnit.blockRate !== undefined
                ? targetUnit.blockRate
                : targetUnit.blk || 0;

            // 只要格擋率大於 0 且隨機滾點成功
            if (targetBlockRate > 0 && Math.random() * 100 < targetBlockRate) {
              damage = Math.floor(damage * 0.5); // 格擋成功：傷害直接物理減半
              isBlocked = true;
            }
          }

          // ==========================================
          // 🛡️ 回應 3：【防禦】減傷判定 (防禦光環與大招皆受防禦影響)
          // ==========================================
          let baseDef = targetUnit.def || 0;

          // 1. 周圍牧師與守護者防禦光環動態判定 (保留原稿隊友加防機制)
          if (targetUnit.faction === FACTIONS.PLAYER) {
            const targetCellKey = Object.keys(currentBoard).find(
              (key) => currentBoard[key]?.id === targetUnit.id
            );
            if (targetCellKey) {
              const [, , trStr, tcStr] = targetCellKey.split("-");
              const tr = parseInt(trStr);
              const tc = parseInt(tcStr);

              let hasDefenderNearby = false;
              let isAuraActive = false;

              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  const checkKey = `cell-${tr + dr}-${tc + dc}`;
                  const neighbor = currentBoard[checkKey];
                  if (neighbor && neighbor.hp > 0) {
                    if (
                      neighbor.label.includes("牧師") ||
                      neighbor.label.includes("大賢者")
                    ) {
                      hasDefenderNearby = true;
                    }
                    if (
                      neighbor.label.includes("守護者") ||
                      neighbor.label.includes("聖堂武士")
                    ) {
                      isAuraActive = true;
                    }
                  }
                }
              }
              if (hasDefenderNearby) baseDef += 4; // 牧師在身邊 +4 防禦
              if (isAuraActive) baseDef += 6; // 守護者在身邊 +6 防禦
            }
          }

          // 2. 祝福天生受傷減免機制 (計算最終防禦)
          let damageMitigation = 1.0;
          if (
            targetUnit.faction === FACTIONS.PLAYER &&
            (targetUnit.isAdvanced || targetUnit.isLegendary)
          ) {
            damageMitigation = 0.85; // 高階職業自带 15% 天生受傷減免
          }

          // 3. 套用防禦減傷計算
          // 使用標準公式防溢出，或原稿直覺公式：(傷害 - 最終防禦)
          let finalDamage = damage - baseDef;

          if (damageMitigation < 1.0) {
            finalDamage = Math.floor(finalDamage * damageMitigation);
          }

          // 保底傷害為 1
          finalDamage = Math.max(1, finalDamage);

          // ==========================================
          // 🔮 4. 萬用核心機制 (護盾、吸血、反傷、死亡收割)
          // ==========================================

          // 【魔力護盾機制】
          const hasMagicShield =
            targetUnit.tags?.includes("魔力護盾") ||
            targetUnit.label.includes("法師");
          if (hasMagicShield) {
            if (
              targetUnit.shieldHp === undefined ||
              isNaN(targetUnit.shieldHp)
            ) {
              targetUnit.shieldHp =
                targetUnit.isAdvanced || targetUnit.isLegendary ? 350 : 120;
            }
            if (targetUnit.shieldHp > 0) {
              if (targetUnit.shieldHp >= finalDamage) {
                targetUnit.shieldHp -= finalDamage;
                triggerFloatingText(targetCellId, "🔮護盾吸收", "miss");
                addLog(
                  `🔮 【${targetUnit.label}】魔力護盾泛起光芒，完全吸收了 ${finalDamage} 點傷害。`
                );
                return;
              } else {
                finalDamage -= targetUnit.shieldHp;
                addLog(
                  `💥 【${targetUnit.label}】的魔力護盾被擊碎！承受溢出的 ${finalDamage} 點傷害。`
                );
                targetUnit.shieldHp = 0;
              }
            }
          }

          // 【吸血機制】
          const hasLifeSteal =
            attacker.tags?.includes("吸血") ||
            attacker.label.includes("狂戰士") ||
            attacker.label.includes("送葬者");
          if (hasLifeSteal && finalDamage > 0) {
            const lifesteal = Math.floor(finalDamage * 0.3); // 統一原稿吸血比例
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + lifesteal);
            const attackerCellId = Object.keys(currentBoard).find(
              (key) => currentBoard[key]?.id === attacker.id
            );
            if (attackerCellId) {
              triggerFloatingText(
                attackerCellId,
                `🩸吸血+${lifesteal}`,
                "miss"
              );
            }
          }

          // 【反傷聖盾 / 荊棘復仇機制】
          if (
            targetUnit.label.includes("黑暗十字軍") ||
            targetUnit.label.includes("聖堂武士")
          ) {
            const reflectDmg = Math.floor(finalDamage * 0.3);
            attacker.hp = Math.max(1, attacker.hp - reflectDmg);
            addLog(
              `🛡️ 【${targetUnit.label}】觸發反傷！加倍奉還 ${reflectDmg} 點傷害給【${attacker.label}】！`
            );
          }

          // ==========================================
          // 💥 5. 實質扣血與浮動文字渲染
          // ==========================================
          targetUnit.hp -= finalDamage;
          triggerCellShake(targetCellId);

          if (isBlocked) {
            triggerFloatingText(targetCellId, `🛡️-${finalDamage}`, "block");
            addLog(
              `🛡️ 【${targetUnit.label}】完美【格擋】！硬抗攻勢，僅受 ${finalDamage} 點輕微創傷。`
            );
          } else if (isSkillAttack) {
            triggerFloatingText(targetCellId, `💥-${finalDamage}`, "damage");
            addLog(
              `💥 【${attacker.label}】釋放技能大招！對【${targetUnit.label}】造成 ${finalDamage} 點毀滅傷害！！`
            );
          } else {
            triggerFloatingText(targetCellId, `-${finalDamage}`, "damage");
            addLog(
              `⚔️ 【${attacker.label}】揮砍出手，對【${targetUnit.label}】造成 ${finalDamage} 點實質創傷。`
            );
          }

          // ==========================================
          // 💀 6. 死亡收割管線
          // ==========================================
          if (targetUnit.hp <= 0) {
            triggerFloatingText(targetCellId, "💀", "damage");
            let deathMessage =
              attacker.faction === "player"
                ? `☠️ 【戰地訃聞】魔物伏誅！【${targetUnit.label}】被我方【${attacker.label}】無情斬殺！`
                : `☠️ 【戰地訃聞】部隊陣亡！【${targetUnit.label}】在【${attacker.label}】的猛烈攻勢下力戰身亡……`;

            addLog(deathMessage);
            targetUnit.hp = 0;
            targetUnit.isDead = true;
            currentBoard[targetCellId] = null;
          }
        };

        const processedUnitIds = new Set();

// ─── 🏃 網格行動與排兵技能掃描（Nep 空間避讓與直線秩序完全整合版） ───
for (let r = 0; r < GRID_ROWS; r++) {
  for (let c = 0; c < GRID_COLS; c++) {
    const currentCellId = `cell-${r}-${c}`;
    const unit = nextBoard[currentCellId];

    if (!unit || unit.hp <= 0) continue;
    if (processedUnitIds.has(unit.id)) continue;
    processedUnitIds.add(unit.id);

    // ===================================================
    // 🧍‍♂️ 【Nep 空間避讓防線】閒置/遠程單位判定後方堵塞時橫向側滑讓路
    // ===================================================
    const isRemoteUnit = (unit.range || 1) > 1;
    const isIdleUnit = unit.visualState === "idle" || !unit.visualState;

    if (unit.faction === FACTIONS.PLAYER && (isRemoteUnit || isIdleUnit)) {
      const behindCellKey = `cell-${r}-${c - 1}`; // 檢查正後方（左側）
      const unitBehind = nextBoard[behindCellKey];

      // 如果正後方死死卡著一隻「手短（range=1）」且想直線衝鋒前進的我方戰友
      if (unitBehind && unitBehind.faction === FACTIONS.PLAYER && (unitBehind.range || 1) === 1) {
        const upCellKey = `cell-${r - 1}-${c}`;
        const downCellKey = `cell-${r + 1}-${c}`;
        let evadeCellId = null;

        // 優先翻查自己「上方」或「下方」是否真空，有空位就側滑
        if (r - 1 >= 0 && !nextBoard[upCellKey]) evadeCellId = upCellKey;
        else if (r + 1 < GRID_ROWS && !nextBoard[downCellKey]) evadeCellId = downCellKey;

        // 🟢 成功側滑避讓，打通直行主幹道！
        if (evadeCellId) {
          nextBoard[evadeCellId] = unit;
          nextBoard[currentCellId] = null; // 騰出當前位置
          unit.nextActionTime = currentTickTime + 200; // 給予極小的位移僵直
          addLog(`💨 【${unit.label}】偵測到近戰隊友衝鋒，主動向側邊滑開一格！`);
          continue; // 位置已讓出，結束本輪該格點算，交棒給後方近戰
        }
      }
    }

    const rawLabelU = unit.label ? String(unit.label) : "";
    const uKey =
      unit.blueprintKey ||
      unit.enemyType ||
      rawLabelU.replace(/[^\u4e00-\u9fa5+·]/g, "");
    const uBlueprint =
      UNIT_BLUEPRINTS[uKey] ||
      ENEMY_BLUEPRINTS[uKey] ||
      ENEMY_BLUEPRINTS[uKey.toLowerCase()];
    let uTags = uBlueprint?.tags || [];
    if (
      rawLabelU.includes("牧師") ||
      rawLabelU.includes("賢者") ||
      rawLabelU.includes("祭司")
    )
      uTags = [...uTags, "補血"];

    // 中毒掉血
    if (unit.isPoisoned && currentTickTime % 1000 === 0) {
      if (unit.poisonTicks > 0) {
        const poisonDmg = Math.max(
          8,
          Math.floor((unit.maxHp || 400) * 0.05)
        );
        unit.hp -= poisonDmg;
        triggerFloatingText(currentCellId, `-${poisonDmg}☣️`, "damage");
        unit.poisonTicks--;

        if (unit.hp <= 0) {
          triggerFloatingText(currentCellId, "💀", "damage");
          addLog(
            `☠️ 【劇毒身亡】毒發身亡！【${unit.label}】毒素攻心，痛苦地倒在戰場上……`
          );
          nextBoard[currentCellId] = null;
          continue;
        }
      } else {
        unit.isPoisoned = false;
      }
    }

    // ─── ⛪ 【核心修復】牧師與 CROSS 系列通用被動補血掃描管線 ───
    if (
      uTags.includes("補血") &&
      unit.faction === FACTIONS.PLAYER &&
      unit.nextActionTime <= currentTickTime
    ) {
      let lowestUnitCellId = null;
      let lowestHpRatio = 1.0;

      // 1. 掃描全戰場，找出目前血量百分比最低的受傷隊友
      Object.keys(nextBoard).forEach((k) => {
        const ally = nextBoard[k];
        if (
          ally &&
          ally.faction === FACTIONS.PLAYER &&
          ally.hp > 0 &&
          ally.hp < ally.maxHp
        ) {
          const ratio = ally.hp / ally.maxHp;
          if (ratio < lowestHpRatio) {
            lowestHpRatio = ratio;
            lowestUnitCellId = k;
          }
        }
      });

      // 2. 如果場上有需要治療的隊友，立刻發動聖光治癒
      if (lowestUnitCellId) {
        const targetAlly = nextBoard[lowestUnitCellId];
        const healPower = Math.floor(unit.atk * 1.5);

        targetAlly.hp = Math.min(
          targetAlly.maxHp,
          targetAlly.hp + healPower
        );

        triggerFloatingText(
          lowestUnitCellId,
          `+${healPower}💚`,
          "miss",
          "#10b981"
        );

        addLog(
          `💚 【${unit.label}】釋放治癒聖光，為受創的【${targetAlly.label}】灌注春風生命力，療癒 ${healPower} 點生命！</span>`
        );

        const actionCooldown = unit.attackSpeed
          ? unit.attackSpeed * 1000
          : 1200;
        unit.nextActionTime = currentTickTime + actionCooldown;

        continue; // 成功執行本職工作，直接跳過後面的「索敵去敲怪」邏輯
      }
    }

    if (unit.nextActionTime > currentTickTime) continue;

    let finalCd = unit.cd || 1000;

    // 🤖 機兵加壓
    if (rawLabelU.includes("機兵")) {
      let humanSteamHelper = 0;
      const leftNeighbor = nextBoard[`cell-${r}-${c - 1}`];
      const rightNeighbor = nextBoard[`cell-${r}-${c + 1}`];
      if (
        leftNeighbor &&
        leftNeighbor.faction === FACTIONS.PLAYER &&
        leftNeighbor.hp > 0 &&
        !leftNeighbor.label.includes("機兵")
      )
        humanSteamHelper++;
      if (
        rightNeighbor &&
        rightNeighbor.faction === FACTIONS.PLAYER &&
        rightNeighbor.hp > 0 &&
        !rightNeighbor.label.includes("機兵")
      )
        humanSteamHelper++;
      if (humanSteamHelper > 0) {
        finalCd = Math.max(500, finalCd - humanSteamHelper * 350);
      }
    }

// ─── 🎯 穩定版索敵管線（Nep 巨型王體積與遠程定點秩序修正版） ───
let targetCellId = null;
let minDistance = Infinity;
let targetCoord = null;
let actualDistance = Infinity;

for (let tr = 0; tr < GRID_ROWS; tr++) {
  for (let tc = 0; tc < GRID_COLS; tc++) {
    const checkCellId = `cell-${tr}-${tc}`;
    const target = nextBoard[checkCellId];
    if (
      target &&
      target.faction !== unit.faction &&
      target.hp > 0
    ) {
      let dist = Math.abs(c - tc) + Math.abs(r - tr);
      let realDist = dist;

      // 🎯 巨型王體積修正：如果對方是王，因為王佔據大面積，在程式判定上將距離直接扣減
      // 這樣近戰兵只要在王的身邊（真實距離 2~3 內），在邏輯裡就會被修正為 1，直接觸發交戰！
      if (target.isBoss) {
        dist = Math.max(1, dist - 2); 
      }

      if (dist < minDistance) {
        minDistance = dist;
        actualDistance = realDist;
        targetCellId = checkCellId;
        targetCoord = { r: tr, c: tc };
      }
    }
  }
}

// 🛑 【防呆第一道防線】如果戰場上完全沒有任何活著的敵方目標，直接原地待命
if (!targetCellId || !targetCoord) {
  unit.visualState = "idle";
  unit.nextActionTime = currentTickTime + 500;
  continue;
}

// ─── ⚔️ 主動攻擊與技能大招結算判定 ───
const currentRange = unit.range || 1;

// 💡 核心邏輯咬合：只要計算出來的修正距離 (minDistance) 小於等於自身射程，立刻開打！
if (minDistance <= currentRange) {
  const target = nextBoard[targetCellId];
  let finalAtk = unit.atk || 40;

  if (unit.skillCount === undefined) unit.skillCount = 0;
  const isCooldownReady = unit.skillCount >= 3;

  // 1. 動態點算全戰場上「與該單位相同幾何形狀」的我方英雄總數量 (含本體)
  const currentShape = unit.shape ? unit.shape.toLowerCase() : "circle";
  const sameShapeCount = Object.values(nextBoard).filter(
    (u) => u && u.faction === FACTIONS.PLAYER && u.hp > 0 && (u.shape ? u.shape.toLowerCase() : "") === currentShape
  ).length;

  // 2. 初始化該傳奇/英雄的大招可用庫存 (每局開場鎖死 = 同形狀徽記總數)
  if (unit.skillStock === undefined) {
    unit.skillStock = sameShapeCount; 
  }

  // 💡 文字流骨架變數：用來記錄這道動作要額外「卡肉定格」多久
  let hitstopDelay = 0;

  // 3. 核心大招發動判定分流：冷卻好了，且「必須還有徽記大招庫存」
  if (isCooldownReady && unit.skillStock > 0) {
    unit.skillStock--; 
    
    const synergyMultiplier = 1 + (sameShapeCount * 0.25); 
    finalAtk = unit.skillAtk || Math.floor(finalAtk * 1.5);
    finalAtk = Math.floor(finalAtk * synergyMultiplier); 

    unit.visualState = "crit-hit";
    hitstopDelay = 600; // 🎯 大招定格 0.6 秒，讓玩家看清楚大招對白與震撼感

    if (unit.skillQuote) {
      triggerFloatingText(
        currentCellId,
        `${unit.skillIcon || "🔮"} [大招餘${unit.skillStock}次] ${unit.skillQuote}`,
        "skill-cast",
        unit.skillColor || "#f59e0b"
      );

      if (
        unit.isBoss ||
        (unit.tags &&
          (unit.tags.includes("吸血") ||
            unit.tags.includes("格擋")))
      ) {
        triggerCellShake && triggerCellShake(targetCellId);
      }

      addLog(
        `<span style="color: ${
          unit.skillColor || "#f59e0b"
        }; font-weight: bold;">【${unit.label}】消耗徽記！引爆 ${Math.floor(synergyMultiplier * 100)}% 威力大招：${
          unit.skillQuote
        }</span>`
      );
    }

    const uTags = unit.tags || [];

    if (uTags.includes("補血") || uTags.includes("光明")) {
      const healPower = Math.floor(unit.atk * 1.8 * synergyMultiplier); 
      unit.hp = Math.min(unit.maxHp, (unit.hp || 0) + healPower);
      triggerFloatingText(currentCellId, `🟢+${healPower} 治癒`, "heal", "#10b981");
      addLog(`☀️ 【${unit.label}】聖光發動：實質回復了自身 ${healPower} 點生命值！`);
    }

    if (uTags.includes("吸血")) {
      const siphonAmt = Math.floor(finalAtk * 0.5);
      unit.hp = Math.min(unit.maxHp, (unit.hp || 0) + siphonAmt);
      triggerFloatingText(currentCellId, `🩸+${siphonAmt} 吸血`, "heal", "#ef4444");
      addLog(`🩸 【${unit.label}】觸發嗜血特性：從目標身上吸取 ${siphonAmt} 點生命！`);
    }

    if (uTags.includes("魔力護盾")) {
      const shieldAmt = Math.floor(unit.atk * 2.0);
      unit.shield = (unit.shield || 0) + shieldAmt;
      triggerFloatingText(currentCellId, `🔮+${shieldAmt} 護盾`, "shield", "#a855f7");
      addLog(`🔮 【${unit.label}】魔力護盾充能：獲得 ${shieldAmt} 點奧術護盾！`);
    }

    if (uTags.includes("暗") || uTags.includes("毒")) {
      const baseEva = unit.eva || 0;
      unit.eva = baseEva + 60;
      setTimeout(() => {
        unit.eva = baseEva;
      }, 1200);
      addLog(`⚡ 【${unit.label}】融入陰影：閃避率短暫暴增 60%！`);
    }

    if (uTags.includes("火") || uTags.includes("電")) {
      if (target) {
        target.def = Math.max(0, (target.def || 0) - 8);
        addLog(`💥 【${unit.label}】元素爆裂：灼燒/破載了敵方防線，削弱 8 點防禦！`);
      }
    }

    if (uTags.includes("格擋")) {
      unit.isPerfectBlocking = true;
      addLog(`🛡️ 【${unit.label}】擺出格擋架勢：下一輪受到的物理傷害將大幅減免！`);
    }

    internalDamagePipeline(unit, target, finalAtk, targetCellId, nextBoard);
    unit.skillCount = 0; 
  } 
  // 🪓 4. 【退化判定】大招次數用光，降格觸發基底被動
  else if (isCooldownReady && unit.skillStock <= 0) {
    unit.visualState = "normal-attack";
    unit.skillCount = 0; 
    hitstopDelay = 400; // 🎯 被動觸發定格 0.4 秒

    const uShape = currentShape;
    addLog(`⚠️ 【${unit.label}】幾何徽記能量耗盡！大招封印，降格觸發【${uShape.toUpperCase()}】基底被動！`);

    if (uShape === "circle") {
      const circleShield = Math.floor(unit.maxHp * 0.15);
      unit.shield = (unit.shield || 0) + circleShield;
      triggerFloatingText(currentCellId, `🛡️「徽記過載・鐵壁！」+${circleShield}`, "shield", "#38bdf8");
    }
    if (uShape === "diamond") {
      finalAtk = Math.floor(finalAtk * 4.0); 
      unit.visualState = "crit-hit";
      triggerFloatingText(currentCellId, `⚡「純粹撕裂！」✨`, "skill-cast", "#f59e0b");
    }
    if (uShape === "square" && unit.hp / unit.maxHp <= 0.2) {
      const squareHeal = Math.floor(unit.maxHp * 0.15);
      unit.hp = Math.min(unit.maxHp, (unit.hp || 0) + squareHeal);
      triggerFloatingText(currentCellId, `💚「死線甦醒！」+${squareHeal}`, "heal", "#10b981");
    }
    if (uShape === "triangle-up" || uShape === "tri_up") {
      finalAtk = Math.floor(finalAtk * 2.0);
      unit.visualState = "crit-hit";
      triggerFloatingText(currentCellId, `🔺「雙重突破！」💥`, "skill-cast", "#ef4444");
    }
    if (uShape === "triangle-down" || uShape === "tri_down") {
      const mageShield = Math.floor(finalAtk * 0.3);
      unit.shield = (unit.shield || 0) + mageShield;
      triggerFloatingText(currentCellId, `🔮「反脈衝增幅！」+${mageShield}`, "shield", "#a855f7");
    }

    internalDamagePipeline(unit, target, finalAtk, targetCellId, nextBoard);
  } 
  // ⚔️ 5. 常規未上膛狀態：執行普通攻擊（動態文字流注入！）
  else {
    unit.visualState = "normal-attack";
    unit.skillCount = (unit.skillCount || 0) + 1;
    hitstopDelay = 150; // 🎯 普攻輕微卡肉 0.15 秒，營造拳拳到肉的打擊頓挫感

    // 📝 根據單位特徵動態分流噴出普攻對白與 Emoji 特效
    const unitLabel = unit.label || "";
    let attackText = "⚔️ 揮擊！";
    let textColor = "#ffffff";

    if (unitLabel.includes("龍騎士")) {
      attackText = "🔱「連環槍突刺！」";
      textColor = "#38bdf8";
    } else if (unitLabel.includes("忍者")) {
      attackText = "🗡️「背刺・瞬斬！」";
      textColor = "#a855f7";
    } else if (unitLabel.includes("浪人")) {
      finalAtk = Math.floor(finalAtk * 1.4);
      attackText = "🏮「一刀流・燕返！」";
      textColor = "#f59e0b";
    } else if (unitLabel.includes("聖堂武士")) {
      attackText = "🛡️「神聖盾擊！」";
      textColor = "#fae8ff";
    } else if (unitLabel.includes("機兵")) {
      attackText = "⚙️「重炮轟炸！」";
      textColor = "#ef4444";
    } else if (unitLabel.includes("弓箭手")) {
      if (minDistance >= 4) finalAtk = Math.floor(finalAtk * 2.0);
      attackText = "🏹「強襲狙擊！」";
      textColor = "#60a5fa";
    } else if (unitLabel.includes("牧師")) {
      // 檢查是否有被貼臉（牧師慌亂呼救機制）
      if (minDistance === 1) {
        attackText = "😭「救命！被貼臉了！」";
        textColor = "#ef4444";
      } else {
        attackText = "✨「聖光微療」";
        textColor = "#10b981";
      }
    } else if (currentShape === "circle") {
      attackText = "✊「盾砸！」";
      textColor = "#94a3b8";
    } else if (currentShape === "diamond") {
      attackText = "⚡「刺擊！」";
      textColor = "#f43f5e";
    }

    // 噴發普攻文字動畫！
    triggerFloatingText(currentCellId, attackText, "normal-attack", textColor);

    internalDamagePipeline(unit, target, finalAtk, targetCellId, nextBoard);
  }

  // ⏰ 計算最終冷卻時間
  let attackCooldown = unit.attackSpeed ? unit.attackSpeed * 1000 : finalCd;

  if (rawLabelU.includes("浪人")) {
    attackCooldown = Math.floor(attackCooldown * 0.4);
  }
  if (unit.visualState === "enemy-enraged-aura") {
    attackCooldown = Math.floor(attackCooldown * 0.8);
  }

  // 🎯 【骨架終端控制】：原本的移動/攻擊時間，再加上我們設定的「對白卡肉延時」！
  // 這樣字串跳出來的時候，單位會剛好定格在那裡，等冷卻走完再動，字就不會重疊閃過！
  unit.nextActionTime = currentTickTime + (attackCooldown * 1.5) + (hitstopDelay * 2.0);
  unit.visualState = "idle";
} else {
  // ─── 🏃 移動拉扯邏輯：只有在打不到怪時才執行 ───
  // 🛠️ 秩序修正：如果單位在「實際真實射程」內，強行原地待命，嚴禁到處亂跳亂踩格子
  const newestDist = Math.abs(targetCoord.r - r) + Math.abs(targetCoord.c - c);
      
  if (newestDist <= currentRange) {
    unit.visualState = "idle";
    // 降低原地發呆等待時間（從 300ms 降到 150ms），大幅提升對突發動態的反應速度
    unit.nextActionTime = currentTickTime + 150; 
    nextBoard[currentCellId] = unit;
    continue;
  }

  // 真正超出射程需要前進、尋找包抄路徑
// ===================================================
  // 📐 【Nep 動態軸向秩序防線】打破死板的上下優先順序
  // ===================================================
  const deltaR = targetCoord.r - r; // 縱向真實距離與方向
  const deltaC = targetCoord.c - c; // 橫向真實距離與方向

  // 🎯 根據與目標的真實相對位置，動態決定最優格子排在陣列的最前面！
  const candidates = [];

  // 如果橫向距離差得比縱向遠，就把「左/右」排在最前面優先考慮
  if (Math.abs(deltaC) >= Math.abs(deltaR)) {
    // 怪在右邊就先考慮右，否則先考慮左
    if (deltaC > 0) candidates.push({ nr: r, nc: c + 1, dir: "h" });
    else candidates.push({ nr: r, nc: c - 1, dir: "h" });
    
    // 隨後補上縱向
    if (deltaR > 0) candidates.push({ nr: r + 1, nc: c, dir: "v" });
    else candidates.push({ nr: r - 1, nc: c, dir: "v" });
  } 
  // 如果縱向距離差得比較遠，就把「上/下」排在最前面優先考慮
  else {
    if (deltaR > 0) candidates.push({ nr: r + 1, nc: c, dir: "v" });
    else candidates.push({ nr: r - 1, nc: c, dir: "v" });
    
    if (deltaC > 0) candidates.push({ nr: r, nc: c + 1, dir: "h" });
    else candidates.push({ nr: r, nc: c - 1, dir: "h" });
  }

  // 把剩下的兩個相反方向塞進去當作最後的兜底逃生口
  const allDirs = [
    { nr: r - 1, nc: c, dir: "v" },
    { nr: r + 1, nc: c, dir: "v" },
    { nr: r, nc: c - 1, dir: "h" },
    { nr: r, nc: c + 1, dir: "h" }
  ];
  for (let d of allDirs) {
    if (!candidates.some(c => c.nr === d.nr && c.nc === d.nc)) {
      candidates.push(d);
    }
  }

  // 💡 以下完全保留你原本健康的權重與位移結算，一字不差
  let bestCellId = null;
  let bestWeight = -Infinity; // 權重越高越好

  for (let cand of candidates) {
    if (
      cand.nr >= 0 &&
      cand.nc >= 0 &&
      cand.nr < GRID_ROWS &&
      cand.nc < GRID_COLS
    ) {
      const checkCellId = `cell-${cand.nr}-${cand.nc}`;

      // 核心記憶防線：絕對不走回頭路（上一輪剛離開的格子）
      if (unit.lastCellId === checkCellId) {
        continue; 
      }

      // 只走乾淨的太空位
      if (!nextBoard[checkCellId]) {
        const oldDist = Math.abs(targetCoord.r - r) + Math.abs(targetCoord.c - c);
        const newDist = Math.abs(targetCoord.r - cand.nr) + Math.abs(targetCoord.c - cand.nc);
        
        // 🎯 【近戰包抄機制】
        let baseScore = 0;
        if (newDist < oldDist) baseScore = 20;
        if (newDist > oldDist) baseScore = -20;

        // 🎯 【Nep 直線秩序軸向權重】
        const deltaR_Abs = Math.abs(targetCoord.r - r);
        const deltaC_Abs = Math.abs(targetCoord.c - c);
        
        let bias = 0;
        // 縱向差距大時，優先給縱向移動加分
        if (deltaR_Abs > deltaC_Abs && cand.dir === "v") bias = 10;
        // 橫向差距大時，優先給橫向移動加分
        if (deltaC_Abs > deltaR_Abs && cand.dir === "h") bias = 10;

        // 最終權重計算
        const weight = baseScore + bias;

        if (weight > bestWeight) {
          bestWeight = weight;
          bestCellId = checkCellId;
        }
      }
    }
  }

  // 如果四周都被堵住（真正塞車）
  if (!bestCellId) {
    unit.visualState = "idle";
    unit.nextActionTime = currentTickTime + 400; 
    nextBoard[currentCellId] = unit; 
    continue; 
  }

  // 成功位移（前前進或繞路包抄）
  const moveCooldown = unit.moveSpeed ? unit.moveSpeed * 1000 : 1000;
  unit.nextActionTime = currentTickTime + moveCooldown;

  unit.lastCellId = currentCellId; 
  nextBoard[bestCellId] = unit;
  nextBoard[currentCellId] = null; 
  continue;
}
  }
}

        // 天災更新維持
        return nextBoard;
      });
    }, TICK_RATE);
    return () => clearInterval(timerRef.current);
  }, [gameState, currentBattleType, darkness, daysLeft, activeBlessing]);

  const confirmBattleResolution = () => {
    // =======================================================
    // ⚔️ 突圍戰役結算與天災黑闇加深管線（完全體修復版）
    // =======================================================
    const nextDays = daysLeft - 1;
    const isFinalBossFight = daysLeft <= 1;
    setDaysLeft(nextDays);

    // 🎯 核心天災修正：隨著天數變少，黑闇值基礎加深（每天增加 16.6%）
    // 第 7 天打完變第 6 天：增加 16.6%
    // 第 2 天打完變第 1 天（Boss日）：直接拉滿到 100%
    setDarkness((prev) => {
      const baseDarknessForNextDay = Math.floor((7 - nextDays) * 16.6);
      // 繼承之前的數值並與新天數的黑闇底線取最大值，確保黑闇無法隨便被玩家刷到不符合天數的低點
      return Math.min(100, Math.max(baseDarknessForNextDay, prev));
    });

    const survivingPlayerUnits = {};
    Object.keys(boardState).forEach((key) => {
      const unit = boardState[key];
      if (unit && unit.faction === FACTIONS.PLAYER && unit.hp > 0)
        survivingPlayerUnits[unit.id] = {
          ...unit,
          nextActionTime: 0,
          skillCount: 0,
        };
    });

    if (deploySnapshotRef.current) {
      const nextBoard = cloneBoardState(deploySnapshotRef.current);
      const deadUnitNames = [];
      Object.keys(nextBoard).forEach((key) => {
        const originalUnit = nextBoard[key];
        if (originalUnit) {
          const currentStatus = survivingPlayerUnits[originalUnit.id];
          if (currentStatus) nextBoard[key] = currentStatus;
          else {
            deadUnitNames.push(originalUnit.label);
            nextBoard[key] = null;
          }
        }
      });
      Object.keys(nextBoard).forEach((key) => {
        if (nextBoard[key] && nextBoard[key].faction === FACTIONS.ENEMY)
          nextBoard[key] = null;
      });
      setBoardState(nextBoard);
      if (deadUnitNames.length > 0)
        addLog(`☠️ 傷亡報告：你失去了英雄【${deadUnitNames.join("、")}】！`);
    }

    if (gameState === "win") {
      if (isFinalBossFight) {
        alert("🎉【真・史詩大捷】你成功擊碎了終極舊日支配者！黎明降臨！");
        fullResetGame();
        return;
      }

      let gainedScore = 25;
      if (currentBattleType === "elite") {
        gainedScore = 50;
        setMaxDeployLimit((prev) => prev + 1);
        addLog("🎁 高危戰區回饋：部隊最大部署人數限制 +1 人！");
      }
      if (currentBattleType === "unknown")
        gainedScore = Math.random() < 0.5 ? 30 : 65;

      setScore((prev) => prev + gainedScore);

      // 🥇 玩家大捷回饋：清除魔物能物理淨化世界「減光 25%」，這行現在 100% 安全不會噴錯了！
      setDarkness((prev) => Math.max(0, prev - 25));

      setCurrentWave((prev) => prev + 1);
      addLog(`⚔️ 突圍成功獲得 +${gainedScore} 戰鬥積分！`);
    }

    if (nextDays <= 0 && gameState !== "win") setGameState("game_over");
    else {
      setGameState("map_view");

      // 🎯 核心修正：突圍成功或失敗點算完後，回到地圖時「立刻執行刷新商店」
      refreshShop();

      // 🎲 提案 C：每突圍一波，25% 機率觸發荒野隨機命運奇遇事件
      if (Math.random() < 0.25) {
        const rolledEvent =
          RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        setCurrentEvent(rolledEvent);
      }
    }
  };

  const handleMapEvent = (type) => {
    if (type === "altar_trigger") {
      if (hasPromotedThisGame) {
        addLog("🏰 聖壇微弱地閃爍...本局轉職次數已達到上限！");
        return;
      }
      setIsAltarActive(true);
      setGameState("setup");
      return;
    }
    if (
      type === "battle_normal" ||
      type === "battle_elite" ||
      type === "battle_unknown"
    ) {
      const typeMapping = {
        battle_normal: "normal",
        battle_elite: "elite",
        battle_unknown: "unknown",
      };
      setCurrentBattleType(typeMapping[type]);
      setGameState("setup");
    }
  };

  const fullResetGame = () => {
    setBoardState({});
    setBenchUnits([]);
    setSelectedTalent(null);
    setDarkness(100);
    setDaysLeft(7);
    setMaxDeployLimit(3);
    setCurrentWave(1);
    setHasPromotedThisGame(false);
    setIsAltarActive(false);
    setScore(0);
    setCurrentBattleType("normal");
    setActiveBlessing(null);
    setCurrentEvent(null);
    setGlobalAtkBonus(0);
    setGameState("faction_select");
  };

  if (gameState === "faction_select")
    return <FactionSelect onSelectFaction={handleSelectFaction} />;

  if (gameState === "map_view") {
    // 🎯 核心變色邏輯：如果是最後一天（daysLeft <= 1），外層 className 動態注入魔王污染天色！
    const isBossApproaching = daysLeft <= 2;
    const mapClass = `map-page-container ${
      isBossApproaching ? `boss-${currentBossType.toLowerCase()}` : ""
    }`;

    return (
<div className={mapClass}>
        {/* 🎲 提案 C：命運隨機奇遇蓋板選單 */}
        {currentEvent && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.88)",
              zIndex: 999999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#111",
                border: "2px dashed #f59e0b",
                padding: "30px",
                borderRadius: "8px",
                maxWidth: "500px",
                width: "90%",
                textAlign: "center",
              }}
            >
              <h2 style={{ color: "#ef4444", marginTop: 0, fontSize: "24px" }}>
                {currentEvent.title}
              </h2>
              <p style={{ color: "#ddd", lineHeight: "1.6", fontSize: "14px" }}>
                {currentEvent.text}
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginTop: "25px",
                }}
              >
                {currentEvent.options.map((opt, idx) => {
                  const canChoose = opt.action({ points: score });
                  return (
                    <button
                      key={idx}
                      disabled={!canChoose}
                      onClick={() => {
                        let scope = {
                          points: score,
                          gainUnit: null,
                          globalAtkBonus: 0,
                          hpPenalty: 0,
                        };
                        opt.run(scope);

                        setScore(scope.points);
                        if (scope.globalAtkBonus > 0) {
                          setGlobalAtkBonus(
                            (prev) => prev + scope.globalAtkBonus
                          );
                          // 全場備戰區活人立增 ATK
                          setBenchUnits((prev) =>
                            prev.map((u) => ({
                              ...u,
                              atk: u.atk + scope.globalAtkBonus,
                            }))
                          );
                        }
                        if (scope.hpPenalty > 0) {
                          setBenchUnits((prev) =>
                            prev.map((u) => ({
                              ...u,
                              hp: Math.max(
                                1,
                                Math.floor(u.hp * (1 - scope.hpPenalty))
                              ),
                            }))
                          );
                        }

                        // ─── 🤖 核心修正：發放英雄防線 ───
                        if (scope.gainUnit) {
                          let finalUnitKey = scope.gainUnit;

                          // 💡 跨維度相容：如果隨機事件寫 "STEAM_MECH"，強行扭轉對齊 "MECHANIZED"
                          if (finalUnitKey === "STEAM_MECH") {
                            finalUnitKey = "MECHANIZED";
                          }

                          const bprint = UNIT_BLUEPRINTS[finalUnitKey];

                          if (bprint) {
                            setBenchUnits((prev) => [
                              ...prev,
                              createUnitInstance(bprint, FACTIONS.PLAYER),
                            ]);
                            addLog(
                              `🎉 奇遇發放成功：獲得 🤖【${bprint.label}】！`
                            );
                          } else {
                            console.error(
                              `🚨 無法發放單位，找不到藍圖 Key: ${finalUnitKey}`
                            );
                            addLog("🚨 系統錯誤：未找到該單位的註冊藍圖！");
                          }
                        }

                        // ─── 🎰 新增擴充奇遇後端數值處理管線 ───

                        // 1. 流浪商人的黑吃黑：懲罰黑暗值暴增
                        if (scope.darknessPenalty) {
                          setDarkness((prev) =>
                            Math.min(100, prev + scope.darknessPenalty)
                          );
                        }

                        // 2. 流浪商人的大打包：直接抓 SHOP_ITEMS 隨機挑三件裝備塞給備戰區的人
                        if (
                          scope.triggerMegaBundleItem &&
                          benchUnits.length > 0
                        ) {
                          setBenchUnits((prev) => {
                            let updated = [...prev];
                            for (let i = 0; i < 3; i++) {
                              const randomUnitIdx = Math.floor(
                                Math.random() * updated.length
                              );
                              const randomItem =
                                SHOP_ITEMS[
                                  Math.floor(Math.random() * SHOP_ITEMS.length)
                                ];
                              let u = { ...updated[randomUnitIdx] };
                              randomItem.effect(u);
                              updated[randomUnitIdx] = u;
                            }
                            return updated;
                          });
                        }

                        // 3. 遺落的聖杯：50% 機率免費覺醒轉職 / 50% 暴斃
                        if (scope.gambleHolyGrail && benchUnits.length > 0) {
                          const roll = Math.random();
                          if (roll < 0.5) {
                            // 覺醒成功！幫備戰區第一個人挑選適合他的高階職業
                            setBenchUnits((prev) => {
                              let updated = [...prev];
                              let u = { ...updated[0] };

                              // 🎯 修正 1：建立完美對齊 UNIT_BLUEPRINTS 的精確映射，並補上 cross 牧師
                              const proMap = {
                                circle: "DARK_CRUSADER", // 坦克 ➡️ 黑暗十字軍
                                square: "BERSERKER", // 戰士 ➡️ 狂戰士
                                diamond: "UNDERTAKER", // 刺客 ➡️ 送葬者
                                "triangle-down": "WARLOCK", // 法師 ➡️ 術士
                                "triangle-up": "SPELLBOW", // 弓箭手 ➡️ 魔弓手
                                cross: "SAGE", // 牧師 ➡️ 大賢者
                              };

                              // 🎯 修正 2：後備 Key 改為絕對存在的 "GUARDIAN"
                              const proKey = proMap[u.shape] || "TEMPLAR";

                              // 🎯 修正 3：放棄 PRO_CLASSES，全面改向 UNIT_BLUEPRINTS 讀取完全體數值
                              const proBlueprint = UNIT_BLUEPRINTS[proKey];

                              if (proBlueprint) {
                                u.proClass = proKey;
                                u.blueprintKey = proKey;
                                u.label = proBlueprint.label;
                                u.shape = proBlueprint.shape;

                                // 🎯 修正 4：改為直接覆蓋完全體數值，不使用舊版 Bonus 累加，防止出現 NaN
                                u.maxHp = proBlueprint.maxHp;
                                u.hp = proBlueprint.maxHp; // 飛升當場回滿血
                                u.def = proBlueprint.def;
                                u.atk = proBlueprint.atk;
                                u.cd = proBlueprint.cd;
                                u.blk =
                                  proBlueprint.blk !== undefined
                                    ? proBlueprint.blk
                                    : u.blk || 0;
                                u.eva =
                                  proBlueprint.eva !== undefined
                                    ? proBlueprint.eva
                                    : u.eva || 0;
                                u.isAdvanced = true;
                                u.visualState = "unit-promotion-glow"; // 注入金色發光特效
                              }

                              updated[0] = u;
                              return updated;
                            });
                            addLog(
                              "🍷【聖杯神蹟】你的先鋒英雄喝下液體後雙眼泛起金芒，免消耗積分直接神聖覺醒！"
                            );
                          } else {
                            // 暴斃！備戰區第一個人當場融化
                            const deadLabel = benchUnits[0].label;
                            setBenchUnits((prev) => prev.slice(1));
                            (
                              `🍷【聖杯劇毒】劇毒噬骨！你的英雄【${deadLabel}】發出淒厲慘叫，當場融化成一灘血水！`
                            );
                          }
                        }
                        setCurrentEvent(null);
                        addLog("🎲 命運齒輪轉動，奇遇決斷已生效！");
                      }}
                      className="route-node"
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        cursor: canChoose ? "pointer" : "not-allowed",
                        opacity: canChoose ? 1 : 0.4,
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        color: "#fff",
                      }}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <MapView
          daysLeft={daysLeft}
          darkness={darkness}
          maxDeployLimit={maxDeployLimit}
          currentWave={currentWave}
          onMapEvent={handleMapEvent}
          score={score}
          hasPromotedThisGame={hasPromotedThisGame}
          currentBossType={currentBossType}
        />

        {/* 🟢 【核心修復】卡死條件鎖：只有在 map_view 且沒有彈出奇遇事件時，下排商店才準渲染 */}

      </div>
    );
  }

  if (gameState === "game_over")
    return (
      <div className="App game-over-screen">
        <h1 className="danger-text">💀 全軍覆沒於黑夜</h1>
        <p style={{ maxWidth: "500px", color: "#aaa" }}>
          你未能擊敗終極魔王。精英小隊官方傷亡...
        </p>
        <button onClick={fullResetGame} className="restart-btn">
          重入輪迴
        </button>
      </div>
    );

  return (
    <div className="App" style={{ position: "relative" }}>
      {/* 🎬 終極硬派：黑魔法 CSS 手切遊戲封面 (Title Screen) */}
      {gameState === "title_screen" && (
        <div className="title-screen-container">
          {/* 舊日神話之瞳視覺核心 */}
          {/* 舊日神話之瞳視覺核心 ── 🎯 幾何多重領域展開補丁 */}
          <div className="mythic-eye">
            <div className="mythic-eye-ring-outer"></div>{" "}
            {/* 🪐 最外層慢速金紫方陣 */}
            <div className="mythic-eye-ring"></div>{" "}
            {/* 🌋 中層順時針岩漿方陣 */}
            <div className="mythic-eye-ring-inner"></div>{" "}
            {/* ⚡ 內層逆時針虛光高頻方陣 */}
            <div className="mythic-eye-iris"></div> {/* 👁️ 核心核心呼吸之瞳 */}
          </div>

          {/* 硬派標題與副標題 */}
          <div className="game-title">不朽之陣</div>
          <div className="game-subtitle">
            Immortal Formation | Roguelike Autochess | v1.0 [Nep's Edition]
          </div>

          {/* 「進入深淵」開局按鈕 */}
          <button
            className="start-game-btn"
            /* 🎯 點擊按鈕後，正式交棒給「選初始流派」畫面 */
            onClick={() => setGameState("faction_select")}
          >
            ── 🌌 進入深淵 ──
          </button>
        </div>
      )}

      {/* 🎯 修正：只要這局還沒選過祝福（!activeBlessing），且已經進入地圖或備戰（currentWave === 1），開局直接強行蓋板！ */}
      {((!activeBlessing && gameState === "setup" && currentWave === 1) ||
        (!activeBlessing && gameState === "map_view" && currentWave === 1)) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.93)",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              color: "#eab308",
              marginBottom: "35px",
              fontSize: "26px",
              fontWeight: "900",
              letterSpacing: "2px",
            }}
          >
            ── 🕯️ 請選擇本局降臨的女神祝福 ──
          </h2>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: "1100px",
            }}
          >
            {Object.values(GODDESS_BLESSINGS).map((bless) => (
              <div
                key={bless.id}
                /* 🎯 關鍵修正：點擊承接神諭時，不僅記錄祝福，同時正式解鎖放行進入地圖！ */
                onClick={() => {
                  setActiveBlessing(bless.id);
                  setGameState("map_view");
                }}
                className="talent-card"
                style={{
                  width: "230px",
                  minHeight: "180px",
                  border: "2px solid #444",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <h3>{bless.name}</h3>
                <p style={{ fontSize: "13px", color: "#bbb" }}>{bless.desc}</p>
                <button className="select-btn">承接神諭</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hardcore-hud">
        <div>⏳ 倒數計時：{daysLeft} 天</div>
        <div>🔮 黑暗值：{darkness}%</div>
        <div>
          👥 限制上陣：
          {
            Object.values(boardState).filter(
              (u) => u && u.faction === FACTIONS.PLAYER
            ).length
          }
          /{maxDeployLimit} 人
        </div>
        <div>
          🎯 戰鬥積分：
          <span style={{ color: "#4ade80", fontWeight: "bold" }}>
            {score} 分
          </span>
        </div>
        {activeBlessing && (
          <div
            style={{
              borderLeft: "1px solid #444",
              paddingLeft: "15px",
              color: "#eab308",
            }}
          >
            ⭐ 祝福：{GODDESS_BLESSINGS[activeBlessing]?.name.split(" ")[1]}
          </div>
        )}
      </div>

      {gameState === "battle" && activeDialogue && (
        <div className="battle-dialogue-overlay">
          <span className="dialogue-speaker">[{activeDialogue.speaker}]:</span>
          <span className="dialogue-content">{activeDialogue.text}</span>
        </div>
      )}

      {isAltarActive && (
        <h2
          style={{
            color: "#f59e0b",
            border: "2px dashed #f59e0b",
            padding: "10px",
          }}
        >
          🔮 遠古轉職聖壇：點擊下方任何一名英雄進行終身覺醒 (100分)
        </h2>
      )}

      {/* 🔮 轉職彈窗內嵌 UI */}
      {isAltarActive && promotionTargetUnit && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#111",
            border: "3px solid #f59e0b",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.5)",
            zIndex: 100000,
            textAlign: "center",
            minWidth: "280px",
          }}
        >
          <h3 style={{ color: "#f59e0b", margin: "0 0 10px 0" }}>
            ⚡ 聖壇共鳴：【{promotionTargetUnit.label}】高階職業晉升
          </h3>
          <p style={{ fontSize: "12px", color: "#aaa", margin: "0 0 15px 0" }}>
            請指定該英雄的核心覺醒路線（將消耗 100 積分）：
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {promotionTargetUnit.shape === "circle" && (
              <>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "GUARDIAN")
                  }
                >
                  🛡️ 聖騎士 (不滅主坦 ｜ 嘲諷吸怪與殘血神聖大療)
                </button>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "CRUSADER")
                  }
                >
                  🧱 黑暗十字軍 (盾牌猛擊擊退)
                </button>
              </>
            )}
            {promotionTargetUnit.shape === "square" && (
              <>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "BERSERKER")
                  }
                >
                  🪓 狂戰士 (鎖血無敵不滅)
                </button>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "SWORDMASTER")
                  }
                >
                  ⚔️ 大劍師 (全方位旋風斬)
                </button>
              </>
            )}
            {promotionTargetUnit.shape === "diamond" && (
              <>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "UNDERTAKER")
                  }
                >
                  ⚰️ 送葬者 (擊殺吸血收割)
                </button>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "TRAPPER")
                  }
                >
                  🪤 陷阱大師 (開局荊棘地雷)
                </button>
              </>
            )}
            {promotionTargetUnit.shape === "triangle-down" && (
              <>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "WARLOCK")
                  }
                >
                  🔮 術師 (吸血護盾轉換)
                </button>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "ARCHMAGE")
                  }
                >
                  ⚡ 大法師 (技能雙重詠唱)
                </button>
              </>
            )}
            {promotionTargetUnit.shape === "triangle-up" && (
              <>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "SPELLBOW")
                  }
                >
                  🏹 魔弓手 (破防物理穿透)
                </button>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={() =>
                    executePromotion(promotionTargetUnit.id, "RANGER")
                  }
                >
                  🍃 遊俠 (相鄰遭遇後跳閃現)
                </button>
              </>
            )}
            {/* 🎯 補丁核心：強行挽救牧師的十字形轉職面板 */}
            {promotionTargetUnit.shape === "cross" && (
              <>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={
                    () => executePromotion(promotionTargetUnit.id, "BLOOD_MAGE") // 🎯 修正1：轉職 ID 綁定血法師藍圖
                  }
                >
                  🩸 血法師 (禁忌血脈 ｜ 具備大招50%實時吸血與暗系影閃能力)
                </button>
                <button
                  className="pro-btn"
                  style={{ padding: "10px", fontSize: "13px" }}
                  onClick={
                    () => executePromotion(promotionTargetUnit.id, "SAGE") // 🟢 維持大賢者
                  }
                >
                  ✨ 大賢者 (全體神神聖新星 ｜ 具備聖光大範圍灌注生命能力)
                </button>
              </>
            )}
          </div>
          <button
            style={{
              marginTop: "15px",
              background: "#333",
              color: "#ccc",
              border: "none",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => setPromotionTargetUnit(null)}
          >
            取消儀式
          </button>
        </div>
      )}

      {/* 🛒 獨立黑市物資站彈窗 UI */}
      {!isAltarActive && promotionTargetUnit && (
        <div
          className="shop-modal-overlay"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#111",
            border: "3px solid #4ade80",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 0 20px rgba(74, 222, 128, 0.4)",
            zIndex: 100000,
            textAlign: "center",
            minWidth: "300px",
          }}
        >
          <h3 style={{ color: "#4ade80", margin: "0 0 10px 0" }}>
            🛒 戰術黑市：為【{promotionTargetUnit.label}】採購裝備
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxHeight: "250px",
              overflowY: "auto",
            }}
          >
            {SHOP_ITEMS.map((item) => (
              <button
                key={item.id}
                disabled={score < item.cost}
                style={{
                  padding: "10px",
                  background: score >= item.cost ? "#1e293b" : "#334155",
                  color: score >= item.cost ? "#fff" : "#94a3b8",
                  border: `1px solid ${
                    score >= item.cost ? "#4ade80" : "#475569"
                  }`,
                  borderRadius: "4px",
                  cursor: score >= item.cost ? "pointer" : "not-allowed",
                  textAlign: "left",
                }}
                onClick={() => {
                  buyIndependentItem(item, promotionTargetUnit.id);
                  setPromotionTargetUnit(null);
                }}
              >
                <strong>{item.name}</strong> - {item.desc} ({item.cost}分)
              </button>
            ))}
          </div>
          <button
            style={{
              marginTop: "15px",
              background: "#333",
              color: "#ccc",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => setPromotionTargetUnit(null)}
          >
            離開黑市
          </button>
        </div>
      )}

      {(gameState === "win" || gameState === "lose") && (
        <h2
          style={{ color: gameState === "win" ? "#4ade80" : "#f87171" }}
          onClick={confirmBattleResolution}
          className="click-confirm"
        >
          {gameState === "win"
            ? "🎉 戰鬥捷報！點擊此處收兵重整 🔄"
            : "💀 陣線崩潰！點擊此處點算傷亡 🔄"}
        </h2>
      )}

{gameState === "setup" && (
        <div
          className="bench-container"
          onDragOver={handleDragOver}
          onDrop={handleDropOnBench}
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: isAltarActive ? "2px dashed #f59e0b" : "1px solid #334155",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
            marginBottom: "15px",
          }}
        >
          {!isAltarActive && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "15px",
                borderBottom: "1px solid #334155",
                paddingBottom: "10px",
              }}
            >
              <button
                onClick={() => {
                  window.setupTab = "team";
                  setBoardState((b) => ({ ...b }));
                }}
                style={{
                  padding: "8px 16px",
                  background:
                    (window.setupTab || "team") === "team"
                      ? "#38bdf8"
                      : "#1e293b",
                  color:
                    (window.setupTab || "team") === "team"
                      ? "#0f172a"
                      : "#94a3b8",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                🛡️ 戰鬥隊伍
              </button>
              <button
                onClick={() => {
                  window.setupTab = "shop";
                  setBoardState((b) => ({ ...b }));
                }}
                style={{
                  padding: "8px 16px",
                  background:
                    window.setupTab === "shop" ? "#4ade80" : "#1e293b",
                  color: window.setupTab === "shop" ? "#0f172a" : "#94a3b8",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                🛒 擴編區 (招募)
              </button>
            </div>
          )}

          <h3
            style={{
              marginTop: 0,
              fontSize: "15px",
              color: isAltarActive ? "#f59e0b" : "#94a3b8",
              marginBottom: "12px",
            }}
          >
            {isAltarActive
              ? "💡 請直接「點擊」下方任何一名兵種進行高階轉職"
              : (window.setupTab || "team") === "team"
              ? `備戰區（出戰上限 ${maxDeployLimit} 人，可反向拖回整備）`
              : `新戰力招募（消費戰鬥積分，解鎖後放入隊伍）`}
          </h3>

          {(isAltarActive || (window.setupTab || "team") === "team") && (
            <div>
              <div
                className="bench-grid"
                style={{
                  minHeight: "80px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "20px", // 稍微留點空隙給下方的日誌
                }}
              >
                {benchUnits.length === 0 ? (
                  <div
                    style={{
                      color: "#475569",
                      fontSize: "13px",
                      padding: "10px",
                      fontStyle: "italic",
                    }}
                  >
                    當前備戰隊伍為空，請從擴編區招募或將棋盤英雄拖回...
                  </div>
                ) : (
                  benchUnits.map((unit) => (
                    <div
                      key={unit.id}
                      draggable={!isAltarActive}
                      onDragStart={(e) => handleDragStart(e, unit.id)}
                      onClick={() => {
                        if (isAltarActive) handleUnitAltarClick(unit);
                        else setPromotionTargetUnit(unit);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        background: isAltarActive
                          ? "rgba(245, 158, 11, 0.08)"
                          : "rgba(255,255,255,0.03)",
                        padding: "8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        border: isAltarActive
                          ? "1px dashed #f59e0b"
                          : "1px solid #1e293b",
                      }}
                    >
                      <Unit unit={unit} dragging={unit.id === draggingUnitId} />
                    </div>
                  ))
                )}
              </div>

              {/* 🟢 【只在這裡插入】戰術日誌終端機，完全收納進戰鬥隊伍頁籤下方 */}
              {!isAltarActive && (
                <div
                  className="battle-log-terminal"
                  style={{
                    background: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: "6px",
                    padding: "12px",
                    fontFamily: "'Courier New', Courier, monospace",
                    textAlign: "left",
                    boxShadow: "inset 0 0 10px #000",
                    marginTop: "15px",
                  }}
                >
                  <div
                    style={{
                      color: "#38bdf8",
                      fontWeight: "bold",
                      borderBottom: "1px solid #1e293b",
                      paddingBottom: "6px",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    📜 戰術中央指揮部核心日誌 (Live Feed)
                  </div>
                  <div
                    style={{
                      maxHeight: "120px",
                      overflowY: "auto",
                      fontSize: "11px",
                      color: "#4ade80",
                      lineHeight: "1.5",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {battleLogs.length === 0 ? (
                      <div style={{ color: "#475569", fontStyle: "italic" }}>
                        [系統] 等待警報觸發，目前戰區死寂...
                      </div>
                    ) : (
                      battleLogs.map((log, index) => (
                        <div key={index} style={{ wordBreak: "break-all" }}>
                          {log}
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}
            </div>
          )}

          {!isAltarActive && window.setupTab === "shop" && (
            <div>
              {/* 🎯 上排：隨機基礎兵區 */}
              <h3
                style={{
                  color: "#38bdf8",
                  fontSize: "14px",
                  marginBottom: "10px",
                  textAlign: "left",
                }}
              >
                🛒 本回合限時隨機基礎新兵（限購）
              </h3>
              <div
                className="recruitment-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  marginBottom: "25px",
                }}
              >
                {(shopPool || []).map((slot, index) => {
                  if (!slot || !slot.exists) {
                    return (
                      <div
                        key={`empty-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px dashed #475569",
                          borderRadius: "6px",
                          minHeight: "115px",
                          color: "#475569",
                          fontSize: "13px",
                          background: "#0f172a",
                        }}
                      >
                        📦 已售罄
                      </div>
                    );
                  }

                  const bp = UNIT_BLUEPRINTS[slot.key];
                  if (!bp) return null;

                  const isBasicUnit = [
                    "CIRCLE",
                    "SQUARE",
                    "TRI_UP",
                    "TRI_DOWN",
                    "DIAMOND",
                    "CROSS",
                  ].includes(slot.key);

                  const finalPrice = isBasicUnit ? 0 : bp.price || 0;
                  const isAffordable = score >= finalPrice;

                  return (
                    <button
                      key={`slot-${index}-${slot.key}`}
                      disabled={!isAffordable}
                      onClick={() => recruitUnit(slot.key, index)}
                      style={{
                        padding: "10px",
                        background: isAffordable ? "#1e293b" : "#0f172a",
                        color: "#fff",
                        border: isBasicUnit
                          ? "1px solid #10b981"
                          : "1px solid #38bdf8",
                        borderRadius: "6px",
                        cursor: isAffordable ? "pointer" : "not-allowed",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "115px",
                        textAlign: "left",
                        opacity: isAffordable ? 1 : 0.4,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          color: "#fff",
                          fontSize: "14px",
                        }}
                      >
                        {bp.label}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginTop: "2px",
                        }}
                      >
                        ❤️{bp.maxHp} ⚔️{bp.atk} 🛡️{bp.def}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: isBasicUnit ? "#10b981" : "#38bdf8",
                          marginTop: "auto",
                          fontWeight: "bold",
                          alignSelf: "flex-end",
                        }}
                      >
                        🪙 {finalPrice} 積分
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 🎯 下牌：常駐高級特種兵區 */}
              <h3
                style={{
                  color: "#4ade80",
                  fontSize: "14px",
                  marginBottom: "10px",
                  textAlign: "left",
                }}
              >
                ⚔️ 常駐精英支援部隊（消費積分）
              </h3>
              <div
                className="recruitment-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: "10px",
                }}
              >
                {Object.entries(UNIT_BLUEPRINTS).map(([key, bp]) => {
                  if (!bp) return null;

                  const isLegendaryUnit =
                    [
                      "DRAGON_KNIGHT",
                      "NINJA",
                      "RONIN",
                      "TEMPLAR",
                      "MECHANIZED",
                    ].includes(key) ||
                    [
                      "DRAGON_KNIGHT",
                      "NINJA",
                      "RONIN",
                      "TEMPLAR",
                    ].includes(key.toUpperCase()) ||
                    [
                      "龍騎士",
                      "忍者",
                      "浪人",
                      "聖堂武士",
                      "機兵",
                    ].includes(bp.label) ||
                    bp.isLegendary === true;

                  if (!isLegendaryUnit) {
                    return null;
                  }

                  let finalPrice =
                    bp.price !== undefined && bp.price > 0 ? bp.price : 75;
                  if (activeBlessing === "FORTUNE") {
                    finalPrice = Math.floor(finalPrice * 0.8);
                  }
                  const isAffordable = score >= finalPrice;

                  let skillDesc = "";
                  const currentKey = key.toUpperCase();

                  if (
                    currentKey === "DRAGON_KNIGHT" ||
                    bp.label === "龍騎士"
                  ) {
                    skillDesc =
                      "🐉 特色：長槍兩格距離雙主動格槍刺擊與推條破防";
                  } else if (currentKey === "NINJA" || bp.label === "忍者") {
                    skillDesc = "⚡ 忍法奧義：極速出刀施展瞬步絕殺背刺";
                  } else if (currentKey === "RONIN" || bp.label === "浪人") {
                    skillDesc = "❄️ 孤狼意境：周圍無隊友時暴增攻速與閃避率";
                  } else if (
                    currentKey === "TEMPLAR" ||
                    bp.label === "聖堂武士"
                  ) {
                    skillDesc =
                      "✠ 反傷聖盾：每 6 秒獲得護盾，盾碎時反彈大範圍傷害";
                  } else if (
                    currentKey === "MECHANIZED" ||
                    bp.label === "機兵"
                  ) {
                    skillDesc =
                      "⚙️ 過載核心：成功擊殺目標後永久解除限制爆發攻速";
                  } else {
                    skillDesc = "基礎特性：無特殊技能";
                    if (bp.shape === "circle")
                      skillDesc =
                        "🛡️ 被動：每 3 次攻擊觸發 15% 最大血量護盾";
                    if (bp.shape === "square")
                      skillDesc =
                        "🪓 被動：血量低於 20% 時觸發 3 回合 15% 甦醒回血";
                    if (bp.shape === "diamond")
                      skillDesc = "🎯 被動：每 3 次攻擊觸發 4 倍傷害暴擊";
                    if (bp.range > 1)
                      skillDesc += " ｜ 🏹 具備遠程施法/射擊能力";
                  }

                  const tooltipText = `【${bp.label}】\n血量: ${
                    bp.maxHp
                  } ｜ 防禦: ${bp.def || 0} ｜ 攻擊: ${bp.atk}\n射程: ${
                    bp.range || 1
                  } ｜ 攻速: ${
                    bp.attackSpeed || 1.0
                  }s\n------------------------\n${skillDesc}`;

                  return (
                    <button
                      key={key}
                      disabled={!isAffordable}
                      title={tooltipText}
                      style={{
                        padding: "8px 10px",
                        background: isAffordable ? "#1e293b" : "#0f172a",
                        color: isAffordable ? "#f8fafc" : "#64748b",
                        border: `1px solid ${
                          isAffordable ? "#4ade80" : "#1e293b"
                        }`,
                        borderRadius: "4px",
                        cursor: isAffordable ? "pointer" : "not-allowed",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "115px",
                      }}
                      onClick={() => recruitUnit(key, null)}
                    >
                      <div
                        style={{
                          textAlign: "left",
                          fontSize: "14px",
                          color: isAffordable ? "#4ade80" : "#64748b",
                        }}
                      >
                        {bp.label}
                      </div>

                      <div
                        style={{
                          textAlign: "left",
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginTop: "2px",
                        }}
                      >
                        ❤️{bp.maxHp} ⚔️{bp.atk} 🛡️{bp.def || 0}
                      </div>

                      <div
                        style={{
                          fontSize: "10px",
                          color: isAffordable ? "#f59e0b" : "#475569",
                          marginTop: "6px",
                          textAlign: "left",
                          lineHeight: "1.3",
                          fontWeight: "normal",
                        }}
                      >
                        {skillDesc}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: isAffordable ? "#10b981" : "#64748b",
                          marginTop: "auto",
                          alignSelf: "flex-end",
                        }}
                      >
                        🪙 {finalPrice} 積分
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {isAltarActive && (
            <button
              onClick={() => {
                setIsAltarActive(false);
                setGameState("map_view");
              }}
              style={{
                marginTop: "10px",
                background: "#ef4444",
                border: "none",
                color: "white",
                padding: "5px 15px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ❌ 離開聖壇
            </button>
          )}
        </div>
      )}

      <div className="board-container" style={{ position: "relative" }}>
        {projectiles.map((p) => (
          <div
            key={p.id}
            className={`projectile proj-${p.type}`}
            style={{
              position: "absolute",
              left: `calc(${p.c * 20 + 10}% - 4px)`,
              top: `calc(${p.r * 25 + 12.5}% - 4px)`,
              transform: `translate(${p.moveX}%, ${p.moveY}%)`,
              transition: "transform 0.2s linear",
            }}
          />
        ))}
        <div
          className={`battle-board ${
            draggingUnitId ? "board-focused" : "board-normal"
          } ${
            // 🎯 核心修正：直接在字串模板內用三元運算子判斷魔王是否存在
            Object.values(boardState).find(
              (u) => u && u.faction === FACTIONS.ENEMY && u.isBoss
            )
              ? `arena-${Object.values(boardState)
                  .find((u) => u && u.faction === FACTIONS.ENEMY && u.isBoss)
                  .enemyType.toLowerCase()}`
              : ""
          }`}
        >
          {Array.from({ length: GRID_ROWS }).map((_, r) =>
            Array.from({ length: GRID_COLS }).map((_, c) => {
              const cellId = `cell-${r}-${c}`;
              const unitInCell = boardState[cellId];
              const fText = floatingTexts[cellId];
              const cellClass = `grid-cell ${
                shakingCells[cellId] ? "shake" : ""
              }`;
              let unitVisualModifier = unitInCell?.visualState || "";
              if (unitInCell?.isBoss) unitVisualModifier += " final-boss-style";

              return (
                <div
                  key={cellId}
                  className={cellClass}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnGrid(e, cellId)}
                >
                  {fText && (
                    <span
                      key={fText.id}
                      className={`floating-text pop-${fText.type}`}
                    >
                      {fText.text}
                    </span>
                  )}
                  {unitInCell && (
                    <div
                      draggable={gameState === "setup" && !isAltarActive}
                      onDragStart={(e) => handleDragStart(e, unitInCell.id)}
                      onClick={() => {
                        if (isAltarActive) handleUnitAltarClick(unitInCell);
                        else if (gameState === "setup")
                          setPromotionTargetUnit(unitInCell);
                      }}
                      className={`action-wrapper ${unitVisualModifier}`}
                      style={{ cursor: "pointer" }}
                    >
                      <Unit
                        unit={unitInCell}
                        dragging={unitInCell.id === draggingUnitId}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {gameState === "setup" && !isAltarActive && (
        <button
          onClick={startBattle}
          style={{
            padding: "12px 30px",
            background: "#4ade80",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        >
          ⚔️ 部署完畢，開戰！
        </button>
      )}

    </div> /* 👈 這是整個 App 元件最外層唯一的結尾標籤 */
  );
}
const styleInject = `
  .action-wrapper.attacking { transform: translateY(-15px) scale(1.08); z-index: 20; }
  .action-wrapper.skill { transform: scale(1.25) translateY(-20px); filter: brightness(1.5); z-index: 30; }
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = styleInject;
  document.head.appendChild(style);
}

export default App;
