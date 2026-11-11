<template>
  <TownShell
    :user="user"
    active="park"
    tag="PARK"
    title="花见公园"
    desc="小镇中央的一片草地，两棵樱花树围着一张旧长椅。走累了就在这儿坐一会儿，风会替你数花瓣。"
    @navigate="$emit('navigate', $event)"
    @logout="$emit('logout')"
  >
    <template #hud>
      <span class="park-tip">
        长椅 {{ wallet.benchReadyIn > 0 ? wallet.benchReadyIn + ' 秒后可再歇' : '可以坐了' }}
      </span>
    </template>

    <div class="park-wrap">
      <!-- ============ 场景 ============ -->
      <section class="park" aria-label="公园场景">
        <div class="park__sky"></div>
        <div class="park__lawn"></div>

        <!-- 池塘 -->
        <div class="pond">
          <span class="pond__ripple"></span>
          <span class="pond__ripple pond__ripple--b"></span>
          <span class="pond__lily"></span>
        </div>

        <!-- 小径 -->
        <span class="path"></span>

        <!-- 两棵樱花树 -->
        <svg class="tree tree--l" viewBox="0 0 120 150" aria-hidden="true">
          <path d="M58 148c3-26 5-44 3-60-2-14-9-24-22-36l9-8c9 9 15 18 18 27 1-16-1-28-9-42l12-5c7 14 10 27 9 40 9-12 20-20 34-27l7 10c-15 9-26 20-32 33-1 15 2 28 7 42-16 4-31 4-36 6Z" fill="#8a6472" />
          <g fill="#ffc4d9">
            <circle cx="46" cy="52" r="26" />
            <circle cx="78" cy="42" r="30" />
            <circle cx="96" cy="62" r="24" />
            <circle cx="60" cy="30" r="22" opacity=".9" />
            <circle cx="70" cy="70" r="26" opacity=".85" />
          </g>
          <g fill="#ffe0ec" opacity=".85">
            <circle cx="58" cy="44" r="13" />
            <circle cx="86" cy="56" r="11" />
            <circle cx="72" cy="24" r="9" />
          </g>
        </svg>
        <svg class="tree tree--r" viewBox="0 0 120 150" aria-hidden="true">
          <path d="M58 148c3-26 5-44 3-60-2-14-9-24-22-36l9-8c9 9 15 18 18 27 1-16-1-28-9-42l12-5c7 14 10 27 9 40 9-12 20-20 34-27l7 10c-15 9-26 20-32 33-1 15 2 28 7 42-16 4-31 4-36 6Z" fill="#8a6472" />
          <g fill="#ffbcd4">
            <circle cx="46" cy="52" r="24" />
            <circle cx="78" cy="42" r="28" />
            <circle cx="96" cy="62" r="22" />
            <circle cx="60" cy="30" r="20" opacity=".9" />
          </g>
          <g fill="#ffe6f0" opacity=".8">
            <circle cx="58" cy="44" r="12" />
            <circle cx="86" cy="56" r="10" />
          </g>
        </svg>

        <!-- 长椅 -->
        <button
          class="bench"
          type="button"
          :class="{ 'is-ready': canBench }"
          aria-label="在长椅上坐一会儿恢复体力"
          @click="doBench"
        >
          <span class="bench__back"></span>
          <span class="bench__seat"></span>
          <span class="bench__leg bench__leg--l"></span>
          <span class="bench__leg bench__leg--r"></span>
          <span class="bench__hint">
            {{ wallet.energy >= wallet.energyMax ? '体力已满' : canBench ? `坐一会儿 · 体力 +${wallet.benchRestore}` : `${wallet.benchReadyIn} 秒后可再歇` }}
          </span>
        </button>

        <!-- 路边贩卖机 -->
        <button class="vending" type="button" aria-label="在贩卖机买饮料" @click="openVending">
          <span class="vending__top">DRINK</span>
          <span class="vending__glass">
            <i v-for="i in 6" :key="i" class="vending__slot" :style="{ animationDelay: (i * .3) + 's' }"></i>
          </span>
          <span class="vending__panel"></span>
          <span class="vending__tray"></span>
          <span class="vending__hint">投币买一瓶</span>
        </button>

        <!-- 鸽子 -->
        <span class="bird bird--a" aria-hidden="true"></span>
        <span class="bird bird--b" aria-hidden="true"></span>
        <span class="bird bird--c" aria-hidden="true"></span>
      </section>

      <!-- ============ 右列 ============ -->
      <aside class="side">
        <div class="panel">
          <h3 class="panel__title">歇脚的三种方式</h3>
          <ul class="ways">
            <li>
              <span class="ways__ico">🪑</span>
              <span class="ways__body">
                <b>公园长椅</b>
                <i>免费 · +{{ wallet.benchRestore }} 体力 · 2 分钟一次</i>
              </span>
              <button class="ways__btn" type="button" :disabled="!canBench" @click="doBench">
                {{ canBench ? '坐下' : wallet.benchReadyIn > 0 ? wallet.benchReadyIn + 's' : '已满' }}
              </button>
            </li>
            <li>
              <span class="ways__ico">🥤</span>
              <span class="ways__body">
                <b>路边贩卖机</b>
                <i>3~12 金币 · +8~40 体力 · 随时</i>
              </span>
              <button class="ways__btn" type="button" @click="openVending">投币</button>
            </li>
            <li>
              <span class="ways__ico">🛏️</span>
              <span class="ways__body">
                <b>回家睡觉</b>
                <i>免费 · 回满体力 · 每天一次</i>
              </span>
              <button class="ways__btn" type="button" @click="$emit('navigate', 'gamehome')">
                {{ wallet.sleptToday ? '已睡过' : '回家' }}
              </button>
            </li>
          </ul>
        </div>

        <div class="panel panel--soft">
          <h3 class="panel__title">公园札记</h3>
          <p class="panel__text">
            长椅是小镇最便宜的回血点 —— 只花两分钟，不花一分钱。
            要是急着去便利店上工，就顺手在贩卖机买瓶可乐，冰的那种。
          </p>
          <p class="panel__meta">
            当前体力 <b>{{ wallet.energy }}</b> / {{ wallet.energyMax }} ·
            距离自然恢复下一点还有 <b>{{ wallet.nextRegenIn || 0 }}</b> 秒
          </p>
        </div>
      </aside>
    </div>

    <!-- ============ 贩卖机面板 ============ -->
    <Teleport to="body">
      <Transition name="vend">
        <div v-if="vending" class="vend" role="dialog" aria-modal="true" aria-label="贩卖机" @click.self="vending = false">
          <div class="vend__panel">
            <header class="vend__head">
              <div>
                <span class="vend__tag">VENDING · 24H</span>
                <h3>路边贩卖机</h3>
              </div>
              <button class="vend__close" type="button" aria-label="关闭" @click="vending = false">✕</button>
            </header>

            <p class="vend__wallet">
              余额 <b>{{ wallet.money }}</b> 金币 · 体力
              <b>{{ wallet.energy }}</b>/{{ wallet.energyMax }}
            </p>

            <div v-if="drinkLoading" class="vend__empty">正在亮灯…</div>
            <ul v-else class="vend__grid">
              <li v-for="d in drinkList" :key="d.key">
                <button
                  class="drink"
                  type="button"
                  :disabled="buying === d.key || wallet.money < d.price || wallet.energy >= wallet.energyMax"
                  @click="doBuyDrink(d)"
                >
                  <span class="drink__ico" :class="'drink__ico--' + d.key">{{ drinkIcon(d.key) }}</span>
                  <span class="drink__body">
                    <b>{{ d.name }}</b>
                    <i>{{ d.note }}</i>
                  </span>
                  <span class="drink__right">
                    <em>{{ d.price }} 币</em>
                    <small>+{{ d.restore }}</small>
                  </span>
                  <span v-if="buying === d.key" class="drink__busy">出货中…</span>
                </button>
              </li>
            </ul>

            <p class="vend__foot">
              体力满了就先别买 —— 机器不会给你退钱。缺钱的话，便利店永远缺人手。
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </TownShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import TownShell from './TownShell.vue'
import { useEconomy } from '../composables/useEconomy'
import { toast } from '../composables/useToast'

