<template>
  <!--
    后山：日常地图的延伸。
    和小镇同一套配色与画法（2:1 斜轴、粉彩、樱树同一组渐变），
    但它是「安静的休闲点位」—— 青草、碎石小路、几棵小树，
    巨型千年樱站在最深处。走近它，才谈得上进副本。
  -->
  <div class="hill" :class="{ 'is-leaving': leaving }">
    <SiteNav :user="user" active="backhill" @go="$emit('navigate', $event)" @logout="$emit('logout')" />

    <main class="hill__stage">
      <svg class="hill__svg" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="hillSky" cx="44%" cy="26%" r="82%">
            <stop offset="0%" stop-color="#fffafc" />
            <stop offset="46%" stop-color="#fdeff5" />
            <stop offset="100%" stop-color="#e8ecf7" />
          </radialGradient>
          <linearGradient id="hillGrass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#cfe0b9" />
            <stop offset="42%" stop-color="#bcd3a4" />
            <stop offset="100%" stop-color="#9fbb8a" />
          </linearGradient>
          <linearGradient id="hillGrass2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d8e7c4" />
            <stop offset="100%" stop-color="#c2d6ab" />
          </linearGradient>
          <radialGradient id="hillCanopy" cx="36%" cy="28%" r="76%">
            <stop offset="0%" stop-color="#ffe0ea" />
            <stop offset="58%" stop-color="#f8bdd1" />
            <stop offset="100%" stop-color="#e79ab5" />
          </radialGradient>
          <radialGradient id="hillCanopyLit" cx="40%" cy="24%" r="72%">
            <stop offset="0%" stop-color="#fff4f8" />
            <stop offset="52%" stop-color="#ffd2e1" />
            <stop offset="100%" stop-color="#f3adc5" />
          </radialGradient>
          <radialGradient id="hillGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffd9e6" stop-opacity=".9" />
            <stop offset="58%" stop-color="#f0c6e2" stop-opacity=".34" />
            <stop offset="100%" stop-color="#e6c8ee" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="hillMist" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#f4eef9" stop-opacity="0" />
            <stop offset="100%" stop-color="#f6ecf7" stop-opacity=".62" />
          </linearGradient>
          <filter id="hillBlur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="hillBlurBig" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="24" />
          </filter>
        </defs>

        <!-- 天空 -->
        <rect x="0" y="0" width="1200" height="720" fill="url(#hillSky)" />

        <!-- 远山：两层，只做气氛 -->
        <path d="M-40 430 Q150 350 330 402 Q470 444 620 386 Q780 324 950 396 Q1090 452 1250 402 L1250 720 L-40 720Z"
              fill="#e6e7f2" opacity=".8" />
        <path d="M-40 474 Q180 410 380 456 Q560 498 730 442 Q900 388 1060 448 Q1160 484 1250 458 L1250 720 L-40 720Z"
              fill="#dfe8d8" opacity=".62" />

        <!-- 后山：草坡主岛 -->
        <ellipse cx="600" cy="612" rx="580" ry="150" fill="#8fa87f" opacity=".18" filter="url(#hillBlurBig)" />
        <!-- 巨樱所在的那道台地，让树站得住 -->
        <ellipse cx="440" cy="486" rx="300" ry="86" fill="url(#hillGrass2)" opacity=".95" />
        <path d="M70 552 Q140 472 320 452 Q500 432 660 440 Q840 448 1000 476
                 Q1128 500 1146 556 Q1156 632 1000 664 Q820 694 620 692 Q400 690 232 664 Q86 640 70 552Z"
              fill="url(#hillGrass)" />
        <path d="M70 552 Q86 640 232 664 Q400 690 620 692 Q820 694 1000 664 Q1156 632 1146 556
                 Q1148 604 1010 636 Q830 668 620 666 Q410 664 244 638 Q90 614 70 552Z"
              fill="#93ae7f" opacity=".5" />

        <!-- 草丛 -->
        <g stroke="#8dab78" stroke-width="1.6" fill="none" opacity=".68" stroke-linecap="round">
          <path v-for="(g, i) in grass" :key="`g${i}`" :d="g" />
        </g>

        <!-- 碎石小路：从右下角盘上台阶地 -->
        <g>
          <path :d="pathRibbon" fill="#ecdfcd" opacity=".95" />
          <path :d="pathRibbon" fill="none" stroke="#d3bfa8" stroke-width="2" opacity=".65" />
          <ellipse v-for="(s, i) in pathStones" :key="`s${i}`"
                   :cx="s[0]" :cy="s[1]" :rx="s[2]" :ry="s[3]"
                   :fill="i % 3 === 0 ? '#f6ede0' : i % 3 === 1 ? '#eaddca' : '#ded0bb'"
                   opacity=".95" />
        </g>

        <!-- 苔石 -->
        <g v-for="(r, i) in rocks" :key="`r${i}`">
          <ellipse :cx="r[0] + 4" :cy="r[1] + 5" :rx="r[2]" :ry="r[2] * 0.32" fill="#6f7d63" opacity=".18" />
          <path :d="rockPath(r)" fill="#c3c9bb" />
          <path :d="rockLitPath(r)" fill="#dbdfd2" />
          <ellipse :cx="r[0] - r[2] * 0.18" :cy="r[1] - r[2] * 0.18" :rx="r[2] * 0.4" :ry="r[2] * 0.15" fill="#a8bf92" opacity=".75" />
        </g>

        <!-- 石灯 -->
        <g v-for="(l, i) in lanterns" :key="`l${i}`">
          <ellipse :cx="l[0] + 3" :cy="l[1] + 3" rx="15" ry="6" fill="#6b4b69" opacity=".16" />
          <path :d="`M${l[0] - 6} ${l[1]} L${l[0] - 5} ${l[1] - 26} L${l[0] + 5} ${l[1] - 26} L${l[0] + 6} ${l[1]}Z`" fill="#cfc8be" />
          <path :d="`M${l[0] - 5} ${l[1] - 26} L${l[0] - 12} ${l[1] - 34} L${l[0] + 12} ${l[1] - 34} L${l[0] + 5} ${l[1] - 26}Z`" fill="#e2dcd0" />
          <rect :x="l[0] - 8" :y="l[1] - 44" width="16" height="11" rx="3" fill="#ffe3b4" />
          <path :d="`M${l[0] - 12} ${l[1] - 44} L${l[0]} ${l[1] - 52} L${l[0] + 12} ${l[1] - 44}Z`" fill="#b7aaa0" />
          <circle :cx="l[0]" :cy="l[1] - 39" r="11" fill="#ffe8bc" opacity=".4" />
        </g>

        <!-- 长椅 -->
        <g v-if="bench">
          <ellipse :cx="bench[0] + 4" :cy="bench[1] + 4" rx="34" ry="10" fill="#6b4b69" opacity=".16" />
          <path :d="`M${bench[0] - 30} ${bench[1] - 12} L${bench[0] + 30} ${bench[1] - 12} L${bench[0] + 26} ${bench[1] - 4} L${bench[0] - 26} ${bench[1] - 4}Z`" fill="#d9ac8b" />
          <path :d="`M${bench[0] - 28} ${bench[1] - 26} L${bench[0] + 28} ${bench[1] - 26} L${bench[0] + 30} ${bench[1] - 12} L${bench[0] - 30} ${bench[1] - 12}Z`" fill="#c38f6f" />
          <path :d="`M${bench[0] - 24} ${bench[1] - 4} v8 M${bench[0] + 22} ${bench[1] - 4} v8`" stroke="#8a6a5a" stroke-width="3" stroke-linecap="round" />
        </g>

        <!-- 零星小树 -->
        <g v-for="(t, i) in smallTrees" :key="`t${i}`">
          <ellipse :cx="t.x + 5" :cy="t.y + 4" :rx="26 * t.s" :ry="9 * t.s" fill="#6b4b69" opacity=".2" />
          <path :d="trunkPath(t)" fill="#7a5a4e" />
          <ellipse v-for="(b, j) in t.blobs" :key="`b${i}-${j}`"
                   :cx="t.x + b[0] * t.s" :cy="t.y - 42 * t.s + b[1] * t.s"
                   :rx="b[2] * t.s" :ry="b[3] * t.s"
                   :fill="j === 0 ? '#f2b3c9' : j === 1 ? '#f9c9da' : '#ffdae7'"
                   :opacity="1" />
        </g>

        <!-- 千年樱：站位偏右，避开左上角的文案卡 -->
        <g class="giant" transform="translate(150, 42)">
          <ellipse cx="440" cy="492" rx="236" ry="48" fill="#6b4b69" opacity=".22" filter="url(#hillBlur)" />
          <circle cx="425" cy="220" r="286" fill="url(#hillGlow)" opacity=".9" />

          <!-- 通关之后：树根边一圈慢慢浮起的花瓣 -->
          <g v-if="blessed" class="blessed-aura">
            <circle cx="440" cy="300" r="210" fill="url(#hillGlow)" opacity=".55" />
            <ellipse v-for="(b, i) in blessPetals" :key="`bp${i}`"
                     :cx="440 + b[0]" :cy="420 + b[1]" :rx="4.6" :ry="2.6"
                     fill="#fff0f6" opacity=".85" />
          </g>

          <!-- 通关之后：树根边一圈慢慢浮起的花瓣 -->
          <g v-if="blessed" class="blessed-aura">
            <circle cx="440" cy="300" r="210" fill="url(#hillGlow)" opacity=".55" />
            <ellipse v-for="(b, i) in blessPetals" :key="`bp${i}`"
                     :cx="440 + b[0]" :cy="420 + b[1]" :rx="4.6" :ry="2.6"
                     fill="#fff0f6" opacity=".85" />
          </g>

          <!-- 树根 -->
          <g fill="#6b4a44">
            <path d="M378 476 C348 462 320 452 304 450 C314 466 342 482 374 498Z" />
            <path d="M486 476 C516 462 544 452 560 450 C550 466 522 482 490 498Z" />
            <path d="M406 492 C386 504 372 514 364 522 C376 522 394 514 418 502Z" opacity=".94" />
            <path d="M460 492 C480 504 494 514 502 522 C490 522 472 514 448 502Z" opacity=".94" />
            <path d="M428 494 C424 508 422 518 424 528 C432 522 436 508 436 494Z" opacity=".88" />
          </g>

          <!-- 树干：根粗上收，向左弓一点 -->
          <path d="M372 494
                   C364 424 372 366 384 314
                   C392 276 396 244 400 208
                   L452 208
                   C458 246 466 282 476 320
                   C488 374 498 434 504 494Z"
                fill="#6b4741" />
          <path d="M372 494 C364 424 372 366 384 314 C392 276 396 244 400 208 L424 208
                   C418 244 414 280 408 318 C398 372 388 434 390 494Z"
                fill="#8a6057" opacity=".42" />
          <!-- 树皮竖纹 -->
          <g stroke="#543634" stroke-width="2.8" fill="none" opacity=".42" stroke-linecap="round">
            <path d="M404 470 C398 412 406 354 412 300" />
            <path d="M436 480 C440 420 446 360 452 306" />
            <path d="M468 468 C474 412 482 358 488 314" />
            <path d="M420 456 C416 404 420 352 424 306" />
          </g>
          <!-- 树瘤 -->
          <ellipse cx="402" cy="330" rx="11" ry="26" fill="#5b3b36" opacity=".38" />
          <ellipse cx="478" cy="420" rx="9" ry="19" fill="#5b3b36" opacity=".32" />

          <!-- 枝桠 -->
          <g stroke="#6b4741" fill="none" stroke-linecap="round">
            <path d="M406 252 C346 224 282 206 200 218" stroke-width="16" />
            <path d="M452 246 C514 210 588 196 664 214" stroke-width="15" />
            <path d="M414 214 C390 168 394 124 420 86" stroke-width="12" />
            <path d="M446 218 C498 178 552 148 614 134" stroke-width="10" />
            <path d="M400 230 C348 198 308 170 260 152" stroke-width="10" />
            <path d="M470 258 C538 234 600 230 668 248" stroke-width="8" opacity=".9" />
            <path d="M440 202 C452 160 470 132 496 110" stroke-width="7" opacity=".85" />
          </g>

          <!-- 树冠：三层叠色 + 毛边，形状偏「张开」而不是正圆 -->
          <g class="giant-canopy">
            <g fill="#e595b2" opacity=".94">
              <ellipse cx="230" cy="232" rx="102" ry="66" />
              <ellipse cx="424" cy="132" rx="152" ry="92" />
              <ellipse cx="618" cy="214" rx="106" ry="70" />
              <ellipse cx="330" cy="282" rx="92" ry="52" />
              <ellipse cx="548" cy="278" rx="94" ry="54" />
              <ellipse cx="140" cy="282" rx="54" ry="36" />
              <ellipse cx="708" cy="268" rx="56" ry="38" />
            </g>
            <g fill="#f7bed3">
              <ellipse cx="244" cy="214" rx="92" ry="60" />
              <ellipse cx="356" cy="156" rx="96" ry="66" />
              <ellipse cx="490" cy="144" rx="100" ry="68" />
              <ellipse cx="608" cy="198" rx="92" ry="62" />
              <ellipse cx="424" cy="88" rx="116" ry="62" />
              <ellipse cx="186" cy="262" rx="58" ry="40" />
              <ellipse cx="676" cy="254" rx="60" ry="42" />
              <ellipse cx="322" cy="254" rx="74" ry="46" />
              <ellipse cx="534" cy="250" rx="78" ry="48" />
            </g>
            <g fill="#ffd8e5">
              <ellipse cx="306" cy="124" rx="82" ry="52" />
              <ellipse cx="430" cy="104" rx="88" ry="52" />
              <ellipse cx="200" cy="204" rx="56" ry="38" />
              <ellipse cx="368" cy="206" rx="62" ry="40" />
              <ellipse cx="516" cy="194" rx="62" ry="40" />
              <ellipse cx="430" cy="52" rx="70" ry="36" />
            </g>
            <g fill="#fff0f6" opacity=".94">
              <ellipse cx="292" cy="98" rx="48" ry="30" />
              <ellipse cx="430" cy="70" rx="54" ry="30" />
              <ellipse cx="186" cy="182" rx="34" ry="24" />
            </g>
            <!-- 毛边花簇 -->
            <g fill="#ffd2e1" opacity=".96">
              <circle v-for="(c, i) in canopyEdge" :key="`ce${i}`" :cx="c[0]" :cy="c[1]" :r="c[2]" />
            </g>
            <g fill="#fff3f7" opacity=".82">
              <circle v-for="(d, i) in canopyDots" :key="`d${i}`" :cx="d[0]" :cy="d[1]" :r="d[2]" />
            </g>
          </g>

          <!-- 探出树冠的枝梢：让轮廓不至于太齐 -->
          <g stroke="#6b4741" fill="none" stroke-width="4" opacity=".9" stroke-linecap="round">
            <path d="M196 214 q-26 10 -34 30" />
            <path d="M668 210 q26 8 34 28" />
            <path d="M300 108 q-18 -16 -44 -18" />
            <path d="M520 96 q20 -18 44 -22" />
            <path d="M700 250 q18 12 22 32" />
          </g>

          <!-- 垂枝 -->
          <g stroke="#8a6152" fill="none" stroke-width="2.2" opacity=".6" stroke-linecap="round">
            <path d="M692 220 q14 44 -4 84" />
            <path d="M186 230 q-12 40 6 72" />
            <path d="M612 280 q10 34 -4 62" />
            <path d="M286 294 q-8 28 4 50" />
          </g>
        </g>

        <!-- 站着的自己 -->
        <g class="me" :style="{ transform: `translate(${me.x}px, ${me.y}px)` }">
          <ellipse cx="2" cy="2" rx="13" ry="5" fill="#6b4b69" opacity=".24" />
          <ellipse cx="0" cy="0" rx="17" ry="6.6" fill="none" stroke="#fff6fa" stroke-width="1.6" opacity=".85" class="me__ring" />
          <path d="M-7 0 q-1 -20 5 -30 q6 -8 8 0 q5 12 3 30Z" fill="#e2919f" />
          <circle cx="0" cy="-34" r="8" fill="#ffe3d2" />
          <path d="M-8 -36 q4 -12 14 -8 q6 3 2 8 q-6 -4 -16 0Z" fill="#584152" />
        </g>

        <!-- 雾：靠近时慢慢浮起来 -->
        <rect class="hill__mist" :class="{ on: arrived }" x="0" y="350" width="1200" height="330" fill="url(#hillMist)" />
      </svg>

      <canvas ref="petalCanvas" class="hill__petals" aria-hidden="true"></canvas>

      <!-- 顶部文案 -->
      <header class="hill__head">
        <p class="hill__eyebrow"><span></span>BACK HILL · 后山</p>
        <h1>风是从树下吹来的。</h1>
        <p class="hill__lede">
          顺着碎石小路往上走，草到膝盖，花香到鼻尖。最深处站着那棵千年樱 ——
          小镇的人说，雾起的时候别盯着它看太久。
        </p>
        <p v-if="blessed" class="hill__blessed">
          <span aria-hidden="true">✦</span> 樱心已静 · 花落得比从前慢一些
        </p>
      </header>

      <!-- 底部操作 -->
      <div class="hill__actions">
        <button type="button" class="hill__back" @click="$emit('navigate', 'town')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M19 12H6M11.5 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          回小镇
        </button>
        <button v-if="!arrived" type="button" class="hill__walk" :disabled="walking" @click="approach">
          {{ walking ? '正在走近…' : '走近千年樱' }}
        </button>
        <button v-else type="button" class="hill__walk" :disabled="walking" @click="approach">再看一眼雾</button>
      </div>

      <p class="hill__foot">在树下站一会儿，风会替你数花瓣</p>

      <!-- 靠近巨樱的提示 -->
      <Transition name="hill-prompt">
        <div v-if="promptOpen" class="hill__prompt" role="dialog" aria-modal="false" aria-labelledby="realm-title">
          <p class="hill__prompt-tag">樱之异境 · 入口</p>
          <p id="realm-title" class="hill__prompt-text">
            花瓣突然旋转汇聚，空间泛起一层薄雾，<br />通往樱之异境的入口开启了。
          </p>
          <p class="hill__prompt-hint">里面是另一个小镇 —— 会动的东西比这里多。进去了随时可以用归乡樱瓣回来。</p>
          <div class="hill__prompt-actions">
            <button type="button" class="hill__enter" @click="enterRealm">走进薄雾</button>
            <button type="button" class="hill__stay" @click="dismiss">今天先算了</button>
          </div>
        </div>
      </Transition>

      <!-- 花瓣漩涡 -->
      <div v-if="leaving" class="vortex" aria-hidden="true">
        <span
          v-for="i in 30"
          :key="`v${i}`"
          class="vortex__petal"
          :style="petalStyle(i)"
        ></span>
        <span class="vortex__fog"></span>
        <span class="vortex__core"></span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import SiteNav from './SiteNav.vue'
