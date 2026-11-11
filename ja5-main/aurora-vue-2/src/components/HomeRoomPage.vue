<template>
  <TownShell
    :user="user"
    active="game"
    tag="HOME"
    title="樱见小屋"
    desc="一室一厅，窗正对着那棵大樱花树。书桌上摊着笔记本，床铺永远是刚晒过的味道。"
    @navigate="$emit('navigate', $event)"
    @logout="$emit('logout')"
  >
    <template #hud>
      <span class="home-tip">
        {{ wallet.sleptToday ? '今天已经睡过了' : '还能睡一觉' }}
      </span>
    </template>

    <div class="home">
      <!-- ============ 房间 ============ -->
      <section class="room" aria-label="房间">
        <div class="room__wall"></div>
        <div class="room__floor"></div>

        <!-- 窗：外面就是小镇的樱花树 -->
        <div class="win">
          <div class="win__sky"></div>
          <svg class="win__branch" viewBox="0 0 120 80" aria-hidden="true">
            <path d="M-4 74C22 62 34 44 44 20c4-10 12-16 22-18" fill="none" stroke="#8a6272" stroke-width="3.4" stroke-linecap="round" />
            <path d="M44 26c12-4 20-2 30 4M52 14c10-6 20-6 30-2" fill="none" stroke="#8a6272" stroke-width="2.4" stroke-linecap="round" />
            <g fill="#ffc4d9">
              <ellipse cx="46" cy="18" rx="7" ry="5" transform="rotate(-18 46 18)" />
              <ellipse cx="66" cy="28" rx="6" ry="4.4" transform="rotate(12 66 28)" />
              <ellipse cx="80" cy="16" rx="5.4" ry="4" transform="rotate(-8 80 16)" />
              <ellipse cx="34" cy="40" rx="5" ry="3.6" transform="rotate(20 34 40)" />
            </g>
          </svg>
          <span class="win__frame"></span>
          <span class="win__curtain win__curtain--l"></span>
          <span class="win__curtain win__curtain--r"></span>
        </div>

        <!-- 书架 -->
        <button class="shelf" type="button" aria-label="看看我的书架" @click="shelfOpen = true">
          <span class="shelf__row" v-for="r in 3" :key="r">
            <i
              v-for="(b, i) in shelfRow(r)"
              :key="i"
              class="shelf__book"
              :style="{ background: b.color, height: b.h + 'px' }"
            ></i>
          </span>
          <span class="shelf__hint">我的书架 · {{ wallet.ownedCount }} 本</span>
        </button>

        <!-- 书桌 + 笔记本 -->
        <div class="desk">
          <button class="laptop" type="button" aria-label="打开笔记本，玩小游戏" @click="openLaptop('snake')">
            <span class="laptop__lid">
              <span class="laptop__screen">
                <span class="laptop__glow"></span>
                <span class="laptop__petal"></span>
              </span>
            </span>
            <span class="laptop__base"></span>
            <span class="laptop__label">点我开机</span>
          </button>
          <span class="desk__top"></span>
          <span class="desk__leg desk__leg--l"></span>
          <span class="desk__leg desk__leg--r"></span>
          <span class="desk__cup"></span>
          <span class="desk__books"></span>
        </div>

        <!-- 床 -->
        <button class="bed" type="button" aria-label="睡一觉，恢复体力" @click="doSleep">
          <span class="bed__head"></span>
          <span class="bed__mattress"></span>
          <span class="bed__pillow"></span>
          <span class="bed__quilt"></span>
          <span class="bed__hint">{{ wallet.sleptToday ? '今天睡过了' : '睡一觉 · 回满体力' }}</span>
        </button>

        <span class="rug"></span>
        <span class="cat" aria-hidden="true">
          <span class="cat__body"></span>
          <span class="cat__head"></span>
          <span class="cat__tail"></span>
        </span>
      </section>

      <!-- ============ 右列 ============ -->
      <aside class="side">
        <div class="panel">
          <h3 class="panel__title">今天的家</h3>
          <ul class="panel__list">
            <li>
              <span>体力</span>
              <b>{{ wallet.energy }} / {{ wallet.energyMax }}</b>
            </li>
            <li>
              <span>睡眠</span>
              <b :class="{ done: wallet.sleptToday }">{{ wallet.sleptToday ? '已休息' : '可休息一次' }}</b>
            </li>
            <li>
              <span>游戏收入</span>
              <b>{{ wallet.gameEarnedToday }} / {{ wallet.gameDailyCap }}</b>
            </li>
            <li>
              <span>藏书</span>
              <b>{{ wallet.ownedCount }} 本</b>
            </li>
          </ul>
          <button class="panel__sleep" type="button" :disabled="wallet.sleptToday || sleepBusy" @click="doSleep">
            {{ sleepBusy ? '正在铺床…' : wallet.sleptToday ? '今天已经睡过了' : '躺一会儿（回满体力）' }}
          </button>
        </div>

        <div class="panel panel--soft">
          <h3 class="panel__title">书桌抽屉</h3>
          <p class="panel__text">
            笔记本里有三款小游戏，玩完结算会自动折算金币 ——
            每天最多赚 {{ wallet.gameDailyCap }} 金币，别熬太晚。
          </p>
          <div class="mini">
            <button
              v-for="g in GAMES"
              :key="g.key"
              class="mini__btn"
              type="button"
              @click="openLaptop(g.key)"
            >
              <span>{{ g.icon }}</span>{{ g.label }}
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- ============ 笔记本（内嵌游戏） ============ -->
    <Teleport to="body">
      <Transition name="lap">
        <div v-if="laptop" class="lap" role="dialog" aria-modal="true" aria-label="笔记本" @click.self="closeLaptop">
          <div class="lap__shell">
            <header class="lap__bar">
              <span class="lap__dots"><i></i><i></i><i></i></span>
              <nav class="lap__tabs">
                <button
                  v-for="g in GAMES"
                  :key="g.key"
                  class="lap__tab"
                  :class="{ on: laptop === g.key }"
                  type="button"
                  @click="laptop = g.key"
                >{{ g.label }}</button>
              </nav>
              <span class="lap__earn">今日 +{{ wallet.gameEarnedToday }}/{{ wallet.gameDailyCap }}</span>
              <button class="lap__close" type="button" aria-label="合上笔记本" @click="closeLaptop">合上</button>
            </header>

            <div class="lap__screen">
              <SpaceSnake
                v-if="laptop === 'snake'"
                key="snake"
                :user="user"
                embedded
                @navigate="onGameNavigate"
                @logout="$emit('logout')"
              />
              <TetrisPage
                v-else-if="laptop === 'tetris'"
                key="tetris"
                :user="user"
                embedded
                @navigate="onGameNavigate"
                @logout="$emit('logout')"
              />
              <FishGamePage
                v-else
                key="fish"
                :user="user"
                embedded
                @navigate="onGameNavigate"
                @logout="$emit('logout')"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============ 书架抽屉 ============ -->
    <Teleport to="body">
      <Transition name="lap">
        <div v-if="shelfOpen" class="shelf-drawer" role="dialog" aria-modal="true" aria-label="我的书架" @click.self="shelfOpen = false">
          <div class="shelf-drawer__panel">
            <header class="shelf-drawer__head">
              <div>
                <span class="shelf-drawer__tag">MY SHELF</span>
                <h3>买回来的书</h3>
              </div>
              <button class="shelf-drawer__close" type="button" @click="shelfOpen = false">✕</button>
            </header>

            <div v-if="shelfLoading" class="shelf-drawer__empty">正在数书…</div>
            <div v-else-if="!shelfBooks.length" class="shelf-drawer__empty">
              书架还空着。<br />去书店挑一本吧，书脊会替你记住这个下午。
            </div>
            <ul v-else class="shelf-drawer__list">
              <li v-for="b in shelfBooks" :key="b.id">
                <button type="button" @click="openBook(b.id)">
                  <span class="shelf-drawer__spine" :style="{ background: spineColor(b.category) }"></span>
                  <span class="shelf-drawer__info">
                    <b>{{ b.title }}</b>
                    <i>{{ b.author || '佚名' }} · {{ b.category || '手记' }}</i>
                  </span>
                  <span class="shelf-drawer__go">翻开 →</span>
                </button>
              </li>
            </ul>

            <button class="shelf-drawer__more" type="button" @click="goBookstore">再去书店看看</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </TownShell>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import TownShell from './TownShell.vue'
