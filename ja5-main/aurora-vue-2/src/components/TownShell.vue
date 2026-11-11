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

        <div class="hud__extra">
          <slot name="hud" />
          <button
            v-if="wallet.ready"
            class="hud__book"
            type="button"
            title="查看金币流水"
            @click="openLedger"
          >账本</button>
        </div>
      </section>

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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import SiteNav from './SiteNav.vue'
import { useEconomy } from '../composables/useEconomy'
import { fetchLogs } from '../api/economy'

defineProps({
  user: { type: Object, default: null },
  active: { type: String, default: 'town' },
  tag: { type: String, default: 'TOWN' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' }
})
defineEmits(['navigate', 'logout'])

const { wallet, refresh, startTicker } = useEconomy()

/** 把秒数说人话：90 → 1分30秒 */
const countdown = computed(() => {
  const s = Math.max(0, wallet.nextRegenIn)
  if (s <= 0) return '随时'
  if (s < 60) return `${s} 秒`
  return `${Math.floor(s / 60)} 分 ${s % 60} 秒`
})

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
