<template>
  <!--
    小镇入口（序章页）：登录之后、进入小镇之前的一屏。
    一张电影感的千年樱主视觉 + 一行序章文案 + 一个「进入小镇」的按钮，
    点下去先有一层暖光闪白，再切到 SakuraTown，像一个「推门」的动作。
  -->
  <section
    class="entry"
    :class="{ 'is-ready': ready, 'is-leaving': leaving }"
    aria-labelledby="entry-title"
  >
    <!-- 主视觉：慢慢推近的镜头（桌面 16:9 取景，拱形树冠压住上半部） -->
    <div class="entry__media" aria-hidden="true">
      <img
        class="entry__photo"
        :src="photo"
        alt=""
        decoding="async"
        fetchpriority="high"
        @load="ready = true"
        @error="ready = true"
      />
    </div>

    <!-- 调色层：上方压深给品牌，下方压深给文案，中间留出树 -->
    <div class="entry__grade" aria-hidden="true"></div>
    <div class="entry__bloom" aria-hidden="true"></div>
    <div class="entry__cool" aria-hidden="true"></div>
    <div class="entry__rays" aria-hidden="true">
      <i></i><i></i><i></i>
    </div>
    <div class="entry__vig" aria-hidden="true"></div>
    <canvas ref="petalCanvas" class="entry__petals" aria-hidden="true"></canvas>
    <div class="entry__frame" aria-hidden="true"></div>

    <!-- 顶部：品牌 + 当前用户 -->
    <header class="entry__top">
      <div class="entry__brand">
        <span class="eb-mark" aria-hidden="true"></span>
        <span class="eb-cn">樱见</span>
        <span class="eb-en">SAKURA NOTE</span>
      </div>

      <div class="entry__user">
        <span v-if="user" class="userchip">
          <i class="userchip__dot" aria-hidden="true"></i>
          <span class="userchip__name">{{ user.name }}</span>
        </span>
        <button v-if="user" type="button" class="entry__logout" @click="$emit('logout')">退出登录</button>
      </div>
    </header>

    <!-- 正文 -->
    <div class="entry__body">
      <div class="entry__copy">
        <p class="entry__eyebrow"><span aria-hidden="true"></span>SAKURA TOWN · 序章</p>

        <h1 id="entry-title" class="entry__title">
          花落了一千年，<br />
          <em>小镇刚醒来。</em>
        </h1>

        <p class="entry__lede">
          一棵守了千年的樱树，把整个春天留在了湖心谷。石阶往下是水，
          水的那一边是书店、便利店、健身房和公园 —— 都还亮着灯，等你推门。
        </p>

        <div class="entry__actions">
          <button type="button" class="entry__cta" :disabled="leaving" @click="enter">
            <span>进入小镇</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M5 12h13M12.5 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button type="button" class="entry__ghost" :disabled="leaving" @click="$emit('navigate', 'about')">
            先了解一下这里
          </button>
        </div>

        <p class="entry__hint">也可以按 <kbd>Enter</kbd> 进门</p>
      </div>

      <!-- 右侧小铭牌：像游戏开场的信息栏 -->
      <dl class="entry__meta">
        <div>
          <dt>时节</dt>
          <dd>春 · 午后</dd>
        </div>
        <div>
          <dt>所在</dt>
          <dd>湖心谷 · 千年樱</dd>
        </div>
        <div>
          <dt>今日</dt>
          <dd>18°C · 微风</dd>
        </div>
      </dl>
    </div>

    <!-- 进门时的一层暖光 -->
    <div class="entry__flash" aria-hidden="true"></div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createPetalField } from '../composables/usePetals'

defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['enter', 'navigate', 'logout'])

const photo = '/town/entry-tree.jpg'

const ready = ref(false)
const leaving = ref(false)

/* ---------- 花瓣：比站内更密一点，画面才够「吹雪」 ---------- */
const petalCanvas = ref(null)
let field = null

/* ---------- 进入小镇：先闪一层暖光，再交给 App 切视图 ---------- */
let timer = null
function enter () {
  if (leaving.value) return
  leaving.value = true
  timer = setTimeout(() => emit('enter'), 780)
}

function onKeydown (e) {
  if (e.key !== 'Enter' || e.repeat) return
  // 焦点在按钮上时按钮自己会处理，避免触发两次
  const tag = (e.target && e.target.tagName) || ''
  if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return
  enter()
}