import SpaceSnake from './SpaceSnake.vue'
import TetrisPage from './TetrisPage.vue'
import FishGamePage from './FishGamePage.vue'
import { useEconomy } from '../composables/useEconomy'
import { refreshOwned } from '../composables/useEconomy'
import { searchArticles } from '../api/search'
import { toast } from '../composables/useToast'

const props = defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['navigate', 'logout', 'open-article'])

const { wallet, sleep, refresh, startTicker, hasOwned } = useEconomy()

const GAMES = [
  { key: 'snake', label: '花瓣贪吃蛇', icon: '🐍' },
  { key: 'tetris', label: '樱落方块', icon: '🧩' },
  { key: 'fish', label: '樱海大鱼', icon: '🐟' }
]

const laptop = ref('')
const sleepBusy = ref(false)
const shelfOpen = ref(false)
const shelfLoading = ref(false)
const shelfBooks = ref([])

function openLaptop (key) {
  if (!props.user) {
    toast.info('先登录，笔记本才认你的账号')
    emit('navigate', 'auth')
    return
  }
  laptop.value = key
}
function closeLaptop () { laptop.value = '' }
function onGameNavigate () { /* 游戏内的跳转在笔记本里不生效，避免盖住整个页面 */ }

async function doSleep () {
  if (wallet.sleptToday) {
    toast.info('今天已经睡过了，再睡就真的变成猫了')
    return
  }
  if (sleepBusy.value) return
  sleepBusy.value = true
  try {
    const res = await sleep()
    toast.success(`一觉睡到自然醒，体力 ${res.energy}/${res.energyMax}`)
  } catch (e) {
    toast.error((e && e.message) || '睡不着，稍后再试')
  } finally {
    sleepBusy.value = false
  }
}

