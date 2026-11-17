<template>
  <!--
    小镇入口（序章页）：登录之后、进入小镇之前的一屏。
    一张日系动画风的千年樱主视觉 + 一行序章文案 + 一个「进入小镇」的按钮，
    点下去先有一层暖光闪白，再切到 SakuraTown，像一个「推门」的动作。

    版式说明（别随手改回深色）：
      这张图是明亮的粉彩调，白字压不住，所以文字统一用墨色 + 淡白光晕，
      控件走站内的「白瓷玻璃」语言，画面上半部右侧是天空留白，正好放文案；
      下半部（山下小镇 + 树根边休息的人）整块留出来，不压任何东西。
  -->
  <section
    class="entry"
    :class="{ 'is-ready': ready, 'is-leaving': leaving }"
    aria-labelledby="entry-title"
  >
    <!-- 主视觉：慢慢推近的镜头 -->
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

    <!-- 调色：只做加法 —— 阳光处补暖、四周补一点樱粉，不压暗画面 -->
    <div class="entry__glow" aria-hidden="true"></div>
    <div class="entry__veil" aria-hidden="true"></div>
    <div class="entry__vig" aria-hidden="true"></div>
    <canvas ref="petalCanvas" class="entry__petals" aria-hidden="true"></canvas>
    <div class="entry__frame" aria-hidden="true"></div>

    <!-- 顶部：品牌 + 当前用户（白瓷玻璃片） -->
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

    <!-- 正文：落在右上方的天空留白里 -->
    <div class="entry__copy">
      <p class="entry__eyebrow"><span aria-hidden="true"></span>SAKURA TOWN · 序章</p>

      <h1 id="entry-title" class="entry__title">
        花落了一千年，<br />
        <em>小镇刚醒来。</em>
      </h1>

      <p class="entry__lede">
        千年樱守在后山的崖上，风一过就落一场花雨。<br />
        山脚下的小镇亮着灯 —— 书店、便利店与公园，都在等你。
      </p>

      <div class="entry__actions">
        <button type="button" class="entry__cta" :disabled="leaving" @click="enter">
          <span>进入小镇</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M5 12h13M12.5 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button type="button" class="entry__ghost" :disabled="leaving" @click="$emit('navigate', 'about')">
          先了解一下这里
        </button>
      </div>

      <p class="entry__hint">也可以按 <kbd>Enter</kbd> 进门</p>
    </div>

    <!-- 左下角：一行小铭牌，压在草坡上，白字带阴影 -->
    <p class="entry__meta">
      <span>湖心谷 · 千年樱</span>
      <i aria-hidden="true"></i>
      <span>春 · 午后</span>
      <i aria-hidden="true"></i>
      <span>微风 18°C</span>
    </p>

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
  background: var(--paper-2);
  isolation: isolate;
  color: var(--ink);
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
  object-position: 50% 46%;
  opacity: 0;
  transform: scale(1.1);
  filter: saturate(1.02) contrast(1);
  transition: opacity 1.1s var(--ease), transform 2.6s var(--ease);
  will-change: transform, opacity;
}
.entry.is-ready .entry__photo {
  opacity: 1;
  transform: scale(1.02);
  animation: entry-drift 38s ease-in-out infinite alternate;
}
/* 极缓慢的推镜：只做一点点，久了才觉出来 */
@keyframes entry-drift {
  from { transform: scale(1.02) translate3d(0, 0, 0); }
  to { transform: scale(1.07) translate3d(-0.8%, -0.8%, 0); }
}

/* ---------- 调色：只提亮不压暗 ---------- */
/* 太阳位置补一层暖光，让逆光更「新海诚」 */
.entry__glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(34% 30% at 63% 15%, rgba(255, 246, 224, 0.55), rgba(255, 240, 214, 0) 72%);
  mix-blend-mode: screen;
  animation: entry-breathe 12s ease-in-out infinite;
}
/* 文案区后方的极淡米白纱：只抬一点点底，避免字压在云上发虚 */
.entry__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(54% 50% at 60% 52%, rgba(255, 253, 251, 0.6), rgba(255, 253, 251, 0) 74%);
}
/* 四周一圈樱花色柔光，替掉原来的深色暗角 */
.entry__vig {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(126% 96% at 50% 42%, rgba(255, 214, 228, 0) 56%, rgba(255, 208, 225, 0.3) 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 22%);
}
@keyframes entry-breathe {
  0%, 100% { opacity: 0.78; }
  50% { opacity: 1; }
}