onMounted(() => {
  if (petalCanvas.value) {
    field = createPetalField(petalCanvas.value, { density: 0.000095, max: 150, base: 16, wind: 0.19 })
    field.mount()
  }
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (field) field.destroy()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* ============================================================
   整屏：一屏定死，不滚动
   ============================================================ */
.entry {
  position: relative;
  z-index: 2;
  width: 100%;
  /* 兜底：body 在登录态是 grid 居中布局，保证整屏一定铺满视口 */
  min-width: 100vw;
  height: 100vh;
  height: 100svh;
  min-height: 560px;
  overflow: hidden;
  background: #191322;
  isolation: isolate;
  color: #fff;
}

/* ---------- 主视觉 ---------- */
.entry__media {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
.entry__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 44%;
  opacity: 0;
  transform: scale(1.14);
  filter: saturate(1.06) contrast(1.02);
  transition: opacity 1.1s var(--ease), transform 2.4s var(--ease);
  will-change: transform, opacity;
}
.entry.is-ready .entry__photo {
  opacity: 1;
  transform: scale(1.04);
  animation: entry-drift 34s ease-in-out infinite alternate;
}
/* 极缓慢的推镜：只做一点点，久了才觉出来 */
@keyframes entry-drift {
  from { transform: scale(1.04) translate3d(0, 0, 0); }
  to { transform: scale(1.11) translate3d(-1.2%, -1%, 0); }
}

/* ---------- 调色 ---------- */
.entry__grade {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(16, 14, 30, 0.6) 0%, rgba(16, 14, 30, 0.16) 16%, rgba(16, 14, 30, 0) 38%),
    linear-gradient(0deg, rgba(15, 11, 22, 0.9) 0%, rgba(15, 11, 22, 0.62) 16%, rgba(15, 11, 22, 0.12) 42%, rgba(15, 11, 22, 0) 62%),
    /* 左下角再压一层：文案区落在山体亮面上，不加这层白字会发灰 */
    radial-gradient(66% 74% at 14% 66%, rgba(13, 9, 19, 0.5), rgba(13, 9, 19, 0) 74%);
}
/* 树冠里的暖光：让花簇透出来 */
.entry__bloom {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(46% 40% at 50% 26%, rgba(255, 196, 168, 0.22), rgba(255, 196, 168, 0) 72%);
  mix-blend-mode: screen;
  animation: entry-breathe 11s ease-in-out infinite;
}
/* 左下角的冷蓝，把暖粉衬暖 */
.entry__cool {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(58% 52% at 12% 92%, rgba(96, 150, 196, 0.2), rgba(96, 150, 196, 0) 70%),
    radial-gradient(50% 46% at 92% 78%, rgba(72, 120, 176, 0.16), rgba(72, 120, 176, 0) 72%);
  mix-blend-mode: screen;
}
@keyframes entry-breathe {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
}

/* 穿过花层的光束：三片很淡的斜向亮带，慢慢呼吸 */
.entry__rays {
  position: absolute;
  inset: -10% -20%;
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0.5;
}
.entry__rays i {
  position: absolute;
  top: -30%;
  height: 150%;
  width: 14%;
  filter: blur(22px);
  background: linear-gradient(180deg, rgba(255, 236, 214, 0.42), rgba(255, 226, 206, 0) 78%);
  transform: rotate(16deg);
}
.entry__rays i:nth-child(1) { left: 26%; width: 9%; opacity: 0.55; animation: ray-sway 16s ease-in-out infinite; }
.entry__rays i:nth-child(2) { left: 44%; width: 13%; opacity: 0.4; animation: ray-sway 21s ease-in-out infinite reverse; }
.entry__rays i:nth-child(3) { left: 66%; width: 7%; opacity: 0.32; animation: ray-sway 26s ease-in-out infinite; }
@keyframes ray-sway {
  0%, 100% { transform: rotate(16deg) translateX(-14px); opacity: 0.25; }
  50% { transform: rotate(16deg) translateX(18px); opacity: 0.6; }
}

.entry__vig {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(112% 88% at 50% 40%, rgba(0, 0, 0, 0) 42%, rgba(12, 9, 18, 0.55) 100%);
}

.entry__petals {
  position: fixed;
  inset: 0;
  z-index: 2;
  display: block;
  pointer-events: none;
}

/* 画面内框：一条极细的白线，像电影取景框 */
.entry__frame {
  position: absolute;
  inset: 18px;
  z-index: 3;
  pointer-events: none;
  border: 1px solid rgba(255, 245, 240, 0.16);
  border-radius: 8px;
}

/* ---------- 顶部 ---------- */
.entry__top {
  position: absolute;
  z-index: 4;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 34px 44px;
  animation: entry-fade 1s var(--ease) 0.15s both;
}
/* 注意：不要再叫 .brand —— style.css 里登录页的 .brand 有底色和伪元素，会串到这一屏 */
.entry__brand {
  display: flex;
  align-items: baseline;
  gap: 9px;
  white-space: nowrap;
  flex: none;
  color: rgba(255, 250, 247, 1);
  /* 压在花簇上，光靠一层阴影不够，做两层：近处勾边 + 远处扩散 */
  text-shadow: 0 1px 3px rgba(12, 7, 16, 0.85), 0 4px 20px rgba(12, 7, 16, 0.7);
}
.eb-mark {
  width: 15px;
  height: 15px;
  border-radius: 50% 0 50% 50%;
  background: linear-gradient(140deg, #fff, #ffc4d9);
  transform: rotate(45deg) translateY(1px);
  box-shadow: 0 0 18px rgba(255, 170, 200, 0.9);
}
.eb-cn {
  white-space: nowrap;
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.3em;
}
.eb-en {
  white-space: nowrap;
  font-size: 9px;
  letter-spacing: 0.3em;
  color: rgba(255, 244, 248, 0.78);
}

.entry__user { display: flex; align-items: center; gap: 14px; }
.userchip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 13px 6px 10px;
  border: 1px solid rgba(255, 246, 241, 0.34);
  border-radius: 999px;
  background: rgba(22, 15, 28, 0.46);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: rgba(255, 246, 242, 0.92);
  white-space: nowrap;
}
.userchip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffb7c8;
  box-shadow: 0 0 0 4px rgba(255, 183, 200, 0.16);
  animation: dot-pulse 2.8s ease-in-out infinite;
}
@keyframes dot-pulse {
  50% { box-shadow: 0 0 0 7px rgba(255, 183, 200, 0.06); }
}
.userchip__name { font-weight: 600; }
.entry__logout {
  border: 0;
  background: none;
  padding: 4px 2px;
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(255, 246, 242, 0.82);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.25s;
}
.entry__logout:hover { color: rgba(255, 246, 242, 0.95); }