import { createPetalField } from '../composables/usePetals'
import { gainOnce } from '../composables/usePlaces'

defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['navigate', 'logout', 'enter-realm'])

/** 打通樱心之后，后山会多一层特效（副本里写 localStorage，这里读） */
const blessed = ref(false)
try { blessed.value = localStorage.getItem('sakura_hollow_cleared') === '1' } catch (e) { /* 读不到就没有 */ }


/* ---------------- 场景数据 ---------------- */
const grass = [
  'M150 618 q4 -14 10 -18', 'M196 640 q3 -12 9 -16', 'M252 604 q4 -12 11 -15',
  'M340 664 q4 -14 10 -18', 'M430 682 q3 -12 9 -15', 'M540 660 q4 -13 11 -17',
  'M660 686 q4 -14 10 -18', 'M744 656 q3 -12 9 -16', 'M830 672 q4 -13 10 -17',
  'M920 640 q4 -14 10 -18', 'M1000 614 q3 -12 9 -15', 'M1058 590 q4 -12 10 -16',
  'M300 560 q4 -12 9 -15', 'M586 604 q4 -13 10 -16', 'M886 592 q4 -12 9 -15',
  'M700 548 q4 -12 9 -15', 'M1020 660 q4 -12 10 -16'
]

/** 小路：从右下角盘到台地上的树根边 */
const pathPts = [
  [1042, 706], [948, 666], [852, 628], [758, 592],
  [676, 556], [614, 526], [578, 510], [560, 504]
]

