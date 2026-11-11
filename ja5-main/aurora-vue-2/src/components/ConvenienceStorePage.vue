<template>
  <TownShell
    :user="user"
    active="discover"
    tag="STORE 24H"
    title="灯花便利店"
    desc="凌晨两点也亮着的白灯，关东煮在咕嘟咕嘟。店长说：缺人手，你要不要试一班？"
    @navigate="$emit('navigate', $event)"
    @logout="$emit('logout')"
  >
    <template #hud>
      <span class="shift-tip">
        下一班 {{ wallet.workReadyIn > 0 ? wallet.workReadyIn + ' 秒后' : '随时可上工' }}
      </span>
    </template>

    <div class="store">
      <!-- ============ 左：收银台 ============ -->
      <section class="till">
        <header class="till__head">
          <div>
            <span class="till__tag">CASHIER</span>
            <h2>收银台</h2>
          </div>
          <span class="till__lamp" :class="{ 'is-on': phase === 'playing' }"></span>
        </header>

        <!-- 上班前的说明 -->
        <div v-if="phase === 'idle'" class="till__intro">
          <p class="till__lede">
            一单接一单地把东西装进袋子 —— 30 秒内装对越多，绩效越高。
            装错了会耽误时间，顾客可不会等你。
          </p>
          <ul class="till__rules">
            <li><b>{{ wallet.workEnergyCost }}</b> 体力换一班</li>
            <li>底薪 <b>8</b> 金币，满绩效 <b>46</b> 金币</li>
            <li>每班结束要歇 <b>20</b> 秒</li>
          </ul>
          <button class="till__start" type="button" :disabled="!canStart" @click="start">
            {{ startLabel }}
          </button>
          <p v-if="blockReason" class="till__block">{{ blockReason }}</p>
        </div>

        <!-- 游戏中 -->
        <div v-else-if="phase === 'playing'" class="till__game">
          <div class="till__top">
            <span class="till__timer" :class="{ low: timeLeft <= 8 }">{{ timeLeft }}s</span>
            <span class="till__combo" v-if="combo > 1">连击 ×{{ combo }}</span>
            <span class="till__score">{{ correct }} 单</span>
          </div>

          <div class="queue">
            <div v-for="(c, i) in customers" :key="c.key" class="guest" :class="{ 'guest--now': i === 0 }">
              <span class="guest__face" :style="{ background: c.color }">{{ c.initial }}</span>
              <div class="guest__bubble">
                <span class="guest__want">{{ c.goods.icon }}</span>
                <span class="guest__name">{{ c.goods.name }}</span>
              </div>
            </div>
          </div>

          <div class="goods">
            <button
              v-for="g in GOODS"
              :key="g.key"
              class="goods__btn"
              type="button"
              @click="pick(g)"
            >
              <span class="goods__ico">{{ g.icon }}</span>
              <span class="goods__label">{{ g.name }}</span>
            </button>
          </div>

          <p class="till__flash" :class="flashType">{{ flashText }}</p>
        </div>

        <!-- 结算 -->
        <div v-else class="till__done">
          <span class="till__done-tag">SHIFT OVER</span>
          <h3>{{ result.wage >= 40 ? '店长给你比了个赞' : result.wage >= 24 ? '干得不错，明天还来吗' : '辛苦了，先熟悉熟悉货架吧' }}</h3>
          <div class="till__pay">
            <div><b>{{ result.correct }}</b><span>装对单数</span></div>
            <div><b>{{ result.score }}</b><span>绩效分</span></div>
            <div class="hl"><b>+{{ result.wage }}</b><span>本班工资</span></div>
          </div>
          <p class="till__balance">余额 {{ wallet.money }} 金币 · 体力 {{ wallet.energy }}/{{ wallet.energyMax }}</p>
          <div class="till__actions">
            <button class="till__ghost" type="button" @click="phase = 'idle'">收工</button>
            <button class="till__again" type="button" :disabled="!canStart" @click="start">
              {{ canStart ? '再打一班' : (wallet.workReadyIn > 0 ? `${wallet.workReadyIn} 秒后可再上工` : '体力不够了') }}
            </button>
          </div>
        </div>
      </section>

      <!-- ============ 右：货架与街景 ============ -->
      <aside class="side">
        <div class="shop">
          <div class="shop__fascia">
            <span class="shop__neon">24H</span>
            <span class="shop__name">灯花便利店</span>
          </div>

          <div class="shop__window">
            <div class="shelf-row" v-for="row in 2" :key="row">
              <span v-for="g in GOODS.slice(row === 1 ? 0 : 3, row === 1 ? 3 : 6)" :key="g.key" class="shelf-item">
                <i>{{ g.icon }}</i>
                <b>{{ g.price }}</b>
              </span>
            </div>
          </div>

          <p class="shop__note">「东西随便看，钱要一次结清。」<i>—— 店长 · 猫柳</i></p>
        </div>

        <div class="tips">
          <h3>镇上的营生</h3>
          <ul>
            <li><b>打工</b>：在这儿赚金币，体力越多班次越多</li>
            <li><b>回体力</b>：回家睡一觉（每天一次），或在健身房买瓶蛋白饮</li>
            <li><b>花金币</b>：书店买书解锁全文、健身房练高体力上限</li>
          </ul>
        </div>
      </aside>
    </div>
  </TownShell>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import TownShell from './TownShell.vue'
