<template>
  <TownShell
    :user="user"
    active="gym"
    tag="GYM"
    title="花见健身房"
    desc="旧仓库改的健身房，窗子正对着樱花树。老板说：把体力上限练上去，打工才能一口气扛到底。"
    @navigate="$emit('navigate', $event)"
    @logout="$emit('logout')"
  >
    <template #hud>
      <span class="tier-tip">会员等级 · {{ tier.name }}</span>
    </template>

    <div class="gym">
      <!-- ============ 左：训练区 ============ -->
      <section class="train">
        <header class="train__head">
          <div>
            <span class="train__tag">TRAINING</span>
            <h2>今天练什么</h2>
          </div>
          <div class="barbell" aria-hidden="true">
            <span class="barbell__bar"></span>
            <span class="plate plate--l" :class="{ 'is-lift': lifting }"></span>
            <span class="plate plate--r" :class="{ 'is-lift': lifting }"></span>
          </div>
        </header>

        <!-- 体力上限进度 -->
        <div class="cap">
          <div class="cap__top">
            <span>体力上限</span>
            <b>{{ wallet.energyMax }}<i>/{{ wallet.energyMaxCap }}</i></b>
          </div>
          <div class="cap__track">
            <div class="cap__fill" :style="{ width: capPercent + '%' }"></div>
            <span class="cap__goal" :style="{ left: capPercent + '%' }"></span>
          </div>
          <p class="cap__hint">
            <template v-if="wallet.energyMax >= wallet.energyMaxCap">已经练到上限了，剩下的靠睡觉和蛋白饮补</template>
            <template v-else>每上一节私教课 +{{ wallet.trainBonus }}，还能练 {{ Math.floor((wallet.energyMaxCap - wallet.energyMax) / wallet.trainBonus) }} 次</template>
          </p>
        </div>

        <!-- 课程 -->
        <div class="drills">
          <button
            v-for="d in drills"
            :key="d.key"
            class="drill"
            :class="{ 'is-busy': busy === 'train' && picked === d.key }"
            type="button"
            :disabled="busy === 'train'"
            @click="doTrain(d)"
          >
            <span class="drill__ico">{{ d.icon }}</span>
            <span class="drill__body">
              <b>{{ d.name }}</b>
              <i>{{ d.desc }}</i>
            </span>
            <span class="drill__cost">{{ wallet.trainCost }} 币</span>
          </button>
        </div>

        <!-- 蛋白饮 -->
        <div class="bar">
          <div class="bar__text">
            <b>前台蛋白饮</b>
            <i>{{ wallet.drinkCost }} 金币 · 立刻恢复 {{ wallet.drinkRestore }} 点体力</i>
          </div>
          <button class="bar__btn" type="button" :disabled="busy === 'drink'" @click="doDrink">
            {{ busy === 'drink' ? '正在摇匀…' : '来一瓶' }}
          </button>
        </div>

        <p class="train__note">
          体力每 90 秒自然恢复 1 点；打工、训练都会消耗。练高上限以后，一班接一班也不用心慌。
        </p>
      </section>

      <!-- ============ 右：会员卡 ============ -->
      <aside class="member">
        <div class="card">
          <div class="card__shine"></div>
          <span class="card__brand">HANAMI GYM</span>
          <div class="card__row">
            <span class="card__avatar">{{ initial }}</span>
            <div class="card__who">
              <b>{{ (user && user.name) || '旅人' }}</b>
              <i>会员编号 {{ (user && user.id) || '—' }}</i>
            </div>
          </div>
          <dl class="card__stats">
            <div><dt>等级</dt><dd>{{ tier.name }}</dd></div>
            <div><dt>体力上限</dt><dd>{{ wallet.energyMax }}</dd></div>
            <div><dt>今日已练</dt><dd>{{ trainedToday }} 次</dd></div>
          </dl>
          <p class="card__foot">「力量不是一天长的，樱花也不是。」</p>
        </div>

        <ul class="ladder">
          <li v-for="t in TIERS" :key="t.name" :class="{ on: t.name === tier.name, done: wallet.energyMax >= t.min }">
            <span class="ladder__dot"></span>
            <span class="ladder__name">{{ t.name }}</span>
            <span class="ladder__min">上限 ≥ {{ t.min }}</span>
          </li>
        </ul>
      </aside>
    </div>
  </TownShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import TownShell from './TownShell.vue'
import { useEconomy } from '../composables/useEconomy'
import { toast } from '../composables/useToast'

const props = defineProps({
  user: { type: Object, default: null }
})
defineEmits(['navigate', 'logout'])