/** 书架抽屉里的书：拿已购 id 去换成具体书目信息 */
async function loadShelf () {
  shelfLoading.value = true
  try {
    await refreshOwned()
    const res = await searchArticles('', { size: 50 })
    shelfBooks.value = ((res && res.list) || []).filter((b) => hasOwned(b.id))
  } catch (e) {
    shelfBooks.value = []
  } finally {
    shelfLoading.value = false
  }
}

function openBook (id) {
  shelfOpen.value = false
  emit('open-article', id)
}
function goBookstore () {
  shelfOpen.value = false
  emit('navigate', 'home')
}

const SPINE = ['#f2a6c3', '#bac9ee', '#a8d3ae', '#eec488', '#c3aee6', '#eeaac5']
function spineColor (cat) {
  const map = { 前端: '#bac9ee', 后端: '#a8d3ae', 数据库: '#eec488', 设计: '#c3aee6', 小说: '#f2a6c3', 工程: '#eeaac5' }
  return map[cat] || SPINE[0]
}

/** 书架上的书脊：用已购数量决定亮几本，其余用淡色占位 */
function shelfRow (row) {
  const owned = wallet.ownedCount
  const perRow = 7
  const start = (row - 1) * perRow
  const out = []
  for (let i = 0; i < perRow; i++) {
    const idx = start + i
    const filled = idx < owned
    out.push({
      color: filled ? SPINE[idx % SPINE.length] : 'rgba(180, 160, 178, .18)',
      h: 22 + ((idx * 7) % 12)
    })
  }
  return out
}

