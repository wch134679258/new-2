// ============================================================
//  樱之异境 · 技能表
// ------------------------------------------------------------
//  四个按钮升级成五个技能，每个技能一套专属特效语言（fx）。
//  数值口径：都以 atk 为基准，倍率写在 dmg 里，方便以后调平衡。
//  MP 不存本地：每场战斗开场满，靠智力（神秘）加成，回合内缓慢回。
// ============================================================

/** 玩家 MP 上限：神秘 x4 + 20 */
export const mpOf = (mystic) => 20 + Math.round(mystic * 4)

/** 每回合回多少（打在 endTurn 里） */
export const MP_REGEN = 3

export const SKILLS = [
  {
    key: 'slash',
    name: '樱斩',
    en: 'SAKURA SLASH',
    cost: 6,
    cd: 0,
    fx: 'slash',
    color: '#ffd7e6',
    icon: 'M4 19L19 4M13 4h6v6',
    desc: '单体斩击 · 攻击 115%',
    dmg: 1.15,
    crit: true
  },
  {
    key: 'storm',
    name: '花雨',
    en: 'PETAL STORM',
    cost: 13,
    cd: 2,
    fx: 'petalstorm',
    color: '#e2698f',
    icon: 'M12 3c3 4 3 9 0 12c-3-3-3-8 0-12ZM5 12c4 3 4 8 0 9M19 12c-4 3-4 8 0 9',
    desc: '三段花瓣 · 每段攻击 55%',
    dmg: 0.55,
    hits: 3
  },
  {
    key: 'mirror',
    name: '镜返',
    en: 'MIRROR WARD',
    cost: 9,
    cd: 3,
    fx: 'mirror',
    color: '#7f9fc9',
    icon: 'M12 3l7 9-7 9-7-9Z',
    desc: '一回合减伤 70%，并把伤害弹回去'
  },
  {
    key: 'pray',
    name: '祈',
    en: 'PRAYER',
    cost: 11,
    cd: 3,
    fx: 'pray',
    color: '#f6b8cd',
    icon: 'M12 3v6M9 6h6M7 21c0-5 2-8 5-8s5 3 5 8',
    desc: '回复生命 · 18 + 智力 x0.8',
    heal: 18
  },
  {
    key: 'bind',
    name: '缚',
    en: 'BINDING ROOT',
    cost: 10,
    cd: 3,
    fx: 'bind',
    color: '#9a86b6',
    icon: 'M8 4c4 3 0 6 4 9s0 6 4 7M16 4c-4 3 0 6-4 9s0 6-4 7',
    desc: '根须缠住 · 小幅伤害，敌人少一回合',
    dmg: 0.4
  }
]

export const SKILL_BY_KEY = SKILLS.reduce((m, s) => { m[s.key] = s; return m }, {})

/** 开场的冷却表：全 0 */
export const freshCooldowns = () => SKILLS.reduce((m, s) => { m[s.key] = 0; return m }, {})
