<template>
  <!--
    樱之异境 · 自由开放副本
    ------------------------------------------------------------
    按设定重做：不再是一条路走到黑，而是一张地图上的四大区域，
    顺序不限、随时换区、随时用「归乡樱瓣」回家。

      樱雾漫林  → 练 力量 / 神秘 / 敏捷     (新手)
      浮樱镜湖  → 练 智力 / 魅力 / 幸运     (中级 · 魅力可跳过战斗)
      古樱根域  → 练 力量 + 体力(防御)      (高阶 · 智力开密道 / 幸运撞隐藏房)
      灵樱神域  → 全属性                    (BOSS · 不要求通关前三个区域)

    画风与小镇同一套：2.5D 斜轴、圆润马卡龙、淡粉淡紫；
    区别是这里全程有雾光、悬浮花瓣和幻境柔光。
  -->
  <div class="realm">
    <div class="realm__sky" aria-hidden="true"></div>
    <div class="realm__glow" aria-hidden="true"></div>
    <div class="realm__fog" aria-hidden="true"></div>
    <canvas ref="petalCanvas" class="realm__petals" aria-hidden="true"></canvas>

    <!-- 顶栏：七维战斗属性实时显示 -->
    <header class="realm__bar">
      <div class="realm__brand">
        <span class="realm__mark" aria-hidden="true"></span>
        <span class="realm__name">樱之异境</span>
        <span class="realm__en">SAKURA HOLLOW</span>
      </div>

      <ul class="realm__seven" aria-label="七维属性">
        <li v-for="s in STATS" :key="s.key" :title="`${s.label} ${stats[s.key]}`">
          <i :style="{ background: s.color }"></i>
          <em>{{ s.label }}</em>
          <b>{{ stats[s.key] }}</b>
          <span><i :style="{ width: Math.min(100, stats[s.key]) + '%', background: s.color }"></i></span>
        </li>
      </ul>

      <div class="realm__vitals">
        <span class="rv rv--hp">
          <i>生命</i>
          <b>{{ Math.max(0, hp) }}</b><em>/{{ maxHp }}</em>
          <span class="rv__bar"><i :style="{ width: hpPercent + '%' }"></i></span>
        </span>
        <span class="rv rv--petal"><i>花瓣</i><b>{{ petals }}</b></span>
        <button class="realm__home" type="button" title="归乡樱瓣 · 直接回后山，不扣东西" @click="goHome">
          <span class="realm__home-petal" aria-hidden="true"></span>
          归乡
        </button>
      </div>
    </header>

    <!-- 四大区域：随便点，顺序不限 -->
    <nav class="realm__regions" aria-label="异境区域">
      <button
        v-for="r in REGIONS"
        :key="r.key"
        type="button"
        class="rgn"
        :class="{ 'is-on': region === r.key, 'is-boss': r.boss }"
        @click="switchRegion(r.key)"
      >
        <b>{{ r.name }}</b>
        <i>{{ r.en }}</i>
        <em>{{ r.tier }}</em>
      </button>
      <span class="realm__tip">四个区域互不设卡 · 想先去哪儿都行</span>
    </nav>

    <!-- 区域舞台 -->
    <main class="realm__stage">
      <RealmMap
        :region="region"
        :encounters="currentEncounters"
        :is-done="isDone"
        :meets-need="meetsNeed"
        @engage="engage"
      />

      <!-- 区域说明 + 这一趟的记录 -->
      <aside class="realm__side">
        <p class="realm__side-tier">{{ current.tier }}</p>
        <h2>{{ current.name }}</h2>
        <p class="realm__side-desc">{{ current.desc }}</p>
        <ul class="realm__side-tags">
          <li v-for="t in current.tags" :key="t">{{ t }}</li>
        </ul>
        <p class="realm__side-tag">JOURNAL · 这一路</p>
        <ul class="realm__log" aria-live="polite">
          <li v-for="(l, i) in log" :key="`lg${i}`" :class="`is-${l.kind}`">{{ l.text }}</li>
        </ul>
      </aside>
    </main>

    <!-- 战斗 -->
    <Transition name="battle">
      <section v-if="battle" class="battle" role="dialog" aria-modal="true" aria-label="战斗">
        <div class="battle__panel">
          <header class="battle__head">
            <div>
              <p class="battle__tag">BATTLE · {{ current.name }}</p>
              <h2>{{ battle.enemy.name }}</h2>
            </div>
            <span class="battle__turn">第 {{ battle.turn }} 回合</span>
          </header>

          <p class="battle__line">{{ battle.enemy.line }}</p>

          <!-- 战斗场景：怪物、玩家、影子、头顶血条、飘字、斩击弧线都在这一个组件里 -->
          <BattleScene
            :foe="{
              key: battle.enc.foe,
              name: battle.enemy.name,
              color: battle.enemy.color,
              hp: battle.enemy.hp,
              boss: !!battle.enemy.boss
            }"
            :foe-hp="battle.enemyHp"
            :foe-percent="foePercent"
            :hp="hp"
            :max-hp="maxHp"
            :hp-percent="hpPercent"
            :buff="buff"
            :foe-state="foeState"
            :me-state="meState"
            :slash-key="slashKey"
            :entering="entering"
            :pops="pops"
            :mp="mp"
            :mp-max="mpMax"
            :fx="fx"
            :fx-name="fxName"
          />

          <ul class="battle__log" aria-live="polite">
            <li v-for="(l, i) in battle.log" :key="`bl${i}`" :class="`is-${l.kind}`">{{ l.text }}</li>
          </ul>

          <div class="battle__foot">
            <!-- 技能栏：五个格子，图标 + 名字 + 消耗 + 冷却 -->
            <div class="battle__skills">
              <button
                v-for="sk in SKILLS"
                :key="sk.key"
                type="button"
                class="bskill"
                :class="{ 'is-off': !skillReady(sk) }"
                :style="{ '--c': sk.color }"
                :disabled="!skillReady(sk)"
                :title="`${sk.name} · ${sk.desc}`"
                @click="useSkill(sk)"
              >
                <span class="bskill__ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                       stroke-linecap="round" stroke-linejoin="round">
                    <path :d="sk.icon" />
                  </svg>
                </span>
                <b>{{ sk.name }}</b>
                <em>{{ sk.cost }}</em>
                <i v-if="cds[sk.key] > 0" class="bskill__cd">{{ cds[sk.key] }}</i>
              </button>
            </div>

            <!-- 普通动作收进右侧小圆钮 -->
            <div class="battle__mini">
              <button type="button" class="bmini" :disabled="busy || over" title="普通攻击" @click="attack">攻</button>
              <button type="button" class="bmini" :disabled="busy || over || buff || focusUsed >= 2"
                      :title="buff ? '已凝神' : `凝神：下一击必暴 · 剩 ${2 - focusUsed} 次`" @click="focus">凝</button>
              <button v-if="canCharm" type="button" class="bmini bmini--charm" :disabled="busy || over"
                      :title="`交涉 · 魅力 ${stats.charm}`" @click="charmSkip">交</button>
              <button type="button" class="bmini bmini--flee" :disabled="busy || over" title="退开" @click="flee">退</button>
            </div>
          </div>

          <div v-if="over" class="battle__over">
            <p class="battle__over-tag">{{ win ? 'CLEARED' : 'DEFEATED' }}</p>
            <p class="battle__over-text">
              {{ win ? `${battle.enemy.name}散了，花瓣留在你手里。` : '视野一白，你被花瓣裹着送出了异境。' }}
            </p>
            <button type="button" class="battle__close" @click="win ? closeBattle() : loseOut()">
              {{ win ? '收下花瓣' : '回到后山' }}
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <!-- 事件 / 宝箱 / 密道 -->
    <Transition name="battle">
      <section v-if="sheet" class="sheet" role="dialog" aria-modal="true" aria-label="异境事件">
        <div class="sheet__panel">
          <p class="sheet__tag">{{ sheet.tag }}</p>
          <h2>{{ sheet.title }}</h2>
          <p class="sheet__text">{{ sheet.text }}</p>
          <ul v-if="sheet.gains && sheet.gains.length" class="sheet__gain">
            <li v-for="g in sheet.gains" :key="g">+{{ g }}</li>
          </ul>
          <div class="sheet__actions">
            <button type="button" class="sheet__ok" @click="closeSheet">{{ sheet.ok }}</button>
          </div>
        </div>
      </section>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createPetalField } from '../composables/usePetals'