.entry__petals {
  position: fixed;
  inset: 0;
  z-index: 2;
  display: block;
  pointer-events: none;
}

/* 画面内框：一条极细的白线，像明信片的压边 */
.entry__frame {
  position: absolute;
  inset: 16px;
  z-index: 3;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(120, 80, 100, 0.05);
}

/* ---------- 顶部：白瓷玻璃 ---------- */
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
  flex: none;
  white-space: nowrap;
  padding: 9px 16px 9px 13px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  box-shadow: 0 10px 26px -18px rgba(120, 70, 95, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  color: var(--ink);
}
.eb-mark {
  width: 14px;
  height: 14px;
  border-radius: 50% 0 50% 50%;
  background: linear-gradient(140deg, #fff, var(--sakura-400));
  transform: rotate(45deg) translateY(1px);
  box-shadow: 0 0 14px rgba(249, 116, 159, 0.55);
}
.eb-cn {
  white-space: nowrap;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.26em;
  color: #3a2b3d;
}
.eb-en {
  white-space: nowrap;
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.26em;
  color: rgba(90, 68, 88, 0.55);
}

.entry__user { display: flex; align-items: center; gap: 10px; }
.userchip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px 7px 11px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  box-shadow: 0 10px 26px -18px rgba(120, 70, 95, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: #45334a;
  white-space: nowrap;
}
.userchip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sakura-500);
  box-shadow: 0 0 0 4px rgba(249, 116, 159, 0.18);
  animation: dot-pulse 2.8s ease-in-out infinite;
}
@keyframes dot-pulse {
  50% { box-shadow: 0 0 0 7px rgba(249, 116, 159, 0.07); }
}
.userchip__name { font-weight: 700; }
.entry__logout {
  padding: 7px 13px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  box-shadow: 0 10px 26px -18px rgba(120, 70, 95, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(62, 44, 58, 0.78);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.25s, background 0.25s;
}
.entry__logout:hover { color: var(--sakura-700); background: rgba(255, 255, 255, 0.74); }

/* ---------- 正文：右上方的天空留白 ---------- */
.entry__copy {
  position: absolute;
  z-index: 4;
  left: 45%;
  top: 34%;
  width: min(500px, 45vw);
  animation: entry-rise 1s var(--ease) 0.3s both;
}
.entry__copy > * { animation: entry-rise 1s var(--ease) both; }
.entry__copy > *:nth-child(1) { animation-delay: 0.32s; }
.entry__copy > *:nth-child(2) { animation-delay: 0.4s; }
.entry__copy > *:nth-child(3) { animation-delay: 0.5s; }
.entry__copy > *:nth-child(4) { animation-delay: 0.6s; }
.entry__copy > *:nth-child(5) { animation-delay: 0.7s; }

.entry__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.26em;
  color: rgba(58, 42, 62, 0.82);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
}
.entry__eyebrow span {
  width: 26px;
  height: 1px;
  background: linear-gradient(90deg, var(--sakura-500), rgba(249, 116, 159, 0));
}

/* 墨色标题：压在浅色天空上，靠一层淡白光晕和背景分开 */
.entry__title {
  margin: 0;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: clamp(34px, 3.6vw, 54px);
  line-height: 1.26;
  letter-spacing: 0.02em;
  color: #35263a;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7), 0 3px 14px rgba(255, 255, 255, 0.45);
}
.entry__title em {
  font-style: normal;
  text-shadow: none;
  background: linear-gradient(100deg, #c02460 0%, #e0447b 46%, #9a45b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 12px rgba(255, 255, 255, 0.75));
}

.entry__lede {
  max-width: 460px;
  margin: 16px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.95;
  color: rgba(48, 34, 54, 0.92);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9), 0 0 18px rgba(255, 255, 255, 0.8);
}

