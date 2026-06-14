export const FACTION_TALENTS = {
  IRON: {
    id: "IRON",
    name: "鋼鐵要塞",
    desc: "防禦力 (DEF) +4，格擋率 +15%",
    effect: (u) => {
      u.def += 4;
      u.blk += 15;
    },
  },
  WIND: {
    id: "WIND",
    name: "疾風之刃",
    desc: "行動冷卻 (CD) 加快 200ms，閃避率 +15%",
    effect: (u) => {
      u.cd = Math.max(200, u.cd - 200);
      u.eva += 15;
    },
  },
  BLOOD: {
    id: "BLOOD",
    name: "嗜血戰歌",
    desc: "攻擊力 (ATK) +6，最大血量 +20",
    effect: (u) => {
      u.atk += 6;
      u.maxHp += 20;
      u.hp += 20;
    },
  },
};

// =========================================================================
// 🛡️ 2. 我方英雄藍圖庫 (100% 補齊原稿所有轉職、傳奇、PLUS與台詞)
// =========================================================================
export const UNIT_BLUEPRINTS = {
  // ─── 基礎兵種 (1個徽記) ───
  CIRCLE: {
    label: "坦克",
    shape: "circle",
    shapes: ["CIRCLE"],
    maxHp: 600,
    atk: 35,
    def: 10,
    tags: ["物理", "格擋"],
    skillQuote: "「哈！給我站住！」",
    skillIcon: "🛡️",
  },
  SQUARE: {
    label: "戰士",
    shape: "square",
    shapes: ["SQUARE"],
    maxHp: 550,
    atk: 45,
    def: 5,
    tags: ["物理"],
    skillQuote: "「還沒結束...復甦之風！」",
    skillIcon: "🟢",
  },
  TRI_UP: {
    label: "弓箭手",
    shape: "triangle-up",
    shapes: ["TRI_UP"],
    maxHp: 400,
    atk: 45,
    def: 0,
    tags: ["物理"],
    skillQuote: "「鎖定目標，穿透！」",
    skillIcon: "🏹",
  },
  TRI_DOWN: {
    label: "法師",
    shape: "triangle-down",
    shapes: ["TRI_DOWN"],
    maxHp: 450,
    atk: 60,
    def: 1,
    tags: ["魔力護盾"],
    skillQuote: "「轟炸吧，能量彈！」",
    skillIcon: "🧪",
  },
  DIAMOND: {
    label: "刺客",
    shape: "diamond",
    shapes: ["DIAMOND"],
    maxHp: 400,
    atk: 70,
    def: 0,
    tags: ["毒"],
    skillQuote: "「抓到破綻了。」",
    skillIcon: "⚡",
  },
  CROSS: {
    label: "牧師",
    shape: "cross",
    shapes: ["CROSS"],
    maxHp: 400,
    atk: 25,
    def: 2,
    tags: ["光明", "補血"],
    skillQuote: "「聖光，請治癒傷痛。」",
    skillIcon: "☀️",
  },

  // ─── 我方合成職業 (2個徽記) ───
  CIRCLE_PLUS: {
    label: "坦克+",
    shapes: ["CIRCLE", "CIRCLE"],
    maxHp: 2200,
    atk: 55,
    def: 20,
    tags: ["物理", "格擋"],
    skillQuote: "「此路不通！」",
    skillIcon: "🛡️",
    isPlus: true,
  },
  SQUARE_PLUS: {
    label: "戰士+",
    shapes: ["SQUARE", "SQUARE"],
    maxHp: 1100,
    atk: 75,
    def: 10,
    tags: ["物理"],
    skillQuote: "「為了榮耀，永不倒下！」",
    skillIcon: "🟢",
    isPlus: true,
  },
  TRI_UP_PLUS: {
    label: "弓箭手+",
    shapes: ["TRI_UP", "TRI_UP"],
    maxHp: 900,
    atk: 80,
    def: 5,
    tags: ["物理"],
    skillQuote: "「百步之外，例無虛發！」",
    skillIcon: "🏹",
    isPlus: true,
  },
  TRI_DOWN_PLUS: {
    label: "法師+",
    shapes: ["TRI_DOWN", "TRI_DOWN"],
    maxHp: 800,
    atk: 120,
    def: 5,
    tags: ["魔力護盾"],
    skillQuote: "「感受元素的烈焰！」",
    skillIcon: "🧪",
    isPlus: true,
  },
  DIAMOND_PLUS: {
    label: "刺客+",
    shapes: ["DIAMOND", "DIAMOND"],
    maxHp: 850,
    atk: 130,
    def: 2,
    tags: ["毒", "暗"],
    skillQuote: "「一擊，絕殺！」",
    skillIcon: "⚡",
    isPlus: true,
  },
  CROSS_PLUS: {
    label: "牧師+",
    shapes: ["CROSS", "CROSS"],
    maxHp: 950,
    atk: 50,
    def: 6,
    tags: ["光明", "補血"],
    skillQuote: "「神聖的光輝，將驅散一切陰霾！」",
    skillIcon: "☀️",
    isPlus: true,
  },

  // ─── 我方轉職與傳奇職業 (3個徽記) ───
  // 戰士系雙轉職：狂戰士、大劍師
  BERSERKER: {
    label: "狂戰士",
    shapes: ["SQUARE", "SQUARE", "DIAMOND"],
    maxHp: 1600,
    atk: 160,
    def: 5,
    tags: ["物理", "吸血"],
    skillQuote: "「鮮血與憤怒！不死不休！！」",
    skillIcon: "🩸",
  },
  BLADEMASTER: {
    label: "大劍師",
    shapes: ["SQUARE", "SQUARE", "TRI_UP"],
    maxHp: 1800,
    atk: 140,
    def: 8,
    tags: ["物理"],
    skillQuote: "「見識風暴的力量吧！旋風斬！」",
    skillIcon: "⚔️",
  },
  // 坦克系雙轉職：守護者、黑暗十字軍
  GUARDIAN: {
    label: "守護者",
    shapes: ["CIRCLE", "CIRCLE", "CROSS"],
    maxHp: 3800,
    atk: 60,
    def: 25,
    tags: ["物理", "格擋"],
    skillQuote: "「大地啊，築起不可撼動的防線！」",
    skillIcon: "🧱",
  },
  DARK_CRUSADER: {
    label: "黑暗十字軍",
    shapes: ["CIRCLE", "CIRCLE", "DIAMOND"],
    maxHp: 3200,
    atk: 110,
    def: 15,
    tags: ["物理", "吸血"],
    skillQuote: "「痛楚，將加倍奉還！」",
    skillIcon: "▨",
  },
  // 弓箭手系雙轉職：魔弓手、遊俠
  MAGIC_ARCHER: {
    label: "魔弓手",
    shapes: ["TRI_UP", "TRI_UP", "TRI_DOWN"],
    maxHp: 1200,
    atk: 130,
    def: 4,
    tags: ["魔力護盾"],
    skillQuote: "「魔法與箭矢的交響樂！」",
    skillIcon: "🔮",
  },
  RANGER: {
    label: "遊俠",
    shapes: ["TRI_UP", "TRI_UP", "SQUARE"],
    maxHp: 1100,
    atk: 150,
    def: 5,
    tags: ["物理"],
    skillQuote: "「幻影步...連射！」",
    skillIcon: "🍃",
  },
  // 法師系雙轉職：術士、元素使
  WARLOCK: {
    label: "術士",
    shapes: ["TRI_DOWN", "TRI_DOWN", "DIAMOND"],
    maxHp: 1200,
    atk: 110,
    def: 8,
    tags: ["暗", "魔力護盾"],
    skillQuote: "「靈魂啊，化為詛咒蔓延吧...」",
    skillIcon: "🔮",
  },
  ELEMENTALIST: {
    label: "元素使",
    shapes: ["TRI_DOWN", "TRI_DOWN", "TRI_UP"],
    maxHp: 1400,
    atk: 180,
    def: 5,
    tags: ["冰", "電"],
    skillQuote: "「聆聽末日的宣告——天崩地裂！」",
    skillIcon: "☄️",
  },
  // 刺客系雙轉職：陷阱大師、送葬者
  TRAPMASTER: {
    label: "陷阱大師",
    shapes: ["TRI_UP", "DIAMOND", "DIAMOND"],
    maxHp: 1100,
    atk: 85,
    def: 4,
    tags: ["毒"],
    skillQuote: "「可別踩錯步子了，嘻嘻。」",
    skillIcon: "🕸️",
  },
  UNDERTAKER: {
    label: "送葬者",
    shapes: ["DIAMOND", "DIAMOND", "SQUARE"],
    maxHp: 1400,
    atk: 130,
    def: 6,
    tags: ["暗", "吸血"],
    skillQuote: "「你的陽壽已盡，認命吧。」",
    skillIcon: "☠️",
  },
  // 牧師系雙轉職：大賢者、血法師
  SAGE: {
    label: "大賢者",
    shapes: ["CROSS", "TRI_DOWN", "PLUS"],
    maxHp: 1500,
    atk: 70,
    def: 12,
    tags: ["光明", "補血", "魔力護盾"],
    skillQuote: "「神神聖新星——普照萬物！」",
    skillIcon: "☀️",
  },
  BLOOD_MAGE: {
    label: "血法師",
    shapes: ["TRI_DOWN", "SQUARE", "DIAMOND"],
    maxHp: 1300,
    atk: 115,
    def: 5,
    tags: ["暗", "吸血"],
    skillQuote: "「以血還血，生命共生！」",
    skillIcon: "💉",
  },

  // ─── 4. 特殊獨立傳奇職業 ───
  DRAGON_KNIGHT: {
    label: "龍騎士",
    shapes: ["DIAMOND", "TRI_UP", "SQUARE"],
    maxHp: 2500,
    atk: 150,
    def: 12,
    price: 60, // 🪙 定價：60 積分
    tags: ["火", "格擋"],
    skillQuote: "「從天而降的龍火，將你們燃燒殆盡！」",
    skillIcon: "🔥",
    isLegendary: true,
  },
  NINJA: {
    label: "忍者",
    shapes: ["DIAMOND", "DIAMOND", "TRI_UP"],
    maxHp: 900,
    atk: 120,
    def: 2,
    price: 50, // 🪙 定價：50 積分
    tags: ["毒", "暗"],
    skillQuote: "「忍法·奧義——瞬步絕殺！」",
    skillIcon: "⚡",
    isLegendary: true,
  },
  RONIN: {
    label: "浪人",
    shapes: ["SQUARE", "SQUARE", "DIAMOND"],
    maxHp: 1500,
    atk: 180,
    def: 5,
    price: 55, // 🪙 定價：55 積分
    tags: ["冰", "物理"],
    skillQuote: "「我一人的戰場...足矣。」",
    skillIcon: "❄️",
    isLegendary: true,
  },
  TEMPLAR: {
    label: "聖堂武士",
    shapes: ["CIRCLE", "CIRCLE", "PLUS"],
    maxHp: 2800,
    atk: 100,
    def: 18,
    price: 65, // 🪙 定價：65 積分
    tags: ["光明", "格擋"],
    skillQuote: "「正義之盾，堅不可摧！」",
    skillIcon: "🛡️",
    isLegendary: true,
  },
  MECHANIZED: {
    label: "機兵",
    shapes: ["SQUARE", "CIRCLE", "PLUS"],
    maxHp: 2000,
    atk: 140,
    def: 15,
    price: 60, // 🪙 定價：60 積分
    tags: ["物理", "電"],
    skillQuote: "「檢測到擊殺目標...限制解除，核心過載！！」",
    skillIcon: "🤖",
    isLegendary: true,
  },
};

