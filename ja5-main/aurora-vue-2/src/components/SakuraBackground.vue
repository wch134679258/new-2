<template>
  <div class="scene" :class="{ 'scene--night': night }" aria-hidden="true">
    <!-- 天光：淡粉紫渐变 + 右上一轮暖日 -->
    <div class="scene__sky"></div>

    <!-- 太阳本体：极柔的大光斑，不做实心圆 -->
    <div class="scene__sun"></div>

    <!-- 丁达尔光：从右上斜入的三道光束，缓慢呼吸 -->
    <div class="rays">
      <i class="ray ray--1"></i>
      <i class="ray ray--2"></i>
      <i class="ray ray--3"></i>
      <i class="ray ray--4"></i>
    </div>

    <!-- 高空薄云：用长椭圆 + 大模糊，像水彩抹开 -->
    <div class="cloud cloud--a"></div>
    <div class="cloud cloud--b"></div>
    <div class="cloud cloud--c"></div>

    <!-- 散景 bokeh：远处失焦的光斑，轻微浮动，营造空气感 -->
    <div class="bokeh">
      <i v-for="b in bokehList" :key="b.id" class="bk" :style="b.style"></i>
    </div>

    <!-- 远山：几乎融入空气，只留一层轮廓 -->
    <svg class="scene__hills" viewBox="0 0 1440 420" preserveAspectRatio="none">
      <path class="hill hill--3" d="M0,250 C120,206 208,236 300,214 C392,192 452,150 560,168 C668,186 720,222 812,206 C904,190 964,140 1072,158 C1180,176 1252,224 1340,208 C1396,198 1420,206 1440,200 L1440,420 L0,420 Z" />
      <path class="hill hill--2" d="M0,300 C96,272 176,300 268,282 C360,264 404,222 512,240 C620,258 668,300 764,290 C860,280 916,238 1016,252 C1116,266 1176,306 1268,298 C1340,292 1392,308 1440,300 L1440,420 L0,420 Z" />
      <path class="hill hill--1" d="M0,352 C110,330 190,356 296,344 C402,332 470,300 576,314 C682,328 748,362 848,356 C948,350 1012,316 1112,326 C1212,336 1300,364 1440,352 L1440,420 L0,420 Z" />
    </svg>

    <!-- 鸟居：远景剪影，融在雾里 -->
    <svg class="scene__torii" viewBox="0 0 420 340">
      <g class="torii__body">
        <path d="M22 60 Q210 36 398 60 L392 78 Q210 54 28 78 Z" />
        <rect x="46" y="78" width="328" height="20" rx="4" />
        <rect x="186" y="96" width="48" height="44" rx="3" />
        <rect x="62" y="140" width="296" height="17" rx="3" />
        <path d="M96 98 L128 98 L142 336 L106 336 Z" />
        <path d="M292 98 L324 98 L314 336 L278 336 Z" />
        <rect x="98" y="318" width="46" height="18" rx="3" />
        <rect x="276" y="318" width="46" height="18" rx="3" />
      </g>
    </svg>

    <!-- 近景樱花枝：只留一枝，避免画面太满 -->
    <svg class="scene__branch scene__branch--r" viewBox="0 0 520 320">
      <g class="branch__wood">
        <path d="M520 8 C440 26 386 60 330 96 C300 116 268 138 236 174" />
        <path d="M392 62 C360 46 328 40 288 44" />
        <path d="M300 112 C282 92 276 70 278 44" />
        <path d="M240 170 C214 178 186 196 168 222" />
      </g>
      <g class="branch__blossoms">
        <g transform="translate(70,36) scale(1.25)"><circle r="7" class="b1" /><circle r="5.2" cx="11" cy="6" class="b2" /><circle r="4.4" cx="-9" cy="8" class="b3" /><circle r="3.4" cx="4" cy="-10" class="b2" /></g>
        <g transform="translate(150,68) scale(1)"><circle r="6" class="b2" /><circle r="4.6" cx="9" cy="5" class="b1" /><circle r="3.8" cx="-8" cy="6" class="b3" /></g>
        <g transform="translate(232,96) scale(1.15)"><circle r="7" class="b3" /><circle r="5" cx="10" cy="-4" class="b1" /><circle r="4" cx="-7" cy="-7" class="b2" /><circle r="3.2" cx="-2" cy="9" class="b1" /></g>
        <g transform="translate(316,128) scale(.95)"><circle r="6" class="b1" /><circle r="4.4" cx="-9" cy="4" class="b3" /><circle r="3.6" cx="8" cy="7" class="b2" /></g>
        <g transform="translate(392,182) scale(1.1)"><circle r="6.6" class="b2" /><circle r="4.8" cx="10" cy="5" class="b3" /><circle r="4" cx="-9" cy="-5" class="b1" /></g>
        <g transform="translate(456,236) scale(.85)"><circle r="5.6" class="b3" /><circle r="4" cx="9" cy="-3" class="b2" /></g>
        <g transform="translate(104,104) scale(.8)"><circle r="5.2" class="b1" /><circle r="3.8" cx="8" cy="5" class="b2" /></g>
        <g transform="translate(200,64) scale(.75)"><circle r="4.8" class="b2" /><circle r="3.4" cx="-7" cy="4" class="b3" /></g>
      </g>
    </svg>

    <!-- 底部空气雾：把远山与鸟居的下半部溶掉 -->
    <div class="scene__mist"></div>

    <!-- 顶层柔光：整屏一层极淡的粉紫滤光，统一色调 -->
    <div class="scene__veil"></div>
  </div>
