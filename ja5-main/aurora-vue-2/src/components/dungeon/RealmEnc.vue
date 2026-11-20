<template>
  <!--
    地图上的一个遭遇点：不再是白圆圈，而是场景里的东西 ——
    怪就是怪本身（用 FoeSprite 缩到 0.62），宝箱是箱子，密道是石门，事件是一团光。
    未解锁的加密文符号飘在头顶，不加白圈底。
  -->
  <g
    class="renc"
    :class="[`is-${enc.kind}`, { 'is-done': done, 'is-locked': locked }]"
    :transform="`translate(${x} ${y})`"
    role="button"
    tabindex="0"
    :aria-label="enc.name"
    @click.stop="$emit('go', enc)"
    @keyup.enter.stop="$emit('go', enc)"
  >
    <!-- 脚下的一圈光：告诉你「这里有东西」，但不抢造型 -->
    <ellipse v-if="!done" cx="0" cy="0" rx="38" ry="17" :fill="glow" :opacity="locked ? .18 : .5" class="renc__halo" />
    <ellipse
      cx="0" cy="0"
      :rx="enc.kind === 'foe' || enc.kind === 'boss' ? 22 : 16"
      :ry="enc.kind === 'foe' || enc.kind === 'boss' ? 9 : 6"
      fill="#3a2231"
      :opacity="done ? .08 : (enc.kind === 'foe' || enc.kind === 'boss' ? .22 : .1)"
    />

    <!-- 怪：本体直接站在地上 -->
    <g v-if="enc.kind === 'foe' || enc.kind === 'boss'" :transform="`translate(${-80 * scale} ${-158 * scale}) scale(${scale})`">
      <FoeSprite
        :foe="enc.foe"
        :color="color"
        :label="enc.name"
        :state="done ? 'idle' : 'idle'"
        :style="{ width: '160px', height: '160px' }"
        width="160"
        height="160"
      />
    </g>

    <!-- 宝箱 -->
    <g v-else-if="enc.kind === 'chest'" class="renc__chest">
      <path d="M-26 -6 L26 -6 L30 6 L-30 6 Z" fill="#c9956f" />
      <path d="M-30 6 L30 6 L30 20 L-30 20 Z" fill="#b07f5c" />
      <path d="M-30 -6 L0 -20 L30 -6 L30 4 L0 -10 L-30 4 Z" fill="#dcaa80" />
      <path d="M-4 6 h8 v10 h-8 Z" fill="#f2d9a8" />
      <path d="M-2 8 h4 v4 h-4 Z" fill="#8a6340" />
    </g>

    <!-- 密道：石壁上的门 -->
    <g v-else-if="enc.kind === 'secret'">
      <path d="M-34 -54 L34 -54 L34 8 L-34 8 Z" fill="#7b6470" />
      <path d="M-26 -46 L26 -46 L26 6 L-26 6 Z" fill="#4d3a47" />
      <path d="M-26 -46 L26 -46 L26 -38 L-26 -38 Z" fill="#8f7684" />
      <path d="M0 -40 v44" stroke="#6d5663" stroke-width="1.6" opacity=".7" />
      <circle cx="8" cy="-16" r="3" fill="#e8c98f" />
      <path d="M-14 -22 q14 -10 28 0" fill="none" stroke="#9c8494" stroke-width="1.4" opacity=".6" />
    </g>

    <!-- 事件：一团浮着的光，里面一片花瓣 -->
    <g v-else class="renc__wisp">
      <circle cx="0" cy="-34" r="20" :fill="glow" opacity=".8" class="renc__glowball" />
      <path d="M0 -26q7 -8 0 -16q-7 8 0 16Z" fill="#f9c6d8" class="renc__petal" />
      <circle cx="-16" cy="-42" r="2.4" fill="#fff" opacity=".85" class="renc__mote" />
      <circle cx="14" cy="-24" r="2" fill="#fff" opacity=".7" class="renc__mote" style="animation-delay:-1.1s" />
    </g>

    <!-- 未解锁：头顶飘一个加密文 -->
    <g v-if="locked && !done" class="renc__lock">
      <text y="-72" text-anchor="middle" class="renc__glyph">✦</text>
      <text y="-58" text-anchor="middle" class="renc__need">{{ enc.needLabel }}</text>
    </g>

    <!-- 名字 + 完成勾 -->
    <text y="26" text-anchor="middle" class="renc__label" :class="{ 'is-dim': done }">{{ enc.name }}</text>
    <g v-if="done" transform="translate(20 -34)">
      <circle r="8" fill="#8fd3a8" />
      <path d="M-4 -0.5 l3 3.4 6 -6.6" fill="none" stroke="#173022" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</template>