import BattleScene from './dungeon/BattleScene.vue'
import RealmMap from './dungeon/RealmMap.vue'
import { SKILLS, mpOf, MP_REGEN, freshCooldowns } from './dungeon/skills'
import { combat, gainMany, nudgeMood, setPanelMode, stats, STATS } from '../composables/useStats'

const emit = defineEmits(['exit-realm', 'navigate'])

/* =========================================================
   四大区域
   ========================================================= */
const REGIONS = [
  {
    key: 'forest',
    name: '樱雾漫林',
    en: 'MIST GROVE',
    tier: '初级 · 新手安全区',
    desc: '整片轻柔粉雾森林，弯曲的樱木小路，满地落樱。最温柔的一块地方，连怪都打得慢。',
    tags: ['练 力量 / 神秘 / 敏捷', '掉 基础花瓣 · 普通种子'],
    gains: { strength: 1, mystic: 1, agility: 1 }
  },
  {
    key: 'lake',
    name: '浮樱镜湖',
    en: 'MIRROR LAKE',
    tier: '中级 · 均衡探索区',
    desc: '半透明的樱色湖水，水面漂着樱瓣小岛，倒影里的世界比岸上更歪一些。',
    tags: ['练 智力 / 魅力 / 幸运', '魅力够可以跳过战斗'],
    gains: { wits: 1, charm: 1, luck: 1 }
  },
  {
    key: 'roots',
    name: '古樱根域',
    en: 'ROOT MAZE',
    tier: '高阶 · 地下迷宫',
    desc: '巨樱的根系交错成天然迷宫，幽暗柔光，石壁上长着会发亮的苔。',
    tags: ['练 力量 / 体力', '智力开密道 · 幸运撞隐藏房'],
    gains: { strength: 2, vigor: 1 }
  },
  {
    key: 'shrine',
    name: '灵樱神域',
    en: 'SHRINE',
    tier: '终极 · BOSS 区',
    desc: '悬浮的樱花平台，圆形祭坛，空中有缓慢旋转的花瓣法阵。异境最高的一块地方。',
    tags: ['全属性提升', '不用通关前三个区域'],
    gains: { strength: 1, wits: 1, agility: 1, mystic: 1, charm: 1, luck: 1, vigor: 1 },
    boss: true
  }
]

/* 怪物表：按区域给，数值从弱到强 */
const FOES = {
  puppet: { name: '樱花木傀儡', hp: 44, atk: 10, def: 3, crit: 4, color: '#e0a05c', line: '关节是活的木头，抬手时吱呀一声。' },
  sprite: { name: '幼年樱雾精灵', hp: 38, atk: 9, def: 2, crit: 7, color: '#c9a0e0', line: '雾里亮起两点，是它眨了一下眼。' },
  swarm: { name: '花瓣蜂群', hp: 52, atk: 12, def: 3, crit: 12, color: '#e88fa6', line: '一整团花瓣突然改了方向，朝你压过来。' },
  wraith: { name: '湖影幻妖', hp: 68, atk: 13, def: 5, crit: 9, color: '#7f9fc9', line: '水面倒影先动了一步，本体才跟上。' },
  golem: { name: '青苔石魔', hp: 96, atk: 15, def: 12, crit: 5, color: '#8fae83', line: '一块会走路的石头，苔藓下埋着旧符文。' },
  warden: { name: '根须守卫', hp: 124, atk: 17, def: 8, crit: 8, color: '#9a86b6', line: '根须缠成一个大概的肩，正对着你。' },
  elite: { name: '樱影护卫', hp: 118, atk: 19, def: 9, crit: 12, color: '#d4608f', line: '影子先亮起来，然后才有形状。' },
  guardian: { name: '樱之守护灵', hp: 190, atk: 24, def: 12, crit: 15, color: '#e0576f', line: '整座祭坛的心跳，和你的叠在一起。' }
}

/* 每个区域的遭遇点 */
const ENCOUNTERS = {
  forest: [
    { id: 'f1', kind: 'foe', name: '樱花木傀儡', foe: 'puppet', x: 4.4, y: 6.6 },
    { id: 'f2', kind: 'foe', name: '幼年樱雾精灵', foe: 'sprite', x: 9.4, y: 4.4 },
    { id: 'f3', kind: 'foe', name: '樱花木傀儡', foe: 'puppet', x: 12.0, y: 8.6 },
    { id: 'f4', kind: 'event', name: '记忆花瓣', x: 6.4, y: 10.8 }
  ],
  lake: [
    { id: 'l1', kind: 'foe', name: '花瓣蜂群', foe: 'swarm', x: 4.8, y: 5.4 },
    { id: 'l2', kind: 'foe', name: '湖影幻妖', foe: 'wraith', x: 10.6, y: 5.8 },
    { id: 'l3', kind: 'chest', name: '湖中宝箱', need: 14, needLabel: '智力 14', x: 8.2, y: 9.8 },
    { id: 'l4', kind: 'event', name: '湖面微光', need: 10, needLabel: '幸运 10', x: 12.4, y: 9.4 }
  ],
  roots: [
    { id: 'r1', kind: 'foe', name: '青苔石魔', foe: 'golem', x: 4.2, y: 7.8 },
    { id: 'r2', kind: 'foe', name: '根须守卫', foe: 'warden', x: 10.4, y: 8.6 },
    { id: 'r3', kind: 'secret', name: '根系密道', need: 18, needLabel: '智力 18', x: 7.0, y: 3.8 },
    { id: 'r4', kind: 'event', name: '隐藏的根室', need: 12, needLabel: '幸运 12', x: 12.6, y: 10.4 }
  ],
  shrine: [
    { id: 's1', kind: 'foe', name: '樱影护卫', foe: 'elite', x: 4.6, y: 7.0 },
    { id: 's2', kind: 'foe', name: '樱影护卫', foe: 'elite', x: 11.4, y: 7.0 },
    { id: 's3', kind: 'boss', name: '樱之守护灵', foe: 'guardian', x: 8.0, y: 6.4 }
  ]
}

