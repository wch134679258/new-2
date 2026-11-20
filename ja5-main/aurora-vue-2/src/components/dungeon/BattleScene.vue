<template>
  <!--
    战斗场景：一块地、两个影子、一只怪、一个人。
    之前面板里只有名字和血条 —— 这一版把「谁在打谁」画出来。
  -->
  <div class="bscene" :class="{ 'is-entering': entering, 'is-boss': foe.boss }">
    <div class="bscene__bg" aria-hidden="true">
      <span class="bscene__pool"></span>
      <!-- 远景：两层樱树剪影 + 地平线，画面才有纵深，不然就是一块灰卡片 -->
      <svg class="bscene__far" viewBox="0 0 480 322" preserveAspectRatio="xMidYMax slice">
        <g class="far__band">
          <ellipse v-for="(t, i) in farTrees" :key="`ft${i}`" :cx="t[0]" :cy="t[1]" :rx="t[2]" :ry="t[3]" />
        </g>
        <path class="far__horizon" d="M0 214q120 -18 240 -4t240 2" />
      </svg>
      <span class="bscene__petals">
        <i v-for="(p, i) in driftPetals" :key="`dp${i}`"
           :style="{ left: p.x + '%', animationDelay: p.d + 's', animationDuration: p.t + 's', opacity: p.o }"></i>
      </span>
      <span class="bscene__vig"></span>
    </div>

    <!-- 地面：椭圆台 + 一圈淡光，两个人的影子和它对齐 -->
    <div class="bscene__ground" aria-hidden="true">
      <span class="bscene__disc"></span>
      <span class="bscene__ring"></span>
    </div>

    <!-- ---------- 怪物 ---------- -->
    <div class="bscene__foe" :class="`is-${foeState || 'idle'}`">
      <div class="bscene__foe-hp">
        <span class="bscene__foe-name">{{ foe.name }}</span>
        <span class="bscene__foe-num">{{ Math.max(0, foeHp) }}<i>/{{ foe.hp }}</i></span>
        <span class="bscene__foe-bar"><i :style="{ width: foePercent + '%', background: foe.color }"></i></span>
      </div>
      <div class="bscene__shadow bscene__shadow--foe"></div>
      <FoeSprite
        class="bscene__sprite"
        :foe="foe.key"
        :color="foe.color"
        :label="foe.name"
        :state="foeState || 'idle'"
        :dead="foeState === 'dead'"
      />
      <!-- 散了之后原地留一摊花瓣，别让怪物位置变成一块空地 -->
      <div v-if="foeState === 'dead'" class="bscene__ashes" aria-hidden="true">
        <i v-for="(a, i) in deathPetals" :key="`da${i}`"
           :style="{ left: a.x + '%', top: a.y + '%', transform: `rotate(${a.r}deg)`, animationDelay: a.d + 's', background: a.c }"></i>
      </div>
      <!-- 斩击弧线：dashoffset 从 0 描到全长，只在 slashKey 变化时重播 -->
      <svg v-if="slashKey" :key="slashKey" class="bscene__slash" viewBox="0 0 200 200" aria-hidden="true">
        <path class="slash__a" d="M28 158C52 108 108 60 176 44" />
        <path class="slash__b" d="M34 44C86 62 132 104 168 156" />
      </svg>
    </div>

    <!-- ---------- 玩家 ---------- -->
    <div class="bscene__me" :class="`is-${meState || 'idle'}`">
      <div class="bscene__shadow bscene__shadow--me"></div>
      <svg class="bscene__hero" viewBox="0 0 120 160" aria-hidden="true">
        <defs>
          <linearGradient id="heroHaori" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fbe6ea" />
            <stop offset="100%" stop-color="#e2919f" />
          </linearGradient>
        </defs>
        <g class="hero__legs">
          <rect x="52" y="112" width="8" height="34" rx="4" fill="#6d5568" />
          <rect x="64" y="112" width="8" height="34" rx="4" fill="#7d6478" />
        </g>
        <g class="hero__body">
          <path d="M44 70q16 -10 32 0q8 24 4 46q-20 8 -40 0q-4 -24 4 -46Z" fill="url(#heroHaori)" />
          <path d="M60 72v42" stroke="#fff" stroke-width="2.4" opacity=".75" />
          <path d="M48 116q12 4 24 0" stroke="#d9788c" stroke-width="3" stroke-linecap="round" opacity=".8" />
        </g>
        <g class="hero__arm">
          <path d="M46 78q-12 12 -10 26" fill="none" stroke="#f3cdd6" stroke-width="8" stroke-linecap="round" />
          <circle cx="37" cy="106" r="4.6" fill="#ffe3d2" />
        </g>
        <g class="hero__head">
          <circle cx="60" cy="48" r="19" fill="#ffe3d2" />
          <path d="M41 46q4 -22 19 -22q16 0 19 22q-8 -8 -19 -8q-11 0 -19 8Z" fill="#584152" />
          <circle cx="74" cy="34" r="7" fill="#584152" />
          <circle cx="74" cy="34" r="3" fill="#f9b8cd" opacity=".9" />
        </g>
        <g class="hero__sword">
          <path d="M84 44l8 4 -30 62 -6 -3Z" fill="#f7f2fa" opacity=".95" />
          <path d="M84 44l8 4 -30 62 -6 -3Z" fill="none" stroke="#d9cbe4" stroke-width="1" />
          <path d="M52 104l10 6" stroke="#7d6478" stroke-width="5" stroke-linecap="round" />
        </g>
        <!-- 凝神：身上一圈缓慢旋转的虚线环 -->
        <ellipse v-if="buff" class="hero__buff" cx="60" cy="96" rx="46" ry="20" />
      </svg>
    </div>

    <!-- ---------- 飘字：DOM 绝对定位，比在 SVG 里算坐标简单可靠 ---------- -->
    <TransitionGroup name="pop" tag="div" class="bscene__pops" aria-live="polite">
      <span
        v-for="p in pops"
        :key="p.id"
        class="pop"
        :class="[`pop--${p.target}`, `is-${p.kind}`]"
      >{{ p.text }}</span>
    </TransitionGroup>

    <!-- ---------- 玩家状态条 ---------- -->
    <div class="bscene__me-hp">
      <span class="bscene__me-tag">{{ buff ? '凝神 · 下一击必暴' : '你' }}</span>
      <span class="bscene__me-num">{{ Math.max(0, hp) }}<i>/{{ maxHp }}</i></span>
      <span class="bscene__me-bar"><i :style="{ width: hpPercent + '%' }"></i></span>
    </div>
  </div>