import { useEconomy } from '../composables/useEconomy'
import { toast } from '../composables/useToast'

defineProps({
  user: { type: Object, default: null }
})
defineEmits(['navigate', 'logout'])

const { wallet, work, canWork, refresh, startTicker } = useEconomy()

/* ---------------- 货架商品（同时是收银小游戏的题库） ---------------- */
const GOODS = [
  { key: 'onigiri', icon: '🍙', name: '饭团', price: 6, color: '#fff4e6' },
  { key: 'noodle', icon: '🍜', name: '杯面', price: 9, color: '#ffeede' },
  { key: 'coffee', icon: '☕', name: '咖啡', price: 8, color: '#f3e8dd' },
  { key: 'choco', icon: '🍫', name: '巧克力', price: 7, color: '#f0e2d6' },
  { key: 'milk', icon: '🥛', name: '牛奶', price: 5, color: '#f6f2ec' },
  { key: 'dango', icon: '🍡', name: '团子', price: 6, color: '#fdeaf1' }
]

const GUEST_COLORS = ['#f8d7e3', '#dbe7f7', '#e2f0dc', '#f3e3d3', '#e9ddf5']

const SHIFT_SECONDS = 30
const PENALTY_SECONDS = 2

const phase = ref('idle')
const timeLeft = ref(SHIFT_SECONDS)
const correct = ref(0)
const combo = ref(0)
const bestCombo = ref(0)
const result = ref({ wage: 0, score: 0, correct: 0 })
const customers = ref([])
const flashText = ref('')
const flashType = ref('')

let timer = null
let seed = 0

const canStart = computed(() => canWork.value && phase.value !== 'playing')

const startLabel = computed(() => {
  if (phase.value === 'playing') return '正在上班…'
  if (wallet.energy < wallet.workEnergyCost) return '体力不够，先回家睡一觉'
  if (wallet.workReadyIn > 0) return `${wallet.workReadyIn} 秒后可再上工`
  return '开始打工'
})

const blockReason = computed(() => {
  if (wallet.energy < wallet.workEnergyCost) {
    return `体力 ${wallet.energy}/${wallet.energyMax}，打工需要 ${wallet.workEnergyCost} 点 —— 每 90 秒会自然恢复 1 点。`
  }
  return ''
})

/** 生成一位顾客：随机想要一件商品 */
function makeGuest () {
  const goods = GOODS[Math.floor(Math.random() * GOODS.length)]
  const color = GUEST_COLORS[Math.floor(Math.random() * GUEST_COLORS.length)]
  return {
    key: ++seed,
    goods,
    color,
    initial: ['小', '阿', '雪', '川', '铃'][Math.floor(Math.random() * 5)]
  }
}

function refillQueue () {
  while (customers.value.length < 3) customers.value.push(makeGuest())
}

function flash (text, type = '') {
  flashText.value = text
  flashType.value = type
}

function start () {
  if (!canStart.value) {
    toast.error(blockReason.value || '现在还不能上工')
    return
  }
  phase.value = 'playing'
  timeLeft.value = SHIFT_SECONDS
  correct.value = 0
  combo.value = 0
  bestCombo.value = 0
  customers.value = []
  refillQueue()
  flash('开始上班，把东西装进袋子里', '')

  clearInterval(timer)
  timer = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) finish()
  }, 1000)
}