const { wallet, train, protein, refresh, startTicker } = useEconomy()

const busy = ref('')
const picked = ref('')
const lifting = ref(false)
const trainedToday = ref(0)

/** 三个动作纯为氛围：数值一致，文案不同 */
const drills = [
  { key: 'squat', icon: '🏋️', name: '深蹲', desc: '一组 12 次 × 4 · 练腿也练耐力' },
  { key: 'row', icon: '🚣', name: '划船', desc: '一组 10 次 × 3 · 把肩背拉开' },
  { key: 'run', icon: '🏃', name: '跑步机', desc: '20 分钟 · 窗外的樱花开得正好' }
]

/** 会员等级：按体力上限分段 */
const TIERS = [
  { name: '初来乍到', min: 0 },
  { name: '常客', min: 115 },
  { name: '举铁达人', min: 135 },
  { name: '樱花力士', min: 160 }
]
const tier = computed(() => {
  let cur = TIERS[0]
  TIERS.forEach((t) => { if (wallet.energyMax >= t.min) cur = t })
  return cur
})

const capPercent = computed(() => {
  const cap = wallet.energyMaxCap || 160
  return Math.max(4, Math.min(100, Math.round((wallet.energyMax / cap) * 100)))
})

const initial = computed(() => {
  const n = (props.user && props.user.name) || '旅'
  return String(n).slice(0, 1)
})

async function doTrain (drill) {
  busy.value = 'train'
  picked.value = drill.key
  lifting.value = true
  try {
    const res = await train()
    trainedToday.value += 1
    toast.success(`一节${drill.name}下来，体力上限到 ${res.energyMax} 了`)
  } catch (e) {
    toast.error((e && e.message) || '今天练不动了')
  } finally {
    busy.value = ''
    setTimeout(() => { lifting.value = false }, 620)
  }
}

async function doDrink () {
  busy.value = 'drink'
  try {
    const res = await protein()
    toast.success(`一瓶下去，体力 ${res.energy}`)
  } catch (e) {
    toast.error((e && e.message) || '前台没人，稍后再试')
  } finally {
    busy.value = ''
  }
}

startTicker()
refresh()
</script>

<style scoped>
.tier-tip { font-size: 11.5px; color: var(--muted); letter-spacing: .06em; }

.gym {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

/* ---------- 训练区 ---------- */
.train {
  padding: 20px 20px 22px;
  border-radius: 22px;
  background: rgba(255, 253, 254, .84);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, .95);
  box-shadow: var(--lift), var(--gloss);
}
.train__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.train__tag { font-size: 9px; letter-spacing: .3em; color: var(--leaf-500); }
.train__head h2 {
  margin: 6px 0 0;
  font-family: var(--font-serif);
  font-size: 21px;
  font-weight: 600;
  color: var(--ink);
}

/* 杠铃小图：两块胶片在训练时抬起 */
.barbell { position: relative; width: 84px; height: 34px; flex: none; }
.barbell__bar {
  position: absolute;
  left: 4px;
  right: 4px;
  top: 16px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #c7b9c8, #8d7f90 40%, #c7b9c8);
}
.plate {
  position: absolute;
  top: 3px;
  width: 11px;
  height: 28px;
  border-radius: 4px;
  background: linear-gradient(180deg, #efd3e0, #d79fbb);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .6);
  transition: transform .55s var(--ease);
}
.plate--l { left: 16px; }
.plate--r { right: 16px; }
.plate.is-lift { transform: translateY(-7px); }

/* 上限进度 */
.cap { margin-top: 18px; }
.cap__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 11.5px;
  letter-spacing: .1em;
  color: var(--muted);
}
.cap__top b { font-size: 16px; color: var(--ink); font-variant-numeric: tabular-nums; }
.cap__top i { font-style: normal; font-size: 11px; color: var(--faint); }
.cap__track {
  position: relative;
  height: 9px;
  margin-top: 8px;
  border-radius: 999px;
  background: rgba(203, 178, 226, .22);
  overflow: hidden;
}
.cap__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #d9c6ee, #b092d0 60%, #8f6fb8);
  transition: width .6s var(--ease);
}
.cap__goal {
  position: absolute;
  top: -2px;
  width: 2px;
  height: 13px;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 0 8px rgba(143, 111, 184, .9);
  transition: left .6s var(--ease);
}
.cap__hint { margin: 8px 0 0; font-size: 11px; color: var(--faint); line-height: 1.7; }