</template>

<script setup>
import FoeSprite from './FoeSprite.vue'

/* 远景剪影：固定的一排，别每次重排 */
const farTrees = [
  [26, 196, 34, 20], [78, 188, 26, 16], [132, 198, 40, 22], [196, 190, 22, 14],
  [258, 196, 36, 20], [318, 186, 26, 15], [372, 198, 42, 22], [440, 190, 28, 16]
]
const driftPetals = Array.from({ length: 9 }, (_, i) => ({
  x: 6 + (i * 11.3) % 88,
  d: -(i % 5) * 1.6,
  t: 9 + (i % 4) * 2.4,
  o: 0.3 + (i % 3) * 0.16
}))
const deathPetals = Array.from({ length: 14 }, (_, i) => ({
  x: 22 + (i * 13) % 56,
  y: 52 + (i % 3) * 12,
  r: (i * 47) % 180,
  d: (i % 5) * 0.12,
  c: i % 3 ? '#f9b8cd' : '#ffe0ea'
}))

defineProps({
  foe: { type: Object, required: true },
  foeHp: { type: Number, default: 0 },
  foePercent: { type: Number, default: 0 },
  hp: { type: Number, default: 0 },
  maxHp: { type: Number, default: 100 },
  hpPercent: { type: Number, default: 100 },
  buff: { type: Boolean, default: false },
  /** '' | 'hit' | 'crit' | 'dead' */
  foeState: { type: String, default: '' },
  /** '' | 'hit' | 'attack' */
  meState: { type: String, default: '' },
  /** 每次出手 +1，用来重播斩击弧线 */
  slashKey: { type: Number, default: 0 },
  entering: { type: Boolean, default: false },
  pops: { type: Array, default: () => [] }
})
</script>