defineProps({
  user: { type: Object, default: null }
})
defineEmits(['navigate', 'logout'])

const { wallet, bench, drinks, drink, refresh, startTicker } = useEconomy()

const vending = ref(false)
const drinkList = ref([])
const drinkLoading = ref(false)
const buying = ref('')
const benchBusy = ref(false)

const canBench = computed(() =>
  wallet.benchReadyIn <= 0 && wallet.energy < wallet.energyMax && !benchBusy.value
)

const ICONS = {
  water: '💧', cola: '🥤', sprite: '🍋', fanta: '🍊',
  milk: '🥛', coffee: '☕', energy: '⚡'
}
function drinkIcon (key) { return ICONS[key] || '🥤' }

async function doBench () {
  if (!canBench.value) {
    if (wallet.benchReadyIn > 0) toast.info(`长椅刚被人坐热，${wallet.benchReadyIn} 秒后再来`)
    else if (wallet.energy >= wallet.energyMax) toast.info('体力已经是满的，不如去打工')
    return
  }
  benchBusy.value = true
  try {
    const res = await bench()
    toast.success(`微风里坐了一会儿，体力 +${res.restored}`)
  } catch (e) {
    toast.error((e && e.message) || '这会儿坐不下来')
  } finally {
    benchBusy.value = false
  }
}