// ==========================================
// 🎯 敵方魔物藍圖庫追加屬性標籤
// ==========================================
export const ENEMY_BLUEPRINTS = {
  goblin: {
    label: "哥布林",
    maxHp: 180, // 250 -> 180 常規炮灰
    atk: 18,    // 25 -> 18
    def: 1,
    enemyType: "goblin",
    tags: ["物理"],
  },
  harpy: {
    label: "哈比鷹身人",
    maxHp: 240, // 350 -> 240
    atk: 26,    // 35 -> 26
    def: 1,
    enemyType: "harpy",
    tags: ["物理"],
  },
  direwolf: {
    label: "兇暴狼獸",
    maxHp: 310, // 400 -> 310
    atk: 32,    // 40 -> 32
    def: 2,
    enemyType: "direwolf",
    tags: ["物理"],
  },
  orc: {
    label: "獸人戰士",
    maxHp: 420, // 532 -> 420 標準前排
    atk: 38,    // 50 -> 38
    def: 5,     // 8 -> 5
    enemyType: "orc",
    tags: ["物理"],
  },
  succubus: {
    label: "魅魔",
    maxHp: 510, // 721 -> 510
    atk: 42,    // 55 -> 42
    def: 3,
    enemyType: "succubus",
    tags: ["暗", "吸血"],
  },
  gargoyle: {
    label: "石像鬼",
    maxHp: 620, // 900 -> 620（防止前期滾出 1100+ 血的鐵板）
    atk: 45,    // 60 -> 45
    def: 10,    // 15 -> 10
    enemyType: "gargoyle",
    tags: ["物理", "格擋"],
  },
  troll: {
    label: "巨魔",
    maxHp: 1350, // 2493 -> 1350 大幅砍血，防止前期卡死
    atk: 62,     // 85 -> 62
    def: 6,      // 10 -> 6
    enemyType: "troll",
    tags: ["物理"],
  },
  skeleton_tyrant: {
    label: "骷髏暴君",
    maxHp: 1420, // 2530 -> 1420
    atk: 75,     // 110 -> 75
    def: 8,      // 12 -> 8
    enemyType: "skeleton_tyrant",
    tags: ["暗", "格擋"],
  },
  necro_assassin: {
    label: "死靈刺客",
    maxHp: 880,  // 1265 -> 880
    atk: 82,     // 140 -> 82 高威脅點殺降溫
    def: 3,
    enemyType: "necro_assassin",
    tags: ["毒", "暗"],
  },
  troll_priest: {
    label: "巨魔祭司",
    maxHp: 1250, // 2461 -> 1250 防止對面無限互奶死鎖
    atk: 45,     // 65 -> 45
    def: 4,
    enemyType: "troll_priest",
    tags: ["暗", "補血"],
  },
  storm_witch: {
    label: "風暴魔女",
    maxHp: 980,  // 1537 -> 980
    atk: 60,     // 95 -> 60
    def: 4,
    enemyType: "storm_witch",
    tags: ["冰", "電"],
  },

  // ─── 👑 最終三大魔王降溫公式基底 ───
  KRAKEN: {
    label: "虛空吞噬者·卡薩丁",
    maxHp: 22000, // 30000 -> 22000
    atk: 220,     // 350 -> 220
    def: 18,      // 25 -> 18
    enemyType: "kraken",
    tags: ["冰", "暗", "魔力護盾"],
    isBoss: true,
  },
  BALROG: {
    label: "煉獄炎魔·巴洛格",
    maxHp: 20000, // 25920 -> 20000
    atk: 240,     // 400 -> 240
    def: 15,
    enemyType: "balrog",
    tags: ["火", "暗", "吸血"],
    isBoss: true,
  },
  DRAGON_KING: {
    label: "滅世巨龍·奧杜因",
    maxHp: 28000, // 45000 -> 28000 斬斷破五萬血的絕望數據
    atk: 280,     // 500 -> 280
    def: 25,      // 40 -> 25
    enemyType: "dragon_king",
    tags: ["火", "物理", "格擋"],
    isBoss: true,
  },
};