const ENC_ICON = {
  foe: 'M-7 7 L6 -6 M2 -8 L8 -2 M-3 3 l6 6',
  event: 'M0 -8 q6 4 6 9 a6 6 0 0 1 -12 0 q0 -5 6 -9Z',
  chest: 'M-9 2 h18 v8 h-18Z M-9 2 a9 5 0 0 1 18 0 M0 2 v8',
  secret: 'M-8 8 V0 a8 8 0 0 1 16 0 v8 h-5 V0 a3 3 0 0 0 -6 0 v8Z',
  boss: 'M0 -10 q4 6 9 6 q-3 8 -9 12 q-6 -4 -9 -12 q5 0 9 -6Z'
}

/* ---------------- 场景装饰数据（固定随机，别每次重排） ---------------- */
function seeded (n, fn) {
  const out = []
  let seed = 11
  for (let i = 0; i < n; i++) {
    seed = (seed * 9301 + 49297) % 233280
    out.push(fn(seed / 233280, i))
  }
  return out
}
const forestTrees = [[150, 336, 1.12], [250, 272, 0.92], [560, 240, 1.0], [790, 254, 0.96], [900, 342, 0.86], [66, 430, 0.9], [980, 430, 0.78], [430, 300, 0.68], [700, 400, 0.72]]
const groundPetals = seeded(34, (r, i) => [80 + r * 860, 360 + ((i * 37) % 180) * 1.05])
const lakeFarTrees = [[120, 240, 24], [268, 232, 20], [842, 228, 26], [960, 236, 21]]
const floatIslands = [[300, 300, 44], [640, 264, 34], [780, 356, 40], [420, 372, 28]]
const glowFlowers = seeded(12, (r, i) => [90 + ((i * 79) % 840), 452 + ((i * 23) % 46)])
const farTrees = [[90, 268, 26], [196, 250, 22], [286, 272, 20], [452, 244, 24], [560, 266, 19], [686, 246, 23], [800, 268, 21], [918, 250, 25]]
const forestBushes = [[120, 470, 26], [236, 500, 20], [880, 462, 24], [960, 520, 19], [620, 500, 17]]
const mossDots = seeded(26, (r, i) => [120 + r * 760, 180 + ((i * 53) % 280), 1.4 + (i % 3) * 0.9])
const pillars = [[250, 420], [790, 420], [300, 470], [740, 470]]

/* ---------------- 状态 ---------------- */
const region = ref('forest')
const current = computed(() => REGIONS.find((r) => r.key === region.value))
const currentEncounters = computed(() => ENCOUNTERS[region.value] || [])

const pick = (k) => combat.value.find((c) => c.key === k)?.value ?? 0
const maxHp = computed(() => Math.max(40, pick('hp')))
const atk = computed(() => Math.max(6, pick('atk')))
const def = computed(() => Math.max(2, pick('def')))
const eva = computed(() => Math.min(45, pick('eva')))
const crit = computed(() => Math.min(60, pick('crit')))
const hp = ref(maxHp.value)
const hpPercent = computed(() => Math.max(0, Math.min(100, (hp.value / maxHp.value) * 100)))
const petals = ref(0)
const done = ref(new Set())
const log = ref([])

/* 进异境自动切到「探索战斗」面板形态：七维全开 */
onMounted(() => {
  setPanelMode('battle')
  hp.value = maxHp.value
  push('mute', '雾合上了。四块地方在眼前摊开，先去哪都行。')
  // 幸运够高，进门就有一次微光奇遇
  if (stats.luck >= 12 && Math.random() < 0.5) {
    petals.value += 6
    push('good', '眼前晃过一片微光，随手接住 6 片花瓣。')
  }
})

const isDone = (id) => done.value.has(`${region.value}:${id}`)
function meetsNeed (e) {
  if (!e.need) return true
  if (e.kind === 'chest' || e.kind === 'secret') return stats.wits >= e.need
  return stats.luck >= e.need
}
function encStroke (e) {
  if (isDone(e.id)) return 'rgba(150, 120, 140, .4)'
  if (e.need && !meetsNeed(e)) return 'rgba(160, 140, 170, .55)'
  if (e.kind === 'boss') return '#e0576f'
  if (e.kind === 'chest' || e.kind === 'secret') return '#c9a0e0'
  return 'rgba(226, 134, 172, .8)'
}
function encFill (e) {
  if (e.need && !meetsNeed(e)) return 'rgba(150, 130, 160, .5)'
  if (e.kind === 'boss') return '#e0576f'
  if (e.kind === 'chest' || e.kind === 'secret') return '#a86bb8'
  return '#d4608f'
}

/* ---------------- 切区域 ---------------- */
/** 走到樱枝门：切下一个区域（顺序转一圈） */
function nextRegion () {
  const i = REGIONS.findIndex((r) => r.key === region.value)
  switchRegion(REGIONS[(i + 1) % REGIONS.length].key)
}

function switchRegion (key) {
  if (region.value === key) return
  region.value = key
  push('mute', `走进「${REGIONS.find((r) => r.key === key).name}」。`)
}
watch(region, () => { battle.value = null; sheet.value = null })

/* ---------------- 战斗 ---------------- */
const battle = ref(null)
/* 战斗表现层：飘字 / 受击 / 斩击 / 入场。数值一律不动，只加视觉时序 */
const foeState = ref('')      // '' | 'attack' | 'hit' | 'crit' | 'dead'
const meState = ref('')       // '' | 'attack' | 'hit'
const slashKey = ref(0)       // 每次出手 +1，BattleScene 换 key 重播弧线
const pops = ref([])          // 伤害飘字
const entering = ref(false)   // 入场动画期间锁按钮
let popSeq = 0
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* 技能层：MP / 冷却 / 当前特效 */
const mp = ref(0)
const mpMax = computed(() => mpOf(stats.mystic))
const cds = ref(freshCooldowns())
const fx = ref(null)
const fxName = ref('')
let fxSeq = 0
const mirrorGuard = ref(0)   // 镜返：下一次挨打减伤并反弹
const bound = ref(0)         // 缚：敌人少一回合