/* ---------- 正文 ---------- */
.entry__body {
  position: absolute;
  z-index: 4;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding: 0 62px 56px;
  pointer-events: none;
}
.entry__copy { max-width: 620px; pointer-events: auto; }

.entry__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.26em;
  color: rgba(255, 238, 242, 0.84);
  animation: entry-rise 0.9s var(--ease) 0.3s both;
}
.entry__eyebrow span {
  width: 26px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 200, 214, 0.9), rgba(255, 200, 214, 0));
}

.entry__title {
  margin: 0;
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: clamp(34px, 4.4vw, 62px);
  line-height: 1.24;
  letter-spacing: 0.03em;
  color: #fffaf7;
  text-shadow: 0 6px 34px rgba(18, 10, 24, 0.72), 0 1px 2px rgba(18, 10, 24, 0.5);
  animation: entry-rise 1s var(--ease) 0.4s both;
}
.entry__title em {
  font-style: normal;
  /* 关键：父级 h1 的 text-shadow 会从透明字形里透出来，把这一行染成灰的 */
  text-shadow: none;
  background: linear-gradient(100deg, #fff1e0 0%, #ffdfe6 44%, #ffd2ec 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 3px 10px rgba(24, 12, 26, 0.5)) drop-shadow(0 6px 26px rgba(255, 150, 170, 0.3));
}

.entry__lede {
  max-width: 470px;
  margin: 18px 0 0;
  font-size: 13px;
  line-height: 2;
  color: rgba(255, 248, 246, 0.9);
  text-shadow: 0 2px 16px rgba(14, 9, 20, 0.9);
  animation: entry-rise 1s var(--ease) 0.5s both;
}

.entry__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 26px;
  animation: entry-rise 1s var(--ease) 0.6s both;
}

.entry__cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 50px;
  padding: 0 26px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  background: linear-gradient(120deg, rgba(255, 252, 249, 0.98), rgba(255, 232, 235, 0.94));
  color: #46202f;
  font: inherit;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  cursor: pointer;
  box-shadow:
    0 20px 44px -22px rgba(255, 138, 160, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease), background 0.3s;
}
.entry__cta svg {
  width: 17px;
  height: 17px;
  transition: transform 0.3s var(--ease);
}
.entry__cta:hover {
  transform: translateY(-2px);
  background: linear-gradient(120deg, #fffdfb, #ffe3e6);
  box-shadow:
    0 26px 54px -22px rgba(255, 138, 160, 1),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}
.entry__cta:hover svg { transform: translateX(4px); }
.entry__cta:active { transform: translateY(0) scale(0.99); }
.entry__cta:disabled,
.entry__ghost:disabled { cursor: default; opacity: 0.92; }

.entry__ghost {
  height: 50px;
  padding: 0 20px;
  border: 1px solid rgba(255, 246, 241, 0.3);
  border-radius: 999px;
  background: rgba(30, 22, 34, 0.26);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255, 244, 240, 0.9);
  font: inherit;
  font-size: 12px;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.3s, border-color 0.3s, transform 0.3s var(--ease);
}
.entry__ghost:hover {
  transform: translateY(-2px);
  background: rgba(255, 246, 241, 0.16);
  border-color: rgba(255, 246, 241, 0.5);
}