onMounted(() => {
  refresh()
  startTicker()
  refreshOwned().catch(() => {})
  // 书架抽屉按需加载，这里先不请求
  void loadShelf
})
</script>

<style scoped>
.home-tip { font-size: 11.5px; color: var(--muted); }

.home {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

/* ---------- 房间 ---------- */
.room {
  position: relative;
  min-height: 440px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .9);
  box-shadow: var(--shadow-lg);
  isolation: isolate;
}
.room__wall {
  position: absolute;
  inset: 0 0 32% 0;
  background:
    radial-gradient(120% 90% at 78% 8%, rgba(255, 246, 235, .9), transparent 60%),
    linear-gradient(180deg, #f7e6ef, #f3dee9 60%, #efd8e4);
}
.room__wall::after {
  /* 墙面壁纸细纹 */
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(90deg, rgba(255, 255, 255, .5) 0 1px, transparent 1px 42px);
  opacity: .5;
}
.room__floor {
  position: absolute;
  inset: 68% 0 0 0;
  background:
    repeating-linear-gradient(96deg, rgba(160, 118, 120, .1) 0 2px, transparent 2px 34px),
    linear-gradient(180deg, #d9bdb6, #c8a9a6);
  box-shadow: inset 0 10px 24px -14px rgba(90, 60, 70, .45);
}

/* 窗 */
.win {
  position: absolute;
  left: 7%;
  top: 9%;
  width: 34%;
  height: 42%;
  border-radius: 12px;
  overflow: hidden;
  border: 6px solid #fffaf7;
  box-shadow: 0 18px 34px -22px rgba(90, 60, 70, .6), inset 0 0 0 1px rgba(180, 140, 160, .25);
  background: linear-gradient(180deg, #cfc3ea, #f0d7e4 55%, #fbe8dd);
}
.win__sky { position: absolute; inset: 0; }
.win__branch { position: absolute; right: -6%; top: 4%; width: 78%; height: auto; opacity: .95; }
.win__frame {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent 48.4%, rgba(255, 250, 247, .92) 48.4% 51.6%, transparent 51.6%),
    linear-gradient(180deg, transparent 46%, rgba(255, 250, 247, .92) 46% 50%, transparent 50%);
  pointer-events: none;
}
.win__curtain {
  position: absolute;
  top: -6%;
  bottom: -6%;
  width: 22%;
  background: linear-gradient(180deg, rgba(255, 246, 250, .95), rgba(255, 228, 238, .88));
  border-radius: 0 0 40% 40%;
}
.win__curtain--l { left: -4%; }
.win__curtain--r { right: -4%; border-radius: 0 0 40% 40%; }

/* 书架 */
.shelf {
  position: absolute;
  right: 6%;
  top: 8%;
  width: 27%;
  height: 40%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  background: linear-gradient(180deg, #b98a72, #a5765f);
  box-shadow: 0 18px 32px -20px rgba(90, 60, 70, .7), inset 0 0 0 3px rgba(255, 240, 230, .26);
  transition: transform .3s var(--ease), box-shadow .3s;
}
.shelf:hover { transform: translateY(-3px); box-shadow: 0 24px 40px -22px rgba(90, 60, 70, .8); }
.shelf__row {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 26px;
  padding: 0 2px 3px;
  border-bottom: 3px solid rgba(255, 240, 230, .55);
}
.shelf__book {
  width: 8px;
  border-radius: 2px 2px 0 0;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, .12);
  transition: height .4s var(--ease);
}
.shelf__hint {
  position: absolute;
  left: 50%;
  bottom: -26px;
  transform: translateX(-50%);
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .88);
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transition: opacity .25s;
}
.shelf:hover .shelf__hint { opacity: 1; }

/* 书桌 + 笔记本 */
.desk {
  position: absolute;
  right: 8%;
  bottom: 24%;
  width: 40%;
  height: 30%;
}
.desk__top {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 42%;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(180deg, #e6c9b4, #cbab96);
  box-shadow: 0 10px 18px -12px rgba(90, 60, 70, .8);
}
.desk__leg {
  position: absolute;
  bottom: 0;
  width: 8px;
  height: 42%;
  border-radius: 3px;
  background: linear-gradient(180deg, #b8977f, #a5846f);
}
.desk__leg--l { left: 8%; }
.desk__leg--r { right: 8%; }
.desk__cup {
  position: absolute;
  right: 12%;
  bottom: 48%;
  width: 14px;
  height: 16px;
  border-radius: 3px 3px 6px 6px;
  background: linear-gradient(180deg, #fff, #f0e2ea);
  box-shadow: 0 4px 8px -6px rgba(90, 60, 70, .8);
}
.desk__books {
  position: absolute;
  left: 6%;
  bottom: 48%;
  width: 30px;
  height: 10px;
  border-radius: 2px;
  background: linear-gradient(180deg, #f3a8c4, #e58bab);
  box-shadow: 0 3px 0 -1px #b7c8ea, 0 6px 0 -2px #a8d3ae;
}

.laptop {
  position: absolute;
  left: 50%;
  bottom: 48%;
  transform: translateX(-50%);
  width: 112px;
  height: 74px;
  border: 0;
  background: none;
  cursor: pointer;
  padding: 0;
}
.laptop__lid {
  position: absolute;
  left: 12px;
  bottom: 16px;
  width: 88px;
  height: 54px;
  border-radius: 5px 5px 2px 2px;
  background: linear-gradient(160deg, #d8d3dd, #b3adba);
  box-shadow: 0 12px 22px -16px rgba(60, 40, 60, .9);
  transform-origin: bottom center;
  transition: transform .45s var(--ease);
}
.laptop:hover .laptop__lid { transform: rotateX(-8deg) translateY(-3px); }
.laptop__screen {
  position: absolute;
  inset: 4px;
  border-radius: 3px;
  overflow: hidden;
  background: radial-gradient(120% 100% at 30% 20%, #fff8fb, #ffe6f0 55%, #f6d3e6);
}
.laptop__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 60% at 50% 40%, rgba(255, 232, 244, .95), transparent 70%);
  animation: screen-breathe 4.5s ease-in-out infinite;
}
.laptop__petal {
  position: absolute;
  left: 30%;
  top: 26%;
  width: 12px;
  height: 8px;
  border-radius: 50% 0 50% 50%;
  background: #f9a8c6;
  transform: rotate(-24deg);
  opacity: .8;
  animation: petal-float 5s ease-in-out infinite;
}
.laptop__base {
  position: absolute;
  left: 0;
  bottom: 6px;
  width: 112px;
  height: 10px;
  border-radius: 3px 3px 6px 6px;
  background: linear-gradient(180deg, #cfc9d4, #a8a2af);
  box-shadow: 0 8px 14px -10px rgba(60, 40, 60, .9);
}
.laptop__label {
  position: absolute;
  left: 50%;
  bottom: -14px;
  transform: translateX(-50%);
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .92);
  font-size: 10px;
  color: var(--sakura-700);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transition: opacity .25s;
}
.laptop:hover .laptop__label { opacity: 1; }

/* 床 */
.bed {
  position: absolute;
  left: 6%;
  bottom: 7%;
  width: 40%;
  height: 25%;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
}
.bed__head {
  position: absolute;
  left: 0;
  bottom: 34%;
  width: 12px;
  height: 66%;
  border-radius: 4px;
  background: linear-gradient(180deg, #b8977f, #9c7c68);
}
.bed__mattress {
  position: absolute;
  left: 8px;
  bottom: 30%;
  right: 0;
  height: 34%;
  border-radius: 6px;
  background: linear-gradient(180deg, #fffafc, #f4e6ee);
  box-shadow: 0 10px 18px -14px rgba(90, 60, 70, .9);
}
.bed__pillow {
  position: absolute;
  left: 18px;
  bottom: 46%;
  width: 26%;
  height: 26%;
  border-radius: 8px;
  background: linear-gradient(180deg, #fff, #ffeef5);
  box-shadow: inset 0 0 0 1px rgba(255, 214, 229, .9);
}
.bed__quilt {
  position: absolute;
  left: 30%;
  bottom: 30%;
  right: 0;
  height: 36%;
  border-radius: 8px;
  background: linear-gradient(150deg, #ffd3e2, #f7b3cc 60%, #eea1bd);
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, .6);
}
.bed__hint {
  position: absolute;
  left: 50%;
  top: -18px;
  transform: translateX(-50%);
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .92);
  font-size: 10px;
  color: var(--mauve, var(--muted));
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transition: opacity .25s;
}
.bed:hover .bed__hint { opacity: 1; }

/* 地毯与猫 */
.rug {
  position: absolute;
  left: 42%;
  bottom: 6%;
  width: 30%;
  height: 9%;
  border-radius: 50%;
  background: radial-gradient(50% 50% at 50% 50%, rgba(255, 214, 229, .95), rgba(255, 214, 229, .35) 70%, transparent);
  filter: blur(.4px);
}
.cat {
  position: absolute;
  left: 52%;
  bottom: 8%;
  width: 34px;
  height: 22px;
}
.cat__body {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 30px;
  height: 14px;
  border-radius: 12px 12px 8px 8px;
  background: #fdf6f2;
  box-shadow: inset -2px -2px 0 rgba(230, 200, 205, .5);
}
.cat__head {
  position: absolute;
  right: -2px;
  bottom: 8px;
  width: 14px;
  height: 13px;
  border-radius: 50%;
  background: #fffdfb;
  box-shadow: 0 0 0 1px rgba(220, 190, 200, .5) inset;
}
.cat__head::before,
.cat__head::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 0;
  height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-bottom: 5px solid #fffdfb;
}
.cat__head::before { left: 1px; }
.cat__head::after { right: 3px; }
.cat__tail {
  position: absolute;
  left: -8px;
  bottom: 2px;
  width: 12px;
  height: 8px;
  border: 2px solid #fdf6f2;
  border-right: 0;
  border-radius: 8px 0 0 8px;
  transform-origin: right center;
  animation: tail-sway 3.4s ease-in-out infinite;
}

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
.panel__list { list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.panel__list li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
}
.panel__list b { color: var(--ink); font-variant-numeric: tabular-nums; }
.panel__list b.done { color: var(--leaf-500); }
.panel__sleep {
  width: 100%;
  height: 38px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  color: #fff;
  background: linear-gradient(120deg, var(--lavender-400), var(--lavender-500));
  box-shadow: 0 14px 26px -18px rgba(143, 111, 184, .95);
}
.panel__sleep:disabled { color: var(--muted); background: var(--paper-3); box-shadow: none; cursor: default; }
.panel__text { margin: 0 0 14px; font-size: 11.5px; line-height: 1.85; color: var(--muted); }
.mini { display: flex; flex-wrap: wrap; gap: 7px; }
.mini__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 11px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink-soft);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: transform .2s var(--ease), border-color .2s, color .2s;
}
.mini__btn:hover { transform: translateY(-1px); border-color: var(--sakura-300); color: var(--sakura-700); }

/* ---------- 笔记本遮罩 ---------- */
.lap {
  position: fixed;
  inset: 0;
  z-index: 96;
  display: grid;
  place-items: center;
  padding: clamp(10px, 3vw, 34px);
  background: rgba(56, 30, 48, .42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.lap__shell {
  width: min(1180px, 100%);
  max-height: 94vh;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(180deg, #f7f2f5, #eae2e9);
  border: 1px solid rgba(255, 255, 255, .9);
  box-shadow: 0 50px 90px -50px rgba(40, 20, 35, .9);
}
.lap__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  background: linear-gradient(180deg, #fdf8fb, #f0e8ef);
  border-bottom: 1px solid rgba(180, 150, 170, .25);
}
.lap__dots { display: flex; gap: 5px; flex: none; }
.lap__dots i { width: 9px; height: 9px; border-radius: 50%; background: #e2d3dc; }
.lap__dots i:nth-child(1) { background: #f4b0b8; }
.lap__dots i:nth-child(2) { background: #f6d79a; }
.lap__dots i:nth-child(3) { background: #a8d3ae; }
.lap__tabs { display: flex; gap: 4px; overflow-x: auto; }
.lap__tab {
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 11.5px;
  white-space: nowrap;
  cursor: pointer;
}
.lap__tab:hover { background: rgba(255, 255, 255, .8); }
.lap__tab.on {
  color: var(--sakura-700);
  background: #fff;
  border-color: var(--sakura-200);
  box-shadow: var(--shadow-sm);
}
.lap__earn { margin-left: auto; font-size: 10.5px; color: var(--faint); letter-spacing: .04em; }
.lap__close {
  flex: none;
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--muted);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}
.lap__close:hover { color: var(--sakura-700); border-color: var(--sakura-300); }
.lap__screen {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--paper);
  padding: 4px 6px 10px;
}

/* 书架抽屉 */
.shelf-drawer {
  position: fixed;
  inset: 0;
  z-index: 96;
  display: flex;
  justify-content: flex-end;
  background: rgba(70, 36, 56, .34);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
}
.shelf-drawer__panel {
  width: min(400px, 92vw);
  height: 100%;
  padding: 22px 20px calc(20px + env(safe-area-inset-bottom));
  background: linear-gradient(175deg, #fffafc, #fdf2f7);
  border-left: 1px solid var(--line);
  box-shadow: -30px 0 70px -34px rgba(147, 81, 108, .5);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.shelf-drawer__head { display: flex; align-items: flex-start; justify-content: space-between; }
.shelf-drawer__tag { font-size: 9px; letter-spacing: .32em; color: var(--sakura-500); }
.shelf-drawer__head h3 {
  margin: 6px 0 0;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
  color: var(--ink);
}
.shelf-drawer__close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--muted);
  cursor: pointer;
}
.shelf-drawer__empty {
  padding: 44px 10px;
  text-align: center;
  font-size: 12.5px;
  line-height: 2;
  color: var(--faint);
}
.shelf-drawer__list { list-style: none; margin: 18px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.shelf-drawer__list button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 10px;
  border-radius: 13px;
  border: 1px solid transparent;
  background: #fff;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color .2s, transform .2s var(--ease);
}
.shelf-drawer__list button:hover { border-color: var(--sakura-200); transform: translateX(2px); }
.shelf-drawer__spine { width: 5px; height: 30px; border-radius: 3px; flex: none; }
.shelf-drawer__info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.shelf-drawer__info b {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.shelf-drawer__info i { font-style: normal; font-size: 10px; color: var(--faint); }
.shelf-drawer__go { font-size: 10.5px; color: var(--sakura-500); flex: none; }
.shelf-drawer__more {
  margin-top: auto;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--sakura-200);
  background: var(--sakura-50);
  color: var(--sakura-700);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.lap-enter-active, .lap-leave-active { transition: opacity .24s var(--ease); }
.lap-enter-active .lap__shell, .lap-leave-active .lap__shell { transition: transform .3s var(--ease); }
.lap-enter-from, .lap-leave-to { opacity: 0; }
.lap-enter-from .lap__shell, .lap-leave-to .lap__shell { transform: translateY(12px) scale(.985); }

@keyframes screen-breathe {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}
@keyframes petal-float {
  0%, 100% { transform: rotate(-24deg) translate(0, 0); }
  50% { transform: rotate(-8deg) translate(4px, 6px); }
}
@keyframes tail-sway {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(8deg); }
}

@media (max-width: 900px) {
  .home { grid-template-columns: 1fr; }
  .room { min-height: 380px; }
  .win { width: 38%; }
  .shelf { width: 30%; }
}
</style>