async function openVending () {
  vending.value = true
  if (drinkList.value.length) return
  drinkLoading.value = true
  try {
    drinkList.value = await drinks()
  } catch (e) {
    toast.error((e && e.message) || '贩卖机没通电')
  } finally {
    drinkLoading.value = false
  }
}

async function doBuyDrink (item) {
  if (buying.value) return
  buying.value = item.key
  try {
    const res = await drink(item.key)
    toast.success(`${res.drink}入手，体力 +${res.restored}`)
  } catch (e) {
    toast.error((e && e.message) || '投币失败')
  } finally {
    buying.value = ''
  }
}

onMounted(() => {
  refresh()
  startTicker()
})
</script>

<style scoped>
.park-tip { font-size: 11.5px; color: var(--muted); }

.park-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

/* ---------- 场景 ---------- */
.park {
  position: relative;
  min-height: 440px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .9);
  box-shadow: var(--shadow-lg);
  isolation: isolate;
}
.park__sky {
  position: absolute;
  inset: 0 0 46% 0;
  background: linear-gradient(180deg, #d3c7e8, #f3dbe6 62%, #fdeade);
}
.park__lawn {
  position: absolute;
  inset: 46% 0 0 0;
  background:
    radial-gradient(120% 80% at 20% 0%, rgba(255, 255, 255, .5), transparent 55%),
    linear-gradient(180deg, #cfe0c2, #b6cfa8 58%, #a4c096);
}
.park__lawn::after {
  /* 草纹 */
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(74deg, rgba(255, 255, 255, .3) 0 1px, transparent 1px 16px);
  opacity: .5;
}

/* 池塘 */
.pond {
  position: absolute;
  left: 5%;
  bottom: 9%;
  width: 36%;
  height: 24%;
  border-radius: 50%;
  background: radial-gradient(60% 70% at 40% 30%, #eaf4fb, #b9dcef 55%, #93c3dd);
  box-shadow: inset 0 6px 18px -8px rgba(60, 100, 130, .5), 0 10px 20px -14px rgba(60, 100, 130, .6);
  overflow: hidden;
}
.pond__ripple {
  position: absolute;
  left: 22%;
  top: 34%;
  width: 34%;
  height: 30%;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, .7);
  animation: ripple 5s ease-in-out infinite;
}
.pond__ripple--b { left: 52%; top: 56%; width: 26%; height: 22%; animation-delay: 1.6s; }
.pond__lily {
  position: absolute;
  right: 16%;
  top: 26%;
  width: 20px;
  height: 12px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: #a8cfa0;
  box-shadow: inset -2px -2px 0 rgba(120, 160, 120, .5);
}

/* 小径 */
.path {
  position: absolute;
  left: 34%;
  bottom: -6%;
  width: 34%;
  height: 60%;
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
  background: linear-gradient(180deg, rgba(240, 228, 214, .9), rgba(228, 212, 196, .95));
  transform: rotate(-6deg);
  box-shadow: inset 0 0 30px rgba(200, 180, 160, .4);
}

/* 樱花树 */
.tree { position: absolute; width: 132px; height: auto; filter: drop-shadow(0 12px 18px rgba(110, 80, 100, .28)); }
.tree--l { left: 4%; top: 16%; }
.tree--r { right: 26%; top: 8%; width: 152px; transform: scaleX(-1); }

/* 长椅 */
.bench {
  position: absolute;
  left: 26%;
  bottom: 13%;
  width: 150px;
  height: 74px;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
}
.bench__back {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 4px;
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(180deg, #c79a7c, #a87c60);
  box-shadow: 0 3px 0 -1px #e0bd9f;
}
.bench__back::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 14px;
  height: 8px;
  border-radius: 3px;
  background: linear-gradient(180deg, #d3a684, #b1856a);
}
.bench__seat {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 26px;
  height: 13px;
  border-radius: 5px;
  background: linear-gradient(180deg, #e0b491, #b98a68);
  box-shadow: 0 8px 14px -10px rgba(90, 60, 50, .8);
  transition: transform .3s var(--ease);
}
.bench__leg { position: absolute; bottom: 26px; width: 7px; height: 22px; border-radius: 3px; background: #8b7160; }
.bench__leg--l { left: 14px; }
.bench__leg--r { right: 14px; }
.bench:hover .bench__seat { transform: translateY(-3px); }
.bench.is-ready .bench__seat {
  box-shadow: 0 8px 14px -10px rgba(90, 60, 50, .8), 0 0 0 2px rgba(255, 255, 255, .55) inset;
}
.bench__hint {
  position: absolute;
  left: 50%;
  top: -20px;
  transform: translateX(-50%);
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .94);
  font-size: 10px;
  color: var(--sakura-700);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transition: opacity .25s;
}
.bench:hover .bench__hint, .bench.is-ready .bench__hint { opacity: 1; }

/* 贩卖机 */
.vending {
  position: absolute;
  right: 6%;
  bottom: 12%;
  width: 76px;
  height: 124px;
  border: 0;
  padding: 0;
  cursor: pointer;
  background: none;
}
.vending__top {
  position: absolute;
  inset: 0 0 auto 0;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 8px 8px 0 0;
  font-size: 8px;
  letter-spacing: .24em;
  color: #fff;
  background: linear-gradient(180deg, #e8869f, #d4657f);
}
.vending__glass {
  position: absolute;
  inset: 20px 6px 34px 6px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 5px;
  border-radius: 4px;
  background: linear-gradient(170deg, #eef7fb, #d6e9f2);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .8);
}
.vending__slot {
  border-radius: 3px;
  background: linear-gradient(180deg, #ffd9e6, #f4a9c4);
  animation: slot-glow 3.2s ease-in-out infinite;
}
.vending__slot:nth-child(2n) { background: linear-gradient(180deg, #cfe6fb, #a6c9ee); }
.vending__slot:nth-child(3n) { background: linear-gradient(180deg, #fdf0c9, #f0d089); }
.vending__panel {
  position: absolute;
  right: 6px;
  bottom: 38px;
  width: 16px;
  height: 30px;
  border-radius: 3px;
  background: rgba(120, 130, 150, .35);
}
.vending__tray {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 8px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(180deg, #b9c2ce, #8d97a6);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, .25);
}
.vending__hint {
  position: absolute;
  left: 50%;
  top: -22px;
  transform: translateX(-50%);
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .94);
  font-size: 10px;
  color: var(--sky-600);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transition: opacity .25s;
}
.vending:hover .vending__hint { opacity: 1; }

/* 鸽子 */
.bird {
  position: absolute;
  width: 10px;
  height: 7px;
  border-radius: 50% 50% 40% 40%;
  background: #f4f2f6;
  box-shadow: 0 2px 4px -2px rgba(90, 80, 100, .6);
  animation: peck 2.6s ease-in-out infinite;
}
.bird::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 1px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #f4f2f6;
}
.bird--a { left: 62%; bottom: 12%; }
.bird--b { left: 68%; bottom: 10%; animation-delay: .7s; }
.bird--c { left: 74%; bottom: 13%; animation-delay: 1.4s; }

/* ---------- 右列 ---------- */
.side { display: flex; flex-direction: column; gap: 14px; }
.panel {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 253, 254, .84);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, .95);
  box-shadow: var(--lift), var(--gloss);
}
.panel--soft { background: rgba(255, 250, 252, .7); border-style: dashed; border-color: var(--line); box-shadow: none; }
.panel__title {
  margin: 0 0 12px;
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .1em;
  color: var(--ink-soft);
}
.ways { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.ways li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  border-radius: 13px;
  background: #fff;
  border: 1px solid var(--line-soft);
}
.ways__ico { font-size: 17px; line-height: 1; flex: none; }
.ways__body { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.ways__body b { font-size: 12.5px; font-weight: 600; color: var(--ink); }
.ways__body i { font-style: normal; font-size: 10.5px; color: var(--faint); }
.ways__btn {
  flex: none;
  height: 30px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--sakura-200);
  background: var(--sakura-50);
  color: var(--sakura-700);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: transform .2s var(--ease), background .2s;
}
.ways__btn:hover:not(:disabled) { transform: translateY(-1px); background: var(--sakura-100); }
.ways__btn:disabled { color: var(--faint); border-color: var(--line); background: var(--paper-3); cursor: default; }
.panel__text { margin: 0 0 12px; font-size: 11.5px; line-height: 1.9; color: var(--muted); }
.panel__meta { margin: 0; font-size: 11px; color: var(--faint); line-height: 1.8; }
.panel__meta b { color: var(--ink-soft); font-variant-numeric: tabular-nums; }

/* ---------- 贩卖机面板 ---------- */
.vend {
  position: fixed;
  inset: 0;
  z-index: 96;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(40, 40, 56, .34);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.vend__panel {
  width: min(460px, 100%);
  max-height: 88vh;
  overflow-y: auto;
  padding: 22px 20px 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f9fdff, #eef6fb 60%, #e9f2f8);
  border: 1px solid rgba(255, 255, 255, .95);
  box-shadow: 0 40px 80px -44px rgba(40, 70, 100, .7);
}
.vend__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.vend__tag { font-size: 9px; letter-spacing: .3em; color: var(--sky-600); }
.vend__head h3 {
  margin: 6px 0 0;
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 600;
  color: var(--ink);
}
.vend__close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(120, 150, 180, .25);
  background: #fff;
  color: var(--muted);
  cursor: pointer;
}
.vend__wallet {
  margin: 12px 0 14px;
  padding: 9px 12px;
  border-radius: 11px;
  background: rgba(255, 255, 255, .78);
  font-size: 11.5px;
  color: var(--muted);
}
.vend__wallet b { color: var(--ink); font-variant-numeric: tabular-nums; }
.vend__empty { padding: 30px 0; text-align: center; font-size: 12px; color: var(--faint); }
.vend__grid { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.drink {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, .9);
  background: #fff;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: transform .2s var(--ease), border-color .2s, box-shadow .2s;
}
.drink:hover:not(:disabled) { transform: translateX(2px); border-color: rgba(140, 190, 220, .7); box-shadow: var(--lift); }
.drink:disabled { cursor: default; opacity: .55; }
.drink__ico {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 17px;
  background: linear-gradient(160deg, #f3f8fc, #e4eef7);
  flex: none;
}
.drink__ico--cola { background: linear-gradient(160deg, #ffe0e6, #f6b7c4); }
.drink__ico--sprite { background: linear-gradient(160deg, #e6f7e2, #c2e6bb); }
.drink__ico--fanta { background: linear-gradient(160deg, #ffedd6, #ffd39a); }
.drink__ico--coffee { background: linear-gradient(160deg, #efe3d8, #ddc6b0); }
.drink__ico--energy { background: linear-gradient(160deg, #e8e2fb, #c6b9ee); }
.drink__body { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.drink__body b { font-size: 12.5px; font-weight: 600; color: var(--ink); }
.drink__body i { font-style: normal; font-size: 10.5px; color: var(--faint); }
.drink__right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex: none; }
.drink__right em { font-style: normal; font-size: 12px; font-weight: 600; color: var(--gold); }
.drink__right small { font-size: 10px; color: var(--leaf-500); }
.drink__busy {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: rgba(255, 255, 255, .82);
  font-size: 11.5px;
  color: var(--sky-600);
}
.vend__foot { margin: 14px 0 0; font-size: 10.5px; line-height: 1.8; color: var(--faint); }

.vend-enter-active, .vend-leave-active { transition: opacity .22s var(--ease); }
.vend-enter-active .vend__panel, .vend-leave-active .vend__panel { transition: transform .28s var(--ease); }
.vend-enter-from, .vend-leave-to { opacity: 0; }
.vend-enter-from .vend__panel, .vend-leave-to .vend__panel { transform: translateY(14px) scale(.98); }

@keyframes ripple {
  0%, 100% { transform: scale(.9); opacity: .35; }
  50% { transform: scale(1.08); opacity: .8; }
}
@keyframes slot-glow {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}
@keyframes peck {
  0%, 100% { transform: translateY(0) rotate(0); }
  40% { transform: translateY(1.5px) rotate(-6deg); }
}

@media (max-width: 900px) {
  .park-wrap { grid-template-columns: 1fr; }
  .park { min-height: 390px; }
  .tree--r { right: 6%; width: 120px; }
  .pond { width: 46%; }
}
</style>