.entry__hint {
  margin: 16px 0 0;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  color: rgba(255, 240, 240, 0.55);
  animation: entry-rise 1s var(--ease) 0.7s both;
}
.entry__hint kbd {
  padding: 1px 7px;
  border: 1px solid rgba(255, 246, 241, 0.24);
  border-radius: 5px;
  background: rgba(255, 250, 248, 0.08);
  font-family: var(--font-body);
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: rgba(255, 246, 242, 0.72);
}

/* ---------- 右侧铭牌 ---------- */
.entry__meta {
  flex: none;
  display: grid;
  gap: 14px;
  margin: 0 0 4px;
  padding-left: 22px;
  border-left: 1px solid rgba(255, 244, 238, 0.16);
  text-align: right;
  animation: entry-fade 1.2s var(--ease) 0.8s both;
}
.entry__meta div { display: grid; gap: 3px; }
.entry__meta dt {
  font-size: 9px;
  letter-spacing: 0.22em;
  color: rgba(255, 240, 242, 0.55);
  text-shadow: 0 2px 10px rgba(16, 10, 22, 0.8);
}
.entry__meta dd {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: rgba(255, 248, 244, 0.92);
  text-shadow: 0 2px 14px rgba(16, 10, 22, 0.85);
}

/* ---------- 入场 / 出门动画 ---------- */
@keyframes entry-rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes entry-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 进门时的暖光：从画面中心亮起来，铺满整屏再切视图，像走进光里 */
.entry__flash {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(72% 72% at 50% 36%, #fffaf3 0%, #ffeade 52%, #ffdcd0 100%);
  /* ease-in：前半段几乎看不出来，最后 200ms 才迅速亮满，切换藏在最后一帧 */
  transition: opacity 0.82s cubic-bezier(.55, 0, .85, .35);
}
.entry.is-leaving .entry__flash { opacity: 1; }
.entry.is-leaving .entry__media { filter: brightness(1.12) saturate(1.1); }
/* 推镜是 animation，出门时要先关掉它，transform 才会听 transition 的 */
.entry.is-leaving .entry__photo {
  animation: none;
  transform: scale(1.14);
  transition: transform 0.9s var(--ease);
}
.entry.is-leaving .entry__copy,
.entry.is-leaving .entry__top,
.entry.is-leaving .entry__meta {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.4s ease, transform 0.55s var(--ease);
}
.entry.is-leaving .entry__cta { pointer-events: none; }

/* ---------- 窄屏 ---------- */
@media (max-width: 960px) {
  .entry__top { padding: 24px 26px; }
  .entry__body { padding: 0 30px 40px; }
  .entry__meta { display: none; }
  .entry__lede { max-width: 100%; }
}
@media (max-width: 640px) {
  .entry__top { padding: 20px 18px; gap: 10px; }
  .entry__brand { gap: 7px; }
  .eb-cn { font-size: 15px; letter-spacing: 0.18em; }
  .eb-en { display: none; }
  .entry__user { gap: 8px; }
  .userchip { font-size: 10.5px; padding: 5px 10px 5px 8px; }
  .entry__logout { font-size: 10px; padding: 2px; }

  .entry__title { font-size: clamp(28px, 8.4vw, 40px); }
  .entry__lede { font-size: 12px; line-height: 1.9; }
  .entry__actions { gap: 10px; margin-top: 20px; }
  .entry__cta { height: 46px; padding: 0 22px; font-size: 13px; letter-spacing: 0.1em; }
  .entry__ghost { height: 46px; font-size: 11.5px; padding: 0 16px; }
  .entry__hint { display: none; }
  .entry__frame { inset: 10px; }
}

/* 动效关闭：保留画面，不做推镜与光束 */
html.no-motion .entry__photo,
html.no-motion .entry__bloom,
html.no-motion .entry__rays i,
html.no-motion .userchip__dot,
html.no-motion .entry__eyebrow,
html.no-motion .entry__title,
html.no-motion .entry__lede,
html.no-motion .entry__actions,
html.no-motion .entry__hint,
html.no-motion .entry__top,
html.no-motion .entry__meta {
  animation: none !important;
}
html.no-motion .entry__photo { opacity: 1; transform: none; }
</style>