function pick (goods) {
  if (phase.value !== 'playing') return
  const now = customers.value[0]
  if (!now) return

  if (now.goods.key === goods.key) {
    correct.value += 1
    combo.value += 1
    if (combo.value > bestCombo.value) bestCombo.value = combo.value
    flash(combo.value > 1 ? `连击 ×${combo.value}，漂亮` : '装对了', 'ok')
    customers.value.shift()
    refillQueue()
    // 手快给一点正反馈：命中就轻微加时，最高不超过 30 秒
    timeLeft.value = Math.min(SHIFT_SECONDS, timeLeft.value + 0.4)
    timeLeft.value = Math.ceil(timeLeft.value)
  } else {
    combo.value = 0
    timeLeft.value = Math.max(0, timeLeft.value - PENALTY_SECONDS)
    flash(`拿错了，他要的是「${now.goods.name}」· -${PENALTY_SECONDS} 秒`, 'bad')
  }
}

async function finish () {
  clearInterval(timer)
  phase.value = 'done'
  // 绩效分：装对一单 7 分，满 100；服务端还会再夹一次，这里只是展示口径
  const score = Math.min(100, correct.value * 7)
  try {
    const res = await work(score)
    result.value = { wage: res.wage, score: res.score, correct: correct.value }
    toast.success(`这班挣了 ${res.wage} 金币`)
  } catch (e) {
    result.value = { wage: 0, score, correct: correct.value }
    toast.error((e && e.message) || '这班工资没能在系统里记上，请稍后再试')
  }
}

onBeforeUnmount(() => clearInterval(timer))
startTicker()
refresh()
</script>

<style scoped>
.shift-tip { font-size: 11.5px; color: var(--muted); letter-spacing: .04em; }

.store {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

/* ---------- 收银台 ---------- */
.till {
  padding: 20px 20px 22px;
  border-radius: 22px;
  background: rgba(255, 253, 254, .84);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, .95);
  box-shadow: var(--lift), var(--gloss);
}
.till__head { display: flex; align-items: flex-start; justify-content: space-between; }
.till__tag { font-size: 9px; letter-spacing: .3em; color: var(--sky-600); }
.till__head h2 {
  margin: 6px 0 0;
  font-family: var(--font-serif);
  font-size: 21px;
  font-weight: 600;
  color: var(--ink);
}
.till__lamp {
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 50%;
  background: rgba(168, 156, 176, .4);
  transition: background .3s, box-shadow .3s;
}
.till__lamp.is-on {
  background: #7fc4a4;
  box-shadow: 0 0 0 5px rgba(127, 196, 164, .18), 0 0 16px rgba(127, 196, 164, .7);
  animation: lamp-pulse 1.6s ease-in-out infinite;
}

.till__intro { padding-top: 14px; }
.till__lede { margin: 0; font-size: 12.5px; line-height: 1.9; color: var(--muted); }
.till__rules {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  margin: 14px 0 18px;
  padding: 0;
}
.till__rules li {
  padding: 7px 11px;
  border-radius: 10px;
  background: rgba(255, 233, 242, .6);
  border: 1px solid rgba(255, 221, 233, .8);
  font-size: 11px;
  color: var(--muted);
}
.till__rules b { color: var(--sakura-700); font-variant-numeric: tabular-nums; }
.till__start {
  width: 100%;
  height: 44px;
  border: 0;
  border-radius: 14px;
  cursor: pointer;
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: .08em;
  color: #fff;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  box-shadow: 0 18px 32px -20px rgba(232, 84, 127, 1);
  transition: transform .25s var(--ease), box-shadow .25s, filter .25s;
}
.till__start:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 22px 36px -20px rgba(232, 84, 127, 1); }
.till__start:disabled {
  color: var(--muted);
  background: var(--paper-3);
  box-shadow: none;
  cursor: default;
}
.till__block { margin: 10px 0 0; font-size: 11.5px; color: var(--sakura-600); line-height: 1.7; }