<style scoped>
.bscene {
  position: relative;
  height: 322px;
  margin: 4px 0 14px;
  border-radius: 20px;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(120% 92% at 50% 112%, #fdf0f7 0%, #f2dcec 40%, #e2c6dd 72%, #cdadd0 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .7), inset 0 -26px 40px -30px rgba(96, 54, 90, .5);
}

/* 远处的一团雾光 */
.bscene__bg { position: absolute; inset: 0; pointer-events: none; }
.bscene__pool {
  position: absolute;
  left: 50%;
  top: 24%;
  width: 78%;
  aspect-ratio: 2.2;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 245, 252, .85), rgba(255, 235, 248, 0) 68%);
  filter: blur(6px);
}

/* 远景剪影 + 地平线 */
.bscene__far {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: .62;
}
.far__band ellipse { fill: #c08fba; }
.far__band ellipse:nth-child(2n) { fill: #b480ae; }
.far__horizon { fill: none; stroke: #a8779f; stroke-width: 2; opacity: .55; }

/* 场景里飘的几片花瓣：不动就还是张静图 */
.bscene__petals { position: absolute; inset: 0; pointer-events: none; }
.bscene__petals i {
  position: absolute;
  top: -12px;
  width: 7px;
  height: 5px;
  border-radius: 60% 40% 60% 40%;
  background: #ffd6e4;
  animation: drift-fall linear infinite;
}
@keyframes drift-fall {
  0% { transform: translate(0, 0) rotate(0); }
  100% { transform: translate(-26px, 340px) rotate(220deg); }
}

/* 四角压暗，视线才落到两个人身上 */
.bscene__vig {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 95% at 50% 52%, rgba(120, 70, 110, 0) 46%, rgba(110, 62, 100, .26) 100%);
}

/* 怪物散了以后，地上剩一摊花瓣 */
.bscene__ashes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.bscene__ashes i {
  position: absolute;
  width: 8px;
  height: 6px;
  border-radius: 60% 40% 60% 40%;
  animation: ash-settle 1.6s ease-out forwards;
}
@keyframes ash-settle {
  0% { opacity: 0; filter: blur(1px); }
  30% { opacity: .95; }
  100% { opacity: .28; filter: blur(.4px); }
}

/* 地面：一块椭圆台 + 一道虚线环 */
.bscene__ground {
  position: absolute;
  left: 50%;
  bottom: 26px;
  width: 86%;
  height: 132px;
  transform: translateX(-50%);
  pointer-events: none;
}
.bscene__disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(ellipse at 50% 38%, rgba(255, 252, 254, .98), rgba(240, 214, 236, .8) 54%, rgba(206, 174, 210, 0) 80%);
}
.bscene__ring {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 12%;
  bottom: 8%;
  border-radius: 50%;
  border: 1.5px dashed rgba(168, 116, 158, .42);
}

/* 影子：跟着受击一起抖（放在 sprite 外面，才不会被它的 transform 带走） */
.bscene__shadow {
  position: absolute;
  left: 50%;
  bottom: 4px;
  width: 118px;
  height: 26px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(90, 56, 88, .34), rgba(90, 56, 88, 0) 70%);
  transition: transform .22s var(--ease, ease), opacity .22s;
}

/* ---------- 怪物位 ---------- */
.bscene__foe {
  position: absolute;
  right: 6%;
  bottom: 34px;
  width: 212px;
  height: 212px;
}
.bscene.is-boss .bscene__foe { width: 250px; height: 250px; right: 4%; }

.bscene__sprite { width: 100%; height: 100%; }

.bscene__foe.is-hit { animation: foe-nudge .24s ease-out; }
.bscene__foe.is-crit { animation: foe-nudge-big .34s ease-out; }
.bscene__foe.is-hit .bscene__shadow { transform: translateX(-50%) scaleX(1.12); opacity: .8; }
.bscene__foe.is-crit .bscene__shadow { transform: translateX(-50%) scaleX(1.3) scaleY(.86); opacity: .9; }
.bscene__foe.is-dead { animation: none; }
/* 怪散了，头顶血条也跟着退场，别留一个 0/44 悬在空中 */
.bscene__foe.is-dead .bscene__foe-hp {
  opacity: 0;
  transform: translate(-50%, -8px);
  transition: opacity .3s var(--ease, ease), transform .3s var(--ease, ease);
}
.bscene__foe.is-dead .bscene__shadow { opacity: 0; transform: translateX(-50%) scale(.6); }