</template>

<script setup>
/**
 * 新海诚式背景场景（纯 CSS/SVG，无位图）
 *  关键词：柔光、空气透视、丁达尔、散景。
 *  注意「少即是多」：光斑与光束都很淡，叠加才有质感，而不是堆颜色。
 */
import { computed } from 'vue'

const props = defineProps({
  night: { type: Boolean, default: false }
})

/** 散景光斑：位置/大小/色相随机但固定，避免每次渲染跳动 */
const bokehList = computed(() => {
  const out = []
  const n = props.night ? 12 : 9
  for (let i = 0; i < n; i++) {
    // 用确定性的伪随机（基于 i），保证热更新时不闪
    const r = (s) => {
      const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    const size = 26 + r(1) * 120
    const hue = ['rgba(255,214,232,.5)', 'rgba(255,240,222,.5)', 'rgba(226,214,255,.45)', 'rgba(255,255,255,.6)'][(r(2) * 4) | 0]
    out.push({
      id: i,
      style: {
        left: (r(3) * 100).toFixed(2) + '%',
        top: (r(4) * 92).toFixed(2) + '%',
        width: size.toFixed(1) + 'px',
        height: size.toFixed(1) + 'px',
        '--c': hue,
        '--dur': (14 + r(5) * 16).toFixed(1) + 's',
        '--delay': (-r(6) * 20).toFixed(1) + 's',
        '--amp': (10 + r(7) * 26).toFixed(1) + 'px',
        opacity: (0.16 + r(8) * 0.24).toFixed(2)
      }
    })
  }
  return out
})
</script>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;

  /* 晨樱配色：低饱和的粉、白、薰衣草紫 */
  --sky-a: #fdf8fb;
  --sky-b: #faf1f7;
  --sky-c: #f3e9f4;
  --sun-core: rgba(255, 248, 236, .95);
  --sun-halo: rgba(255, 226, 234, .55);
  --sun-spill: rgba(232, 206, 248, .35);
  --ray: rgba(255, 250, 240, .55);
  --hill-1: #efdbe6;
  --hill-2: #e3c8db;
  --hill-3: #d4b8d0;
  --torii: #d2879f;
  --torii-2: #bd7490;
  --wood: #8a5d70;
  --bl1: #ffe4ee;
  --bl2: #ffd2e3;
  --bl3: #ffc0d6;
  --mist: rgba(250, 243, 249, .95);
}

/* ---------- 夜色：登录页 ---------- */
.scene--night {
  --sky-a: #2a1f36;
  --sky-b: #3c2742;
  --sky-c: #4d2c4a;
  --sun-core: rgba(255, 236, 246, .5);
  --sun-halo: rgba(210, 180, 255, .28);
  --sun-spill: rgba(150, 180, 255, .18);
  --ray: rgba(240, 226, 255, .16);
  --hill-1: #4d2d4c;
  --hill-2: #3f2540;
  --hill-3: #321d33;
  --torii: #7e3a58;
  --torii-2: #622a45;
  --wood: #2c1a26;
  --bl1: #ffb3cc;
  --bl2: #f594b4;
  --bl3: #dd7b9e;
  --mist: rgba(60, 39, 66, .9);
}

/* ---------- 天光 ---------- */
.scene__sky {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(100% 70% at 74% 4%, var(--sun-spill), transparent 68%),
    radial-gradient(80% 60% at 6% 92%, rgba(226, 214, 255, .35), transparent 70%),
    linear-gradient(176deg, var(--sky-a) 0%, var(--sky-b) 52%, var(--sky-c) 100%);
}

/* ---------- 太阳：只有光，没有轮廓 ---------- */
.scene__sun {
  position: absolute;
  top: -10%;
  right: 4%;
  width: 62vmin;
  height: 62vmin;
  border-radius: 50%;
  background: radial-gradient(circle,
    var(--sun-core) 0%,
    var(--sun-halo) 26%,
    transparent 64%);
  filter: blur(10px);
  animation: sunBreathe 16s ease-in-out infinite;
}
@keyframes sunBreathe {
  0%, 100% { transform: scale(1); opacity: .9; }
  50% { transform: scale(1.06); opacity: 1; }
}

