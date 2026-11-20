<template>
  <!--
    一只怪 = 5~7 个 <g class="part">，各自能单独动。
    整张图淡入淡出永远像贴纸，拆开部件才有「活物」的错觉：
    身体呼吸、手臂摆、头微点、装饰各自转 —— 位移全交给外部 class。
  -->
  <svg
    class="foesprite"
    :class="[`is-${foe}`, `is-${state}`, { 'is-dead': dead }]"
    viewBox="0 0 160 160"
    role="img"
    :aria-label="label"
  >
    <defs>
      <radialGradient :id="`g-${uid}-body`" cx="42%" cy="34%" r="70%">
        <stop offset="0%" :stop-color="tint(0.42)" />
        <stop offset="100%" :stop-color="tint(0)" />
      </radialGradient>
      <radialGradient :id="`g-${uid}-glow`" cx="50%" cy="50%" r="50%">
        <stop offset="0%" :stop-color="c" stop-opacity=".8" />
        <stop offset="100%" :stop-color="c" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="`g-${uid}-fade`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="c" stop-opacity=".78" />
        <stop offset="100%" :stop-color="c" stop-opacity="0" />
      </linearGradient>
      <linearGradient :id="`g-${uid}-robe`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fdf4fb" />
        <stop offset="100%" :stop-color="c" stop-opacity=".85" />
      </linearGradient>
    </defs>

    <!-- ================= 樱花木傀儡：球关节木偶 ================= -->
    <g v-if="foe === 'puppet'">
      <g class="part part--leg-l">
        <rect x="70" y="104" width="11" height="40" rx="5" :fill="shade(-14)" />
        <circle cx="75" cy="146" r="7" :fill="shade(-24)" />
      </g>
      <g class="part part--leg-r">
        <rect x="83" y="104" width="11" height="40" rx="5" :fill="shade(-6)" />
        <circle cx="88" cy="146" r="7" :fill="shade(-18)" />
      </g>
      <g class="part part--body">
        <rect x="60" y="66" width="42" height="46" rx="12" :fill="c" />
        <path d="M64 80h34M64 94h34" :stroke="shade(-16)" stroke-width="1.6" opacity=".55" />
        <circle cx="81" cy="106" r="6" :fill="shade(14)" opacity=".8" />
      </g>
      <g class="part part--arm-l">
        <circle cx="58" cy="72" r="9" :fill="shade(10)" />
        <rect x="49" y="74" width="9" height="30" rx="4.5" :fill="shade(-8)" />
        <circle cx="53" cy="106" r="8" :fill="shade(6)" />
        <rect x="47" y="108" width="9" height="20" rx="4.5" :fill="shade(-14)" />
      </g>
      <g class="part part--arm-r">
        <circle cx="104" cy="72" r="9" :fill="shade(6)" />
        <rect x="104" y="74" width="9" height="30" rx="4.5" :fill="shade(-4)" />
        <circle cx="109" cy="106" r="8" :fill="shade(2)" />
        <rect x="106" y="108" width="9" height="20" rx="4.5" :fill="shade(-10)" />
      </g>
      <g class="part part--head">
        <circle cx="81" cy="44" r="21" :fill="shade(18)" />
        <path d="M66 34l18-6-9 12z" :fill="shade(-12)" opacity=".55" />
        <circle cx="74" cy="42" r="2.6" fill="#4a2f2a" />
        <circle cx="88" cy="42" r="2.6" fill="#4a2f2a" />
        <path d="M76 52q5 4 10 0" fill="none" stroke="#4a2f2a" stroke-width="1.6" stroke-linecap="round" opacity=".7" />
        <circle cx="81" cy="23" r="3" :fill="shade(-18)" />
        <path d="M81 23v-6" :stroke="shade(-18)" stroke-width="1.4" />
      </g>
      <g class="part part--deco">
        <g transform="translate(81 21)">
          <ellipse v-for="(p, i) in fivePetals" :key="`pp${i}`" cx="0" cy="-5" rx="3.1" ry="5"
                   fill="#f9b8cd" :transform="`rotate(${p} )`" opacity=".95" />
          <circle r="2" fill="#fff1f5" />
        </g>
      </g>
    </g>

    <!-- ================= 幼年樱雾精灵：一团会飘的雾 ================= -->
    <g v-else-if="foe === 'sprite'">
      <g class="part part--tail">
        <path d="M80 104q-18 12 -12 30q4 12 18 8" fill="none" :stroke="c" stroke-width="10" stroke-linecap="round" opacity=".18" />
        <path d="M80 108q14 14 8 30" fill="none" :stroke="c" stroke-width="8" stroke-linecap="round" opacity=".22" />
        <path d="M64 112q-8 16 -2 26" fill="none" :stroke="c" stroke-width="6" stroke-linecap="round" opacity=".14" />
        <path d="M96 112q10 14 4 26" fill="none" :stroke="c" stroke-width="6" stroke-linecap="round" opacity=".14" />
      </g>
      <g class="part part--body">
        <path d="M80 44q26 8 30 40q4 34 -12 42q-18 8 -36 0q-16 -8 -12 -42q4 -32 30 -40Z" :fill="`url(#g-${uid}-body)`" />
        <path d="M80 44q26 8 30 40q4 34 -12 42q-18 8 -36 0q-16 -8 -12 -42q4 -32 30 -40Z" :fill="c" opacity=".18" />
        <ellipse cx="80" cy="96" rx="16" ry="12" :fill="c" opacity=".22" />
        <circle cx="70" cy="70" r="7" fill="#fff" opacity=".7" />
      </g>
      <g class="part part--head">
        <circle cx="80" cy="52" r="19" :fill="c" opacity=".26" />
        <circle cx="80" cy="52" r="19" fill="none" :stroke="tint(0.5)" stroke-width="1.2" opacity=".6" />
        <ellipse cx="73" cy="51" rx="2.4" ry="3.2" fill="#42284f" class="eye" />
        <ellipse cx="87" cy="51" rx="2.4" ry="3.2" fill="#42284f" class="eye" />
        <path d="M76 59q4 2 8 0" fill="none" :stroke="c" stroke-width="1.6" stroke-linecap="round" opacity=".55" />
      </g>
      <g class="part part--deco">
        <circle cx="50" cy="70" r="3.4" fill="#fff" opacity=".85" class="mote" />
        <circle cx="112" cy="84" r="2.6" fill="#fff" opacity=".7" class="mote" style="animation-delay:-1.2s" />
        <circle cx="98" cy="30" r="2.2" fill="#fff" opacity=".6" class="mote" style="animation-delay:-2.1s" />
        <circle cx="62" cy="34" r="1.8" fill="#fff" opacity=".5" class="mote" style="animation-delay:-.6s" />
      </g>
    </g>

    <!-- ================= 花瓣蜂群：三层花瓣卷成漩涡 ================= -->
    <g v-else-if="foe === 'swarm'">
      <g class="part part--core">
        <circle cx="80" cy="84" r="30" :fill="`url(#g-${uid}-glow)`" opacity=".8" />
        <circle cx="80" cy="84" r="14" :fill="shade(-34)" opacity=".9" />
        <circle cx="80" cy="84" r="8" :fill="c" opacity=".75" class="rune" />
        <circle cx="80" cy="84" r="3.2" fill="#fff" opacity=".9" />
      </g>
      <g class="part part--ring">
        <g class="orbit">
          <path
            v-for="(p, i) in swarmPetals"
            :key="`sp${i}`"
            d="M0 0q4 -5 0 -10q-4 5 0 10Z"
            :transform="`translate(${p.x} ${p.y}) rotate(${p.tilt}) scale(${p.s})`"
            :fill="i % 3 ? c : tint(0.4)"
            :opacity="0.6 + (i % 4) * 0.1"
          />
        </g>
      </g>
      <g class="part part--head">
        <path class="dash-ring" d="M80 84m-40 0a40 40 0 1 1 80 0a40 40 0 1 1 -80 0" />
      </g>
    </g>

    <!-- ================= 湖影幻妖：下半身融进水面 ================= -->
    <g v-else-if="foe === 'wraith'">
      <g class="part part--body">
        <path d="M62 70q18 -14 36 0q10 26 6 52q-24 12 -48 0q-4 -26 6 -52Z" :fill="`url(#g-${uid}-body)`" />
        <path d="M62 70q18 -14 36 0q10 26 6 52q-24 12 -48 0q-4 -26 6 -52Z" :fill="c" opacity=".28" />
      </g>
      <g class="part part--tail">
        <path d="M52 120q10 14 28 12q18 2 28 -12q-4 26 -28 28q-24 -2 -28 -28Z" :fill="`url(#g-${uid}-fade)`" />
        <ellipse cx="80" cy="146" rx="34" ry="6" :fill="c" opacity=".22" />
        <ellipse cx="80" cy="140" rx="22" ry="4" :fill="c" opacity=".3" />
      </g>
      <g class="part part--arm-l">
        <path d="M58 82q-16 10 -18 28" fill="none" :stroke="c" stroke-width="7" stroke-linecap="round" opacity=".6" />
        <path d="M40 110l-4 6M42 110l2 8" :stroke="c" stroke-width="2.4" stroke-linecap="round" opacity=".65" />
      </g>
      <g class="part part--arm-r">
        <path d="M102 82q16 10 18 28" fill="none" :stroke="c" stroke-width="7" stroke-linecap="round" opacity=".6" />
        <path d="M120 110l4 6M118 110l-2 8" :stroke="c" stroke-width="2.4" stroke-linecap="round" opacity=".65" />
      </g>
      <g class="part part--head">
        <ellipse cx="80" cy="56" rx="19" ry="22" :fill="c" opacity=".42" />
        <ellipse cx="80" cy="56" rx="19" ry="22" :fill="`url(#g-${uid}-body)`" />
        <ellipse cx="73" cy="54" rx="2.4" ry="3.4" fill="#f6fbff" class="eye" />
        <ellipse cx="88" cy="54" rx="2.4" ry="3.4" fill="#f6fbff" class="eye" />
      </g>
      <g class="part part--deco">
        <path d="M60 44q20 -18 40 0" fill="none" :stroke="c" stroke-width="3" stroke-linecap="round" opacity=".5" />
      </g>
    </g>

    <!-- ================= 青苔石魔：几块石头叠起来，棱要分开 ================= -->
    <g v-else-if="foe === 'golem'">
      <g class="part part--leg-l">
        <path d="M62 118l-8 30h20l2 -28Z" :fill="shade(-26)" />
        <path d="M62 118l-8 30h9l4 -28Z" :fill="shade(-12)" opacity=".7" />
      </g>
      <g class="part part--leg-r">
        <path d="M98 118l8 30H86l-2 -28Z" :fill="shade(-18)" />
        <path d="M98 118l8 30h-9l-4 -28Z" :fill="shade(-6)" opacity=".7" />
      </g>
      <g class="part part--body">
        <!-- 主躯干：一块有顶面的六边形岩 -->
        <path d="M46 80l12 -20 40 -6 22 16 4 34 -16 18 -42 2 -20 -16Z" :fill="c" />
        <path d="M58 60l40 -6 22 16 -24 8 -38 -2Z" :fill="shade(20)" opacity=".85" />
        <path d="M46 80l34 6 -4 40 -30 -6Z" :fill="shade(-14)" opacity=".55" />
        <path d="M80 86l24 0 -6 26 -22 2Z" :fill="shade(-6)" opacity=".5" />
        <!-- 石缝 -->
        <path d="M80 60l-6 26M74 86l-28 -6M80 86l22 -2" fill="none" :stroke="shade(-34)" stroke-width="1.6" opacity=".55" />
      </g>
      <g class="part part--arm-l">
        <path d="M50 84l-18 10 2 20 16 -8Z" :fill="shade(-12)" />
        <path d="M50 84l-18 10 6 4 14 -8Z" :fill="shade(10)" opacity=".7" />
        <circle cx="40" cy="116" r="9" :fill="shade(-4)" />
        <circle cx="37" cy="112" r="4" :fill="shade(16)" opacity=".6" />
      </g>
      <g class="part part--arm-r">
        <path d="M110 84l18 8 -2 22 -16 -10Z" :fill="shade(-8)" />
        <path d="M110 84l18 8 -6 4 -14 -8Z" :fill="shade(12)" opacity=".7" />
        <circle cx="124" cy="118" r="10" :fill="shade(-2)" />
        <circle cx="121" cy="114" r="4.4" :fill="shade(18)" opacity=".6" />
      </g>
      <g class="part part--head">
        <path d="M62 46l14 -12 20 4 10 14 -8 16 -24 4 -14 -12Z" :fill="shade(14)" />
        <path d="M62 46l14 -12 20 4 -22 6Z" :fill="shade(30)" opacity=".8" />
        <!-- 眼：石缝里亮着两点 -->
        <ellipse cx="73" cy="48" rx="3.4" ry="2.4" :fill="shade(52)" class="eye" />
        <ellipse cx="90" cy="47" rx="3.4" ry="2.4" :fill="shade(52)" class="eye" />
      </g>
      <g class="part part--deco">
        <path d="M64 40q10 -6 22 -3q8 2 8 6q-16 4 -30 -3Z" fill="#8fae83" opacity=".92" />
        <path d="M96 62q8 -2 10 2q-6 6 -12 2Z" fill="#a3bf92" opacity=".9" />
        <path d="M52 96q-4 10 -2 16" fill="none" stroke="#8fae83" stroke-width="3" stroke-linecap="round" opacity=".8" />
        <circle cx="80" cy="96" r="3.6" fill="#eaffd8" opacity=".9" class="rune" />
        <circle cx="74" cy="102" r="1.8" fill="#eaffd8" opacity=".7" class="rune" style="animation-delay:-1.2s" />
      </g>
    </g>

    <!-- ================= 根须守卫：根须缠成躯干 ================= -->
    <g v-else-if="foe === 'warden'">
      <g class="part part--legs">
        <path d="M64 112q-8 18 -14 32M96 112q8 18 14 32M74 114q-2 18 -4 32" fill="none" :stroke="shade(-16)" stroke-width="9" stroke-linecap="round" />
      </g>
      <g class="part part--body">
        <path d="M60 60q20 -12 40 0q10 24 4 54q-24 10 -48 0q-6 -30 4 -54Z" :fill="c" />
        <path d="M66 74q14 10 30 0M64 94q16 8 32 0M68 112q12 6 24 0" fill="none" :stroke="shade(-18)" stroke-width="3" stroke-linecap="round" opacity=".7" />
      </g>
      <g class="part part--arm-l">
        <path d="M62 72q-18 6 -24 26M38 98l-8 4M38 98l-2 9" fill="none" :stroke="shade(-8)" stroke-width="7" stroke-linecap="round" />
      </g>
      <g class="part part--arm-r">
        <path d="M98 72q18 6 24 26M122 98l8 4M122 98l2 9" fill="none" :stroke="shade(-4)" stroke-width="7" stroke-linecap="round" />
      </g>
      <g class="part part--head">
        <path d="M66 46q14 -10 28 0q6 12 -2 18q-12 8 -24 0q-8 -6 -2 -18Z" :fill="shade(14)" />
        <circle cx="73" cy="52" r="2.6" :fill="shade(46)" />
        <circle cx="89" cy="52" r="2.6" :fill="shade(46)" />
      </g>
      <g class="part part--deco">
        <path d="M56 62q-4 -14 6 -18M104 64q6 -12 -2 -18" fill="none" :stroke="shade(6)" stroke-width="4" stroke-linecap="round" />
        <ellipse cx="112" cy="52" rx="5" ry="3" fill="#a8c79a" opacity=".9" :transform="'rotate(-28 112 52)'" />
      </g>
    </g>

    <!-- ================= 樱影护卫：黑剪影 + 粉边光 ================= -->
    <g v-else-if="foe === 'elite'">
      <g class="part part--cape">
        <path d="M58 64q22 -14 44 0q12 30 4 66q-24 10 -52 0q-8 -36 4 -66Z" fill="#2c1c31" />
        <path d="M58 64q22 -14 44 0q12 30 4 66q-24 10 -52 0q-8 -36 4 -66Z" fill="none" :stroke="c" stroke-width="1.8" opacity=".9" />
      </g>
      <g class="part part--body">
        <path d="M68 74q12 -8 24 0q6 20 2 46q-14 6 -28 0q-4 -26 2 -46Z" fill="#3b2541" />
      </g>
      <g class="part part--arm-l">
        <path d="M66 78q-16 8 -20 26" fill="none" stroke="#2c1c31" stroke-width="8" stroke-linecap="round" />
        <path d="M66 78q-16 8 -20 26" fill="none" :stroke="c" stroke-width="1.4" stroke-linecap="round" opacity=".75" />
      </g>
      <g class="part part--arm-r">
        <path d="M96 76q18 2 26 -14" fill="none" stroke="#2c1c31" stroke-width="8" stroke-linecap="round" />
        <path d="M96 76q18 2 26 -14" fill="none" :stroke="c" stroke-width="1.4" stroke-linecap="round" opacity=".75" />
      </g>
      <g class="part part--head">
        <path d="M68 44q12 -12 26 0q6 12 -2 18q-11 7 -22 0q-8 -6 -2 -18Z" fill="#241628" />
        <path d="M68 44q12 -12 26 0q6 12 -2 18q-11 7 -22 0q-8 -6 -2 -18Z" fill="none" :stroke="c" stroke-width="1.6" opacity=".95" />
        <path d="M73 50l6 2M87 50l-6 2" :stroke="c" stroke-width="2.2" stroke-linecap="round" />
      </g>
      <g class="part part--sword">
        <path d="M122 26l6 8 -34 52 -7 -4Z" fill="#f7e9f4" opacity=".92" />
        <path d="M122 26l6 8 -34 52 -7 -4Z" fill="none" :stroke="c" stroke-width="1.2" />
        <path d="M92 82l10 6" stroke="#2c1c31" stroke-width="5" stroke-linecap="round" />
      </g>
      <g class="part part--deco">
        <circle v-for="(s, i) in shards" :key="`sh${i}`" :cx="s[0]" :cy="s[1]" :r="s[2]" :fill="c" opacity=".55" class="mote"
                :style="{ animationDelay: `${-i * 0.6}s` }" />
      </g>
    </g>

    <!-- ================= 樱之守护灵：长袍 + 面具 + 浮空法阵 ================= -->
    <g v-else-if="foe === 'guardian'">
      <!-- 法阵：两圈反向转的虚线 + 一圈花瓣 -->
      <g class="part part--ring">
        <ellipse cx="80" cy="112" rx="66" ry="26" fill="none" :stroke="c" stroke-width="1.4" stroke-dasharray="7 10" opacity=".5" class="ring-spin" />
        <ellipse cx="80" cy="112" rx="50" ry="19" fill="none" :stroke="tint(0.45)" stroke-width="1.4" stroke-dasharray="16 12" opacity=".45" class="ring-spin ring-spin--rev" />
        <g class="orbit orbit--slow">
          <ellipse v-for="(p, i) in bossPetals" :key="`bp${i}`"
                   :cx="p.x" :cy="p.y" rx="2.4" ry="4.2"
                   :transform="`rotate(${p.tilt} ${p.x} ${p.y})`"
                   fill="#f9b8cd" opacity=".8" />
        </g>
      </g>
      <!-- 背后的光晕 -->
      <g class="part part--halo">
        <circle cx="80" cy="46" r="34" :fill="`url(#g-${uid}-glow)`" opacity=".8" />
        <ellipse cx="80" cy="46" rx="26" ry="26" fill="none" :stroke="c" stroke-width="1.2" stroke-dasharray="3 9" opacity=".55" class="ring-spin" />
      </g>
      <!-- 长袍 -->
      <g class="part part--body">
        <path d="M80 58q22 6 26 30q4 26 10 40q2 14 -8 18q-26 8 -56 0q-10 -4 -8 -18q6 -14 10 -40q4 -24 26 -30Z" :fill="`url(#g-${uid}-robe)`" />
        <!-- 领口 -->
        <path d="M68 62l12 14 12 -14q-12 -4 -24 0Z" fill="#fff" opacity=".9" />
        <path d="M80 76v34" stroke="#fff" stroke-width="1.6" opacity=".55" />
        <!-- 衣褶 -->
        <path d="M62 96q10 8 18 8M98 96q-10 8 -18 8M58 118q12 6 22 6M102 118q-12 6 -22 6" fill="none" :stroke="shade(-16)" stroke-width="1.4" opacity=".35" />
        <!-- 腰带 -->
        <path d="M64 92q16 6 32 0l2 7q-18 6 -36 0Z" :fill="c" opacity=".55" />
      </g>
      <!-- 宽袖 -->
      <g class="part part--arm-l">
        <path d="M56 72q-16 10 -20 30q8 8 18 2q4 -18 8 -26Z" :fill="`url(#g-${uid}-robe)`" opacity=".95" />
        <path d="M56 72q-16 10 -20 30" fill="none" :stroke="c" stroke-width="1.2" opacity=".5" />
        <circle cx="40" cy="106" r="4.6" fill="#fff" opacity=".85" class="mote" />
      </g>
      <g class="part part--arm-r">
        <path d="M104 72q16 10 20 30q-8 8 -18 2q-4 -18 -8 -26Z" :fill="`url(#g-${uid}-robe)`" opacity=".95" />
        <path d="M104 72q16 10 20 30" fill="none" :stroke="c" stroke-width="1.2" opacity=".5" />
        <circle cx="120" cy="106" r="4.6" fill="#fff" opacity=".85" class="mote" style="animation-delay:-1.4s" />
      </g>
      <!-- 面具 -->
      <g class="part part--head">
        <path d="M80 22q16 0 18 18q2 18 -18 24q-20 -6 -18 -24q2 -18 18 -18Z" fill="#fffaf8" />
        <path d="M80 22q16 0 18 18q2 18 -18 24q-20 -6 -18 -24q2 -18 18 -18Z" fill="none" :stroke="c" stroke-width="1.6" opacity=".85" />
        <!-- 细长的眼缝 -->
        <path d="M69 44q5 -3 10 0q-5 3 -10 0Z" :fill="c" class="eye" />
        <path d="M81 44q5 -3 10 0q-5 3 -10 0Z" :fill="c" class="eye" />
        <path d="M80 56l3 4 -3 4 -3 -4Z" :fill="c" opacity=".7" />
        <path d="M74 34l12 0" :stroke="c" stroke-width="1.4" stroke-linecap="round" opacity=".6" />
        <!-- 面具上的樱记 -->
        <circle cx="80" cy="30" r="2.2" fill="#f9b8cd" />
      </g>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  foe: { type: String, default: 'puppet' },
  color: { type: String, default: '#e0a05c' },
  label: { type: String, default: '异境生物' },
  /** idle / attack / hit / crit —— 决定内部部件怎么抖 */
  state: { type: String, default: 'idle' },
  dead: { type: Boolean, default: false }
})