/** 在目标身上弹一个飘字；760ms 后自己清掉 */
function popAt (target, text, kind = 'hit') {
  const id = ++popSeq
  pops.value.push({ id, target, text, kind })
  setTimeout(() => {
    const i = pops.value.findIndex((p) => p.id === id)
    if (i >= 0) pops.value.splice(i, 1)
  }, 760)
}
// 事件/宝箱/密道的小弹窗（模板里 v-if="sheet" 用它，漏声明会直接白屏）
const sheet = ref(null)
const bossCleared = ref(false)
const buff = ref(false)
const focusUsed = ref(0)
const busy = ref(false)
const over = computed(() => !!(battle.value && battle.value.over))
const win = computed(() => !!(battle.value && battle.value.enemyHp <= 0))
const foePercent = computed(() => {
  if (!battle.value) return 0
  return Math.max(0, Math.min(100, (battle.value.enemyHp / battle.value.enemy.hp) * 100))
})

/** 镜湖里魅力够就能交涉 */
const canCharm = computed(() => {
  if (!battle.value) return false
  if (region.value !== 'lake') return false
  return stats.charm >= 14 && !battle.value.enemy.boss
})

function engage (e) {
  if (e.kind === 'portal') { nextRegion(); return }
  if (isDone(e.id)) return
  if (e.kind === 'foe' || e.kind === 'boss') {
    startBattle(e)
    return
  }
  if (e.kind === 'chest') return openChest(e)
  if (e.kind === 'secret') return openSecret(e)
  openEvent(e)
}

function startBattle (e) {
  const foe = FOES[e.foe]
  battle.value = {
    enc: e,
    enemy: { ...foe, boss: e.kind === 'boss' },
    enemyHp: foe.hp,
    turn: 1,
    log: [{ kind: 'foe', text: `${foe.name} 挡在面前。` }],
    over: false
  }
  buff.value = false
  focusUsed.value = 0
  foeState.value = ''
  meState.value = ''
  pops.value = []
  slashKey.value = 0
  mp.value = mpMax.value
  cds.value = freshCooldowns()
  fx.value = null
  fxName.value = ''
  mirrorGuard.value = 0
  bound.value = 0
  push('foe', `遇上 ${foe.name}。`)
  // 入场 440ms：场景压暗 + 双方从两侧滑进来，这期间按钮按不动
  entering.value = true
  busy.value = true
  setTimeout(() => { entering.value = false; busy.value = false }, 460)
}

function pushBattle (kind, text) {
  if (battle.value) battle.value.log.unshift({ kind, text })
}
function push (kind, text) {
  log.value.unshift({ kind, text })
  if (log.value.length > 7) log.value.pop()
}

async function attack () {
  if (!battle.value || busy.value || over.value) return
  busy.value = true
  // 1) 前冲 + 斩击弧线（170ms）—— 弧线描完了才掉血，手感才对得上
  meState.value = 'attack'
  slashKey.value += 1
  await sleep(170)

  // 2) 结算（数值与旧版完全一致）
  const e = battle.value.enemy
  const isCrit = buff.value || Math.random() * 100 < crit.value
  const raw = atk.value * (0.85 + Math.random() * 0.3) - e.def * 0.5
  const dmg = Math.max(2, Math.round(raw * (isCrit ? 1.7 : 1)))
  battle.value.enemyHp -= dmg
  pushBattle(isCrit ? 'crit' : 'hit', isCrit ? `暴击！${dmg} 点伤害。` : `你斩出一刀，${dmg} 点伤害。`)
  popAt('foe', `-${dmg}`, isCrit ? 'crit' : 'hit')
  foeState.value = isCrit ? 'crit' : 'hit'
  buff.value = false

  // 3) 受击反应 220ms
  await sleep(200)
  meState.value = ''

  if (battle.value.enemyHp <= 0) {
    await playDeath()
    return
  }
  foeState.value = ''
  await sleep(60)
  foeTurn()
}

/** 死亡演出：部件散开 → 结算。技能也能复用，别把这段抄三遍 */
async function playDeath () {
  foeState.value = 'dead'
  await sleep(560)
  battle.value.over = true
  busy.value = false
  onWin()
}

/** 技能能不能按：MP、冷却、以及「满血时别浪费祈」 */
function skillReady (sk) {
  if (busy.value || over.value) return false
  if (mp.value < sk.cost || cds.value[sk.key] > 0) return false
  if (sk.key === 'pray' && hp.value >= maxHp.value) return false
  return true
}

/* ---------------- 技能 ---------------- */
async function useSkill (sk) {
  const b = battle.value
  if (!b || busy.value || over.value) return
  if (mp.value < sk.cost || cds.value[sk.key] > 0) return

  busy.value = true
  mp.value -= sk.cost
  if (sk.cd) cds.value = { ...cds.value, [sk.key]: sk.cd }
  fx.value = { key: sk.fx, id: ++fxSeq, color: sk.color }
  fxName.value = `${sk.name} · ${sk.en}`
  meState.value = 'attack'
  if (sk.fx === 'slash') slashKey.value += 1
  await sleep(sk.fx === 'pray' ? 280 : 200)
  meState.value = ''

  if (sk.key === 'pray') {
    const heal = sk.heal + Math.round(stats.wits * 0.8)
    const before = hp.value
    hp.value = Math.min(maxHp.value, hp.value + heal)
    const real = hp.value - before
    if (real > 0) popAt('me', `+${real}`, 'heal')
    pushBattle('buff', `祈：回复 ${real} 点生命。`)
  } else if (sk.key === 'mirror') {
    mirrorGuard.value = 1
    pushBattle('buff', '三面镜子浮起来，下一次攻击会被弹回去。')
  } else if (sk.key === 'bind') {
    const dmg = Math.max(2, Math.round(atk.value * sk.dmg))
    b.enemyHp -= dmg
    bound.value = 1
    popAt('foe', `-${dmg}`, 'hit')
    foeState.value = 'hit'
    pushBattle('hit', `根须缠住了它，${dmg} 点伤害。`)
    await sleep(220)
    foeState.value = ''
    if (b.enemyHp <= 0) { await playDeath(); return }
  } else if (sk.key === 'storm') {
    for (let i = 0; i < (sk.hits || 2); i++) {
      const dmg = Math.max(2, Math.round(atk.value * sk.dmg * (0.85 + Math.random() * 0.3)))
      b.enemyHp -= dmg
      popAt('foe', `-${dmg}`, 'hit')
      foeState.value = 'hit'
      pushBattle('hit', `花瓣划过，${dmg} 点伤害。`)
      await sleep(180)
      foeState.value = ''
      if (b.enemyHp <= 0) { await playDeath(); return }
    }
  } else {
    const isCrit = buff.value || Math.random() * 100 < crit.value
    const raw = atk.value * sk.dmg * (0.9 + Math.random() * 0.2) - b.enemy.def * 0.4
    const dmg = Math.max(2, Math.round(raw * (isCrit ? 1.7 : 1)))
    b.enemyHp -= dmg
    popAt('foe', `-${dmg}`, isCrit ? 'crit' : 'hit')
    foeState.value = isCrit ? 'crit' : 'hit'
    pushBattle(isCrit ? 'crit' : 'hit', isCrit ? `樱斩暴击！${dmg} 点伤害。` : `樱斩，${dmg} 点伤害。`)
    buff.value = false
    await sleep(220)
    foeState.value = ''
    if (b.enemyHp <= 0) { await playDeath(); return }
  }

  await sleep(80)
  foeTurn()
}