.entry__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.entry__cta {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  height: 50px;
  padding: 0 26px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(115deg, var(--sakura-400) 0%, var(--sakura-500) 55%, var(--sakura-600) 100%);
  color: #fff;
  font: inherit;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  cursor: pointer;
  box-shadow:
    0 18px 34px -16px rgba(232, 84, 127, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  transition: transform 0.3s var(--ease), box-shadow 0.3s var(--ease), filter 0.3s;
}
.entry__cta svg {
  width: 17px;
  height: 17px;
  transition: transform 0.3s var(--ease);
}
.entry__cta:hover {
  transform: translateY(-2px);
  filter: saturate(1.06) brightness(1.02);
  box-shadow:
    0 24px 44px -16px rgba(232, 84, 127, 0.85),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
.entry__cta:hover svg { transform: translateX(4px); }
.entry__cta:active { transform: translateY(0) scale(0.99); }

.entry__ghost {
  height: 50px;
  padding: 0 20px;
  border: 1px solid rgba(90, 62, 88, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.46);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  color: #4a3750;
  font: inherit;
  font-size: 12px;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.3s, border-color 0.3s, transform 0.3s var(--ease);
}
.entry__ghost:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(90, 62, 88, 0.34);
}
.entry__cta:disabled,
.entry__ghost:disabled { cursor: default; opacity: 0.92; }

.entry__hint {
  margin: 14px 0 0;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(52, 38, 58, 0.8);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
}
.entry__hint kbd {
  padding: 1px 7px;
  border: 1px solid rgba(90, 62, 88, 0.2);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.55);
  font-family: var(--font-body);
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: rgba(70, 50, 74, 0.7);
}

/* ---------- 左下角铭牌：压在草坡上，所以用白字 + 阴影 ---------- */
.entry__meta {
  position: absolute;
  z-index: 4;
  left: 44px;
  bottom: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 8px 15px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  box-shadow: 0 10px 26px -18px rgba(120, 70, 95, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  color: rgba(58, 42, 62, 0.78);
  animation: entry-fade 1.2s var(--ease) 0.9s both;
}
.entry__meta i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

/* ---------- 入场 / 出门动画 ---------- */
@keyframes entry-rise {
  from { opacity: 0; transform: translateY(14px); }
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
  background: radial-gradient(72% 72% at 50% 40%, #fffdfb 0%, #fff1ea 52%, #ffe3e8 100%);
  /* ease-in：前半段几乎看不出来，最后 200ms 才迅速亮满，切换藏在最后一帧 */
  transition: opacity 0.82s cubic-bezier(.55, 0, .85, .35);
}
.entry.is-leaving .entry__flash { opacity: 1; }
.entry.is-leaving .entry__media { filter: brightness(1.06) saturate(1.04); }
/* 推镜是 animation，出门时要先关掉它，transform 才会听 transition 的 */
.entry.is-leaving .entry__photo {
  animation: none;
  transform: scale(1.1);
  transition: transform 0.9s var(--ease);
}
.entry.is-leaving .entry__copy,
.entry.is-leaving .entry__top,
.entry.is-leaving .entry__meta {
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.4s ease, transform 0.55s var(--ease);
}
.entry.is-leaving .entry__cta { pointer-events: none; }

/* ---------- 窄窗口：只做桌面端，这里仅把排版收紧一点 ---------- */
@media (max-width: 1180px) {
  .entry__copy { left: 44%; width: min(440px, 50vw); top: 22%; }
  .entry__title { font-size: clamp(30px, 3.4vw, 42px); }
}
@media (max-width: 900px) {
  .entry__top { padding: 22px 26px; }
  .entry__copy {
    left: 28px;
    right: 28px;
    top: auto;
    bottom: 92px;
    width: auto;
    max-width: 520px;
    padding: 20px 22px;
    border-radius: 18px;
    background: rgba(255, 253, 252, 0.72);
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    box-shadow: 0 18px 40px -26px rgba(120, 70, 95, 0.5);
  }
  .entry__meta { left: 26px; bottom: 28px; }
}

/* 动效关闭：保留画面，不做推镜与呼吸 */
html.no-motion .entry__photo,
html.no-motion .entry__glow,
html.no-motion .userchip__dot,
html.no-motion .entry__copy,
html.no-motion .entry__copy > *,
html.no-motion .entry__hint,
html.no-motion .entry__top,
html.no-motion .entry__meta {
  animation: none !important;
}
html.no-motion .entry__photo { opacity: 1; transform: none; }
</style>