/** 每只怪一个实例 id，避免 defs 里的渐变互相串 */
const uid = Math.random().toString(36).slice(2, 8)

const c = computed(() => props.color)

/* ---- 颜色小工具：同一个主色上提亮 / 压暗，整只怪的明暗关系才对得上 ---- */
function mix (hex, target, t) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const tr = (target >> 16) & 255
  const tg = (target >> 8) & 255
  const tb = target & 255
  return `rgb(${Math.round(r + (tr - r) * t)},${Math.round(g + (tg - g) * t)},${Math.round(b + (tb - b) * t)})`
}
const shade = (t) => mix(props.color, t >= 0 ? 0xffffff : 0x2a1c2e, Math.abs(t) / 100)
const tint = (t) => mix(props.color, 0xffffff, t)

const fivePetals = [0, 72, 144, 216, 288]

const swarmPetals = Array.from({ length: 24 }, (_, i) => {
  const ring = i % 3
  const r = 13 + ring * 8 + (i % 2) * 3
  const a = ((i / 24) * 360 * (ring % 2 ? -1 : 1) + i * 7) * Math.PI / 180
  return {
    x: +(80 + Math.cos(a) * r).toFixed(1),
    y: +(84 + Math.sin(a) * r * 0.92).toFixed(1),
    r,
    s: 1.05 + (i % 4) * 0.26,
    tilt: Math.round((a * 180) / Math.PI) + 90 + (-20 + (i % 5) * 10)
  }
})