function focus () {
  if (!battle.value || busy.value || over.value || buff.value || focusUsed.value >= 2) return
  buff.value = true
  focusUsed.value += 1
  pushBattle('buff', '你凝住呼吸，下一击必定暴击。')
  busy.value = true
  // 凝神环是 BattleScene 里 buff 那条虚线环，这里只留时间给玩家看见它
  setTimeout(foeTurn, 420)
}

async function foeTurn () {
  const b = battle.value
  if (!b || b.over) { busy.value = false; return }
  const e = b.enemy
  // 被缚住：这回合动不了
  if (bound.value) {
    bound.value = 0
    pushBattle('mute', `${e.name} 被根须缠着，这一下没能动。`)
    await sleep(420)
    endTurn()
    return
  }

  // 怪物先往前扑一下，再判闪避 —— 只影响观感，判定顺序与旧版一致
  foeState.value = 'attack'
  await sleep(150)
  foeState.value = ''

  if (Math.random() * 100 < eva.value) {
    pushBattle('dodge', `${e.name} 扑了个空 —— 你侧身让开。`)
    popAt('foe', '未命中', 'miss')
    await sleep(260)
    endTurn()
    return
  }
  const isCrit = Math.random() * 100 < e.crit
  const raw = e.atk * (0.85 + Math.random() * 0.3) - def.value * 0.5
  let dmg = Math.max(1, Math.round(raw * (isCrit ? 1.6 : 1)))

  // 镜返：先削 70%，再把这部分的一半弹回去
  if (mirrorGuard.value > 0) {
    const blocked = Math.round(dmg * 0.7)
    dmg -= blocked
    const back = Math.max(1, Math.round(blocked * 0.8))
    b.enemyHp -= back
    popAt('foe', `-${back}`, 'hit')
    pushBattle('buff', `镜面弹回去 ${back} 点。`)
    mirrorGuard.value = 0
    if (b.enemyHp <= 0) { await playDeath(); return }
  }
  hp.value -= dmg
  pushBattle(isCrit ? 'crit' : 'hit', isCrit ? `${e.name} 重击，${dmg} 点伤害。` : `${e.name} 打来，${dmg} 点伤害。`)
  popAt('me', `-${dmg}`, isCrit ? 'crit' : 'hit')
  meState.value = 'hit'
  await sleep(320)
  meState.value = ''
  if (hp.value <= 0) {
    hp.value = 0
    b.over = true
    busy.value = false
    push('foe', '眼前一白，被花瓣裹着送了出去。')
    return
  }
  endTurn()
}

function endTurn () {
  if (!battle.value) return
  battle.value.turn += 1
  // 每回合回一点 mp，冷却减一
  mp.value = Math.min(mpMax.value, mp.value + MP_REGEN)
  const next = { ...cds.value }
  Object.keys(next).forEach((k) => { if (next[k] > 0) next[k] -= 1 })
  cds.value = next
  busy.value = false
}

function onWin () {
  const b = battle.value
  const isBoss = !!b.enemy.boss
  const gainPetal = isBoss ? 40 : 10 + Math.floor(Math.random() * 5)
  petals.value += gainPetal
  gainMany(current.value.gains)
  nudgeMood(isBoss ? 14 : 5)
  push('good', `${b.enemy.name} 散了，拾得 ${gainPetal} 片花瓣。`)
  done.value = new Set([...done.value, `${region.value}:${b.enc.id}`])
  if (isBoss) {
    bossCleared.value = true
    // 通关奖励：解锁后山特效（存本地，后山会读到）
    try { localStorage.setItem('sakura_hollow_cleared', '1') } catch (e) { /* 存不下就算了 */ }
  }
}

function closeBattle () {
  const wasBoss = bossCleared.value
  battle.value = null
  busy.value = false
  foeState.value = ''
  meState.value = ''
  pops.value = []
  entering.value = false
  if (!wasBoss) return
  bossCleared.value = false
  sheet.value = {
    tag: 'HOLLOW CLEARED · 通关',
    title: '樱心安静下来了',
    text: `雾从脚边退开，你手里的花瓣还带着温度。这一趟带出 ${petals.value} 片花瓣 —— 它们会变成你身上的一点东西。后山的花，从今往后落得更慢了。`,
    gains: ['解锁 后山特效', `花瓣 ${petals.value}`, '全属性 +1'],
    ok: '回到后山',
    exit: true
  }
}

function flee () {
  const b = battle.value
  if (!b) return
  hp.value = Math.max(1, hp.value - 3)
  battle.value = null
  busy.value = false
  foeState.value = ''
  meState.value = ''
  pops.value = []
  push('mute', '退开了，心跳还没慢下去。')
}

function loseOut () {
  battle.value = null
  busy.value = false
  foeState.value = ''
  meState.value = ''
  pops.value = []
  emit('exit-realm', { reason: 'lose', petals: petals.value })
}

/* 镜湖：魅力交涉跳过战斗 */
function charmSkip () {
  const b = battle.value
  if (!b) return
  const gainPetal = 6
  petals.value += gainPetal
  gainMany({ charm: 1 })
  nudgeMood(4)
  done.value = new Set([...done.value, `${region.value}:${b.enc.id}`])
  battle.value = null
  busy.value = false
  foeState.value = ''
  meState.value = ''
  pops.value = []
  push('good', `你和 ${b.enemy.name} 说了几句，它让开了路，还留下 ${gainPetal} 片花瓣。`)
  sheet.value = {
    tag: 'CHARM · 交涉成功',
    title: '它听懂了',
    text: `${b.enemy.name} 盯着你看了很久，最后侧过身去。花瓣落下来的时候，像一句道谢。`,
    gains: ['魅力 +1', `花瓣 +${gainPetal}`],
    ok: '继续'
  }
}

/* ---------------- 宝箱 / 密道 / 事件 ---------------- */
function openChest (e) {
  if (!meetsNeed(e)) {
    sheet.value = {
      tag: 'CHEST · 锁住了',
      title: '箱盖上是一圈看不懂的花纹',
      text: `你试着推了推，箱子纹丝不动。花纹像是某种谜题 —— 智力 ${e.need} 以上也许能读懂。`,
      ok: '记下来'
    }
    return
  }
  const gainPetal = 18
  petals.value += gainPetal
  gainMany({ wits: 1, luck: 1 })
  done.value = new Set([...done.value, `${region.value}:${e.id}`])
  push('good', `解开了湖中宝箱，得到 ${gainPetal} 片花瓣。`)
  sheet.value = {
    tag: 'CHEST · 解开',
    title: '箱子开了',
    text: '花纹顺着你的指尖转了一圈，锁扣自己弹开。里面是裹着水汽的花瓣和一枚小种子。',
    gains: [`花瓣 +${gainPetal}`, '智力 +1', '幸运 +1'],
    ok: '收好'
  }
}

