<template>
  <div class="page">
    <SiteNav :user="user" :active="active" @go="$emit('navigate', $event)" @logout="$emit('logout')" />

    <main class="subpage shell">
      <header class="subhead">
        <span class="subhead__tag">{{ tag }}</span>
        <h1>{{ title }}</h1>
        <p v-if="desc">{{ desc }}</p>
      </header>

      <!-- 钱包条：金币 / 体力，全站统一，数值来自 useEconomy 单例 -->
      <section class="hud" aria-label="钱包状态">
        <div class="hud__coin">
          <span class="hud__coin-ico" aria-hidden="true">¥</span>
          <span class="hud__coin-body">
            <b>{{ wallet.money }}</b>
            <i>金币</i>
          </span>
        </div>

        <div class="hud__energy">
          <div class="hud__energy-top">
            <span class="hud__energy-label">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
              </svg>
              体力
            </span>
            <span class="hud__energy-num">{{ wallet.energy }}<i>/{{ wallet.energyMax }}</i></span>
          </div>
          <div class="hud__bar">
            <i :style="{ width: energyPercent + '%' }" :class="{ low: wallet.energy < wallet.workEnergyCost }"></i>
          </div>
          <p class="hud__hint">
            {{ wallet.energy >= wallet.energyMax ? '体力已满，去镇上逛逛吧' : `每 ${wallet.regenSeconds} 秒 +1 · 约 ${countdown} 后恢复` }}
          </p>
        </div>

        <div class="hud__mood">
          <div class="hud__energy-top">
            <span class="hud__energy-label">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20.5S5 16.2 5 10.9A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 7 3.2c0 5.3-7 9.6-7 9.6z" />
              </svg>
              心情
            </span>
            <span class="hud__energy-num">{{ mood }}<i>/100</i></span>
          </div>
          <div class="hud__bar hud__bar--mood">
            <i :style="{ width: mood + '%', background: moodMeta.color }"></i>
          </div>
          <p class="hud__hint">{{ moodMeta.label }} · 逛一逛会好起来</p>
        </div>

        <div class="hud__extra">
          <slot name="hud" />
          <button
            class="hud__book hud__book--stats"
            type="button"
            title="查看角色属性"
            @click="statsOpen = true"
          >
            <span class="hud__stat-dots" aria-hidden="true">
              <i v-for="s in STATS" :key="s.key" :style="{ background: s.color }"></i>
            </span>
            属性
          </button>
          <button
            v-if="wallet.ready"
            class="hud__book"
            type="button"
            title="查看金币流水"
            @click="openLedger"
          >账本</button>
        </div>
      </section>

      <!-- 2.5D 室内剖视：走进这栋楼之后看到的样子 -->
      <InteriorScene v-if="scene" :scene-key="scene" />

      <slot />
    </main>

    <!-- 账本：金币流水，一次性看清钱是怎么来的、又花到哪去了 -->
    <Teleport to="body">
      <Transition name="ledger">
        <div v-if="ledgerOpen" class="ledger" role="dialog" aria-modal="true" aria-label="金币账本" @click.self="ledgerOpen = false">
          <div class="ledger__panel">
            <header class="ledger__head">
              <div>
                <span class="ledger__tag">LEDGER</span>
                <h3>小镇账本</h3>
              </div>
              <button class="ledger__close" type="button" aria-label="关闭" @click="ledgerOpen = false">✕</button>
            </header>

            <p class="ledger__sum">
              当前余额 <b>{{ wallet.money }}</b> 金币 · 今日游戏收入
              <b>{{ wallet.gameEarnedToday }}</b>/{{ wallet.gameDailyCap }}
            </p>

            <div v-if="ledgerLoading" class="ledger__empty">正在翻账本…</div>
            <div v-else-if="!logs.length" class="ledger__empty">还没有任何记录，去便利店打一班吧</div>
            <ul v-else class="ledger__list">
              <li v-for="row in logs" :key="row.id" class="ledger__row">
                <span class="ledger__dot" :class="row.delta > 0 ? 'in' : row.delta < 0 ? 'out' : 'flat'"></span>
                <span class="ledger__detail">
                  <b>{{ row.detail || reasonLabel(row.reason) }}</b>
                  <i>{{ row.createdAt }} · 余 {{ row.balance }}</i>
                </span>
                <span class="ledger__delta" :class="{ plus: row.delta > 0, minus: row.delta < 0 }">
                  {{ row.delta > 0 ? '+' : '' }}{{ row.delta }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 属性面板：七项属性 + 称号 -->
    <Teleport to="body">
      <Transition name="ledger">
        <div
          v-if="statsOpen"
          class="stpanel"
          role="dialog"
          aria-modal="true"
          aria-label="角色属性"
          @click.self="statsOpen = false"
        >
          <div class="stats__panel">
            <header class="stats__head">
              <div>
                <span class="stats__tag">STATUS</span>
                <h3>角色属性</h3>
              </div>
              <button class="stats__close" type="button" aria-label="关闭" @click="statsOpen = false">✕</button>
            </header>

            <p class="stats__title">
              称号 · <b>{{ title }}</b>
              <em v-if="panelMode === 'battle'">战力 {{ power }}</em>
              <em v-else>总成长 {{ total }}</em>
            </p>

            <!-- 形态切换：日常只留四项，探索战斗全开 -->
            <div class="stats__modes" role="tablist" aria-label="面板形态">
              <button
                v-for="m in PANEL_MODES"
                :key="m.key"
                type="button"
                class="stats__mode"
                :class="{ 'is-on': panelMode === m.key }"
                role="tab"
                :aria-selected="panelMode === m.key"
                @click="setPanelMode(m.key)"
              >
                <b>{{ m.label }}</b><i>{{ m.en }}</i>
              </button>
            </div>

            <ul class="stats__list">
              <li v-for="s in visibleStats" :key="s.key" class="stats__row">
                <span class="stats__dot" :style="{ background: s.color }"></span>
                <span class="stats__name">{{ s.label }}<i>{{ s.en }}</i></span>
                <span class="stats__bar">
                  <i :style="{ width: Math.min(100, (stats[s.key] / MAX_VALUE) * 100) + '%', background: s.color }"></i>
                </span>
                <b class="stats__num">{{ stats[s.key] }}<em>Lv.{{ levelOf(s.key) }}</em></b>
              </li>
            </ul>

            <!-- 战斗态：再折一层换算，每个数字都能追到某一项属性 -->
            <div v-if="panelMode === 'battle'" class="stats__combat">
              <p class="stats__sub">战斗换算<span>由上面的属性折算</span></p>
              <ul class="stats__grid">
                <li v-for="c in combat" :key="c.key">
                  <span class="stats__grid-label">{{ c.label }}<i>{{ c.en }}</i></span>
                  <b :style="{ color: c.color }">{{ c.value }}<em>{{ c.unit }}</em></b>
                  <span class="stats__grid-hint">{{ c.hint }}</span>
                </li>
              </ul>
            </div>

            <p v-else class="stats__note">
              {{ hiddenStats.map(h => h.label).join(' · ') }} 这几项过日子用不上，先收起来了 ——
              切到「探索战斗」就会全部出现。这里的「体力」是角色耐力，和钱包里会随时间恢复的体力值不是一回事。
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 属性成长提示：右下角小条 -->
    <div class="stattoast" aria-live="polite">
      <span
        v-for="t in toasts"
        :key="t.id"
        class="stattoast__item"
        :style="{ '--c': t.color }"
      >{{ t.label }} {{ t.n > 0 ? '+' + t.n : t.n }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import SiteNav from './SiteNav.vue'
import InteriorScene from './InteriorScene.vue'
import { useEconomy } from '../composables/useEconomy'
import {
  stats, STATS, toasts, levelOf, title, total, MAX_VALUE, mood, moodMeta,
  PANEL_MODES, panelMode, setPanelMode, visibleStats, hiddenStats, power, combat
} from '../composables/useStats'
import { fetchLogs } from '../api/economy'

defineProps({
  user: { type: Object, default: null },
  active: { type: String, default: 'town' },
  tag: { type: String, default: 'TOWN' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  /** 室内场景 key（iso/scenes.js），不传就不显示 2.5D 剖视图 */
  scene: { type: String, default: '' }
})
defineEmits(['navigate', 'logout'])

// energyPercent 之前漏了解构：HUD 的体力条宽度一直是空的（控制台一直有 warning）
const { wallet, refresh, startTicker, energyPercent } = useEconomy()

/** 把秒数说人话：90 → 1分30秒 */
const countdown = computed(() => {
  const s = Math.max(0, wallet.nextRegenIn)
  if (s <= 0) return '随时'
  if (s < 60) return `${s} 秒`
  return `${Math.floor(s / 60)} 分 ${s % 60} 秒`
})

const statsOpen = ref(false)
const ledgerOpen = ref(false)
const ledgerLoading = ref(false)
const logs = ref([])

const REASON = {
  store: '便利店工资',
  book: '书店购书',
  gym: '健身房',
  game: '小游戏',
  sleep: '睡觉'
}
function reasonLabel (r) { return REASON[r] || '收支' }

async function openLedger () {
  ledgerOpen.value = true
  ledgerLoading.value = true
  try {
    logs.value = await fetchLogs(20)
  } catch (e) {
    logs.value = []
  } finally {
    ledgerLoading.value = false
  }
}

onMounted(() => {
  startTicker()
  refresh()
})
</script>

<style scoped>
.shell { max-width: 1120px; }

/* ---------- 钱包条 ---------- */
.hud {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 22px;
  padding: 16px 20px;
  margin-bottom: 26px;
  border-radius: 20px;
  background: rgba(255, 253, 254, .78);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, .92);
  box-shadow: var(--lift), var(--gloss);
}
.hud__coin { display: flex; align-items: center; gap: 11px; flex: none; }
.hud__coin-ico {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: #7a5a24;
  background: radial-gradient(circle at 34% 28%, #fff4d4, #f0c976 58%, #d9a94f);
  box-shadow: 0 6px 14px -8px rgba(196, 148, 60, .9), inset 0 1px 0 rgba(255, 255, 255, .9);
}
.hud__coin-body { display: flex; flex-direction: column; line-height: 1.2; }
.hud__coin-body b {
  font-size: 21px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.hud__coin-body i { font-style: normal; font-size: 10px; letter-spacing: .18em; color: var(--faint); }

.hud__energy { flex: 1 1 240px; min-width: 200px; }
.hud__energy-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.hud__energy-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  letter-spacing: .12em;
  color: var(--muted);
}
.hud__energy-label svg { width: 12px; height: 12px; fill: var(--gold-500); }
.hud__energy-num {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.hud__energy-num i { font-style: normal; font-size: 11px; color: var(--faint); }
.hud__bar {
  height: 7px;
  margin-top: 7px;
  border-radius: 999px;
  background: rgba(201, 160, 106, .16);
  overflow: hidden;
}
.hud__bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #f7d79a, #eab866 60%, #d99b3f);
  box-shadow: 0 0 10px -2px rgba(234, 184, 102, .9);
  transition: width .45s var(--ease);
}
.hud__bar i.low { background: linear-gradient(90deg, #ffc3b6, #f08e80); }
.hud__hint { margin: 6px 0 0; font-size: 10.5px; color: var(--faint); letter-spacing: .02em; }

/* 心情：跟体力并排的第二个实时状态 */
.hud__mood { flex: 0 1 176px; min-width: 146px; }
.hud__mood .hud__energy-label svg { fill: none; stroke: currentColor; stroke-width: 1.7; color: #cf7d95; }
.hud__mood .hud__energy-label { color: var(--muted); }
.hud__bar--mood { background: rgba(150, 110, 132, .14); }

.hud__extra { display: flex; align-items: center; gap: 8px; margin-left: auto; flex: none; }
.hud__book {
  height: 34px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink-soft);
  font: inherit;
  font-size: 12px;
  letter-spacing: .06em;
  cursor: pointer;
  transition: color .25s, border-color .25s, background .25s, transform .25s var(--ease);
}
.hud__book:hover {
  color: var(--sakura-700);
  border-color: var(--sakura-300);
  background: var(--sakura-50);
  transform: translateY(-1px);
}

/* 属性按钮里那排小色点 */
.hud__stat-dots { display: inline-flex; gap: 2px; margin-right: 6px; vertical-align: -1px; }
.hud__stat-dots i { width: 4px; height: 4px; border-radius: 50%; display: block; }
.hud__book--stats { display: inline-flex; align-items: center; }

/* ---------- 属性面板 ---------- */
.stpanel {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(48, 32, 46, .38);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.stats__panel {
  width: min(460px, 100%);
  max-height: min(94vh, 760px);
  overflow: auto;
  padding: 18px 22px 18px;
  border-radius: 22px;
  background: #fffdfc;
  box-shadow: 0 30px 70px -30px rgba(88, 50, 84, .6), 0 0 0 1px rgba(255, 255, 255, .9);
}
.stats__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.stats__tag { font-size: 9px; letter-spacing: .28em; color: var(--sakura-600); }
.stats__head h3 { margin: 4px 0 0; font-family: var(--font-serif); font-size: 19px; letter-spacing: .04em; color: var(--ink); }
.stats__close {
  width: 30px; height: 30px; flex: none;
  border: 1px solid var(--line); border-radius: 50%;
  background: #fff; color: var(--ink-soft); font-size: 13px; cursor: pointer;
}
.stats__close:hover { color: var(--sakura-700); border-color: var(--sakura-300); }

.stats__title {
  display: flex; align-items: baseline; gap: 8px;
  margin: 11px 0 13px; font-size: 12px; color: var(--ink-soft);
}
.stats__title b { font-family: var(--font-serif); font-size: 15px; color: var(--sakura-700); letter-spacing: .04em; }
.stats__title em { margin-left: auto; font-style: normal; font-size: 10.5px; color: var(--faint); letter-spacing: .08em; }

.stats__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }

/* ---------- 形态切换 ---------- */
.stats__modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin: 0 0 14px;
  padding: 3px;
  border-radius: 13px;
  background: #f7eef2;
}
.stats__mode {
  display: grid;
  gap: 1px;
  padding: 7px 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--ink-soft);
  font: inherit;
  cursor: pointer;
  transition: background .25s, color .25s, box-shadow .25s;
}
.stats__mode b { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; }
.stats__mode i { font-style: normal; font-size: 7px; letter-spacing: .16em; opacity: .55; }
.stats__mode:hover { color: var(--sakura-700); }
.stats__mode.is-on {
  background: #fffdfc;
  color: var(--sakura-700);
  box-shadow: 0 6px 14px -10px rgba(88, 50, 84, .9);
}
.stats__mode.is-on i { opacity: .7; }

/* ---------- 战斗换算 ---------- */
.stats__combat { margin-top: 13px; padding-top: 11px; border-top: 1px dashed rgba(150, 110, 132, .24); }
.stats__sub {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 10px;
  font-size: 10.5px;
  letter-spacing: .1em;
  color: var(--ink-soft);
}
.stats__sub span { font-size: 9px; letter-spacing: .04em; color: var(--faint); }
.stats__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.stats__grid li {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 2px 6px;
  padding: 6px 10px;
  border-radius: 11px;
  background: #fbf6f8;
}
.stats__grid-label { display: flex; align-items: baseline; gap: 4px; font-size: 11px; color: var(--ink-soft); }
.stats__grid-label i { font-style: normal; font-size: 7px; letter-spacing: .12em; color: var(--faint); }
.stats__grid b { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.stats__grid b em { font-style: normal; font-size: 9px; font-weight: 500; opacity: .7; }
.stats__grid-hint { grid-column: 1 / -1; font-size: 8.5px; letter-spacing: .04em; color: var(--faint); }
/* 七项里最后一项单独收尾：横跨整行，不留一个空格子 */
.stats__grid li:last-child:nth-child(odd) { grid-column: 1 / -1; }
/* 七项里最后一项单独收尾：横跨整行，不留一个空格子 */
.stats__grid li:last-child:nth-child(odd) { grid-column: 1 / -1; }
.stats__row { display: grid; grid-template-columns: 8px 86px 1fr 44px; align-items: center; gap: 9px; }
.stats__dot { width: 8px; height: 8px; border-radius: 50%; }
.stats__name {
  font-size: 12.5px;
  color: var(--ink);
  display: flex;
  align-items: baseline;
  gap: 5px;
  white-space: nowrap;   /* 「力量 STRENGTH」当年在这被挤成两行 */
  overflow: hidden;
}
.stats__name i {
  font-style: normal;
  font-size: 7px;
  letter-spacing: .1em;
  color: var(--faint);
  transform: translateY(-.5px);
}
.stats__bar {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: #f6eef2;
  overflow: hidden;
}
/* 十格刻度：值只有 10 的时候也不像「空条」 */
.stats__bar::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: repeating-linear-gradient(90deg, transparent 0 calc(10% - 1.5px), #fffdfc calc(10% - 1.5px) 10%);
  pointer-events: none;
}
.stats__bar i { display: block; height: 100%; border-radius: 999px; transition: width .5s var(--ease); }
.stats__num { font-size: 13px; font-weight: 700; color: var(--ink); text-align: right; font-variant-numeric: tabular-nums; }
.stats__num em { display: block; font-style: normal; font-size: 8px; font-weight: 500; letter-spacing: .1em; color: var(--faint); }
.stats__note { margin: 18px 0 0; font-size: 10.5px; line-height: 1.8; color: var(--faint); }

/* ---------- 属性成长提示 ---------- */
.stattoast {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  pointer-events: none;
}
.stattoast__item {
  padding: 6px 13px;
  border-radius: 999px;
  background: rgba(255, 253, 252, .96);
  border: 1px solid color-mix(in srgb, var(--c) 40%, #fff);
  box-shadow: 0 10px 24px -16px rgba(88, 50, 84, .8);
  font-size: 11.5px;
  letter-spacing: .06em;
  color: var(--ink);
  animation: statIn .34s var(--ease) both;
}
.stattoast__item::before {
  content: '';
  display: inline-block;
  width: 6px; height: 6px;
  margin-right: 7px;
  border-radius: 50%;
  background: var(--c);
  vertical-align: 1px;
}
@keyframes statIn {
  from { opacity: 0; transform: translateY(8px) scale(.94); }
  to { opacity: 1; transform: none; }
}

/* ---------- 账本抽屉 ---------- */
.ledger {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  justify-content: flex-end;
  background: rgba(80, 40, 60, .3);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.ledger__panel {
  width: min(420px, 92vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 22px 20px calc(20px + env(safe-area-inset-bottom));
  background: linear-gradient(175deg, #fffafc, #fdf2f7);
  border-left: 1px solid var(--line);
  box-shadow: -30px 0 70px -34px rgba(147, 81, 108, .5);
  overflow-y: auto;
}
.ledger__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ledger__tag { font-size: 9px; letter-spacing: .32em; color: var(--sakura-500); }
.ledger__head h3 {
  margin: 6px 0 0;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
  color: var(--ink);
}
.ledger__close {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
}
.ledger__close:hover { color: var(--sakura-700); background: var(--sakura-100); }
.ledger__sum {
  margin: 14px 0 16px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 233, 242, .7);
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.7;
}
.ledger__sum b { color: var(--sakura-700); font-variant-numeric: tabular-nums; }
.ledger__empty { padding: 30px 0; text-align: center; font-size: 12.5px; color: var(--faint); }
.ledger__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.ledger__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  border-bottom: 1px dashed var(--line-soft);
}
.ledger__dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.ledger__dot.in { background: #7fc4a4; box-shadow: 0 0 0 4px rgba(127, 196, 164, .16); }
.ledger__dot.out { background: var(--sakura-400); box-shadow: 0 0 0 4px rgba(255, 157, 191, .18); }
.ledger__dot.flat { background: var(--lavender-400); box-shadow: 0 0 0 4px rgba(203, 178, 226, .2); }
.ledger__detail { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.ledger__detail b {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ledger__detail i { font-style: normal; font-size: 10px; color: var(--faint); letter-spacing: .04em; }
.ledger__delta {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}
.ledger__delta.plus { color: #4f9d7d; }
.ledger__delta.minus { color: var(--sakura-600); }

.ledger-enter-active, .ledger-leave-active { transition: opacity .25s var(--ease); }
.ledger-enter-active .ledger__panel, .ledger-leave-active .ledger__panel { transition: transform .3s var(--ease); }
.ledger-enter-from, .ledger-leave-to { opacity: 0; }
.ledger-enter-from .ledger__panel, .ledger-leave-to .ledger__panel { transform: translateX(100%); }

@media (max-width: 640px) {
  .hud { padding: 14px 16px; gap: 12px; }
  .hud__extra { margin-left: 0; width: 100%; }
}
</style>