/* 游戏区 */
.till__game { padding-top: 14px; }
.till__top { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.till__timer {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  transition: color .3s;
}
.till__timer.low { color: var(--sakura-600); animation: lamp-pulse 1s ease-in-out infinite; }
.till__combo {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: #8a5f27;
  background: rgba(247, 215, 154, .5);
  animation: rise .3s var(--ease);
}
.till__score { margin-left: auto; font-size: 12px; color: var(--muted); }

.queue { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; }
.guest { display: flex; align-items: center; gap: 8px; opacity: .5; transition: opacity .3s, transform .3s var(--ease); }
.guest--now { opacity: 1; transform: scale(1.04); }
.guest__face {
  width: 34px;
  height: 34px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 12.5px;
  color: #6b4a5c;
  border: 2px solid #fff;
  box-shadow: var(--shadow-sm);
}
.guest__bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--line-soft);
  box-shadow: var(--lift);
}
.guest--now .guest__bubble { border-color: var(--sakura-200); background: linear-gradient(120deg, #fff, #fff5f9); }
.guest__want { font-size: 20px; line-height: 1; }
.guest__name { font-size: 11.5px; color: var(--ink-soft); white-space: nowrap; }

.goods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.goods__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border-radius: 14px;
  border: 1px solid var(--line-soft);
  background: #fff;
  cursor: pointer;
  font: inherit;
  transition: transform .18s var(--ease), border-color .18s, box-shadow .18s, background .18s;
}
.goods__btn:hover { transform: translateY(-2px); border-color: var(--sakura-200); box-shadow: var(--lift); }
.goods__btn:active { transform: scale(.97); }
.goods__ico { font-size: 24px; line-height: 1; }
.goods__label { font-size: 11px; color: var(--muted); }

.till__flash { min-height: 18px; margin: 12px 0 0; font-size: 11.5px; color: var(--faint); }
.till__flash.ok { color: #4f9d7d; }
.till__flash.bad { color: var(--sakura-600); }

/* 结算 */
.till__done { padding-top: 16px; text-align: center; }
.till__done-tag { font-size: 9px; letter-spacing: .3em; color: var(--sakura-500); }
.till__done h3 {
  margin: 10px 0 18px;
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 600;
  color: var(--ink);
}
.till__pay { display: flex; gap: 10px; }
.till__pay div {
  flex: 1;
  padding: 12px 8px;
  border-radius: 14px;
  background: rgba(255, 250, 252, .9);
  border: 1px solid var(--line-soft);
}
.till__pay b { display: block; font-size: 19px; color: var(--ink); font-variant-numeric: tabular-nums; }
.till__pay span { font-size: 10.5px; color: var(--faint); letter-spacing: .06em; }
.till__pay .hl { background: linear-gradient(160deg, #fff6e6, #ffeccf); border-color: rgba(240, 181, 86, .45); }
.till__pay .hl b { color: #a4732a; }
.till__balance { margin: 14px 0 18px; font-size: 11.5px; color: var(--faint); }
.till__actions { display: flex; gap: 10px; }
.till__ghost, .till__again {
  flex: 1;
  height: 40px;
  border-radius: 12px;
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
}
.till__ghost { border: 1px solid var(--line); background: #fff; color: var(--muted); }
.till__again {
  border: 0;
  color: #fff;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  box-shadow: 0 14px 26px -16px rgba(232, 84, 127, 1);
}
.till__again:disabled { color: var(--muted); background: var(--paper-3); box-shadow: none; cursor: default; }

/* ---------- 右侧：店面 ---------- */
.side { display: flex; flex-direction: column; gap: 14px; }
.shop {
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(180deg, #fffaf7, #fdf2f4);
  border: 1px solid rgba(255, 255, 255, .92);
  box-shadow: var(--lift);
}
.shop__fascia {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(120deg, #fdf6e7, #ffe9ef);
  border-bottom: 1px solid rgba(255, 255, 255, .8);
}
.shop__neon {
  padding: 2px 8px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .12em;
  color: #fff;
  background: linear-gradient(120deg, #7fc4a4, #5aa9dd);
  box-shadow: 0 6px 14px -8px rgba(90, 169, 221, .9);
}
.shop__name {
  font-family: var(--font-serif);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: .18em;
  color: #6b4a5c;
}
.shop__window { padding: 14px 14px 4px; display: flex; flex-direction: column; gap: 10px; }
.shelf-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.shelf-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 9px 4px;
  border-radius: 11px;
  background: rgba(255, 255, 255, .86);
  border: 1px solid rgba(255, 255, 255, .9);
  box-shadow: 0 8px 18px -16px rgba(147, 81, 108, .8);
}
.shelf-item i { font-style: normal; font-size: 19px; line-height: 1; }
.shelf-item b { font-size: 10px; font-weight: 600; color: var(--gold); }
.shop__note {
  margin: 8px 0 0;
  padding: 12px 16px 16px;
  font-size: 11px;
  line-height: 1.9;
  color: var(--faint);
}
.shop__note i { font-style: normal; color: var(--muted); }

.tips {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 253, 254, .7);
  border: 1px dashed var(--line);
}
.tips h3 {
  margin: 0 0 10px;
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .1em;
  color: var(--ink-soft);
}
.tips ul { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 7px; }
.tips li { font-size: 11.5px; line-height: 1.8; color: var(--muted); }
.tips b { color: var(--sakura-700); font-weight: 600; }

@keyframes lamp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .55; }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

@media (max-width: 900px) {
  .store { grid-template-columns: 1fr; }
  .goods { grid-template-columns: repeat(3, 1fr); }
}
</style>