function openSecret (e) {
  if (!meetsNeed(e)) {
    sheet.value = {
      tag: 'PASSAGE · 堵着',
      title: '根墙后面还有空间',
      text: `敲上去是空的，但找不到开口。苔藓下有几道刻痕 —— 智力 ${e.need} 以上大概能拼出来。`,
      ok: '记下来'
    }
    return
  }
  const gainPetal = 24
  petals.value += gainPetal
  gainMany({ wits: 2, strength: 1 })
  done.value = new Set([...done.value, `${region.value}:${e.id}`])
  push('good', `拼出刻痕，根墙裂开一条道，得到 ${gainPetal} 片花瓣。`)
  sheet.value = {
    tag: 'PASSAGE · 开启',
    title: '根墙裂开了',
    text: '刻痕是一句方位口诀。墙让开的缝只够一个人侧身过去，里面更暗，花香更浓。',
    gains: [`花瓣 +${gainPetal}`, '智力 +2', '力量 +1'],
    ok: '走进去'
  }
}

const EVENT_TEXT = [
  { title: '记忆花瓣', text: '一片花瓣落在掌心，忽然变得半透明 —— 里面有一个很短的画面：有人在树下等人，等了很久。', gains: ['神秘 +1'] },
  { title: '记忆花瓣', text: '花瓣上浮出一行字，看清时已经散了，只记得最后两个字：别忘。', gains: ['神秘 +1', '智力 +1'] },
  { title: '记忆花瓣', text: '你听见很远的铃声，像是从树的另一侧传来的。手心多了一片温热的花瓣。', gains: ['幸运 +1'] }
]

function closeSheet () {
  const exit = !!(sheet.value && sheet.value.exit)
  sheet.value = null
  if (exit) goHome()
}

function openEvent (e) {
  if (!meetsNeed(e)) {
    sheet.value = {
      tag: 'GLIMMER · 抓不住',
      title: '湖面亮了一下',
      text: `那道微光在你看清之前就散了。幸运 ${e.need} 以上的人，大概能正好接住。`,
      ok: '算了'
    }
    return
  }
  const pickText = EVENT_TEXT[Math.floor(Math.random() * EVENT_TEXT.length)]
  const gainPetal = 8 + Math.floor(Math.random() * 8)
  petals.value += gainPetal
  if (e.id === 'l4') gainMany({ luck: 1 })
  else gainMany({ mystic: 1 })
  done.value = new Set([...done.value, `${region.value}:${e.id}`])
  push('good', `${pickText.title}：${gainPetal} 片花瓣。`)
  sheet.value = {
    tag: e.id === 'l4' ? 'GLIMMER · 奇遇' : 'MEMORY · 剧情碎片',
    title: pickText.title,
    text: pickText.text,
    gains: [`花瓣 +${gainPetal}`, ...pickText.gains],
    ok: '收下'
  }
}

/* ---------------- 离开 ---------------- */
function goHome () {
  // 归乡樱瓣：不惩罚、不扣东西
  const extra = Math.floor(petals.value / 12)
  if (extra > 0) gainMany({ mystic: extra })
  emit('exit-realm', { reason: 'home', petals: petals.value })
}

/* ---------------- 花瓣 ---------------- */
const petalCanvas = ref(null)
let field = null
function resize () {
  const c = petalCanvas.value
  if (!c) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = c.clientWidth * dpr
  c.height = c.clientHeight * dpr
}

onMounted(() => {
  resize()
  field = createPetalField(petalCanvas.value, { density: 0.00005, max: 70, base: 14, wind: 0.12 })
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (field && field.destroy) field.destroy()
})

</script>