const pathRibbon = computed(() => {
  const left = []
  const right = []
  pathPts.forEach((p, i) => {
    const prev = pathPts[Math.max(0, i - 1)]
    const next = pathPts[Math.min(pathPts.length - 1, i + 1)]
    const dx = next[0] - prev[0]
    const dy = next[1] - prev[1]
    const len = Math.hypot(dx, dy) || 1
    const nx = (-dy / len) * 26
    const ny = (dx / len) * 8.5
    left.push(`${p[0] + nx} ${p[1] + ny}`)
    right.push(`${p[0] - nx} ${p[1] - ny}`)
  })
  return `M${left.join('L')}L${right.reverse().join('L')}Z`
})

const pathStones = computed(() => {
  const out = []
  for (let i = 0; i < pathPts.length - 1; i++) {
    const [x0, y0] = pathPts[i]
    const [x1, y1] = pathPts[i + 1]
    for (let t = 0; t < 1; t += 0.34) {
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      const jx = ((i * 7 + t * 13) % 5 - 2) * 9
      const jy = ((i * 11 + t * 17) % 5 - 2) * 2.6
      out.push([x + jx, y + jy, 10 + ((i + t) % 3) * 2.2, 4.2 + ((i + t) % 3) * 0.7])
    }
  }
  return out
})