<script setup>
import { computed } from 'vue'
import FoeSprite from './FoeSprite.vue'

const props = defineProps({
  enc: { type: Object, required: true },
  done: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  scale: { type: Number, default: 0.62 },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
})
defineEmits(['go'])

const COLORS = {
  puppet: '#e0a05c',
  sprite: '#c9a0e0',
  swarm: '#e88fa6',
  wraith: '#7f9fc9',
  golem: '#8fae83',
  warden: '#9a86b6',
  elite: '#d4608f',
  guardian: '#e0576f'
}

const color = computed(() => COLORS[props.enc.foe] || '#d4608f')
const glow = computed(() => {
  if (props.enc.kind === 'boss') return '#f6b0c4'
  if (props.enc.kind === 'chest' || props.enc.kind === 'secret') return '#d9b6ea'
  return '#ffd0e0'
})
</script>

<style scoped>
.renc { cursor: pointer; outline: none; }
.renc.is-done { cursor: default; }
.renc.is-locked { cursor: pointer; }

.renc__halo {
  transform-box: fill-box;
  transform-origin: center;
  animation: renc-pulse 3.2s ease-in-out infinite;
}
@keyframes renc-pulse {
  0%, 100% { opacity: .28; transform: scale(1); }
  50% { opacity: .55; transform: scale(1.08); }
}

.renc__label {
  font-family: var(--font-serif);
  font-size: 10px;
  letter-spacing: .04em;
  fill: #6b4560;
  paint-order: stroke;
  stroke: rgba(255, 250, 253, .85);
  stroke-width: 2.4px;
}
.renc__label.is-dim { fill: rgba(120, 96, 116, .45); }
.renc__glyph { font-size: 15px; fill: #b58ac9; animation: renc-float 2.6s ease-in-out infinite; }
.renc__need { font-size: 8.5px; letter-spacing: .08em; fill: #9a7fa8; }
@keyframes renc-float {
  0%, 100% { transform: translateY(0); opacity: .85; }
  50% { transform: translateY(-5px); opacity: 1; }
}

.renc__glowball {
  transform-box: fill-box;
  transform-origin: center;
  animation: renc-pulse 2.4s ease-in-out infinite;
}
.renc__petal {
  transform-box: fill-box;
  transform-origin: center;
  animation: renc-spin 6s linear infinite;
}
@keyframes renc-spin { to { transform: rotate(360deg); } }
.renc__mote {
  transform-box: fill-box;
  transform-origin: center;
  animation: renc-float 3.4s ease-in-out infinite;
}

/* 完成之后整只淡下去，但还留在原地 —— 地图要有「走过」的痕迹 */
.renc.is-done > g:not(.is-done) { opacity: .45; }
.renc.is-done :deep(.foesprite) { opacity: .35; filter: grayscale(.5); }

/* 锁着的：压灰，但仍能点（走过去会提示条件不够） */
.renc.is-locked :deep(.foesprite) { filter: saturate(.5); opacity: .8; }
.renc.is-locked .renc__chest, .renc.is-locked .renc__wisp { opacity: .6; }

.renc:focus-visible .renc__label { fill: var(--sakura-700); }
</style>