/* 怪物出手：先朝玩家那侧扑一下 */
.bscene__foe.is-attack { animation: foe-lunge .3s cubic-bezier(.3, 1.3, .4, 1); }
@keyframes foe-lunge {
  0% { transform: translateX(0) scale(1); }
  40% { transform: translateX(-26px) scale(1.04); }
  100% { transform: translateX(0) scale(1); }
}

@keyframes foe-nudge {
  0% { transform: translateX(0); }
  40% { transform: translateX(7px); }
  100% { transform: translateX(0); }
}
@keyframes foe-nudge-big {
  0% { transform: translateX(0) rotate(0); }
  26% { transform: translateX(15px) rotate(2.4deg); }
  64% { transform: translateX(-4px) rotate(-1deg); }
  100% { transform: translateX(0) rotate(0); }
}

/* 怪物头顶血条 */
.bscene__foe-hp {
  position: absolute;
  left: 50%;
  top: -6px;
  width: 168px;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 2px 6px;
  padding: 5px 9px;
  border-radius: 11px;
  background: rgba(255, 252, 254, .78);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 18px -14px rgba(88, 50, 84, .9);
}
.bscene__foe-name { font-size: 11px; font-weight: 600; color: #6b4560; white-space: nowrap; }
.bscene__foe-num { font-size: 10px; color: #9b7c94; font-variant-numeric: tabular-nums; }
.bscene__foe-num i { font-style: normal; opacity: .6; }
.bscene__foe-bar {
  grid-column: 1 / -1;
  height: 4px;
  border-radius: 99px;
  background: rgba(150, 110, 132, .22);
  overflow: hidden;
}
.bscene__foe-bar i { display: block; height: 100%; border-radius: 99px; transition: width .4s var(--ease, ease); }

/* ---------- 玩家位 ---------- */
.bscene__me {
  position: absolute;
  left: 8%;
  bottom: 30px;
  width: 148px;
  height: 198px;
}
.bscene__hero { width: 100%; height: 100%; overflow: visible; }
.bscene__me .bscene__shadow { width: 92px; height: 20px; bottom: 0; }

.bscene__me.is-attack { animation: hero-lunge .28s cubic-bezier(.3, 1.4, .4, 1); }
.bscene__me.is-hit { animation: hero-hurt .34s ease-out; }
@keyframes hero-lunge {
  0% { transform: translateX(0) rotate(0); }
  38% { transform: translateX(34px) rotate(-4deg); }
  100% { transform: translateX(0) rotate(0); }
}
@keyframes hero-hurt {
  0% { transform: translateX(0); filter: none; }
  30% { transform: translateX(-12px); filter: brightness(1.8); }
  100% { transform: translateX(0); filter: none; }
}

.hero__sword { transform-box: fill-box; transform-origin: 90% 90%; }
.is-attack .hero__sword { animation: sword-swing .28s ease-out; }
@keyframes sword-swing {
  0% { transform: rotate(0); }
  40% { transform: rotate(-64deg); }
  100% { transform: rotate(0); }
}
.hero__body { transform-box: fill-box; transform-origin: 50% 100%; animation: hero-breathe 4s ease-in-out infinite; }
@keyframes hero-breathe {
  0%, 100% { transform: scale(1, 1); }
  50% { transform: scale(1.012, .99); }
}
.hero__head { transform-box: fill-box; transform-origin: 50% 90%; animation: hero-bob 4.6s ease-in-out infinite; }
@keyframes hero-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1.6px); }
}
/* 凝神环 */
.hero__buff {
  fill: none;
  stroke: #ffd59a;
  stroke-width: 1.6;
  stroke-dasharray: 5 7;
  transform-box: fill-box;
  transform-origin: center;
  animation: buff-spin 6s linear infinite;
  filter: drop-shadow(0 0 4px rgba(255, 196, 120, .9));
}
@keyframes buff-spin { to { transform: rotate(360deg); } }