const bossPetals = Array.from({ length: 12 }, (_, i) => {
  const a = ((i / 12) * 360) * Math.PI / 180
  const r = 58 + (i % 3) * 7
  return {
    x: +(80 + Math.cos(a) * r).toFixed(1),
    y: +(112 + Math.sin(a) * r * 0.4).toFixed(1),
    tilt: Math.round((a * 180) / Math.PI) + 90
  }
})

const shards = [[44, 44, 2.4], [118, 92, 2], [36, 96, 1.8], [104, 132, 1.6]]
</script>

<style scoped>
.foesprite {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 部件默认的 transform-origin：以自身盒子为参照，缩放/旋转才不会绕着画布左上角转 */
.part {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

/* ---------- 待机：呼吸 / 摆臂 / 头微动，各自不同节奏 ---------- */
.part--body { animation: foe-breathe 3.4s ease-in-out infinite; }
.part--head { animation: foe-bob 4.2s ease-in-out infinite; }
.part--arm-l { animation: foe-sway-l 3.8s ease-in-out infinite; transform-origin: 80% 8%; }
.part--arm-r { animation: foe-sway-r 4.6s ease-in-out infinite; transform-origin: 20% 8%; }
.part--deco { animation: foe-drift 6s ease-in-out infinite; }
.part--tail { animation: foe-tail 5s ease-in-out infinite; transform-origin: 50% 10%; }

@keyframes foe-breathe {
  0%, 100% { transform: scale(1, 1); }
  50% { transform: scale(1.018, 0.985); }
}
@keyframes foe-bob {
  0%, 100% { transform: translateY(0) rotate(-1.2deg); }
  50% { transform: translateY(-2px) rotate(1.2deg); }
}
@keyframes foe-sway-l {
  0%, 100% { transform: rotate(2.5deg); }
  50% { transform: rotate(-4deg); }
}
@keyframes foe-sway-r {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(4.5deg); }
}
@keyframes foe-drift {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-3px); opacity: .85; }
}
@keyframes foe-tail {
  0%, 100% { transform: rotate(-2deg) scaleX(1); }
  50% { transform: rotate(2.5deg) scaleX(1.05); }
}

