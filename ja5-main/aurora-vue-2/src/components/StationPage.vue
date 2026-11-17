<template>
  <TownShell
    :user="user"
    active="station"
    tag="SAKURA STATION"
    title="樱花车站"
    desc="一块木月台，两条铁轨，一天四班车。风大的时候，站名牌会晃；车来的时候，樱花会被风卷起来。"
    scene="station"
    @navigate="$emit('navigate', $event)"
    @logout="$emit('logout')"
  >
    <template #hud>
      <span class="sta-tip">{{ next ? next.time + ' 发车' : '今日已收班' }}</span>
    </template>

    <div class="sta">
      <!-- ============ 左：下一班车 ============ -->
      <section class="next">
        <header class="next__head">
          <span class="next__tag">NEXT DEPARTURE</span>
          <span class="next__line">樱见线 · 上行</span>
        </header>

        <div class="next__main">
          <div class="next__time">{{ next ? next.time : '—:—' }}</div>
          <div class="next__body">
            <b>{{ next ? next.dest : '今天没有车了' }}</b>
            <i>{{ next ? `站台 ${next.platform} · ${next.cars} 节车厢` : '明天 08:10 见' }}</i>
          </div>
        </div>

        <!-- 倒计时 -->
        <div class="count">
          <div class="count__num">
            <span>{{ cd.h }}</span><em>时</em>
            <span>{{ cd.m }}</span><em>分</em>
            <span>{{ cd.s }}</span><em>秒</em>
          </div>
          <p class="count__hint">{{ cd.hint }}</p>
        </div>

        <div class="next__take">
          <button type="button" class="take__btn" @click="takeTicket">
            {{ ticket ? '换一张票' : '取一张车票' }}
          </button>
          <span class="take__note">单程 · 不用付钱，镇上的人不买票</span>
        </div>

        <!-- 车票 -->
        <Transition name="ticket">
          <div v-if="ticket" class="ticket" :key="ticket.id">
            <span class="ticket__punch" aria-hidden="true"></span>
            <div class="ticket__left">
              <span class="ticket__brand">SAKURA NOTE 铁道</span>
              <b class="ticket__dest">{{ ticket.dest }}</b>
              <span class="ticket__meta">单程 · 自由席 · {{ ticket.date }}</span>
            </div>
            <div class="ticket__right">
              <span class="ticket__no">{{ ticket.no }}</span>
              <span class="ticket__seat">{{ ticket.seat }}</span>
            </div>
          </div>
        </Transition>
      </section>

      <!-- ============ 右：时刻表 + 站台 ============ -->
      <aside class="side">
        <section class="card">
          <h2 class="card__title">今日时刻表</h2>
          <ul class="board-list">
            <li
              v-for="s in SCHEDULE"
              :key="s.time"
              class="board-row"
              :class="{ 'is-next': next && s.time === next.time, 'is-past': isPast(s) }"
            >
              <span class="board-row__time">{{ s.time }}</span>
              <span class="board-row__dest">{{ s.dest }}</span>
              <span class="board-row__pl">站台 {{ s.platform }}</span>
            </li>
          </ul>
          <p class="card__desc card__desc--sm">
            车站只有一位值班员，敲钟发车。迟到了也不用跑 —— 下一班总会来。
          </p>
        </section>

        <section class="card card--plat">
          <h2 class="card__title">月台</h2>
          <!-- 一小段月台剖面，纯装饰 -->
          <svg class="plat" viewBox="0 0 260 96" aria-hidden="true">
            <rect x="0" y="66" width="260" height="8" rx="3" fill="#e2d6c8" />
            <rect x="0" y="74" width="260" height="10" rx="3" fill="#cdbfb0" />
            <rect x="0" y="60" width="260" height="5" rx="2" fill="#eec56d" opacity=".9" />
            <rect x="26" y="18" width="3" height="42" fill="#a98d99" />
            <rect x="26" y="14" width="54" height="16" rx="3" fill="#fffdf8" stroke="#c8b6bf" />
            <rect x="31" y="19" width="30" height="3" rx="1.5" fill="#8f7794" />
            <rect x="31" y="24" width="16" height="2.4" rx="1.2" fill="#c8b6c4" />
            <circle cx="196" cy="46" r="12" fill="#fffdf6" stroke="#c0a9b6" />
            <path d="M196 39v7l5 3" fill="none" stroke="#7d6379" stroke-width="1.6" stroke-linecap="round" />
            <rect x="120" y="46" width="52" height="14" rx="3" fill="#f7ece0" stroke="#d8c6b8" />
            <rect x="126" y="50" width="40" height="3" rx="1.5" fill="#bfe0ea" />
            <rect x="126" y="55" width="26" height="2.4" rx="1.2" fill="#e07d92" />
          </svg>
          <p class="card__desc">
            长椅是木头的，坐久了会有一点温度。抬头就能看见后山那棵千年樱。
          </p>
        </section>
      </aside>
    </div>
  </TownShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import TownShell from './TownShell.vue'