/* ---------- 丁达尔光束 ---------- */
.rays {
  position: absolute;
  top: -12vh;
  right: -4vw;
  width: 78vw;
  height: 120vh;
  transform: rotate(24deg);
  transform-origin: 80% 0;
  /* GPU 合成层，不参与主线程布局 */
  contain: paint;
}
.ray {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 999px;
  /* 线性光带 + 两端渐隐，模拟空气中的光路 */
  background: linear-gradient(180deg,
    transparent 0%,
    var(--ray) 18%,
    var(--ray) 62%,
    transparent 100%);
  filter: blur(22px);
  mix-blend-mode: screen;
  opacity: 0;
  animation: rayBreathe 18s ease-in-out infinite;
}
.ray--1 { right: 6%; width: 9vw; animation-delay: 0s; }
.ray--2 { right: 26%; width: 4.5vw; filter: blur(16px); animation-delay: 4s; }
.ray--3 { right: 44%; width: 12vw; filter: blur(30px); animation-delay: 8s; }
.ray--4 { right: 66%; width: 3vw; filter: blur(14px); animation-delay: 12s; }
@keyframes rayBreathe {
  0%, 100% { opacity: .12; transform: translateX(0); }
  50% { opacity: .42; transform: translateX(-2.4vw); }
}

/* ---------- 高空薄云 ---------- */
.cloud {
  position: absolute;
  border-radius: 100px;
  background: radial-gradient(closest-side, rgba(255, 255, 255, .85), rgba(255, 255, 255, 0));
  filter: blur(14px);
  opacity: .8;
}
.scene--night .cloud { background: radial-gradient(closest-side, rgba(226, 200, 255, .16), rgba(226, 200, 255, 0)); }
.cloud--a { top: 12%; left: -22%; width: 46vw; height: 9vh; animation: drift 120s linear infinite; }
.cloud--b { top: 30%; left: -36%; width: 34vw; height: 6vh; opacity: .55; animation: drift 160s linear infinite 14s; }
.cloud--c { top: 4%; left: -54%; width: 58vw; height: 11vh; opacity: .45; animation: drift 200s linear infinite 46s; }
@keyframes drift {
  from { transform: translateX(0); }
  to { transform: translateX(210vw); }
}

/* ---------- 散景 bokeh：空气里失焦的光 ---------- */
.bokeh { position: absolute; inset: 0; }
.bk {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, var(--c) 0%, var(--c) 22%, transparent 70%);
  filter: blur(9px);
  animation: bkFloat var(--dur) ease-in-out var(--delay) infinite;
  will-change: transform;
}
@keyframes bkFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(var(--amp), calc(var(--amp) * -.6)) scale(1.06); }
  66% { transform: translate(calc(var(--amp) * -.5), var(--amp)) scale(.96); }
}

/* ---------- 远山：只留空气透视 ---------- */
.scene__hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 44vh;
  min-height: 280px;
  display: block;
}
.hill { transition: fill .8s var(--ease); }
.hill--3 { fill: var(--hill-3); opacity: .3; }
.hill--2 { fill: var(--hill-2); opacity: .45; }
.hill--1 { fill: var(--hill-1); opacity: .68; }

/* ---------- 鸟居：远景剪影 ---------- */
.scene__torii {
  position: absolute;
  right: 8%;
  bottom: 8vh;
  width: clamp(180px, 22vw, 340px);
  height: auto;
  opacity: .5;
  filter: blur(.4px) drop-shadow(0 20px 34px rgba(190, 110, 150, .16));
}
.torii__body path,
.torii__body rect {
  fill: var(--torii);
  transition: fill .8s var(--ease);
}
.torii__body path:nth-of-type(2),
.torii__body path:nth-of-type(3) { fill: var(--torii-2); }

/* ---------- 樱花枝 ---------- */
.scene__branch {
  position: absolute;
  height: auto;
  transform-origin: 100% 0;
  animation: sway 13s ease-in-out infinite;
}
.scene__branch--r {
  top: -5vh;
  right: -6vw;
  width: clamp(260px, 30vw, 500px);
  opacity: .85;
}
@keyframes sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(1.4deg); }
}
.branch__wood path {
  fill: none;
  stroke: var(--wood);
  stroke-width: 5;
  stroke-linecap: round;
  opacity: .55;
  transition: stroke .8s var(--ease);
}
.branch__blossoms circle { transition: fill .8s var(--ease); }
.b1 { fill: var(--bl1); }
.b2 { fill: var(--bl2); }
.b3 { fill: var(--bl3); }

/* ---------- 地面雾 ---------- */
.scene__mist {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30vh;
  background: linear-gradient(0deg, var(--mist), transparent);
}

/* ---------- 顶层柔光：统一色调，像镜头上的一层薄雾 ---------- */
.scene__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 90% at 50% 40%, transparent 40%, rgba(255, 226, 240, .18) 100%),
    linear-gradient(200deg, rgba(255, 255, 255, .16), transparent 40%);
}

/* ---------- 动效关闭态：只留静态天光（见 composables/useMotion.js） ---------- */
html.no-motion .ray,
html.no-motion .bk,
html.no-motion .cloud,
html.no-motion .scene__sun,
html.no-motion .scene__branch { animation: none !important; }
html.no-motion .ray { opacity: .2; }

@media (max-width: 900px) {
  .scene__torii { right: 2%; bottom: 9vh; width: 44vw; opacity: .42; }
  .scene__branch--r { width: 60vw; right: -16vw; }
  .scene__hills { height: 32vh; }
  .ray--3, .ray--4 { display: none; }
  .rays { transform: rotate(20deg); }
}
</style>