/* ---------- 斩击弧线 ---------- */
.bscene__slash {
  position: absolute;
  inset: -18% -8% -6% -30%;
  width: 138%;
  height: 124%;
  pointer-events: none;
  overflow: visible;
}
.slash__a, .slash__b {
  fill: none;
  stroke: #fff;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 240;
  stroke-dashoffset: 240;
  filter: drop-shadow(0 0 6px rgba(255, 214, 232, .95));
  animation: slash-draw .22s ease-out forwards;
}
.slash__b { animation-delay: .04s; stroke-width: 3.4; opacity: .85; }
@keyframes slash-draw {
  0% { stroke-dashoffset: 240; opacity: 0; }
  30% { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}

/* ---------- 飘字 ---------- */
.bscene__pops { position: absolute; inset: 0; pointer-events: none; }
.pop {
  position: absolute;
  padding: 1px 9px 2px;
  border-radius: 999px;
  font-family: var(--font-serif);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: .02em;
  color: #fff;
  white-space: nowrap;
  background: rgba(104, 48, 78, .78);
  box-shadow: 0 6px 14px -8px rgba(80, 30, 60, .9);
  animation: pop-rise .7s cubic-bezier(.2, .9, .3, 1) forwards;
}
.pop--foe { left: 62%; bottom: 138px; }
.pop--me { left: 15%; bottom: 126px; }
.pop.is-crit {
  font-size: 26px;
  padding: 2px 12px 3px;
  background: linear-gradient(180deg, #ef6d8d, #d33c58);
  box-shadow: 0 8px 18px -8px rgba(200, 50, 80, .95);
}
.pop.is-hit { font-size: 18px; }
.pop.is-heal { background: linear-gradient(180deg, #63c39c, #3c9c78); }
.pop.is-miss { font-size: 13px; letter-spacing: .12em; background: rgba(110, 88, 120, .7); }
@keyframes pop-rise {
  0% { transform: translate(-50%, 6px) scale(.7); opacity: 0; }
  22% { transform: translate(-50%, -6px) scale(1.08); opacity: 1; }
  100% { transform: translate(-50%, -42px) scale(.94); opacity: 0; }
}
.pop-enter-active, .pop-leave-active { transition: none; }

/* ---------- 玩家状态条 ---------- */
.bscene__me-hp {
  position: absolute;
  left: 6%;
  bottom: 12px;
  width: 190px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 2px 8px;
}
.bscene__me-tag { font-size: 10px; letter-spacing: .1em; color: #7d5f75; }
.bscene__me-num { font-size: 10px; color: #9b7c94; font-variant-numeric: tabular-nums; }
.bscene__me-num i { font-style: normal; opacity: .6; }
.bscene__me-bar {
  grid-column: 1 / -1;
  height: 4px;
  border-radius: 99px;
  background: rgba(150, 110, 132, .22);
  overflow: hidden;
}
.bscene__me-bar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #f9749f, #ffb3c6);
  transition: width .4s var(--ease, ease);
}

/* ---------- 入场：场景压暗 → 双方从两侧滑入 ---------- */
.bscene.is-entering .bscene__foe { animation: foe-enter .44s cubic-bezier(.2, .9, .3, 1) both; }
.bscene.is-entering .bscene__me { animation: me-enter .44s cubic-bezier(.2, .9, .3, 1) both; }
.bscene.is-entering::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 50%, rgba(255, 240, 248, 0), rgba(120, 80, 120, .28));
  animation: scene-flash .44s ease-out forwards;
}
@keyframes foe-enter {
  0% { transform: translate(46px, 8px) scale(.9); opacity: 0; }
  100% { transform: translate(0, 0) scale(1); opacity: 1; }
}
@keyframes me-enter {
  0% { transform: translate(-46px, 8px) scale(.94); opacity: 0; }
  100% { transform: translate(0, 0) scale(1); opacity: 1; }
}
@keyframes scene-flash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@media (max-width: 720px) {
  .bscene { height: 270px; }
  .bscene__foe { width: 168px; height: 168px; right: 2%; }
  .bscene__me { width: 118px; height: 158px; left: 2%; }
  .bscene__foe-hp { width: 132px; }
}
</style>