/* 课程按钮 */
.drills { display: flex; flex-direction: column; gap: 8px; margin: 20px 0 14px; }
.drill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 15px;
  border: 1px solid var(--line-soft);
  background: #fff;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: transform .25s var(--ease), border-color .25s, box-shadow .25s, background .25s;
}
.drill:hover:not(:disabled) {
  transform: translateX(3px);
  border-color: var(--lavender-400);
  background: linear-gradient(100deg, #fff, #faf6ff);
  box-shadow: var(--lift);
}
.drill:disabled { opacity: .6; cursor: default; }
.drill__ico { font-size: 20px; line-height: 1; }
.drill__body { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.drill__body b { font-size: 13px; font-weight: 600; color: var(--ink); }
.drill__body i { font-style: normal; font-size: 11px; color: var(--faint); }
.drill__cost {
  flex: none;
  padding: 4px 9px;
  border-radius: 8px;
  font-size: 11px;
  color: #8a5f27;
  background: rgba(247, 215, 154, .34);
  font-variant-numeric: tabular-nums;
}

/* 蛋白饮 */
.bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 15px;
  background: linear-gradient(120deg, #fdf6e9, #fdf1f5);
  border: 1px solid rgba(240, 181, 86, .3);
}
.bar__text { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.bar__text b { font-size: 12.5px; color: var(--ink); }
.bar__text i { font-style: normal; font-size: 11px; color: var(--muted); }
.bar__btn {
  flex: none;
  height: 34px;
  padding: 0 16px;
  border: 0;
  border-radius: 11px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  color: #8a5f27;
  background: linear-gradient(120deg, #fbe2ac, #f2c477);
  box-shadow: 0 12px 22px -16px rgba(196, 148, 60, .95);
  transition: transform .25s var(--ease);
}
.bar__btn:hover:not(:disabled) { transform: translateY(-1px); }
.bar__btn:disabled { opacity: .6; cursor: default; }

.train__note { margin: 16px 0 0; font-size: 11px; line-height: 1.9; color: var(--faint); }

/* ---------- 会员卡 ---------- */
.member { display: flex; flex-direction: column; gap: 14px; }
.card {
  position: relative;
  overflow: hidden;
  padding: 18px 18px 16px;
  border-radius: 20px;
  color: #fff;
  background:
    radial-gradient(120% 100% at 0% 0%, rgba(255, 255, 255, .32), transparent 55%),
    linear-gradient(150deg, #b58fd4, #8a6bb5 52%, #6d5194);
  box-shadow: 0 26px 48px -30px rgba(109, 81, 148, .95), var(--gloss);
}
.card__shine {
  position: absolute;
  top: -60%;
  left: -20%;
  width: 60%;
  height: 220%;
  background: linear-gradient(100deg, rgba(255, 255, 255, .34), transparent 60%);
  transform: rotate(14deg);
  pointer-events: none;
}
.card__brand { font-size: 9px; letter-spacing: .34em; opacity: .78; }
.card__row { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
.card__avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 15px;
  font-weight: 600;
  color: #6d5194;
  background: #fff;
  box-shadow: 0 8px 18px -12px rgba(0, 0, 0, .6);
}
.card__who { display: flex; flex-direction: column; gap: 3px; }
.card__who b { font-size: 14.5px; font-weight: 600; letter-spacing: .04em; }
.card__who i { font-style: normal; font-size: 10px; opacity: .72; letter-spacing: .08em; }
.card__stats {
  display: flex;
  gap: 10px;
  margin: 18px 0 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, .22);
}
.card__stats div { flex: 1; }
.card__stats dt { font-size: 9.5px; letter-spacing: .16em; opacity: .7; }
.card__stats dd { margin: 5px 0 0; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.card__foot { margin: 0; font-size: 10.5px; line-height: 1.8; opacity: .74; letter-spacing: .04em; }

.ladder {
  list-style: none;
  margin: 0;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 253, 254, .7);
  border: 1px dashed var(--line);
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.ladder li { display: flex; align-items: center; gap: 9px; font-size: 11.5px; color: var(--faint); }
.ladder__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(168, 156, 176, .3);
  flex: none;
}
.ladder li.done .ladder__dot { background: var(--lavender-500); box-shadow: 0 0 0 4px rgba(176, 146, 208, .18); }
.ladder li.done .ladder__name { color: var(--ink-soft); }
.ladder li.on .ladder__name { color: var(--lavender-500); font-weight: 600; }
.ladder__min { margin-left: auto; font-size: 10px; letter-spacing: .04em; }

@media (max-width: 900px) {
  .gym { grid-template-columns: 1fr; }
}
</style>