defineProps({
  user: { type: Object, default: null }
})
defineEmits(['navigate', 'logout'])

/* 一天四班：时间固定，方便算倒计时 */
const SCHEDULE = [
  { time: '08:10', dest: '海边 · 潮见站', platform: 1, cars: 2 },
  { time: '12:40', dest: '山里 · 雾谷站', platform: 2, cars: 2 },
  { time: '16:20', dest: '城里 · 樱町站', platform: 1, cars: 3 },
  { time: '19:05', dest: '海边 · 潮见站', platform: 2, cars: 2 }
]

const now = ref(new Date())
const ticket = ref(null)
let timer = null

const minutes = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** 下一班：今天还没发的第一班；都发完了就说明天第一班 */
const next = computed(() => {
  const cur = minutes(now.value)
  const hit = SCHEDULE.find((s) => toMin(s.time) > cur)
  return hit || SCHEDULE[0]
})

const cd = computed(() => {
  const cur = minutes(now.value)
  const target = toMin(next.value.time)
  const isTomorrow = target <= cur
  let diff = (isTomorrow ? target + 24 * 60 : target) - cur
  if (diff < 0) diff = 0
  const totalSec = Math.floor(diff * 60)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
    hint: isTomorrow
      ? '今天的车都开走了，这是明早第一班'
      : `${next.value.dest} · ${h > 0 ? h + ' 小时 ' : ''}${m} 分钟后开`
  }
})

function isPast (s) {
  return toMin(s.time) <= minutes(now.value)
}

function takeTicket () {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  ticket.value = {
    id: Date.now(),
    dest: next.value.dest,
    date: `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${next.value.time}`,
    no: `No.${String(Math.floor(Math.random() * 9000) + 1000)}`,
    seat: Math.random() < 0.5 ? '自由席' : `2 车 ${Math.floor(Math.random() * 40) + 1} 号`
  }
}

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.sta-tip { font-size: 11.5px; letter-spacing: .06em; color: var(--ink-soft); }

.sta {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 22px;
  margin-top: 6px;
}

/* ---------- 发车牌 ---------- */
.next {
  position: relative;
  padding: 26px 28px 28px;
  border-radius: 26px;
  overflow: hidden;
  color: #fdf3f6;
  background:
    radial-gradient(120% 90% at 12% 0%, rgba(255, 255, 255, .16), transparent 58%),
    linear-gradient(155deg, #4a3a55 0%, #3d3049 46%, #2f2639 100%);
  box-shadow: 0 30px 60px -34px rgba(58, 40, 66, .8), inset 0 1px 0 rgba(255, 255, 255, .14);
}
/* 木纹般的细横线 */
.next::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(180deg, rgba(255, 255, 255, .045) 0 1px, transparent 1px 7px);
  opacity: .7;
}
.next__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 246, 249, .16);
}
.next__tag { font-size: 9.5px; font-weight: 700; letter-spacing: .26em; color: rgba(255, 226, 236, .62); }
.next__line { font-size: 10px; letter-spacing: .16em; color: rgba(255, 226, 236, .5); }