/* 花瓣绕核心转：用 fill-box 中心，别用 view-box 的 px 原点（会被外层缩放带偏） */
.orbit {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: orbit-spin 9s linear infinite;
}
.orbit--slow { animation-duration: 26s; }
@keyframes orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.ring-spin {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: swirl-spin 26s linear infinite;
}
.ring-spin--rev { animation-direction: reverse; animation-duration: 18s; }
.is-guardian .part--halo .ring-spin { animation-duration: 34s; }

@keyframes swirl-spin {
  from { rotate: 0deg; }
  to { rotate: 360deg; }
}

/* 眼、光点、符文 */
.eye { animation: eye-blink 5.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes eye-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.12); }
}
.mote {
  transform-box: fill-box;
  transform-origin: center;
  animation: mote-float 4.4s ease-in-out infinite;
}
@keyframes mote-float {
  0%, 100% { transform: translateY(0); opacity: .5; }
  50% { transform: translateY(-7px); opacity: 1; }
}
.dash-ring {
  fill: none;
  stroke: #fff;
  stroke-width: 1.2;
  stroke-dasharray: 3 8;
  opacity: .5;
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: swirl-spin 14s linear infinite;
}
.rune { animation: rune-pulse 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes rune-pulse {
  0%, 100% { opacity: .5; transform: scale(.9); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* ---------- 受击：整只体后退 + 部件各自抖 ---------- */
.is-hit { animation: foe-recoil .26s cubic-bezier(.3, 1.6, .4, 1); }
.is-crit { animation: foe-recoil-crit .34s cubic-bezier(.3, 1.7, .35, 1); }
@keyframes foe-recoil {
  0% { transform: translateX(0); }
  35% { transform: translateX(9px) rotate(2deg); }
  100% { transform: translateX(0); }
}
@keyframes foe-recoil-crit {
  0% { transform: translate(0, 0) rotate(0); }
  22% { transform: translate(16px, -4px) rotate(5deg); }
  55% { transform: translate(-5px, 2px) rotate(-2deg); }
  100% { transform: translate(0, 0) rotate(0); }
}

/* 受击时部件错位：光靠整只位移还是会「一块板在动」 */
.is-hit .part--head, .is-crit .part--head { animation: part-jolt .3s ease-out; }
.is-hit .part--arm-l, .is-crit .part--arm-l { animation: part-flail-l .3s ease-out; }
.is-hit .part--arm-r, .is-crit .part--arm-r { animation: part-flail-r .3s ease-out; }
@keyframes part-jolt {
  0% { transform: translate(0, 0) rotate(0); }
  40% { transform: translate(3px, -4px) rotate(-6deg); }
  100% { transform: translate(0, 0) rotate(0); }
}
@keyframes part-flail-l {
  0% { transform: rotate(0); }
  40% { transform: rotate(-26deg); }
  100% { transform: rotate(0); }
}
@keyframes part-flail-r {
  0% { transform: rotate(0); }
  40% { transform: rotate(24deg); }
  100% { transform: rotate(0); }
}

/* ---------- 死亡：部件错开散开，不能同时消失 ---------- */
.is-dead .part { animation: part-scatter .5s cubic-bezier(.4, .1, .7, 1) forwards; }
.is-dead .part--head { animation-delay: .02s; }
.is-dead .part--arm-l { animation-delay: .09s; }
.is-dead .part--arm-r { animation-delay: .14s; }
.is-dead .part--deco { animation-delay: .06s; }
.is-dead .part--tail { animation-delay: .11s; }
.is-dead .part--leg-l { animation-delay: .16s; }
.is-dead .part--legs { animation-delay: .16s; }
.is-dead .part--leg-r { animation-delay: .2s; }
.is-dead .part--sword { animation-delay: .12s; }
.is-dead .part--cape { animation-delay: .18s; }
.is-dead .part--ring { animation-delay: .22s; }
.is-dead .part--halo { animation-delay: .26s; }
@keyframes part-scatter {
  0% { opacity: 1; transform: translate(0, 0) rotate(0) scale(1); }
  100% { opacity: 0; transform: translate(var(--sx, 14px), var(--sy, -26px)) rotate(var(--sr, 32deg)) scale(.86); }
}
/* 每类部件散的方向不同，才不会像同一张图整体淡出 */
.is-dead .part--head { --sx: -10px; --sy: -46px; --sr: -40deg; }
.is-dead .part--arm-l { --sx: -42px; --sy: -18px; --sr: -52deg; }
.is-dead .part--arm-r { --sx: 44px; --sy: -14px; --sr: 48deg; }
.is-dead .part--deco { --sx: 6px; --sy: -58px; --sr: 18deg; }
.is-dead .part--body { --sx: 0px; --sy: -10px; --sr: 8deg; }
.is-dead .part--tail { --sx: 0px; --sy: 12px; --sr: -6deg; }
.is-dead .part--leg-l { --sx: -22px; --sy: 6px; --sr: -30deg; }
.is-dead .part--leg-r { --sx: 24px; --sy: 8px; --sr: 28deg; }

/* 关掉系统动效时：只保留受击位移，不做循环呼吸 */
@media (prefers-reduced-motion: reduce) {
  .part, .swirl, .eye, .mote, .rune { animation: none !important; }
}
</style>