const rocks = [
  [246, 566, 21], [300, 596, 13], [1006, 588, 18],
  [884, 654, 15], [742, 690, 17], [176, 640, 14]
]

function rockPath ([x, y, r]) {
  return `M${x - r} ${y} q${r * 0.1} ${-r * 0.8} ${r} ${-r * 0.72} q${r * 0.9} ${r * 0.1} ${r * 0.86} ${r * 0.7}Z`
}
function rockLitPath ([x, y, r]) {
  return `M${x - r * 0.72} ${y - r * 0.16} q${r * 0.2} ${-r * 0.5} ${r * 0.86} ${-r * 0.46} q${r * 0.3} ${r * 0.16} ${r * 0.2} ${r * 0.3}Z`
}

const lanterns = [[566, 534], [792, 586]]
const bench = [700, 620]

const smallTrees = [
  { x: 812, y: 556, s: 0.94, blobs: [[0, 0, 46, 34], [-32, 8, 30, 22], [32, 6, 28, 22]] },
  { x: 948, y: 606, s: 0.8, blobs: [[0, 0, 38, 28], [-24, 8, 26, 20], [26, 6, 24, 19]] },
  { x: 300, y: 636, s: 0.88, blobs: [[0, 0, 42, 30], [-26, 8, 27, 21], [27, 7, 25, 20]] },
  { x: 1064, y: 528, s: 0.7, blobs: [[0, 0, 34, 26], [-22, 7, 24, 18], [23, 6, 22, 18]] },
  { x: 640, y: 676, s: 0.66, blobs: [[0, 0, 32, 24], [-20, 6, 22, 17], [21, 6, 20, 16]] }
]

