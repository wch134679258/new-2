<template>
  <TownShell
    :user="user"
    active="school"
    tag="SAKURA SCHOOL"
    title="樱花学校"
    desc="后山脚下唯一的一所学校。木地板的走廊、朝南的教室，还有一间总是被樱花照亮的图书角。"
    @navigate="$emit('navigate', $event)"
    @logout="$emit('logout')"
  >
    <template #hud>
      <span class="sch-tip">今日 {{ doneCount }}/{{ lessons.length }} 节</span>
    </template>

    <div class="sch">
      <!-- ============ 左：黑板 + 课程 ============ -->
      <section class="board" aria-label="今日课程">
        <div class="board__frame">
          <div class="board__surface">
            <header class="board__head">
              <span class="board__day">木曜日 · 今日课程</span>
              <span class="board__date">{{ today }}</span>
            </header>

            <ul class="lessons">
              <li
                v-for="(c, i) in lessons"
                :key="c.key"
                class="lesson"
                :class="{ 'is-done': done.includes(c.key) }"
              >
                <span class="lesson__time">{{ c.time }}</span>
                <span class="lesson__body">
                  <b>{{ c.name }}</b>
                  <i>{{ c.room }} · {{ c.teacher }}</i>
                </span>
                <button
                  type="button"
                  class="lesson__btn"
                  :disabled="done.includes(c.key)"
                  @click="attend(c.key)"
                >
                  {{ done.includes(c.key) ? '已上' : '上课' }}
                </button>
                <span v-if="i === 0" class="lesson__now">现在</span>
              </li>
            </ul>

            <p class="board__note">
              {{ doneCount === lessons.length ? '今天的课都上完了，去图书角坐一会儿吧。' : '点「上课」把今天记到点名册上 —— 只是记一笔，不扣体力。' }}
            </p>
          </div>
          <!-- 粉笔槽 -->
          <div class="board__tray" aria-hidden="true">
            <i></i><i></i><i></i>
          </div>
        </div>
      </section>

      <!-- ============ 右：图书角 / 点名册 ============ -->
      <aside class="side">
        <section class="card">
          <h2 class="card__title">图书角</h2>
          <p class="card__desc">
            靠窗那张桌子正对着樱树。风一吹，就有一两片花瓣落在翻开的书页里。
          </p>

          <blockquote class="quote">
            <p>{{ quote }}</p>
          </blockquote>

          <button type="button" class="card__btn" :disabled="reading" @click="read">
            {{ reading ? '正在翻页…' : '读一会儿' }}
          </button>

          <p class="card__foot">已在这里坐过 <b>{{ sits }}</b> 次</p>
        </section>

        <section class="card card--roll">
          <h2 class="card__title">点名册</h2>
          <div class="roll">
            <span v-for="n in lessons.length" :key="n" class="roll__dot" :class="{ 'is-on': n <= doneCount }"></span>
          </div>
          <p class="card__desc card__desc--sm">
            连续到校会在册子上留下痕迹 —— 今天已经记下 {{ doneCount }} 笔。
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

const lessons = [
  { key: 'japanese', time: '08:50', name: '国语', room: '三年二班', teacher: '柊老师' },
  { key: 'math', time: '10:40', name: '算术', room: '三年二班', teacher: '小野老师' },
  { key: 'art', time: '13:30', name: '美术', room: '画室', teacher: '白鸟老师' },
  { key: 'music', time: '15:10', name: '音乐', room: '音乐室', teacher: '雪村老师' }
]

const QUOTES = [
  '「慢一点也没关系，樱花也是慢慢开的。」',
  '「把今天看不懂的那一页折个角，明天再来。」',
  '「窗外的风比课本上的字更早告诉你春天来了。」',
  '「抄写的时候，字会记住你的手。」',
  '「不懂就问，老师最喜欢被打断。」',
  '「放学别急着走，走廊尽头的光很好看。」'
]

const KEY_DONE = 'aurora_school_done'
const KEY_SITS = 'aurora_school_sits'

const done = ref([])
const sits = ref(0)
const quote = ref(QUOTES[0])
const reading = ref(false)
let timer = null

const doneCount = computed(() => done.value.length)
const today = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
})

function attend (key) {
  if (done.value.includes(key)) return
  done.value = [...done.value, key]
  try { localStorage.setItem(KEY_DONE, JSON.stringify(done.value)) } catch (e) { /* 存不下就只留本次 */ }
}

function read () {
  if (reading.value) return
  reading.value = true
  let i = 0
  // 翻几页的假动作：每 260ms 换一句，六句之后停下
  timer = setInterval(() => {
    i += 1
    quote.value = QUOTES[i % QUOTES.length]
    if (i >= 5) {
      clearInterval(timer)
      timer = null
      reading.value = false
      sits.value += 1
      try { localStorage.setItem(KEY_SITS, String(sits.value)) } catch (e) { /* 同上 */ }
    }
  }, 260)
}

onMounted(() => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY_DONE) || '[]')
    if (Array.isArray(d)) done.value = d.filter((k) => lessons.some((l) => l.key === k))
    sits.value = Number(localStorage.getItem(KEY_SITS) || 0) || 0
  } catch (e) { /* 忽略损坏的本地数据 */ }
})

onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.sch-tip {
  font-size: 11.5px;
  letter-spacing: .06em;
  color: var(--ink-soft);
}

.sch {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 22px;
  margin-top: 6px;
}