.next__main {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  margin-top: 20px;
}
.next__time {
  font-size: clamp(46px, 5.4vw, 66px);
  font-weight: 700;
  line-height: .95;
  letter-spacing: .02em;
  font-variant-numeric: tabular-nums;
  color: #fff8fa;
  text-shadow: 0 6px 30px rgba(255, 180, 200, .3);
}
.next__body { display: grid; gap: 6px; padding-bottom: 8px; }
.next__body b { font-size: 15px; font-weight: 700; letter-spacing: .08em; color: #ffdfe8; }
.next__body i { font-style: normal; font-size: 11px; letter-spacing: .1em; color: rgba(255, 232, 240, .55); }

.count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .07);
  border: 1px solid rgba(255, 246, 249, .12);
}
.count__num {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #fff6f8;
}
.count__num em {
  margin-right: 8px;
  font-style: normal;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: .08em;
  color: rgba(255, 232, 240, .55);
}
.count__hint { margin: 0; font-size: 11px; letter-spacing: .06em; color: rgba(255, 236, 242, .62); }

.next__take {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 22px;
  flex-wrap: wrap;
}
.take__btn {
  height: 44px;
  padding: 0 24px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(115deg, #ffc4d9, #f9749f);
  color: #4a2333;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: .12em;
  cursor: pointer;
  box-shadow: 0 16px 30px -18px rgba(255, 150, 180, .9);
  transition: transform .28s var(--ease);
}
.take__btn:hover { transform: translateY(-2px); }
.take__note { font-size: 10.5px; letter-spacing: .06em; color: rgba(255, 234, 242, .5); }

/* ---------- 车票 ---------- */
.ticket {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 0;
  margin-top: 20px;
  border-radius: 14px;
  background: linear-gradient(115deg, #fffaf5, #fff1f4);
  color: #4b3548;
  box-shadow: 0 18px 34px -22px rgba(30, 18, 34, .8);
  overflow: hidden;
}
.ticket__punch {
  position: absolute;
  left: 68%;
  top: 0;
  bottom: 0;
  width: 1px;
  border-left: 1px dashed rgba(120, 90, 110, .35);
}
.ticket__left { flex: 1; padding: 16px 18px; display: grid; gap: 5px; }
.ticket__brand { font-size: 9px; letter-spacing: .22em; color: rgba(110, 80, 100, .6); }
.ticket__dest { font-family: var(--font-serif); font-size: 15px; letter-spacing: .06em; }
.ticket__meta { font-size: 10px; letter-spacing: .08em; color: rgba(90, 66, 86, .6); }
.ticket__right {
  display: grid;
  place-content: center;
  gap: 4px;
  padding: 16px 18px;
  text-align: right;
}
.ticket__no { font-size: 11px; font-weight: 700; letter-spacing: .1em; color: #b0536f; }
.ticket__seat { font-size: 10px; letter-spacing: .08em; color: rgba(90, 66, 86, .6); }

.ticket-enter-active { transition: transform .45s var(--ease), opacity .45s var(--ease); }
.ticket-enter-from { transform: translateY(10px) rotate(-1.2deg); opacity: 0; }

/* ---------- 右侧 ---------- */
.side { display: grid; gap: 18px; align-content: start; }
.card {
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, .8);
  border-radius: 22px;
  background: var(--porcelain);
  box-shadow: var(--lift);
}
.card__title {
  margin: 0 0 4px;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: .1em;
  color: var(--ink);
}
.card__desc { margin: 14px 0 0; font-size: 12.5px; line-height: 1.95; color: var(--ink-soft); }
.card__desc--sm { font-size: 11.5px; color: var(--muted); }

.board-list { display: grid; gap: 2px; margin: 12px 0 0; padding: 0; list-style: none; }
.board-row {
  display: grid;
  grid-template-columns: 62px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 11px 10px;
  border-radius: 10px;
  border-bottom: 1px dashed var(--line);
  transition: background .3s, color .3s;
}
.board-row:last-child { border-bottom: 0; }
.board-row__time {
  font-size: 13.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: .06em;
  color: var(--ink);
}
.board-row__dest { font-size: 12.5px; letter-spacing: .04em; color: var(--ink-soft); }
.board-row__pl { font-size: 10.5px; letter-spacing: .08em; color: var(--faint); }
.board-row.is-past { opacity: .42; }
.board-row.is-next {
  background: linear-gradient(100deg, rgba(255, 226, 236, .9), rgba(255, 245, 248, .5));
}
.board-row.is-next .board-row__time { color: var(--sakura-700); }
.board-row.is-next .board-row__dest { color: #7a4a5e; }

.plat { width: 100%; height: auto; margin-top: 12px; }
</style>