function trunkPath (t) {
  const h = 44 * t.s
  return `M${t.x - 5 * t.s} ${t.y} L${t.x - 3 * t.s} ${t.y - h} L${t.x + 3 * t.s} ${t.y - h} L${t.x + 5 * t.s} ${t.y}Z`
}

/** 树冠轮廓上的小花簇：沿椭圆撒一圈，破掉「气球」感 */
const canopyEdge = (() => {
  const out = []
  let seed = 23
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.16
    const rx = 214 + rnd() * 26
    const ry = 122 + rnd() * 16
    out.push([424 + Math.cos(a) * rx, 168 + Math.sin(a) * ry, 12 + rnd() * 16])
  }
  return out
})()

/** 通关特效：树根边一圈缓缓上浮的花瓣 */
const blessPetals = (() => {
  const out = []
  let seed = 41
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2
    const r = 60 + rnd() * 180
    out.push([Math.cos(a) * r, Math.sin(a) * r * 0.3 - rnd() * 40])
  }
  return out
})()

const canopyDots = (() => {
  const out = []
  let seed = 8
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < 32; i++) {
    const a = rnd() * Math.PI * 2
    const r = 40 + rnd() * 200
    out.push([424 + Math.cos(a) * r, 178 + Math.sin(a) * r * 0.62, 1.6 + rnd() * 2.4])
  }
  return out
})()