/* ---------- 黑板 ---------- */
.board__frame {
  position: relative;
  padding: 14px 14px 0;
  border-radius: 22px;
  background: linear-gradient(180deg, #c69a76 0%, #b4855f 52%, #9d6f4c 100%);
  box-shadow: 0 26px 50px -30px rgba(110, 70, 50, .7), inset 0 1px 0 rgba(255, 255, 255, .4);
}
.board__surface {
  position: relative;
  min-height: 420px;
  padding: 26px 28px 24px;
  border-radius: 14px;
  background:
    radial-gradient(120% 80% at 20% 0%, rgba(255, 255, 255, .1), transparent 60%),
    linear-gradient(160deg, #2f4a41 0%, #28403a 46%, #22372f 100%);
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, .22), inset 0 14px 30px -18px rgba(0, 0, 0, .7);
  color: #eef6ef;
}
.board__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(233, 245, 236, .28);
}
.board__day {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: .16em;
  color: #f4fbf5;
}
.board__date {
  font-size: 11px;
  letter-spacing: .12em;
  color: rgba(234, 246, 238, .6);
}

.lessons {
  display: grid;
  gap: 2px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}
.lesson {
  position: relative;
  display: grid;
  grid-template-columns: 62px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 13px 8px;
  border-radius: 10px;
  border-bottom: 1px dashed rgba(233, 245, 236, .16);
  transition: background .3s;
}
.lesson:last-child { border-bottom: 0; }
.lesson.is-done { background: rgba(255, 255, 255, .05); }
.lesson__time {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
  color: rgba(247, 252, 248, .86);
  font-variant-numeric: tabular-nums;
}
.lesson__body { display: grid; gap: 3px; }
.lesson__body b {
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: .06em;
  color: #f8fdf9;
}
.lesson__body i {
  font-style: normal;
  font-size: 10.5px;
  letter-spacing: .06em;
  color: rgba(230, 244, 234, .55);
}
.lesson.is-done .lesson__body b { text-decoration: line-through; text-decoration-color: rgba(255, 255, 255, .35); }
.lesson__btn {
  padding: 6px 15px;
  border: 1px solid rgba(240, 250, 244, .42);
  border-radius: 999px;
  background: transparent;
  color: rgba(244, 252, 246, .9);
  font: inherit;
  font-size: 11.5px;
  letter-spacing: .1em;
  cursor: pointer;
  transition: background .25s, color .25s, border-color .25s;
}
.lesson__btn:hover:not(:disabled) { background: rgba(255, 255, 255, .16); }
.lesson__btn:disabled {
  cursor: default;
  border-color: transparent;
  background: rgba(255, 255, 255, .1);
  color: rgba(226, 242, 232, .55);
}
.lesson__now {
  position: absolute;
  right: 8px;
  top: -1px;
  font-size: 9px;
  letter-spacing: .18em;
  color: #ffd9a8;
  opacity: .85;
}
.board__note {
  margin: 16px 0 0;
  font-size: 11.5px;
  line-height: 1.9;
  letter-spacing: .04em;
  color: rgba(232, 245, 236, .62);
}

/* 粉笔槽 */
.board__tray {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  margin: 0 6px;
}
.board__tray i {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 252, 246, .82);
}
.board__tray i:nth-child(1) { width: 26px; }
.board__tray i:nth-child(2) { width: 15px; background: rgba(255, 214, 228, .8); }
.board__tray i:nth-child(3) { width: 9px; background: rgba(206, 226, 255, .8); }

/* ---------- 右侧卡片 ---------- */
.side { display: grid; gap: 18px; align-content: start; }
.card {
  padding: 24px 24px 22px;
  border: 1px solid rgba(255, 255, 255, .8);
  border-radius: 22px;
  background: var(--porcelain);
  box-shadow: var(--lift);
}
.card__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: .1em;
  color: var(--ink);
}
.card__desc {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 1.95;
  color: var(--ink-soft);
}
.card__desc--sm { font-size: 11.5px; color: var(--muted); }

.quote {
  position: relative;
  margin: 16px 0 18px;
  padding: 15px 16px 15px 18px;
  border-radius: 14px;
  border-left: 3px solid var(--sakura-400);
  background: linear-gradient(120deg, rgba(255, 240, 245, .9), rgba(255, 250, 252, .6));
}
.quote p {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 12.5px;
  line-height: 1.95;
  color: #6a4a5c;
}

.card__btn {
  width: 100%;
  height: 44px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(115deg, var(--sakura-400), var(--sakura-500));
  color: #fff;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: .12em;
  cursor: pointer;
  box-shadow: 0 16px 30px -18px rgba(232, 84, 127, .85);
  transition: transform .28s var(--ease), box-shadow .28s var(--ease);
}
.card__btn:hover:not(:disabled) { transform: translateY(-2px); }
.card__btn:disabled { cursor: default; opacity: .75; }
.card__foot {
  margin: 12px 0 0;
  font-size: 11px;
  letter-spacing: .06em;
  color: var(--muted);
  text-align: center;
}
.card__foot b { color: var(--sakura-600); }

/* 点名册小圆点 */
.card--roll { padding-bottom: 20px; }
.roll { display: flex; gap: 8px; margin-top: 14px; }
.roll__dot {
  flex: 1;
  height: 7px;
  border-radius: 4px;
  background: rgba(92, 62, 88, .12);
  transition: background .35s var(--ease);
}
.roll__dot.is-on { background: linear-gradient(90deg, var(--sakura-400), var(--sakura-500)); }

@media (max-width: 1080px) {
  .sch { grid-template-columns: 1fr; }
  .board__surface { min-height: 0; }
}
</style>