export const FACTIONS = { PLAYER: "blue", ENEMY: "red" };
export const GRID_ROWS = 5;
export const GRID_COLS = 5;

export const createUnitInstance = (blueprint, faction, customId = null) => {
  // 🎯 鋼鐵防線：如果奇遇事件或存檔丟進來的藍圖是 undefined，自動用基礎戰士頂替，絕不報錯崩潰
  const bp = blueprint || {
    shape: "square",
    label: "戰士",
    maxHp: 600,
    def: 2,
    atk: 55,
    range: 1,
    cd: 800,
    eva: 0,
    blk: 0,
    canPromote: true,
    price: 15,
  };

  return {
    id: customId || `${faction}-${bp.shape}-${Date.now()}-${Math.random()}`,
    shape: bp.shape,
    label: bp.label,
    maxHp: bp.maxHp,
    hp: bp.maxHp,
    def: bp.def,
    atk: bp.atk,
    range: bp.range,
    cd: bp.cd,
    eva: bp.eva !== undefined ? bp.eva : 0,
    blk: bp.blk !== undefined ? bp.blk : 0,
    faction: faction,
    nextActionTime: 0,
    visualState: "idle",
    skillCount: 0,
    isStealth: false,
    proClass: null,
    canPromote: bp.canPromote !== false,
    price: bp.price || 0,
    // 補上後續合成管線需要的血統標籤
    isPlus: bp.isPlus || false,
    isAdvanced: bp.isAdvanced || false,
    isLegendary: bp.isLegendary || false,
  };
};