/* ---------------- 走近 ---------------- */
const START = { x: 1076, y: 700 }
const TARGET = { x: 610, y: 566 }

const me = ref({ ...START })
const walking = ref(false)
const arrived = ref(false)
const promptOpen = ref(false)
const leaving = ref(false)

let walkTimer = null
let promptTimer = null

function approach () {
  if (walking.value) return
  if (arrived.value) {
    promptOpen.value = true
    return
  }
  walking.value = true
  promptOpen.value = false
  me.value = { ...TARGET }
  walkTimer = setTimeout(() => {
    walking.value = false
    arrived.value = true
    // 一口气爬到千年樱下：体力 + 神秘。半小时一次，别站在原地反复上山
    gainOnce('backhill', 30 * 60 * 1000, { vigor: 1, mystic: 1 })
    promptTimer = setTimeout(() => { promptOpen.value = true }, 260)
  }, 1700)
}

function dismiss () {
  promptOpen.value = false
}

/* ---------------- 进异境 ---------------- */
let leaveTimer = null
function enterRealm () {
  if (leaving.value) return
  promptOpen.value = false
  leaving.value = true
  leaveTimer = setTimeout(() => emit('enter-realm'), 1850)
}

function petalStyle (i) {
  const angle = (i / 30) * Math.PI * 2 + (i % 3) * 0.3
  const radius = 42 + (i % 5) * 9
  return {
    '--a': `${(angle * 180) / Math.PI}deg`,
    '--r': `${radius}vmax`,
    '--d': `${(i % 6) * 60}ms`,
    '--s': `${0.7 + (i % 4) * 0.18}`,
    '--t': `${1250 + (i % 4) * 130}ms`
  }
}