<style scoped>
.realm {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100svh;
  overflow: hidden;
  color: #f6ecf4;
  background: #241a30;
  isolation: isolate;
}
.realm__sky {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 50% 6%, #f3e6f3 0%, #e7d8ee 18%, #6d4f78 52%, #2b1e3a 82%, #1c1428 100%);
  opacity: .96;
}
.realm__glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(38% 30% at 76% 16%, rgba(255, 180, 214, .28), transparent 72%),
    radial-gradient(42% 34% at 22% 70%, rgba(168, 120, 200, .22), transparent 74%);
  pointer-events: none;
}
.realm__fog {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 240, 248, .28), transparent 42%, rgba(255, 235, 246, .16));
  pointer-events: none;
}
.realm__petals {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* ---------- 顶栏 ---------- */
.realm__bar {
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: clamp(12px, 2vw, 26px);
  padding: 12px clamp(16px, 3vw, 38px);
  background: linear-gradient(180deg, rgba(30, 20, 42, .82), rgba(30, 20, 42, .18));
  border-bottom: 1px solid rgba(255, 214, 234, .14);
  flex-wrap: wrap;
}
.realm__brand { display: flex; align-items: baseline; gap: 8px; flex: none; }
.realm__mark {
  width: 9px; height: 9px; border-radius: 50% 0 50% 50%;
  background: linear-gradient(140deg, #fff, #ffb3cf);
  transform: rotate(45deg);
  box-shadow: 0 0 14px rgba(255, 160, 200, .9);
}
.realm__name { font-family: var(--font-serif); font-size: 15px; font-weight: 900; letter-spacing: .16em; }
.realm__en { font-size: 7.5px; letter-spacing: .3em; color: rgba(255, 220, 235, .42); }

/* 七维属性条 */
.realm__seven {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(6px, 0.9vw, 14px);
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  max-width: 760px;
}
.realm__seven li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 2px 5px; min-width: 54px; }
.realm__seven i { width: 5px; height: 5px; border-radius: 50%; display: block; }
.realm__seven em { font-style: normal; font-size: 9px; letter-spacing: .06em; color: rgba(255, 228, 240, .62); }
.realm__seven b { font-size: 12px; color: #fff; font-variant-numeric: tabular-nums; justify-self: end; }
.realm__seven span {
  grid-column: 1 / -1;
  grid-row: 2;
  height: 4px;
  margin-top: 1px;
  border-radius: 999px;
  background: rgba(255, 220, 236, .18);
  overflow: hidden;
}
.realm__seven span i { width: 0; height: 100%; border-radius: 999px; transition: width .4s var(--ease); display: block; }

.realm__vitals { display: flex; align-items: center; gap: 14px; margin-left: auto; flex: none; }
.rv { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; color: rgba(255, 226, 238, .66); }
.rv i { font-style: normal; font-size: 8.5px; letter-spacing: .16em; color: rgba(255, 214, 232, .5); }
.rv b { font-size: 13px; color: #fff; font-variant-numeric: tabular-nums; }
.rv em { font-style: normal; font-size: 9.5px; color: rgba(255, 220, 235, .45); }
.rv--hp .rv__bar { display: block; width: 80px; height: 4px; border-radius: 999px; background: rgba(255, 214, 234, .16); overflow: hidden; }
.rv--hp .rv__bar i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #ffb0c8, #e8557f); transition: width .35s var(--ease); }
.rv--petal b { color: #ffd7e6; }

.realm__home {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid rgba(255, 214, 234, .3);
  background: rgba(255, 240, 247, .1);
  color: rgba(255, 236, 244, .86);
  font: inherit;
  font-size: 11px;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .25s, color .25s;
}
.realm__home:hover { background: rgba(255, 214, 234, .2); color: #fff; }
.realm__home-petal {
  width: 8px; height: 6px;
  border-radius: 60% 40% 55% 45%;
  background: linear-gradient(140deg, #fff2f7, #f6b8ce);
}

/* ---------- 区域页签 ---------- */
.realm__regions {
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px clamp(16px, 3vw, 38px) 4px;
  flex-wrap: wrap;
}
.rgn {
  display: grid;
  gap: 1px;
  padding: 8px 15px 7px;
  border-radius: 13px;
  border: 1px solid rgba(255, 214, 234, .2);
  background: rgba(40, 26, 54, .48);
  color: rgba(255, 232, 242, .78);
  font: inherit;
  cursor: pointer;
  transition: background .25s, border-color .25s, transform .25s var(--ease), color .25s;
}
.rgn b { font-size: 12px; letter-spacing: .1em; }
.rgn i { font-style: normal; font-size: 7px; letter-spacing: .18em; opacity: .5; }
.rgn em { font-style: normal; font-size: 8px; letter-spacing: .04em; color: rgba(255, 214, 232, .5); }
.rgn:hover { transform: translateY(-1px); border-color: rgba(255, 214, 234, .45); }
.rgn.is-on {
  background: linear-gradient(180deg, rgba(255, 240, 247, .96), rgba(255, 226, 238, .9));
  border-color: rgba(255, 255, 255, .9);
  color: #7a3f5e;
}
.rgn.is-on i { opacity: .6; }
.rgn.is-on em { color: rgba(140, 80, 110, .7); }
.rgn.is-boss { border-color: rgba(255, 150, 180, .42); }
.realm__tip { margin-left: 6px; font-size: 9.5px; letter-spacing: .1em; color: rgba(255, 226, 238, .42); }

/* ---------- 舞台 ---------- */
.realm__stage {
  position: relative;
  z-index: 4;
  flex: 1 1 auto;
  min-height: 380px;
}
.realm__svg { position: absolute; inset: 0; width: 100%; height: 100%; }

.enc { cursor: pointer; }
.enc:focus { outline: none; }
.enc__ring { transform-box: fill-box; transform-origin: center; animation: encRing 2.4s ease-in-out infinite; }
@keyframes encRing { 0%, 100% { opacity: .25; } 50% { opacity: .7; } }
/* 标签在浅色场景里用深色 + 白描边，在根域那种暗场景里反过来 */
.enc__label {
  font-size: 10px;
  letter-spacing: .06em;
  fill: #5d3b52;
  paint-order: stroke;
  stroke: rgba(255, 252, 254, .92);
  stroke-width: 2.8px;
  stroke-linejoin: round;
}
.enc__label.is-dim { fill: rgba(110, 82, 102, .62); }
.enc__need { font-size: 8px; letter-spacing: .04em; fill: rgba(132, 94, 122, .8); paint-order: stroke; stroke: rgba(255, 252, 254, .9); stroke-width: 2.4px; }
.is-roots .enc__label { fill: #ffd8ea; stroke: rgba(38, 24, 44, .6); }
.is-roots .enc__label.is-dim { fill: rgba(255, 216, 234, .48); }
.is-roots .enc__need { fill: rgba(255, 214, 232, .8); stroke: rgba(38, 24, 44, .55); }

.sigil { animation: sigilSpin 26s linear infinite; }
@keyframes sigilSpin { to { transform: rotate(360deg); } }

/* ---------- 右侧说明 ---------- */
.realm__side {
  position: absolute;
  right: clamp(14px, 2.6vw, 34px);
  top: clamp(12px, 2.4vh, 26px);
  width: min(272px, 30vw);
  padding: 15px 16px 14px;
  border-radius: 18px;
  background: rgba(38, 25, 50, .68);
  border: 1px solid rgba(255, 214, 234, .18);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.realm__side-tier { margin: 0; font-size: 8.5px; letter-spacing: .24em; color: #ffc4d9; }
.realm__side h2 { margin: 6px 0 0; font-family: var(--font-serif); font-size: 19px; letter-spacing: .06em; color: #fff; }
.realm__side-desc { margin: 8px 0 0; font-size: 11px; line-height: 1.8; color: rgba(255, 232, 242, .74); }
.realm__side-tags { list-style: none; display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0 0; padding: 0; }
.realm__side-tags li {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 214, 234, .14);
  color: #ffd9e8;
  font-size: 8.5px;
  letter-spacing: .04em;
}
.realm__side-tag { margin: 14px 0 8px; font-size: 8px; letter-spacing: .26em; color: rgba(255, 214, 232, .45); }
.realm__log { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.realm__log li { font-size: 10.5px; line-height: 1.65; color: rgba(255, 232, 242, .76); }
.realm__log li.is-good { color: #ffd9e6; }
.realm__log li.is-foe { color: #ffb3c4; }
.realm__log li.is-mute { color: rgba(255, 232, 242, .48); }

/* ---------- 战斗 / 事件弹窗 ---------- */
.battle,
.sheet {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(18, 11, 26, .66);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.battle__panel,
.sheet__panel {
  width: min(520px, 100%);
  max-height: 92vh;
  overflow: auto;
  padding: 22px 24px 20px;
  border-radius: 22px;
  background: linear-gradient(180deg, #fdf8fb 0%, #f9f1f7 100%);
  color: var(--ink);
  box-shadow: 0 40px 80px -36px rgba(10, 4, 16, .9);
}
.battle__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.battle__tag { margin: 0; font-size: 8.5px; letter-spacing: .24em; color: var(--sakura-600); }
.battle__head h2 { margin: 6px 0 0; font-family: var(--font-serif); font-size: 21px; letter-spacing: .06em; }
.battle__turn { font-size: 10px; letter-spacing: .1em; color: var(--faint); }
.battle__line { margin: 10px 0 16px; font-size: 11.5px; line-height: 1.7; color: var(--ink-soft); }

.battle__foe,
.battle__me { display: flex; align-items: baseline; justify-content: space-between; font-size: 11px; color: var(--ink-soft); }
.battle__foe-name { letter-spacing: .1em; }
.battle__foe-hp,
.battle__me span:last-child { font-variant-numeric: tabular-nums; font-size: 14px; color: var(--ink); }
.battle__foe-hp i,
.battle__me i { font-style: normal; font-size: 10px; color: var(--faint); }
.battle__bar { height: 7px; margin: 6px 0 14px; border-radius: 999px; background: #efe4ec; overflow: hidden; }
.battle__bar i { display: block; height: 100%; border-radius: 999px; transition: width .3s var(--ease); }
.battle__bar--me i { background: linear-gradient(90deg, #ffb0c8, #e8557f); }

.battle__log {
  list-style: none;
  margin: 4px 0 16px;
  padding: 10px 12px;
  height: 106px;
  overflow: auto;
  border-radius: 12px;
  background: rgba(126, 90, 130, .07);
  display: grid;
  gap: 6px;
  align-content: start;
}
.battle__log li { font-size: 11px; line-height: 1.6; color: var(--ink-soft); }
.battle__log li.is-hit { color: #9b5c74; }
.battle__log li.is-crit { color: #c3325f; font-weight: 600; }
.battle__log li.is-dodge { color: #5f8f7d; }
.battle__log li.is-buff { color: #7c62a8; }
.battle__log li.is-foe { color: #8d6a86; }

/* ---------- 技能栏 ---------- */
.battle__foot {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 78px;
  gap: 8px;
  align-items: start;
}
.battle__skills { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.bskill {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 1px;
  padding: 7px 2px 6px;
  border: 1px solid rgba(255, 255, 255, .95);
  border-radius: 13px;
  background: linear-gradient(180deg, #fffdfd, #f7ecf3);
  box-shadow: 0 8px 16px -14px rgba(88, 50, 84, .9);
  color: #7d5f75;
  font: inherit;
  cursor: pointer;
  transition: transform .18s var(--ease), box-shadow .18s, opacity .18s;
}
.bskill::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 13px;
  box-shadow: inset 0 0 0 1px var(--c);
  opacity: .4;
  pointer-events: none;
}
.bskill__ico { display: block; width: 21px; height: 21px; color: var(--c); }
.bskill__ico svg { width: 100%; height: 100%; filter: drop-shadow(0 1px 1px rgba(120, 70, 110, .2)); }
.bskill b { font-size: 10.5px; font-weight: 700; letter-spacing: .04em; }
.bskill em {
  position: absolute;
  top: 4px;
  right: 5px;
  font-style: normal;
  font-size: 8px;
  font-weight: 700;
  color: #ad8fae;
}
.bskill__cd {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: rgba(88, 48, 78, .58);
  color: #fff;
  font-style: normal;
  font-size: 15px;
  font-weight: 700;
  backdrop-filter: blur(1px);
}
.bskill.is-off { opacity: .5; }
.bskill:not(.is-off):hover { transform: translateY(-2px); box-shadow: 0 12px 20px -12px rgba(120, 60, 100, .95); }
.bskill:not(.is-off):active { transform: translateY(0); }
.bskill:focus-visible { outline: 2px solid var(--sakura-500); outline-offset: 2px; }

/* 普通动作：右侧 2×2 小圆钮 */
.battle__mini { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.bmini {
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, .95);
  border-radius: 50%;
  background: linear-gradient(180deg, #fffdfd, #f4e7ef);
  box-shadow: 0 8px 16px -14px rgba(88, 50, 84, .9);
  color: #7d5f75;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .18s var(--ease), color .18s, opacity .18s;
}
.bmini:hover:not(:disabled) { transform: translateY(-2px); color: var(--sakura-700); }
.bmini:disabled { opacity: .45; cursor: default; }
.bmini--charm { color: #b06a86; }
.bmini--flee { color: #8b7f96; }

.battle__actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.battle__actions.has-four { grid-template-columns: repeat(2, 1fr); }
.battle__btn {
  display: grid;
  gap: 3px;
  padding: 10px 8px 9px;
  border-radius: 13px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 12px;
  letter-spacing: .1em;
  cursor: pointer;
  transition: transform .2s var(--ease), border-color .2s, background .2s;
}
.battle__btn i { font-style: normal; font-size: 8.5px; letter-spacing: .02em; color: var(--faint); }
.battle__btn:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--sakura-300); background: var(--sakura-50); }
.battle__btn:disabled { opacity: .5; cursor: default; }
.battle__btn--cut { border-color: rgba(212, 96, 143, .4); background: linear-gradient(180deg, #fff, #ffeef4); }
.battle__btn--charm { border-color: rgba(168, 107, 184, .42); background: linear-gradient(180deg, #fff, #f6eefb); }

.battle__over { margin-top: 16px; padding-top: 14px; border-top: 1px dashed rgba(150, 110, 132, .24); text-align: center; }
.battle__over-tag { margin: 0; font-size: 9px; letter-spacing: .3em; color: var(--sakura-600); }
.battle__over-text { margin: 8px 0 14px; font-size: 12px; line-height: 1.7; color: var(--ink-soft); }
.battle__close,
.sheet__ok {
  height: 42px;
  padding: 0 26px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  color: #fff;
  font: inherit;
  font-size: 12.5px;
  letter-spacing: .1em;
  cursor: pointer;
  box-shadow: 0 16px 28px -18px rgba(226, 86, 128, .95);
}

.sheet__tag { margin: 0; font-size: 8.5px; letter-spacing: .26em; color: var(--sakura-600); }
.sheet__panel h2 { margin: 8px 0 0; font-family: var(--font-serif); font-size: 20px; letter-spacing: .04em; }
.sheet__text { margin: 10px 0 0; font-size: 12px; line-height: 1.9; color: var(--ink-soft); }
.sheet__actions { display: flex; justify-content: flex-end; margin-top: 18px; }
.sheet__gain { list-style: none; display: flex; flex-wrap: wrap; gap: 7px; margin: 14px 0 0; padding: 0; }
.sheet__gain li { padding: 4px 10px; border-radius: 999px; background: var(--sakura-50); color: var(--sakura-700); font-size: 10.5px; letter-spacing: .04em; }

.battle-enter-active,
.battle-leave-active { transition: opacity .28s var(--ease); }
.battle-enter-active .battle__panel,
.battle-enter-active .sheet__panel,
.battle-leave-active .battle__panel,
.battle-leave-active .sheet__panel { transition: transform .3s var(--ease); }
.battle-enter-from,
.battle-leave-to { opacity: 0; }
.battle-enter-from .battle__panel,
.battle-enter-from .sheet__panel,
.battle-leave-to .battle__panel,
.battle-leave-to .sheet__panel { transform: translateY(14px) scale(.98); }

@media (max-width: 1080px) {
  .realm__seven em { display: none; }
  .realm__seven li { min-width: 34px; }
}
@media (max-width: 900px) {
  .realm__side { position: static; width: auto; margin: 10px 14px 0; }
  .realm__stage { height: auto; }
  .realm__svg { position: static; height: 48vh; }
  .realm__tip { display: none; }
}
</style>