/* ---------------- 花瓣 ---------------- */
const petalCanvas = ref(null)
let field = null

function resize () {
  const c = petalCanvas.value
  if (!c) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = c.clientWidth * dpr
  c.height = c.clientHeight * dpr
}

onMounted(() => {
  resize()
  field = createPetalField(petalCanvas.value, { density: 0.00006, max: 90, base: 15, wind: 0.16 })
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  clearTimeout(walkTimer)
  clearTimeout(promptTimer)
  clearTimeout(leaveTimer)
  if (field && field.destroy) field.destroy()
})
</script>

<style scoped>
.hill {
  position: relative;
  min-height: 100svh;
  background: linear-gradient(180deg, #fdf4f8 0%, #f7eff7 46%, #eef1f8 100%);
  overflow: hidden;
}
.hill__stage {
  position: relative;
  height: calc(100svh - 64px);
  min-height: 560px;
  overflow: hidden;
}
.hill__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.hill__petals {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.me { transition: transform 1.7s cubic-bezier(.4, .05, .3, 1); }
.blessed-aura ellipse { animation: blessFloat 7s ease-in-out infinite; }
.blessed-aura ellipse:nth-child(3n) { animation-duration: 9s; }
.blessed-aura ellipse:nth-child(2n) { animation-delay: -2.4s; }
@keyframes blessFloat {
  0%, 100% { transform: translateY(0); opacity: .35; }
  50% { transform: translateY(-16px); opacity: .95; }
}
.blessed-aura ellipse { animation: blessFloat 7s ease-in-out infinite; }
.blessed-aura ellipse:nth-child(3n) { animation-duration: 9s; }
.blessed-aura ellipse:nth-child(2n) { animation-delay: -2.4s; }
@keyframes blessFloat {
  0%, 100% { transform: translateY(0); opacity: .35; }
  50% { transform: translateY(-16px); opacity: .95; }
}
.me__ring { animation: meRing 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes meRing { 0%, 100% { opacity: .45; } 50% { opacity: .95; } }

.hill__mist { opacity: 0; transition: opacity 1.2s ease; }
.hill__mist.on { opacity: 1; }

/* ---------- 文案 ---------- */
.hill__head {
  position: absolute;
  z-index: 4;
  left: clamp(22px, 4.4vw, 68px);
  top: clamp(18px, 3.4vh, 40px);
  width: min(392px, 34vw);
  padding: 17px 21px 19px;
  border-radius: 20px;
  background: rgba(255, 253, 254, .74);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, .9);
  box-shadow: 0 22px 48px -34px rgba(102, 64, 100, .75);
}
.hill__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 9px;
  letter-spacing: .28em;
  color: var(--sakura-600);
}
.hill__eyebrow span { width: 22px; height: 1px; background: var(--sakura-300); }
.hill__head h1 {
  margin: 9px 0 0;
  font-family: var(--font-serif);
  font-size: clamp(20px, 1.9vw, 26px);
  font-weight: 900;
  letter-spacing: .02em;
  color: var(--ink);
  line-height: 1.42;
}
.hill__blessed {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 10px 0 0;
  padding: 4px 11px;
  border-radius: 999px;
  background: rgba(255, 224, 238, .8);
  color: #a8446a;
  font-size: 10px;
  letter-spacing: .06em;
}
.hill__blessed span { color: #e0557f; }


.hill__lede {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.95;
  color: var(--ink-soft);
}

/* ---------- 操作 ---------- */
.hill__actions {
  position: absolute;
  z-index: 4;
  left: clamp(22px, 4.4vw, 68px);
  bottom: clamp(26px, 4.6vh, 48px);
  display: flex;
  align-items: center;
  gap: 10px;
}
.hill__back,
.hill__walk {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font: inherit;
  font-size: 12.5px;
  letter-spacing: .08em;
  cursor: pointer;
  transition: transform .25s var(--ease), background .25s, box-shadow .25s, color .25s;
}
.hill__back svg { width: 15px; height: 15px; }
.hill__back {
  border: 1px solid rgba(255, 255, 255, .95);
  background: rgba(255, 253, 254, .82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: var(--ink-soft);
  box-shadow: 0 16px 32px -24px rgba(102, 64, 100, .9);
}
.hill__back:hover { color: var(--sakura-700); transform: translateY(-1px); }
.hill__walk {
  border: 0;
  color: #fff;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  box-shadow: 0 18px 30px -18px rgba(226, 86, 128, .95);
}
.hill__walk:hover { transform: translateY(-1px); }
.hill__walk:disabled { opacity: .7; cursor: default; transform: none; }

.hill__foot {
  position: absolute;
  z-index: 4;
  left: 50%;
  transform: translateX(-50%);
  bottom: clamp(20px, 3.4vh, 34px);
  margin: 0;
  font-size: 10px;
  letter-spacing: .22em;
  color: rgba(120, 92, 112, .5);
}

/* ---------- 靠近巨樱的提示 ---------- */
.hill__prompt {
  position: absolute;
  z-index: 8;
  left: 50%;
  top: 44%;
  width: min(430px, 84vw);
  padding: 22px 24px 20px;
  border-radius: 22px;
  background: rgba(255, 252, 253, .95);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, .95);
  box-shadow: 0 34px 70px -34px rgba(96, 56, 94, .85);
  transform: translate(-50%, -50%);
}
.hill__prompt-tag { margin: 0; font-size: 9px; letter-spacing: .3em; color: var(--sakura-600); }
.hill__prompt-text {
  margin: 10px 0 0;
  font-family: var(--font-serif);
  font-size: 15px;
  line-height: 1.9;
  color: var(--ink);
}
.hill__prompt-hint { margin: 10px 0 0; font-size: 10.5px; line-height: 1.7; color: var(--faint); }
.hill__prompt-actions { display: flex; gap: 9px; margin-top: 16px; }
.hill__enter,
.hill__stay {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  font: inherit;
  font-size: 12px;
  letter-spacing: .08em;
  cursor: pointer;
}
.hill__enter {
  border: 0;
  color: #fff;
  background: linear-gradient(120deg, #a86bb8, #d4608f);
  box-shadow: 0 16px 26px -18px rgba(168, 107, 184, .95);
}
.hill__stay { border: 1px solid var(--line); background: #fff; color: var(--ink-soft); }
.hill__stay:hover { border-color: var(--sakura-300); color: var(--sakura-700); }

.hill-prompt-enter-active,
.hill-prompt-leave-active { transition: opacity .34s var(--ease), transform .34s var(--ease); }
.hill-prompt-enter-from,
.hill-prompt-leave-to { opacity: 0; transform: translate(-50%, -46%) scale(.97); }

/* ---------- 花瓣漩涡 ---------- */
.vortex { position: fixed; inset: 0; z-index: 60; overflow: hidden; pointer-events: none; }
.vortex__petal {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 12px;
  margin: -6px 0 0 -9px;
  border-radius: 60% 40% 55% 45%;
  background: linear-gradient(140deg, #fff2f7, #f6b8ce 70%, #e88fb0);
  box-shadow: 0 0 12px rgba(255, 190, 215, .8);
  transform: rotate(var(--a)) translateX(var(--r)) rotate(0deg);
  animation: petalSwirl var(--t) cubic-bezier(.5, .05, .3, 1) var(--d) forwards;
  opacity: 0;
}
@keyframes petalSwirl {
  0% { opacity: 0; transform: rotate(var(--a)) translateX(var(--r)) rotate(0deg) scale(var(--s)); }
  18% { opacity: .95; }
  100% { opacity: .9; transform: rotate(calc(var(--a) + 300deg)) translateX(6vmax) rotate(520deg) scale(.3); }
}
.vortex__fog {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 250, 253, 0) 18%, rgba(246, 232, 244, .55) 46%, rgba(226, 206, 234, .9) 78%);
  opacity: 0;
  animation: fogIn 1.7s ease-in forwards;
}
@keyframes fogIn { 0% { opacity: 0; } 55% { opacity: .5; } 100% { opacity: 1; } }
.vortex__core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12vmax;
  height: 12vmax;
  margin: -6vmax 0 0 -6vmax;
  border-radius: 50%;
  background: radial-gradient(circle, #fffdfe 0%, #ffe1ee 42%, rgba(255, 200, 226, 0) 72%);
  opacity: 0;
  animation: coreIn 1.7s ease-in forwards;
}
@keyframes coreIn {
  0% { opacity: 0; transform: scale(.3); }
  70% { opacity: .9; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(6); }
}

@media (max-width: 1100px) {
  .hill__head { width: min(400px, 46vw); }
}
@media (max-width: 900px) {
  .hill__head { width: min(420px, 82vw); }
  .hill__lede { display: none; }
  .hill__foot { display: none; }
}
</style>
