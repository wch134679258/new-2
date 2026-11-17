<template>
  <div class="town-page">
    <SiteNav :user="user" active="town" @go="$emit('navigate', $event)" @logout="$emit('logout')" />

    <main class="town" :class="{ 'town--gust': gusting, 'is-flipping': flipping }">
      <!-- 天空底色：等距地图四周留出的天空由 CSS 负责，SVG 只画云 -->
      <div class="town__sky" aria-hidden="true">
        <i class="sky__sun"></i>
      </div>

      <div ref="stageEl" class="town__stage" :style="stageStyle">
        <!-- 整座小镇是一块浮在天空里的等距小岛，全部 2:1 斜轴投影手绘 -->
        <svg
          class="town__svg"
          :viewBox="vbStr"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="俯瞰视角的樱花小镇：中央是喷泉广场，四周分布书店、便利店、健身房、公园和一栋小屋，每栋都可以点击进入"
          @pointermove="onPointerMove"
          @pointerleave="onPointerLeave"
        >
          <defs>
            <linearGradient id="grassGrad" x1="0" y1="0" x2=".3" y2="1">
              <stop offset="0" stop-color="#dbe6c4" />
              <stop offset=".55" stop-color="#c7d7ad" />
              <stop offset="1" stop-color="#aec493" />
            </linearGradient>
            <linearGradient id="cliffR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#b79cae" />
              <stop offset="1" stop-color="#8f7690" />
            </linearGradient>
            <linearGradient id="cliffL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#9a7f99" />
              <stop offset="1" stop-color="#74617d" />
            </linearGradient>
            <linearGradient id="bellyGrad" x1=".5" y1="0" x2=".5" y2="1">
              <stop offset="0" stop-color="#83708a" />
              <stop offset=".55" stop-color="#6f5c78" />
              <stop offset="1" stop-color="#544660" />
            </linearGradient>
            <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f6e8dd" />
              <stop offset="1" stop-color="#e9d3cc" />
            </linearGradient>
            <radialGradient id="plazaGrad" cx=".38" cy=".3" r=".8">
              <stop offset="0" stop-color="#f7ece4" />
              <stop offset="1" stop-color="#e2cbc7" />
            </radialGradient>
            <radialGradient id="waterGrad" cx=".4" cy=".35" r=".8">
              <stop offset="0" stop-color="#d8eef2" />
              <stop offset=".6" stop-color="#a9d3de" />
              <stop offset="1" stop-color="#8dbfce" />
            </radialGradient>
            <radialGradient id="canopy" cx=".38" cy=".3" r=".78">
              <stop offset="0" stop-color="#ffe9ec" />
              <stop offset=".5" stop-color="#ffcad6" />
              <stop offset="1" stop-color="#f2a2b8" />
            </radialGradient>
            <radialGradient id="canopyLit" cx=".34" cy=".26" r=".8">
              <stop offset="0" stop-color="#fff6f4" />
              <stop offset=".55" stop-color="#ffdbe2" />
              <stop offset="1" stop-color="#f7b3c4" />
            </radialGradient>
            <linearGradient id="fallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#bfe3ef" />
              <stop offset=".55" stop-color="#d7eef7" />
              <stop offset="1" stop-color="#f2fbfe" stop-opacity=".25" />
            </linearGradient>
            <radialGradient id="lampGlow">
              <stop offset="0" stop-color="#fff3c9" stop-opacity=".9" />
              <stop offset=".35" stop-color="#ffe3ad" stop-opacity=".42" />
              <stop offset="1" stop-color="#ffe3ad" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="sunGlow">
              <stop offset="0" stop-color="#fff5da" stop-opacity=".85" />
              <stop offset="1" stop-color="#fff5da" stop-opacity="0" />
            </radialGradient>
            <filter id="blurSm" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <clipPath id="islandClip">
              <path :d="island.grass" />
            </clipPath>
          </defs>

          <!-- 天空里的云：落在岛后面，慢慢横移 -->
          <g class="clouds" aria-hidden="true">
            <g class="cloud cloud--a" fill="#fff9f6" opacity=".72">
              <ellipse cx="196" cy="92" rx="86" ry="21" />
              <ellipse cx="162" cy="82" rx="44" ry="24" />
              <ellipse cx="228" cy="78" rx="52" ry="27" />
            </g>
            <g class="cloud cloud--b" fill="#fff7f4" opacity=".56">
              <ellipse cx="762" cy="66" rx="96" ry="19" />
              <ellipse cx="726" cy="56" rx="42" ry="22" />
              <ellipse cx="800" cy="53" rx="50" ry="24" />
            </g>
            <g class="cloud cloud--c" fill="#fffaf7" opacity=".44">
              <ellipse cx="520" cy="34" rx="72" ry="15" />
              <ellipse cx="492" cy="27" rx="34" ry="18" />
            </g>
          </g>

          <!-- ---------- 小岛本体 ---------- -->
          <g class="island">
            <path :d="island.belly" fill="url(#bellyGrad)" />
            <g class="island__rock" opacity=".28">
              <path v-for="(d, i) in island.rockLines" :key="`rk${i}`" :d="d" fill="none"
                    stroke="#4d3c54" stroke-width="1.4" stroke-linecap="round" />
            </g>
            <path :d="island.cliffLeft" fill="url(#cliffL)" />
            <path :d="island.cliffRight" fill="url(#cliffR)" />
            <path :d="island.grass" fill="url(#grassGrad)" />
          </g>

          <!-- ---------- 地面：网格、草地、广场、道路、水、花圃 ---------- -->
          <g clip-path="url(#islandClip)">
            <path :d="ground.grid" fill="none" stroke="#ffffff" stroke-width="1" opacity=".22" />

            <g fill="#a9c08c" opacity=".45">
              <ellipse v-for="(p, i) in ground.patches" :key="`pt${i}`" :cx="p.cx" :cy="p.cy" :rx="p.rx" :ry="p.ry" />
            </g>
            <path v-for="(d, i) in ground.tufts" :key="`tf${i}`" :d="d" fill="none"
                  stroke="#9cb583" stroke-width="1.5" stroke-linecap="round" opacity=".75" />

            <!-- 公园的草地（先铺，后面再压路和池子） -->
            <path :d="park.patch" fill="#b8cda0" opacity=".95" />
            <path :d="park.patch" fill="none" stroke="#9cb383" stroke-width="2.4" stroke-dasharray="7 9" opacity=".85" />

            <!-- 中央广场 -->
            <ellipse :cx="plaza.cx" :cy="plaza.cy" :rx="plaza.rx + 8" :ry="plaza.ry + 4"
                     fill="#c3a6a8" opacity=".6" />
            <ellipse :cx="plaza.cx" :cy="plaza.cy" :rx="plaza.rx" :ry="plaza.ry" fill="url(#plazaGrad)" />
            <ellipse :cx="plaza.cx" :cy="plaza.cy" :rx="plaza.rx - 13" :ry="plaza.ry - 6.5"
                     fill="none" stroke="#cbaba9" stroke-width="1.8" stroke-dasharray="7 9" opacity=".95" />

            <!-- 通往各家的小路：先铺一层土色边，再压一层亮面 -->
            <g v-for="(r, i) in ground.roads" :key="`rd${i}`">
              <path :d="r.edge" fill="#b79aa3" opacity=".8" />
              <path :d="r.body" fill="url(#pathGrad)" />
            </g>

            <!-- 公园的水池 -->
            <path :d="park.water" fill="url(#waterGrad)" stroke="#84b2c2" stroke-width="2.4" />
            <g class="water__shimmer" opacity=".7">
              <path v-for="(d, i) in park.ripples" :key="`wp${i}`" :d="d" fill="none"
                    stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
            </g>

            <!-- 小溪 -->
            <path :d="stream.bank" fill="#c1a7ae" opacity=".5" />
            <path :d="stream.water" fill="url(#waterGrad)" />
            <g opacity=".6">
              <path v-for="(d, i) in stream.ripples" :key="`sr${i}`" :d="d" fill="none"
                    stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
            </g>

            <!-- 花圃 -->
            <g v-for="(f, i) in ground.flowerBeds" :key="`fb${i}`">
              <ellipse :cx="f.cx" :cy="f.cy" :rx="f.rx" :ry="f.ry" fill="#a2b98a" opacity=".55" />
              <circle v-for="(pt, j) in f.points" :key="`p${j}`" :cx="pt[0]" :cy="pt[1]" :r="pt[2]"
                      :fill="pt[3]" opacity=".95" />
            </g>
          </g>

          <!-- 岛边的小瀑布：溪水从这里落进云里 -->
          <g class="waterfall">
            <path :d="waterfall.sheet" fill="url(#fallGrad)" opacity=".95" />
            <path :d="waterfall.shine" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity=".7" />
            <ellipse v-for="(f, i) in waterfall.foam" :key="`fm${i}`" :cx="f.cx" :cy="f.cy" :rx="f.rx" :ry="f.ry"
                     fill="#eaf7fc" opacity=".45" />
          </g>

          <!-- 岛的边缘高光，让草地有个厚度 -->
          <path :d="island.rim" fill="none" stroke="#eaf0d9" stroke-width="3" opacity=".7" />

          <!-- ---------- 场景道具：按 x+y 排序，近的压远的 ---------- -->
          <g class="props">
            <g v-for="p in scene" :key="p.id">
              <!-- 可点击的建筑 -->
              <g
                v-if="p.type === 'venue'"
                class="venue"
                :class="{ 'is-hot': hover === p.key }"
                role="button"
                tabindex="0"
                :aria-label="`进入${p.label}`"
                @pointerenter="hover = p.key"
                @pointerleave="hover = null"
                @focus="hover = p.key"
                @blur="hover = null"
                @click="go(p.key)"
                @keyup.enter="go(p.key)"
              >
                <path class="venue__shadow" :d="p.shadow" fill="#6b4b69" opacity=".2" filter="url(#blurSm)" />
                <path class="venue__halo" :d="p.halo" fill="#fff6fb" opacity=".0" />
                <g class="venue__body">
                  <path :d="p.faces.left" :fill="p.wallL" />
                  <path :d="p.faces.right" :fill="p.wallR" />
                  <path
                    v-for="(dc, i) in p.deco"
                    :key="`dc${i}`"
                    :d="dc.d"
                    :fill="dc.fill || 'none'"
                    :stroke="dc.stroke || 'none'"
                    :stroke-width="dc.sw || 0"
                    :opacity="dc.opacity == null ? 1 : dc.opacity"
                  />
                  <path v-for="(rp, i) in p.roofParts" :key="`rf${i}`" :d="rp.d" :fill="rp.fill" />
                </g>
              </g>

              <!-- 樱花树：点一下会落一阵花雨 -->
              <g v-else-if="p.type === 'tree'" class="tree" @click="burstPetals" role="button" tabindex="0"
                 aria-label="摇一摇樱花树" @keyup.enter="burstPetals">
                <ellipse :cx="p.bx + 6 * p.s" :cy="p.by" :rx="30 * p.s" :ry="12 * p.s" fill="#6b4b69" opacity=".2" />
                <path :d="p.trunk" fill="#6f4e59" />
                <path :d="p.branch" fill="none" stroke="#6f4e59" stroke-width="2.6" stroke-linecap="round" />
                <ellipse
                  v-for="(b, i) in p.blobs"
                  :key="`b${i}`"
                  :cx="b.cx" :cy="b.cy" :rx="b.rx" :ry="b.ry"
                  :fill="b.fill" :opacity="b.opacity"
                />
                <circle v-for="(d, i) in p.dots" :key="`dt${i}`" :cx="d[0]" :cy="d[1]" :r="d[2]"
                        fill="#fff2f3" opacity=".8" />
              </g>

              <!-- 路灯 -->
              <g v-else-if="p.type === 'lamp'">
                <ellipse :cx="p.bx + 4" :cy="p.by" rx="13" ry="5" fill="#6b4b69" opacity=".16" />
                <path :d="p.pole" fill="none" stroke="#6b4b62" stroke-width="3.2" stroke-linecap="round" />
                <circle :cx="p.bx" :cy="p.by - 48" r="16" fill="url(#lampGlow)" />
                <path :d="p.head" fill="#ffe8b4" stroke="#6b4b62" stroke-width="1.8" />
                <path :d="p.cap" fill="none" stroke="#6b4b62" stroke-width="2" stroke-linecap="round" />
              </g>

              <!-- 长椅 -->
              <g v-else-if="p.type === 'bench'">
                <ellipse :cx="p.bx + 3" :cy="p.by" rx="18" ry="7" fill="#6b4b69" opacity=".16" />
                <path :d="p.seat" fill="#d5a888" />
                <path :d="p.back" fill="#c1937a" />
                <path :d="p.legs" fill="none" stroke="#8a6a5a" stroke-width="2.6" stroke-linecap="round" />
              </g>

              <!-- 灌木 -->
              <g v-else-if="p.type === 'bush'">
                <ellipse :cx="p.bx + 3" :cy="p.by" rx="15" ry="6" fill="#6b4b69" opacity=".14" />
                <ellipse :cx="p.bx - 7" :cy="p.by - 7" rx="11" ry="8" fill="#a3bb8c" />
                <ellipse :cx="p.bx + 8" :cy="p.by - 8" rx="10" ry="8" fill="#b5c9a0" />
                <ellipse :cx="p.bx" :cy="p.by - 14" rx="10" ry="8" fill="#adc496" />
                <circle :cx="p.bx - 6" :cy="p.by - 12" r="2.4" fill="#ffd3de" />
                <circle :cx="p.bx + 7" :cy="p.by - 13" r="2" fill="#fff0e6" />
              </g>

              <!-- 小溪上的石桥 -->
              <g v-else-if="p.type === 'bridge'">
                <path :d="p.side" fill="#a98d83" />
                <path :d="p.deck" fill="#e0c9b5" />
                <path :d="p.grain" fill="none" stroke="#c2a693" stroke-width="1.4" />
                <path :d="p.rail" fill="none" stroke="#7d5c53" stroke-width="2.4" stroke-linecap="round" />
                <path :d="p.posts" fill="none" stroke="#7d5c53" stroke-width="2.2" stroke-linecap="round" />
              </g>

              <!-- 凉亭 -->
              <g v-else-if="p.type === 'gazebo'">
                <path :d="p.shadow" fill="#6b4b69" opacity=".18" />
                <path v-for="(pp, i) in p.parts" :key="`gz${i}`" :d="pp.d" :fill="pp.fill" />
              </g>

              <!-- 小箱子：贩卖机 / 杂物 -->
              <g v-else-if="p.type === 'box'">
                <path v-for="(pp, i) in p.parts" :key="`bp${i}`" :d="pp.d" :fill="pp.fill" />
                <path v-if="p.glow" :d="p.glow" fill="rgba(255, 240, 198, .9)" />
                <path v-if="p.cap" :d="p.cap" fill="#f5a3b3" />
              </g>

              <!-- 铁轨 -->
              <g v-else-if="p.type === 'track'">
                <path v-for="(pp, i) in p.parts" :key="`tk${i}`" :d="pp.d"
                      :fill="pp.fill || 'none'" :stroke="pp.stroke || 'none'" :stroke-width="pp.sw || 0" />
              </g>

              <!-- 停靠的小电车 -->
              <g v-else-if="p.type === 'train'" class="train">
                <path v-for="(pp, i) in p.parts" :key="`tn${i}`" :d="pp.d" :fill="pp.fill || 'none'" />
              </g>

              <!-- 石头 -->
              <g v-else-if="p.type === 'rock'">
                <path :d="p.body" fill="#b7a7bd" />
                <path :d="p.lit" fill="#cbbcd0" />
              </g>

              <!-- 广场喷泉 -->
              <g v-else-if="p.type === 'fountain'" class="fountain">
                <ellipse :cx="p.bx + 4" :cy="p.by + 2" rx="40" ry="19" fill="#6b4b69" opacity=".14" />
                <path :d="p.basinOuter" fill="#dcc6c4" />
                <path :d="p.water" fill="url(#waterGrad)" />
                <path :d="p.basinInner" fill="none" stroke="#f4e3de" stroke-width="2" opacity=".8" />
                <path :d="p.column" fill="#e6d2cf" />
                <path :d="p.columnShade" fill="#c9aeae" />
                <ellipse :cx="p.bx" :cy="p.by - 36" rx="15" ry="7.5" fill="#e8d3cf" />
                <ellipse :cx="p.bx" :cy="p.by - 38" rx="11" ry="5.4" fill="#b6dde8" />
                <g class="fountain__jet" stroke="#ffffff" stroke-width="1.8" fill="none" opacity=".75" stroke-linecap="round">
                  <path :d="p.jetLeft" />
                  <path :d="p.jetRight" />
                </g>
              </g>

              <!-- 公园里站着的小人：纯爷们不用建模，几笔剪影就够 -->
              <g v-else-if="p.type === 'walker'" class="walker">
                <ellipse :cx="p.bx + 2" :cy="p.by" rx="11" ry="5" fill="#6b4b69" opacity=".2" />
                <ellipse :cx="p.bx" :cy="p.by" rx="15" ry="6" fill="none" stroke="#fff4f9" stroke-width="1.6"
                         class="walker__ring" />
                <path :d="p.body" fill="#e2919f" />
                <circle :cx="p.bx" :cy="p.by - 30" r="7.6" fill="#ffe3d2" />
                <path :d="p.hair" fill="#584152" />
              </g>
            </g>
          </g>
        </svg>

        <!-- 建筑名牌：放在 HTML 层，字号不随 SVG 缩放，手机上也可读 -->
        <div class="hotspots">
          <button
            v-for="s in spots"
            :key="s.key"
            type="button"
            class="hotspot"
            :class="{ 'is-hot': hover === s.key }"
            :style="{ left: s.px + 'px', top: s.py + 'px' }"
            @pointerenter="hover = s.key"
            @pointerleave="hover = null"
            @click="go(s.key)"
          >
            <span class="hotspot__cn">{{ s.label }}</span>
            <span class="hotspot__en">{{ s.en }}</span>
            <i class="hotspot__tail"></i>
          </button>
        </div>
      </div>

      <!-- 左右翻页箭头：切到下一个街区 -->
      <button
        class="mapnav mapnav--prev"
        type="button"
        aria-label="上一张地图"
        @click="prevPage"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
          <path d="M14.5 5 7.5 12l7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        class="mapnav mapnav--next"
        type="button"
        aria-label="下一张地图"
        @click="nextPage"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
          <path d="M9.5 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- 底部页签：全景 / 本町 / 商店街 / 学校·车站 -->
      <nav class="mapdots" aria-label="地图分页">
        <button
          v-for="(p, i) in PAGE_DEFS"
          :key="p.key"
          type="button"
          class="mapdot"
          :class="{ 'is-on': i === page }"
          :aria-current="i === page ? 'true' : 'false'"
          @click="goPage(i)"
        >
          <b>{{ p.label }}</b>
          <i>{{ p.en }}</i>
        </button>
        <span class="mapdots__hint">← → 切换地图</span>
      </nav>

      <!-- 钱包胶囊：金币 / 体力，和各个店铺页面共用同一份状态 -->
      <div class="town__wallet" aria-label="钱包状态">
        <span class="tw__coin"><i>¥</i>{{ wallet.money }}</span>
        <span class="tw__sep"></span>
        <span class="tw__energy">
          <b>{{ wallet.energy }}</b><i>/{{ wallet.energyMax }}</i>
          <em>体力</em>
        </span>
        <span class="tw__sep"></span>
        <span class="tw__mood">
          <b :style="{ color: moodMeta.color }">{{ mood }}</b>
          <em>心情 · {{ moodMeta.label }}</em>
        </span>
      </div>

      <!-- 真实花瓣动画层 -->
      <canvas ref="petalCanvas" class="town__petals" aria-hidden="true"></canvas>

      <!-- 首页文案 -->
      <section class="town__intro">
        <p class="town__eyebrow"><span></span>SAKURA TOWN · 樱花小镇</p>
        <h1>点一下，<br /><em>走进任何一间屋。</em></h1>
        <p class="town__lede">
          从上往下看，小镇只有巴掌大 —— 九间屋子、一座公园，还有一条开往海边的铁轨。
        </p>
        <div class="town__actions">
          <button class="town__primary" type="button" @click="go('home')">
            走进书店
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <button class="town__secondary" type="button" @click="go('park')">去公园坐坐</button>
        </div>
        <p class="town__click-hint"><span>✦</span>点建筑进屋，点樱花树撒一场花</p>

        <!-- 属性速览：完整面板在各栋楼页面的 HUD 里 -->
        <div class="town__stats">
          <p class="town__stats-title">称号 · <b>{{ title }}</b></p>
          <ul class="town__stats-list">
            <li v-for="s in visibleStats" :key="s.key" :title="`${s.label} ${stats[s.key]}（Lv.${levelOf(s.key)}）`">
              <span class="town__stats-dot" :style="{ background: s.color }"></span>
              <em>{{ s.label }}</em>
              <b>{{ stats[s.key] }}</b>
            </li>
          </ul>
        </div>
      </section>

      <p class="town__foot">SAKURA NOTE · A LITTLE TOWN FOR SLOW DAYS</p>
      <div class="town__vig" aria-hidden="true"></div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { stats, visibleStats, levelOf, title, mood, moodMeta } from '../composables/useStats'
import { motionEnabled } from '../composables/useMotion'
import { useEconomy } from '../composables/useEconomy'
import SiteNav from './SiteNav.vue'

defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['navigate', 'logout'])

// 金币 / 体力：和小镇其它页面共用同一份单例，逛一圈回来数字也是对的
const { wallet, refresh: refreshWallet, startTicker } = useEconomy()

/** 场景跳转：统一走 App.vue 的 navigate 事件 */
function go (key) { emit('navigate', key) }

/* =========================================================
   等距（2:1 斜轴）投影 —— 整张地图的地基
   gx 往画面右下、gy 往画面左下，高度 z 直接减在屏幕上。
   这是标准的 2.5D 平行投影：没有透视缩放，所以远近一样大，
   看起来像游戏里的俯视地图，但每栋楼都有正面和侧面。
   ========================================================= */
// 取景框：故意比小岛窄一点 —— 菱形岛的四个角全是空的，
// 不收紧的话镇子只占屏幕中间一小块。裁掉的是上方天空与前方崖底，建筑全在框内。
const VBX = -96
const VBY = 196
const VBW = 1188
const VBH = 660
const HW = 33        // 半格宽
const HH = 16.5      // 半格高（2:1）
const OX = 500       // 格子原点在画布上的位置
const OY = 150
const G = 21         // 21 x 21 格（前后两翼是新街区：学校 / 车站）

const round1 = (n) => Math.round(n * 10) / 10
const P = (p) => `${round1(p[0])} ${round1(p[1])}`
/** 格坐标 (gx, gy) + 高度 z → 屏幕坐标 */
function ip (x, y, z = 0) {
  return [OX + (x - y) * HW, OY + (x + y) * HH - z]
}
const poly = (pts) => 'M' + pts.map(P).join('L') + 'Z'
/** 屏幕坐标系里的椭圆（挂钟、配重片这类圆件用） */
function ellipsePath (cx, cy, rx, ry) {
  return `M${round1(cx - rx)} ${round1(cy)}a${round1(rx)} ${round1(ry)} 0 1 0 ${round1(rx * 2)} 0a${round1(rx)} ${round1(ry)} 0 1 0 ${round1(-rx * 2)} 0Z`
}

/* ---------- 小岛 ---------- */
const RIM = 26       // 岛的侧壁厚度
const cTop = ip(0, 0)
const cRight = ip(G, 0)
const cBottom = ip(G, G)
const cLeft = ip(0, G)
const rimDepth = -RIM
const cb = ip(G, G, rimDepth)   // 岛底那个前角，岛底曲线都以它为基准

const island = {
  grass: poly([cTop, cRight, cBottom, cLeft]),
  cliffRight: poly([ip(G, 0, 0), ip(G, G, 0), ip(G, G, rimDepth), ip(G, 0, rimDepth)]),
  cliffLeft: poly([ip(0, G, 0), ip(G, G, 0), ip(G, G, rimDepth), ip(0, G, rimDepth)]),
  // 岛底：从两个侧角往中间吊成一坨岩石（控制点跟着底角算，改格数不用重画）
  belly: `M${P(ip(0, G, rimDepth))}L${P(ip(G, G, rimDepth))}L${P(ip(G, 0, rimDepth))}` +
    `Q${P([cb[0] + 272, cb[1] + 30])} ${P([cb[0] + 24, cb[1] + 56])}` +
    `Q${P([cb[0] - 258, cb[1] + 22])} ${P(ip(0, G, rimDepth))}Z`,
  rim: `M${P(cLeft)}L${P(cTop)}L${P(cRight)}`,
  rockLines: [
    `M${P([cb[0] - 66, cb[1] - 108])}Q${P([cb[0] - 30, cb[1] - 74])} ${P([cb[0] - 46, cb[1] - 34])}`,
    `M${P([cb[0] + 58, cb[1] - 112])}Q${P([cb[0] + 88, cb[1] - 78])} ${P([cb[0] + 72, cb[1] - 36])}`,
    `M${P([cb[0] + 330, cb[1] - 190])}Q${P([cb[0] + 286, cb[1] - 128])} ${P([cb[0] + 250, cb[1] - 64])}`,
    `M${P([cb[0] - 320, cb[1] - 190])}Q${P([cb[0] - 276, cb[1] - 128])} ${P([cb[0] - 240, cb[1] - 60])}`
  ]
}

/* ---------- 地面：网格 / 广场 / 道路 ---------- */
const gridLines = []
for (let i = 1; i < G; i++) {
  gridLines.push(`M${P(ip(i, 0))}L${P(ip(i, G))}`)
  gridLines.push(`M${P(ip(0, i))}L${P(ip(G, i))}`)
}

/** 把一条折线撑成有宽度的带状（宽度按屏幕像素算），用来铺路 */
function ribbon (pts, w) {
  const s = pts.map(([x, y]) => ip(x, y))
  const left = []
  const right = []
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)]
    const b = s[Math.min(s.length - 1, i + 1)]
    let dx = b[0] - a[0]
    let dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    const hw = w / 2
    left.push([s[i][0] - dy * hw, s[i][1] + dx * hw])
    right.push([s[i][0] + dy * hw, s[i][1] - dx * hw])
  }
  const pts2 = [...left, ...right.reverse()]
  return 'M' + pts2.map(P).join('L') + 'Z'
}

// 广场圆心：略微靠前，避免被前排的房子和树整个盖住
const PCX = 8.5
const PCY = 8.5
const plazaC = ip(PCX, PCY)
const plaza = { cx: plazaC[0], cy: plazaC[1], rx: 88, ry: 44 }

const ROADS = [
  // 书店（左后方）
  { pts: [[6.64, 8.14], [5.8, 7.98], [5.2, 7.88]], w: 34 },
  // 便利店（正后方）
  { pts: [[7.71, 6.77], [7.05, 5.4], [6.55, 4.15]], w: 34 },
  // 家（右侧）
  { pts: [[10.4, 8.39], [11.2, 8.34], [11.95, 8.3]], w: 34 },
  // 健身房（左前方）
  { pts: [[7.53, 10.13], [6.6, 11.7], [5.7, 13.25]], w: 36 },
  // 公园（右前方）
  { pts: [[9.39, 10.18], [9.75, 10.9], [10.1, 11.55]], w: 40 },
  // 凉亭（右后方）
  { pts: [[9.91, 7.23], [11.2, 5.8], [12.4, 4.6], [13.3, 4.0]], w: 30 },
  // 学校（右翼）
  { pts: [[10.2, 8.0], [12.4, 7.3], [14.6, 6.4], [16.6, 5.8]], w: 34 },
  // 车站（前场，从广场下来的缓坡）
  { pts: [[9.4, 10.3], [8.6, 12.2], [8.2, 14.3], [9.2, 15.9], [10.9, 16.4]], w: 36 },
  // 商店街（右前方：咖啡馆 / 甜品屋门口）
  { pts: [[10.6, 10.6], [12.4, 12.2], [14.6, 13.8], [17.4, 14.4], [19.6, 13.8]], w: 32 },
  // 站前花店的小径
  { pts: [[9.2, 15.9], [9.4, 17.0], [9.2, 18.0]], w: 26 }
]
const roads = ROADS.map((r) => ({
  edge: ribbon(r.pts, r.w + 9),
  body: ribbon(r.pts, r.w)
}))

// 花圃：沿路撒几簇，给地面加点颜色
const flowerColors = ['#ffd4e5', '#e4c6f0', '#fff1db', '#d5e3cf', '#ffc0b0']
const BED_SPECS = [
  [4.0, 8.6], [9.8, 4.6], [2.6, 3.0], [7.4, 11.6], [14.6, 9.0], [6.0, 7.2],
  [11.8, 2.4], [1.4, 15.4], [15.8, 4.0], [8.6, 6.2], [12.6, 9.2], [5.0, 16.2],
  [15.0, 12.6], [18.2, 15.0], [19.8, 18.0], [4.2, 19.4]
]
const flowerBeds = BED_SPECS.map(([gx, gy], i) => {
  const [cx, cy] = ip(gx, gy)
  const rx = 26 + (i % 3) * 6
  const ry = rx / 2
  const points = []
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + i
    points.push([
      round1(cx + Math.cos(a) * rx * 0.72),
      round1(cy + Math.sin(a) * ry * 0.72),
      round1(2.4 + (k % 3) * 0.9),
      flowerColors[(k + i) % flowerColors.length]
    ])
  }
  return { cx, cy, rx, ry, points }
})

// 草地上深浅不一的斑块，避免一大片死平的颜色
const PATCH_SPECS = [
  [3.0, 3.2, 1.6], [6.6, 5.2, 1.3], [11.4, 4.4, 1.4], [13.6, 8.4, 1.1],
  [4.2, 12.8, 1.3], [7.8, 11.0, 1.0], [14.4, 6.0, 1.0], [1.0, 9.6, 0.9],
  [9.2, 6.6, 1.2], [15.4, 10.4, 0.9], [5.8, 14.8, 1.0], [2.4, 16.0, 0.8]
]
const patches = PATCH_SPECS.map(([gx, gy, r]) => {
  const [cx, cy] = ip(gx, gy)
  return { cx, cy, rx: r * 46, ry: r * 23 }
})

// 草丛：三根短线，插在空地上，比纯色草地耐看
const TUFT_SPECS = [
  [1.2, 1.8], [3.0, 2.2], [5.8, 4.6], [10.2, 3.0], [14.2, 2.6], [0.8, 5.6],
  [0.7, 8.6], [2.6, 7.4], [5.2, 9.4], [6.6, 12.5], [9.0, 7.5], [12.9, 6.6],
  [12.6, 8.6], [4.4, 13.4], [12.8, 11.4], [7.6, 3.9], [3.6, 12.0], [11.2, 5.6],
  [0.5, 16.2], [2.2, 9.4], [16.2, 2.2], [9.4, 15.4], [13.6, 11.0], [6.2, 16.2],
  [15.2, 3.4], [4.6, 6.4]
]
const tufts = TUFT_SPECS.map(([gx, gy], i) => {
  const [bx, by] = ip(gx, gy)
  const k = 0.8 + (i % 3) * 0.18
  return `M${P([bx - 4 * k, by])}q${-1} ${-5 * k} ${-3 * k} ${-7 * k}` +
    `M${P([bx, by])}q${0} ${-6 * k} ${1 * k} ${-9 * k}` +
    `M${P([bx + 4 * k, by])}q${2 * k} ${-4 * k} ${4 * k} ${-6 * k}`
})

const ground = {
  grid: gridLines.join(''),
  roads,
  flowerBeds,
  patches,
  tufts
}

/* ---------- 小溪：从左前方的空地流到岛边，再顺着崖壁落下去 ---------- */
const STREAM_PTS = [[0.1, 10.8], [0.9, 12.6], [2.2, 14.3], [3.6, 15.7], [5.2, 17.0], [6.3, 19.2], [6.9, 21.0]]
const stream = {
  bank: ribbon(STREAM_PTS, 38),
  water: ribbon(STREAM_PTS, 26),
  ripples: [0, 1, 2].map((i) => {
    const [x, y] = ip(0.8 + i * 1.3, 12.4 + i * 1.3)
    return `M${P([x - 8, y + 2])}q8 -5 16 0`
  })
}

// 瀑布：溪水出了岛就往下掉，落在半空里
const waterfall = (() => {
  const [fx, fy] = ip(6.9, 21.0)
  return {
    sheet: `M${P([fx - 13, fy - 1])}C${P([fx - 12, fy + 18])} ${P([fx - 9, fy + 32])} ${P([fx - 7, fy + 42])}` +
      `L${P([fx + 9, fy + 42])}C${P([fx + 11, fy + 30])} ${P([fx + 13, fy + 16])} ${P([fx + 14, fy - 1])}Z`,
    shine: `M${P([fx - 4, fy + 5])}q2 18 3 34`,
    foam: [
      { cx: round1(fx + 2), cy: round1(fy + 47), rx: 19, ry: 7 },
      { cx: round1(fx - 11), cy: round1(fy + 42), rx: 10, ry: 4.5 },
      { cx: round1(fx + 15), cy: round1(fy + 40), rx: 9, ry: 4 }
    ]
  }
})()

/* ---------- 小溪上的石桥 ---------- */
const bridge = (() => {
  const [bx, by] = ip(2.16, 14.24)
  return {
    type: 'bridge',
    id: 'bridge',
    depth: 2.16 + 14.24,
    bx,
    deck: poly([[bx - 28, by - 10], [bx + 28, by - 16], [bx + 28, by - 3], [bx - 28, by + 3]]),
    side: poly([[bx - 28, by + 3], [bx + 28, by - 3], [bx + 28, by + 3], [bx - 28, by + 9]]),
    grain: `M${P([bx - 22, by - 1])}L${P([bx + 24, by - 7])}M${P([bx - 22, by + 1])}L${P([bx + 24, by - 5])}`,
    rail: `M${P([bx - 28, by - 10])}L${P([bx + 28, by - 16])}`,
    posts: `M${P([bx - 26, by - 16])}v7M${P([bx + 26, by - 22])}v7`
  }
})()

/* ---------- 公园：自己的一块草地 + 水池 ---------- */
const parkSpec = { x: 10.0, y: 11.2, w: 3.8, d: 3.4 }
const wC = ip(11.25, 12.35)
const park = {
  patch: poly([
    ip(parkSpec.x, parkSpec.y), ip(parkSpec.x + parkSpec.w, parkSpec.y),
    ip(parkSpec.x + parkSpec.w, parkSpec.y + parkSpec.d), ip(parkSpec.x, parkSpec.y + parkSpec.d)
  ]),
  water: `M${P([wC[0] - 52, wC[1]])}C${P([wC[0] - 52, wC[1] - 26])} ${P([wC[0] - 20, wC[1] - 30])} ${P([wC[0] + 6, wC[1] - 24])}` +
    `C${P([wC[0] + 42, wC[1] - 16])} ${P([wC[0] + 50, wC[1] + 8])} ${P([wC[0] + 26, wC[1] + 18])}` +
    `C${P([wC[0] - 4, wC[1] + 28])} ${P([wC[0] - 44, wC[1] + 22])} ${P([wC[0] - 52, wC[1] + 4])}Z`,
  ripples: [
    `M${P([wC[0] - 28, wC[1] - 8])}q14 -6 28 0`,
    `M${P([wC[0] - 14, wC[1] + 6])}q12 -5 24 0`,
    `M${P([wC[0] + 6, wC[1] - 12])}q10 -4 20 0`
  ]
}

/* =========================================================
   建筑：每栋都是一个盒子 + 细节
   只画朝向镜头的两个立面（+gx 与 +gy），顶面另画一层带外挑的屋檐。
   ========================================================= */
function faceQuad (fn, u0, u1, z0, z1) {
  return poly([fn(u0, z0), fn(u1, z0), fn(u1, z1), fn(u0, z1)])
}

const ROOF_LIGHT = '#7f5a7c'
const ROOF_DARK = '#5c3d59'

const BUILDINGS = [
  {
    key: 'home',
    label: '书店',
    en: 'BOOKSTORE',
    x: 2.4, y: 5.6, w: 2.9, d: 2.2, h: 76,
    wallL: '#e6c9d1', wallR: '#fbeadd',
    doorFace: 'left',
    doorU: [0.07, 0.29],
    awningU: [0.04, 0.33],
    rows: [[50, 58]],
    cols: [[0.42, 0.56], [0.66, 0.8]],
    awning: ['#c9556f', '#f9dde4']
  },
  {
    key: 'store',
    label: '便利店',
    en: 'STORE 24H',
    x: 6.2, y: 2.0, w: 2.7, d: 2.0, h: 68,
    wallL: '#dfe6da', wallR: '#f8fbf2',
    doorFace: 'left',
    doorU: [0.07, 0.28],
    awningU: [0.04, 0.32],
    rows: [[46, 56]],
    cols: [[0.4, 0.54], [0.64, 0.8]],
    glass: true,
    awning: ['#6fae9d', '#e6f5ef']
  },
  {
    key: 'gym',
    label: '健身房',
    en: 'GYM',
    x: 2.6, y: 11.4, w: 3.0, d: 2.0, h: 92,
    wallL: '#dcc6cf', wallR: '#f6e5e1',
    doorFace: 'left',
    doorU: [0.08, 0.28],
    awningU: [0.05, 0.32],
    rows: [[52, 64], [70, 82]],
    cols: [[0.4, 0.54], [0.62, 0.76], [0.82, 0.94]],
    awning: ['#8d6fa8', '#eee4f6']
  },
  {
    key: 'gamehome',
    label: '家',
    en: 'MY ROOM',
    x: 12.0, y: 6.4, w: 2.6, d: 2.0, h: 54,
    wallL: '#e3cbd3', wallR: '#fbeade',
    doorFace: 'left',
    rows: [[20, 36]],
    cols: [[0.1, 0.26], [0.72, 0.88]],
    pitched: true
  },
  {
    key: 'cafe',
    label: '咖啡馆',
    en: 'CAFE HANAMI',
    x: 14.2, y: 11.8, w: 2.1, d: 1.7, h: 62,
    wallL: '#d9c3ad', wallR: '#f7e9d7',
    doorFace: 'left',
    doorU: [0.08, 0.3],
    awningU: [0.04, 0.36],
    rows: [[44, 54]],
    cols: [[0.44, 0.58], [0.64, 0.78], [0.84, 0.96]],
    awning: ['#6f8f74', '#eef4ea']
  },
  {
    key: 'sweet',
    label: '甜品屋',
    en: 'SWEETS',
    x: 17.2, y: 12.4, w: 2.1, d: 1.7, h: 58,
    wallL: '#f0d5dd', wallR: '#fff4f1',
    doorFace: 'left',
    doorU: [0.1, 0.32],
    awningU: [0.06, 0.38],
    rows: [[40, 50]],
    cols: [[0.5, 0.64], [0.7, 0.84]],
    awning: ['#e88fa6', '#ffeef3']
  },
  {
    key: 'flower',
    label: '花店',
    en: 'FLOWER',
    x: 6.8, y: 16.2, w: 1.9, d: 1.7, h: 54,
    wallL: '#dfe4d0', wallR: '#f8faee',
    doorFace: 'right',
    doorU: [0.05, 0.22],
    rows: [[44, 52]],
    cols: [[0.55, 0.7], [0.76, 0.92]]
  },
  {
    key: 'school',
    label: '樱花学校',
    en: 'SAKURA SCHOOL',
    x: 17.0, y: 4.2, w: 3.1, d: 2.2, h: 88,
    wallL: '#e9d9cf', wallR: '#fdf1e4',
    doorFace: 'left',
    doorU: [0.44, 0.56],
    rows: [[18, 30], [38, 50], [58, 70]],
    cols: [[0.06, 0.18], [0.24, 0.36], [0.64, 0.76], [0.82, 0.94]],
    bell: true,
    labelLift: 82
  },
  {
    key: 'station',
    label: '樱花车站',
    en: 'SAKURA STATION',
    x: 11.0, y: 16.3, w: 3.6, d: 1.9, h: 66,
    wallL: '#dfd3c6', wallR: '#f7ece0',
    doorFace: 'left',
    doorU: [0.42, 0.58],
    rows: [[26, 36]],
    cols: [[0.06, 0.16], [0.2, 0.3], [0.7, 0.8], [0.84, 0.94]],
    station: true,
    labelLift: 34
  }
]

/* 屋顶小配件：每栋楼配不同的组合（烟囱 / 天窗 / 天线） */
const ROOF_KIT = {
  home:    { chimney: true,  skylight: true,  antenna: false },
  store:   { chimney: false, skylight: true,  antenna: true },
  gym:     { chimney: false, skylight: false, antenna: true },
  gamehome:{ chimney: false, skylight: true,  antenna: false },
  cafe:    { chimney: true,  skylight: true,  antenna: false },
  sweet:   { chimney: true,  skylight: false, antenna: false },
  flower:  { chimney: true,  skylight: true,  antenna: false },
  school:  { chimney: false, skylight: false, antenna: true },
  station: { chimney: false, skylight: false, antenna: true }
}

function buildVenue (v) {
  const x0 = v.x
  const y0 = v.y
  const x1 = v.x + v.w
  const y1 = v.y + v.d
  const h = v.h
  const e = 0.15 // 屋檐外挑

  // 立面上的参数坐标：u 沿墙面横走，z 是高度
  const leftFace = (u, z) => ip(x0 + v.w * u, y1, z)
  const rightFace = (u, z) => ip(x1, y0 + v.d * u, z)
  const doorFn = v.doorFace === 'left' ? leftFace : rightFace
  const winFn = v.doorFace === 'left' ? rightFace : leftFace

  const deco = []
  // 踢脚：贴地一条深色，盒子才不像一张纸
  deco.push({ d: faceQuad(leftFace, 0, 1, 0, 6), fill: 'rgba(150,110,132,.24)' })
  deco.push({ d: faceQuad(rightFace, 0, 1, 0, 6), fill: 'rgba(150,110,132,.15)' })

  /* 窗户：不能整面墙都是同一个方块。
     四种样式轮换：竖中梃 / 窗台花箱 / 窗帘 / 十字窗格 */
  let winSeed = 0
  function addWindow (fn, u0, u1, z0, z1) {
    const style = winSeed++ % 4
    const w = u1 - u0
    deco.push({
      d: faceQuad(fn, u0, u1, z0, z1),
      fill: v.glass ? 'rgba(206,238,232,.92)' : '#ffe4ac',
      opacity: 0.95
    })
    deco.push({ d: faceQuad(fn, u0, u1, z0, z1), fill: 'none', stroke: 'rgba(110,76,98,.42)', sw: 1.2 })

    if (style === 0) {
      // 竖中梃
      const [ax, ay] = fn(u0 + w / 2, z0)
      const [bx, by] = fn(u0 + w / 2, z1)
      deco.push({ d: `M${P([ax, ay])}L${P([bx, by])}`, fill: 'none', stroke: 'rgba(110,76,98,.3)', sw: 1 })
    } else if (style === 1) {
      // 窗台 + 一盆樱花：窗台伸出来一点，屋里就有了「住户」
      deco.push({ d: faceQuad(fn, u0 - 0.018, u1 + 0.018, z0 - 3.4, z0 - 0.6), fill: '#dcc4cb' })
      deco.push({ d: faceQuad(fn, u0 - 0.018, u1 + 0.018, z0 - 3.4, z0 - 2.9), fill: '#c9aab4' })
      const [px, py] = fn(u0 + w * 0.28, z0 - 1.2)
      deco.push({ d: poly([[px - 3.4, py], [px + 3.4, py], [px + 2.6, py - 4.2], [px - 2.6, py - 4.2]]), fill: '#c08f78' })
      deco.push({ d: ellipsePath(px - 1.6, py - 6.4, 2.8, 2.6), fill: '#f6a8bd' })
      deco.push({ d: ellipsePath(px + 2.2, py - 7.2, 2.4, 2.2), fill: '#ffd2dd' })
      deco.push({ d: ellipsePath(px, py - 9, 1.8, 1.8), fill: '#fff1f4' })
    } else if (style === 2) {
      // 窗帘：两侧各一片，杆子横在窗顶
      deco.push({ d: faceQuad(fn, u0 + 0.008, u0 + w * 0.2, z0 + 0.5, z1), fill: 'rgba(255, 240, 238, .78)' })
      deco.push({ d: faceQuad(fn, u1 - w * 0.2, u1 - 0.008, z0 + 0.5, z1), fill: 'rgba(255, 240, 238, .78)' })
      const [rx0, ry0] = fn(u0 - 0.01, z1 + 2)
      const [rx1, ry1] = fn(u1 + 0.01, z1 + 2)
      deco.push({ d: `M${P([rx0, ry0])}L${P([rx1, ry1])}`, fill: 'none', stroke: '#b9949f', sw: 1.4 })
    } else {
      // 十字窗格
      const [ax, ay] = fn(u0 + w / 2, z0)
      const [bx, by] = fn(u0 + w / 2, z1)
      const zm = (z0 + z1) / 2
      const [cx, cy] = fn(u0, zm)
      const [dx, dy] = fn(u1, zm)
      deco.push({ d: `M${P([ax, ay])}L${P([bx, by])}M${P([cx, cy])}L${P([dx, dy])}`, fill: 'none', stroke: 'rgba(110,76,98,.3)', sw: 0.9 })
    }
  }

  for (const [z0, z1] of v.rows) {
    for (const [u0, u1] of v.cols) addWindow(winFn, u0, u1, z0, z1)
  }

  // ---------- 门 ----------
  // 位置可按建筑调：书店 / 便利店的门偏左，把整面墙留给橱窗
  const [du0, du1] = v.doorU || [0.4, 0.62]
  deco.push({ d: faceQuad(doorFn, du0, du1, 0, 30), fill: '#7f5771' })
  deco.push({ d: faceQuad(doorFn, du0 + 0.045, du1 - 0.045, 7, 26), fill: 'rgba(255,232,188,.9)' })
  deco.push({ d: faceQuad(doorFn, du0, du1, 0, 30), fill: 'none', stroke: 'rgba(90,60,80,.3)', sw: 1.2 })
  // 门口踏步：多一级石阶，门就有了「进深」
  deco.push({ d: faceQuad(doorFn, du0 - 0.03, du1 + 0.03, 0, 4), fill: '#d8c6cf' })
  // 门框：两道竖边 + 一道门头，门就不像贴纸了
  deco.push({
    d: faceQuad(doorFn, du0 - 0.012, du0 + 0.004, 0, 31),
    fill: 'rgba(120, 84, 104, .5)'
  })
  deco.push({
    d: faceQuad(doorFn, du1 - 0.004, du1 + 0.012, 0, 31),
    fill: 'rgba(120, 84, 104, .5)'
  })
  deco.push({ d: faceQuad(doorFn, du0 - 0.012, du1 + 0.012, 30, 32.4), fill: 'rgba(120, 84, 104, .55)' })
  // 门把手
  {
    const [hx, hy] = doorFn(du1 - 0.05, 15)
    deco.push({ d: ellipsePath(hx, hy, 2, 2), fill: '#f2d9a8' })
  }
  // 小扶手：门的一侧立一根柱子，矮楼的门口就不空
  if (h >= 44) {
    const [rx, ry] = doorFn(du1 + 0.05, 0)
    const rh = 26
    deco.push({ d: `M${P([rx, ry])}V${round1(ry - rh)}`, fill: 'none', stroke: '#8a6a74', sw: 2 })
    deco.push({ d: `M${P([rx, ry - rh])}h-11`, fill: 'none', stroke: '#8a6a74', sw: 2 })
  }

  // 门脸一侧的窗：靠上的几排照样开窗，样式跟着全局计数轮换
  for (const [z0, z1] of v.rows) {
    if (z1 > h - 24) continue
    for (const [u0, u1] of v.cols) {
      if (u1 > du0 - 0.02 && u0 < du1 + 0.02) continue
      addWindow(doorFn, u0, u1, z0, z1)
    }
  }

  // 楼层线：一道浅浅的横线，墙面就有了层数
  for (const z of [44, 70]) {
    if (z > h - 26) continue
    deco.push({ d: faceQuad(leftFace, 0, 1, z, z + 2), fill: 'rgba(120,86,106,.15)' })
    deco.push({ d: faceQuad(rightFace, 0, 1, z, z + 2), fill: 'rgba(120,86,106,.1)' })
  }

  // 雨棚：斜条纹，门口一下就有了「店」的味道
  if (v.awning) {
    const [au0, au1] = v.awningU || [du0 - 0.06, du1 + 0.06]
    const n = 5
    for (let i = 0; i < n; i++) {
      const a = au0 + ((au1 - au0) / n) * i
      const b = au0 + ((au1 - au0) / n) * (i + 1)
      deco.push({ d: faceQuad(doorFn, a, b, 32, 44), fill: i % 2 ? v.awning[1] : v.awning[0] })
    }
    deco.push({ d: faceQuad(doorFn, au0, au1, 30, 32), fill: 'rgba(90,60,80,.22)' })
  }

  // 招牌带：屋顶以下一条白底，衬出「这家店有名字」
  if (!v.pitched) {
    const sz0 = h - 20
    const sz1 = h - 8
    deco.push({ d: faceQuad(doorFn, 0.24, 0.76, sz0, sz1), fill: 'rgba(255, 252, 253, .92)' })
    deco.push({ d: faceQuad(doorFn, 0.24, 0.76, sz0, sz1), fill: 'none', stroke: 'rgba(118, 84, 106, .28)', sw: 1.1 })
    for (let i = 0; i < 3; i++) {
      deco.push({
        d: faceQuad(doorFn, 0.32 + i * 0.11, 0.38 + i * 0.11, sz0 + 4, sz1 - 4),
        fill: i === 1 ? 'rgba(170, 96, 126, .72)' : 'rgba(140, 96, 118, .45)'
      })
    }
  }

  /* =========================================================
     每栋楼的「辨识度」：光靠换个招牌，房子还是同一个盒子。
     下面按 key 追加各自的特征件，目标是缩小后也能一眼认出来。
     ========================================================= */
  const extraRoof = []

  if (v.key === 'home') {
    // 书店：整面橱窗 + 三层书架 + 门口一摞书 + 吊招牌
    const wu0 = 0.4
    const wu1 = 0.94
    const z0 = 12
    const z1 = 46
    deco.push({ d: faceQuad(doorFn, wu0, wu1, z0, z1), fill: '#fff3d8' })
    deco.push({ d: faceQuad(doorFn, wu0, wu1, z0, z1), fill: 'none', stroke: '#a9786f', sw: 2.2 })
    const shelves = [z0 + 6, z0 + 17, z0 + 28]
    for (const sz of shelves) {
      deco.push({ d: faceQuad(doorFn, wu0 + 0.02, wu1 - 0.02, sz, sz + 2), fill: '#b98a7f' })
      // 书脊：一条条彩色小方片，远看就是「一柜子书」
      const n = 8
      for (let i = 0; i < n; i++) {
        const a = wu0 + 0.03 + ((wu1 - wu0 - 0.06) / n) * i
        const b = a + (wu1 - wu0 - 0.06) / n - 0.012
        const cb = ['#d98aa0', '#dcb488', '#9fb3cc', '#a9c0a2', '#bda3c9'][(i + shelves.indexOf(sz)) % 5]
        deco.push({ d: faceQuad(doorFn, a, b, sz + 2.2, sz + 10), fill: cb, opacity: 0.92 })
      }
    }
    // 吊招牌：横臂伸出去，牌子挂在下面（像旧书店那种）
    const [sx, sy] = doorFn(0.06, 62)
    deco.push({ d: `M${P([sx, sy])}h13`, fill: 'none', stroke: '#7f5771', sw: 2 })
    deco.push({ d: poly([[sx + 11, sy], [sx + 25, sy], [sx + 25, sy + 17], [sx + 11, sy + 17]]), fill: '#4d3a52' })
    // 翻开的书：两个小斜面
    deco.push({ d: poly([[sx + 14, sy + 8], [sx + 18, sy + 6], [sx + 18, sy + 12], [sx + 14, sy + 14]]), fill: '#ffe9c9' })
    deco.push({ d: poly([[sx + 18, sy + 6], [sx + 22, sy + 8], [sx + 22, sy + 14], [sx + 18, sy + 12]]), fill: '#fff6e6' })
    // 门口墙角一摞书
    const bx0 = 0.02
    for (let i = 0; i < 4; i++) {
      deco.push({
        d: faceQuad(doorFn, bx0 + i * 0.014, bx0 + 0.1 - i * 0.006, 1 + i * 3.2, 3.2 + i * 3.2),
        fill: ['#d4708c', '#e0a05c', '#7f9fc9', '#8fb98b'][i]
      })
    }
    extraRoof.push({
      d: poly([ip(x0 + 0.15, y1 - 0.32, h + 6), ip(x0 + 0.95, y1 - 0.32, h + 6), ip(x0 + 0.95, y1 - 0.32, h + 14), ip(x0 + 0.15, y1 - 0.32, h + 14)]),
      fill: '#f6e6ea'
    })
  }

  if (v.key === 'store') {
    // 便利店：通高玻璃幕墙 + 冷柜暖光 + 屋顶 24H 灯箱 + 门口 A 字招牌
    const gu0 = 0.36
    const gu1 = 0.95
    deco.push({ d: faceQuad(doorFn, gu0, gu1, 4, 42), fill: 'rgba(212,244,240,.94)' })
    deco.push({ d: faceQuad(doorFn, gu0 + 0.02, gu1 - 0.02, 6, 22), fill: 'rgba(255,238,196,.5)' })
    // 玻璃竖框
    for (let i = 1; i < 4; i++) {
      const u = gu0 + ((gu1 - gu0) / 4) * i
      deco.push({ d: faceQuad(doorFn, u - 0.006, u + 0.006, 4, 42), fill: 'rgba(120,160,158,.5)' })
    }
    // 玻璃里透出的货架
    for (const sz of [12, 20, 28]) {
      deco.push({ d: faceQuad(doorFn, gu0 + 0.03, gu1 - 0.03, sz, sz + 2), fill: 'rgba(120,170,160,.45)' })
    }
    deco.push({ d: faceQuad(doorFn, gu0, gu1, 4, 42), fill: 'none', stroke: '#7f9d9a', sw: 1.8 })
    // 屋顶灯箱
    extraRoof.push({
      d: poly([ip(x0 + 0.16, y1 - 0.34, h + 6), ip(x0 + 1.5, y1 - 0.34, h + 6), ip(x0 + 1.5, y1 - 0.34, h + 24), ip(x0 + 0.16, y1 - 0.34, h + 24)]),
      fill: '#fffdf7', stroke: 'rgba(140,90,110,.35)', sw: 1
    })
    extraRoof.push({
      d: poly([ip(x0 + 0.28, y1 - 0.34, h + 11), ip(x0 + 0.62, y1 - 0.34, h + 11), ip(x0 + 0.62, y1 - 0.34, h + 19), ip(x0 + 0.28, y1 - 0.34, h + 19)]),
      fill: '#e0576f'
    })
    extraRoof.push({
      d: poly([ip(x0 + 0.72, y1 - 0.34, h + 11), ip(x0 + 1.36, y1 - 0.34, h + 11), ip(x0 + 1.36, y1 - 0.34, h + 19), ip(x0 + 0.72, y1 - 0.34, h + 19)]),
      fill: '#7fa8a0'
    })
    // 门口 A 字小招牌
    const [ax, ay] = doorFn(0.08, 0)
    deco.push({ d: poly([[ax - 9, ay], [ax + 3, ay], [ax + 1, ay - 16], [ax - 7, ay - 16]]), fill: '#fdf6ee', stroke: '#b08a92', sw: 1 })
    deco.push({ d: poly([[ax - 5, ay - 13], [ax - 1, ay - 13], [ax - 1, ay - 5], [ax - 5, ay - 5]]), fill: '#e0576f' })
  }

  if (v.key === 'gym') {
    // 健身房：玻璃幕墙 + 屋顶哑铃招牌 + 门口杠铃架
    const gu0 = 0.4
    const gu1 = 0.95
    deco.push({ d: faceQuad(doorFn, gu0, gu1, 4, 46), fill: 'rgba(220,240,246,.92)' })
    for (let i = 1; i < 3; i++) {
      const u = gu0 + ((gu1 - gu0) / 3) * i
      deco.push({ d: faceQuad(doorFn, u - 0.007, u + 0.007, 4, 46), fill: 'rgba(130,150,180,.45)' })
    }
    deco.push({ d: faceQuad(doorFn, gu0, gu1, 4, 46), fill: 'none', stroke: '#8e93b4', sw: 1.8 })
    // 屋顶招牌 + 哑铃
    const [gx0, gy0] = ip(x0 + 0.5, y1 - 0.34, h + 4)
    // 招牌板 + 两根支腿（深紫板，和墙上的小挂板同一套色）
    extraRoof.push({ d: poly([[gx0 - 40, gy0], [gx0 + 44, gy0], [gx0 + 44, gy0 - 28], [gx0 - 40, gy0 - 28]]), fill: '#5b4a68' })
    extraRoof.push({ d: poly([[gx0 - 40, gy0], [gx0 + 44, gy0], [gx0 + 44, gy0 - 2.6], [gx0 - 40, gy0 - 2.6]]), fill: '#b6a0c0' })
    extraRoof.push({ d: `M${P([gx0 - 32, gy0])}v-28M${P([gx0 + 36, gy0])}v-28`, fill: 'none', stroke: '#7a6788', sw: 1.6 })
    // 哑铃：两片配重 + 横杆（奶白，紫底上才看得清）
    extraRoof.push({ d: poly([[gx0 - 28, gy0 - 22], [gx0 - 17, gy0 - 22], [gx0 - 17, gy0 - 6], [gx0 - 28, gy0 - 6]]), fill: '#fff3e2' })
    extraRoof.push({ d: poly([[gx0 + 12, gy0 - 22], [gx0 + 23, gy0 - 22], [gx0 + 23, gy0 - 6], [gx0 + 12, gy0 - 6]]), fill: '#fff3e2' })
    extraRoof.push({ d: poly([[gx0 - 17, gy0 - 17.5], [gx0 + 12, gy0 - 17.5], [gx0 + 12, gy0 - 10.5], [gx0 - 17, gy0 - 10.5]]), fill: '#fff3e2' })
    extraRoof.push({ d: poly([[gx0 - 28, gy0 - 22], [gx0 - 17, gy0 - 22], [gx0 - 17, gy0 - 19], [gx0 - 28, gy0 - 19]]), fill: '#d9c9e2' })
    extraRoof.push({ d: poly([[gx0 + 12, gy0 - 22], [gx0 + 23, gy0 - 22], [gx0 + 23, gy0 - 19], [gx0 + 12, gy0 - 19]]), fill: '#d9c9e2' })

  }

  if (v.key === 'gamehome') {
    // 家：门廊（两根柱子 + 小雨棚）+ 栅栏 + 窗台花箱
    const [fx0] = [x0 + v.w * du0 - 0.12]
    const [px1, py1] = doorFn(du0 - 0.12, 0)
    const [px2, py2] = doorFn(du1 + 0.12, 0)
    deco.push({ d: `M${P([px1, py1])}V${round1(py1 - 26)}M${P([px2, py2])}V${round1(py2 - 26)}`, fill: 'none', stroke: '#8b6a74', sw: 2.6 })
    deco.push({ d: poly([[px1 - 4, py1 - 26], [px2 + 4, py2 - 26], [px2 + 2, py2 - 31], [px1 - 6, py1 - 31]]), fill: '#7f5a7c' })
    // 门廊灯
    deco.push({ d: ellipsePath((px2 + px1) / 2 + 16, (py1 + py2) / 2 - 20, 4.6, 4.6), fill: '#ffe4ac' })
    // 栅栏：一排小竖条
    for (let i = 0; i < 7; i++) {
      const [qx, qy] = doorFn(-0.02 + i * 0.06, 0)
      deco.push({ d: `M${P([qx, qy])}V${round1(qy - 9)}`, fill: 'none', stroke: '#cbb0a6', sw: 2 })
    }
    // 窗台花箱
    const wu = v.cols[0]
    deco.push({ d: faceQuad(winFn, wu[0] - 0.02, wu[1] + 0.02, 17, 20), fill: '#c98b74' })
    for (let i = 0; i < 3; i++) {
      const [cx2, cy2] = winFn(wu[0] + (wu[1] - wu[0]) * (0.2 + i * 0.3), 21)
      deco.push({ d: ellipsePath(cx2, cy2, 2.6, 2.6), fill: ['#e8809c', '#f0a4b8', '#fff0f4'][i] })
    }
    // 邮箱
    const [mx, my] = doorFn(du1 + 0.08, 0)
    deco.push({ d: poly([[mx - 3, my], [mx + 3, my - 2], [mx + 3, my - 11], [mx - 3, my - 9]]), fill: '#b4636f' })
    // 烟囱冒烟：两团小云，谁看都知道屋里有人
    const [smx, smy] = ip(x0 + 0.55, y1 - 0.55, h + 42)
    extraRoof.push({ d: ellipsePath(smx + 2, smy - 12, 5.4, 4.4), fill: 'rgba(255,255,255,.82)' })
    extraRoof.push({ d: ellipsePath(smx + 9, smy - 22, 7, 5.6), fill: 'rgba(255,255,255,.66)' })
    extraRoof.push({ d: ellipsePath(smx + 20, smy - 31, 8, 6), fill: 'rgba(255,255,255,.46)' })
  }

  if (v.key === 'school') {
    // 学校：门脸整面大窗 + 正面挂钟 + 楼顶钟楼 + 旗杆 + 校门
    // 大窗（横长条，教室那种）
    for (const [z0, z1] of v.rows) {
      deco.push({ d: faceQuad(doorFn, 0.06, 0.94, z0 - 1, z1 + 1), fill: 'none', stroke: 'rgba(110,76,98,.28)', sw: 1.4 })
    }
    // 正面挂钟
    const [cx, cy] = doorFn(0.5, 76)
    deco.push({ d: ellipsePath(cx, cy, 9, 10), fill: '#fffdf6', stroke: '#8d6a86', sw: 2 })
    deco.push({ d: `M${P([cx, cy])}V${round1(cy - 6)}M${P([cx, cy])}H${round1(cx + 5)}`, fill: 'none', stroke: '#6b5470', sw: 1.8 })
    // 校门：两根门柱 + 横匾
    const [g1x, g1y] = doorFn(-0.04, 0)
    const [g2x, g2y] = doorFn(0.3, 0)
    deco.push({ d: `M${P([g1x, g1y])}V${round1(g1y - 22)}M${P([g2x, g2y])}V${round1(g2y - 22)}`, fill: 'none', stroke: '#a98d8a', sw: 3 })
    deco.push({ d: poly([[g1x - 2, g1y - 22], [g2x + 2, g2y - 22], [g2x + 2, g2y - 27], [g1x - 2, g1y - 27]]), fill: '#8f6f8c' })
    // 钟楼 + 旗杆（屋顶层）
    const tx = x0 + v.w * 0.5
    const ty = y0 + v.d * 0.55
    extraRoof.push(...boxParts(tx - 0.36, ty - 0.36, 0.72, 0.72, h + 6, h + 44, { l: '#e6d2c8', r: '#fbf0e6', t: '#f3e3d6' }))
    // 四面尖顶：两个可见面 + 一条屋脊
    const apex = ip(tx, ty, h + 66)
    // 攒尖顶：两个朝向镜头的坡面（底边要贴在前沿，不能贴后沿，否则会歪）
    extraRoof.push({
      d: poly([ip(tx - 0.44, ty + 0.44, h + 44), ip(tx + 0.44, ty + 0.44, h + 44), apex]),
      fill: '#9a86b6'
    })
    extraRoof.push({
      d: poly([ip(tx + 0.44, ty - 0.44, h + 44), ip(tx + 0.44, ty + 0.44, h + 44), apex]),
      fill: '#6b5589'
    })
    // 顶尖的小球
    const [spx, spy] = ip(tx, ty, h + 66)
    extraRoof.push({ d: ellipsePath(spx, spy - 3, 2.6, 2.6), fill: '#ef98ac' })
    // 钟楼里的小钟（画在朝向镜头的墙面上）
    const [bz1, bz2] = ip(tx, ty + 0.36, h + 22)
    extraRoof.push({ d: ellipsePath(bz1, bz2, 5, 5.5), fill: '#ffe8ac', stroke: '#8d6a86', sw: 1.4 })
    // 旗杆
    const [fx, fy] = ip(x0 + 0.18, y1 - 0.5, h + 6)
    extraRoof.push({ d: `M${P([fx, fy])}V${round1(fy - 54)}`, fill: 'none', stroke: '#a9929a', sw: 2.4 })
    extraRoof.push({ d: poly([[fx, fy - 54], [fx + 20, fy - 49], [fx + 20, fy - 39], [fx, fy - 44]]), fill: '#ef98ac' })
  }

  if (v.key === 'station') {
    // 车站：站房 + 月台 + 站名牌立柱 + 站钟（不做大雨棚，小比例下会跟屋顶糊在一起）
    const platformY = y1 + 1.7
    deco.push(...boxParts(x0 - 0.3, y1, v.w + 0.6, platformY - y1, 0, 8, { l: '#d6c9bc', r: '#e9ddd0', t: '#f4e9dc' }))
    deco.push({
      d: poly([ip(x0 - 0.28, platformY - 0.16, 8), ip(x0 + v.w + 0.28, platformY - 0.16, 8), ip(x0 + v.w + 0.28, platformY - 0.06, 8), ip(x0 - 0.28, platformY - 0.06, 8)]),
      fill: '#efc66e'
    })
    // 站房挂钟
    const [kx, ky] = doorFn(0.5, 50)
    deco.push({ d: ellipsePath(kx, ky, 7, 7.6), fill: '#fffdf6', stroke: '#8d6a86', sw: 1.8 })
    deco.push({ d: `M${P([kx, ky])}V${round1(ky - 4.4)}M${P([kx, ky])}H${round1(kx + 3.6)}`, fill: 'none', stroke: '#6b5470', sw: 1.5 })
    // 两根站名牌立柱：白底木牌，远看就是「站」
    for (const u of [0.16, 0.8]) {
      const px = x0 + v.w * u
      const py = platformY - 0.5
      const [p0x, p0y] = ip(px, py, 8)
      const [p1x, p1y] = ip(px, py, 34)
      deco.push({ d: `M${P([p0x, p0y])}L${P([p1x, p1y])}`, fill: 'none', stroke: '#8a7086', sw: 2 })
      deco.push({ d: poly([[p1x - 13, p1y], [p1x + 13, p1y], [p1x + 13, p1y - 11], [p1x - 13, p1y - 11]]), fill: '#fffdf8', stroke: 'rgba(120,90,110,.42)', sw: 1 })
      deco.push({ d: poly([[p1x - 9, p1y - 8], [p1x + 9, p1y - 8], [p1x + 9, p1y - 6.4], [p1x - 9, p1y - 6.4]]), fill: '#8f7794' })
      deco.push({ d: poly([[p1x - 9, p1y - 4.6], [p1x + 3, p1y - 4.6], [p1x + 3, p1y - 3], [p1x - 9, p1y - 3]]), fill: '#bfa9c2' })
    }
    // 月台上的长椅
    const [bx, by] = ip(x0 + 0.42, platformY - 0.75, 8)
    deco.push({ d: poly([[bx - 9, by], [bx + 7, by - 3], [bx + 7, by], [bx - 9, by + 3]]), fill: '#c89a7c' })
    deco.push({ d: `M${P([bx - 7, round1(by + 2)])}v4M${P([bx + 5, round1(by - 0.5)])}v4`, fill: 'none', stroke: '#8a6a5a', sw: 1.4 })
  }

  // 屋檐 / 屋顶
  const roofParts = []
  if (v.pitched) {
    // 人字顶：屋脊顺着 gx 方向，只看得见朝向镜头的那面坡和右端山墙
    const mid = (y0 + y1) / 2
    const rise = 26
    roofParts.push({
      d: poly([ip(x0 - e, y1 + e, h), ip(x1 + e, y1 + e, h), ip(x1 + e, mid, h + rise), ip(x0 - e, mid, h + rise)]),
      fill: ROOF_DARK
    })
    roofParts.push({
      d: poly([ip(x1 + e, y0 - e, h), ip(x1 + e, y1 + e, h), ip(x1 + e, mid, h + rise)]),
      fill: ROOF_LIGHT
    })
    roofParts.push({
      d: `M${P(ip(x0 - e, mid, h + rise))}L${P(ip(x1 + e, mid, h + rise))}`,
      fill: 'none'
    })
    roofParts.push({
      d: `M${P(ip(x0 - e, mid - 0.08, h + rise))}L${P(ip(x1 + e, mid - 0.08, h + rise))}L${P(ip(x1 + e, mid + 0.08, h + rise))}L${P(ip(x0 - e, mid + 0.08, h + rise))}Z`,
      fill: '#a97f9c'
    })
    // 烟囱
    roofParts.push({
      d: poly([ip(x0 + 0.35, y1 - 0.55, h + 6), ip(x0 + 0.8, y1 - 0.55, h + 6), ip(x0 + 0.8, y1 - 0.55, h + 34), ip(x0 + 0.35, y1 - 0.55, h + 34)]),
      fill: '#a98a9b'
    })
    roofParts.push({
      d: poly([ip(x0 + 0.35, y1 - 0.55, h + 34), ip(x0 + 0.8, y1 - 0.55, h + 34), ip(x0 + 0.8, y1 - 1.0, h + 34), ip(x0 + 0.35, y1 - 1.0, h + 34)]),
      fill: '#c3a5b2'
    })
  } else {
    const rt = h + 6
    roofParts.push({
      d: poly([ip(x0 - e, y1 + e, h), ip(x1 + e, y1 + e, h), ip(x1 + e, y1 + e, rt), ip(x0 - e, y1 + e, rt)]),
      fill: ROOF_LIGHT
    })
    roofParts.push({
      d: poly([ip(x1 + e, y0 - e, h), ip(x1 + e, y1 + e, h), ip(x1 + e, y1 + e, rt), ip(x1 + e, y0 - e, rt)]),
      fill: ROOF_DARK
    })
    roofParts.push({
      d: poly([ip(x0 - e, y0 - e, rt), ip(x1 + e, y0 - e, rt), ip(x1 + e, y1 + e, rt), ip(x0 - e, y1 + e, rt)]),
      fill: '#8f6a88'
    })
    // 顶面的一道浅色反光
    roofParts.push({
      d: poly([ip(x0 + 0.15, y0 + 0.15, rt), ip(x1 - 0.4, y0 + 0.15, rt), ip(x1 - 0.4, y1 - 0.75, rt), ip(x0 + 0.15, y1 - 0.75, rt)]),
      fill: '#a17b9a',
      opacity: 0.6
    })
  }

  /* =========================================================
     屋顶细节（所有建筑通用）
     深紫屋顶 + 浅紫描边 + 木檐口 + 天窗 / 烟囱 / 天线 + 落花
     ========================================================= */
  {
    const kit = ROOF_KIT[v.key] || {}
    const rt = v.pitched ? h + 26 : h + 6
    const midY = (y0 + y1) / 2
    const trimZ0 = v.pitched ? h - 3.6 : h - 2
    const trimZ1 = v.pitched ? h + 0.2 : h + 2

    // 檐口木饰条：朝向镜头的两条边各压一道深木色，屋顶立刻有了厚度
    roofParts.push({
      d: poly([ip(x0 - e, y1 + e, trimZ0), ip(x1 + e, y1 + e, trimZ0), ip(x1 + e, y1 + e, trimZ1), ip(x0 - e, y1 + e, trimZ1)]),
      fill: '#6f4a48'
    })
    roofParts.push({
      d: poly([ip(x1 + e, y0 - e, trimZ0), ip(x1 + e, y1 + e, trimZ0), ip(x1 + e, y1 + e, trimZ1), ip(x1 + e, y0 - e, trimZ1)]),
      fill: '#593a3a'
    })
    // 浅紫描边：木条上再压一道细线，深紫不发闷
    roofParts.push({
      d: poly([ip(x0 - e, y1 + e, trimZ1), ip(x1 + e, y1 + e, trimZ1), ip(x1 + e, y1 + e, trimZ1 + 1.4), ip(x0 - e, y1 + e, trimZ1 + 1.4)]),
      fill: '#bb9fc0'
    })

    // 天窗
    if (kit.skylight) {
      if (v.pitched) {
        // 斜面上的天窗：沿坡面参数 t 取一小块
        const sl = (x, t) => ip(x, y1 + e + (midY - (y1 + e)) * t, h + 26 * t)
        const sx0 = x0 + v.w * 0.16
        const sx1 = sx0 + 0.62
        const t0 = 0.34
        const t1 = 0.62
        roofParts.push({ d: poly([sl(sx0 - 0.05, t0 - 0.04), sl(sx1 + 0.05, t0 - 0.04), sl(sx1 + 0.05, t1 + 0.04), sl(sx0 - 0.05, t1 + 0.04)]), fill: '#6f4a48' })
        roofParts.push({ d: poly([sl(sx0, t0), sl(sx1, t0), sl(sx1, t1), sl(sx0, t1)]), fill: '#cfe6ef' })
        roofParts.push({ d: poly([sl(sx0 + 0.08, t0 + 0.05), sl(sx0 + 0.3, t0 + 0.05), sl(sx0 + 0.12, t1 - 0.05), sl(sx0 - 0.02, t1 - 0.05)]), fill: 'rgba(255,255,255,.55)' })
      } else {
        const sx0 = x0 + v.w * 0.16
        const sy0 = y0 + v.d * 0.22
        const sw = Math.min(0.66, v.w * 0.3)
        const sd = Math.min(0.44, v.d * 0.26)
        roofParts.push({ d: poly([ip(sx0 - 0.05, sy0 - 0.05, rt), ip(sx0 + sw + 0.05, sy0 - 0.05, rt), ip(sx0 + sw + 0.05, sy0 + sd + 0.05, rt), ip(sx0 - 0.05, sy0 + sd + 0.05, rt)]), fill: '#6f4a48' })
        roofParts.push({ d: poly([ip(sx0, sy0, rt), ip(sx0 + sw, sy0, rt), ip(sx0 + sw, sy0 + sd, rt), ip(sx0, sy0 + sd, rt)]), fill: '#cfe6ef' })
        roofParts.push({ d: poly([ip(sx0 + 0.06, sy0 + 0.05, rt), ip(sx0 + 0.26, sy0 + 0.05, rt), ip(sx0 + 0.1, sy0 + sd - 0.06, rt), ip(sx0 - 0.02, sy0 + sd - 0.06, rt)]), fill: 'rgba(255,255,255,.5)' })
      }
    }

    // 小烟囱（人字顶那栋在屋顶段里已经画过，这里跳过）
    if (kit.chimney && !v.pitched) {
      const cxr = x0 + v.w * 0.72
      const cyr = y0 + v.d * 0.3
      roofParts.push(...boxParts(cxr, cyr, 0.34, 0.34, rt, rt + 26, { l: '#b08799', r: '#c79fb0', t: '#8a6a7e' }))
      // 烟囱帽
      roofParts.push({ d: poly([ip(cxr - 0.06, cyr - 0.06, rt + 26), ip(cxr + 0.4, cyr - 0.06, rt + 26), ip(cxr + 0.4, cyr + 0.4, rt + 26), ip(cxr - 0.06, cyr + 0.4, rt + 26)]), fill: '#6f4a5e' })
      // 一缕烟
      roofParts.push({ d: ellipsePath(...ip(cxr + 0.16, cyr + 0.16, rt + 34), 4.6, 3.8), fill: 'rgba(255,255,255,.55)' })
      roofParts.push({ d: ellipsePath(...ip(cxr + 0.3, cyr + 0.1, rt + 46), 6, 4.6), fill: 'rgba(255,255,255,.36)' })
    }

    // 小天线：一根杆 + 两道横挑
    if (kit.antenna) {
      const [ax, ay] = ip(x0 + v.w * 0.82, y0 + v.d * 0.2, rt)
      roofParts.push({ d: `M${P([ax, ay])}V${round1(ay - 30)}`, fill: 'none', stroke: '#8d728a', sw: 1.8 })
      roofParts.push({ d: `M${P([ax - 7, round1(ay - 26)])}h14M${P([ax - 4, round1(ay - 19)])}h8`, fill: 'none', stroke: '#8d728a', sw: 1.4 })
    }

    // 落花：屋顶上散几片樱花瓣
    const petals = [[0.2, 0.32], [0.46, 0.16], [0.74, 0.46], [0.34, 0.68], [0.62, 0.8], [0.88, 0.24]]
    petals.forEach(([u, w], i) => {
      let px, py
      if (v.pitched) {
        const t = 0.18 + w * 0.55
        ;[px, py] = ip(x0 + v.w * u, y1 + e + (midY - (y1 + e)) * t, h + 26 * t + 0.8)
      } else {
        ;[px, py] = ip(x0 + v.w * u, y0 + v.d * w, rt + 0.8)
      }
      roofParts.push({ d: ellipsePath(px, py, 3.4, 1.8), fill: i % 2 ? 'rgba(255,214,226,.82)' : 'rgba(255,238,244,.78)' })
    })
  }

  if (v.key === 'cafe') {
    // 咖啡馆：大玻璃窗 + 窗上的杯子 + 圆牌吊招牌 + 门口小圆桌
    const wu0 = 0.4
    const wu1 = 0.95
    deco.push({ d: faceQuad(doorFn, wu0, wu1, 12, 42), fill: 'rgba(255, 238, 205, .9)' })
    deco.push({ d: faceQuad(doorFn, wu0, wu1, 12, 42), fill: 'none', stroke: '#9a7a5e', sw: 2 })
    deco.push({ d: faceQuad(doorFn, wu0 + 0.02, wu1 - 0.02, 26, 28), fill: 'rgba(160, 120, 90, .45)' })
    // 窗中的杯子：杯身 + 把手 + 两缕热气
    const [cx1, cy1] = doorFn(0.6, 30)
    deco.push({ d: poly([[cx1 - 7, cy1], [cx1 + 7, cy1], [cx1 + 5, cy1 + 9], [cx1 - 5, cy1 + 9]]), fill: '#fffaf3' })
    deco.push({ d: ellipsePath(cx1 + 8.5, cy1 + 4, 3.2, 3.2), fill: 'none', stroke: '#fffaf3', sw: 1.8 })
    deco.push({ d: `M${P([cx1 - 3, cy1 - 3])}q3 -4 0 -7M${P([cx1 + 2, cy1 - 3])}q3 -4 0 -7`, fill: 'none', stroke: 'rgba(255,250,243,.8)', sw: 1.4 })
    // 圆牌吊招牌
    const [sx, sy] = doorFn(0.08, 56)
    deco.push({ d: `M${P([sx, sy])}h9`, fill: 'none', stroke: '#7f5771', sw: 2 })
    deco.push({ d: ellipsePath(sx + 17, sy + 4, 9, 9), fill: '#3f4f42', stroke: '#e6d7c4', sw: 1.4 })
    deco.push({ d: ellipsePath(sx + 17, sy + 4, 4.6, 4.6), fill: '#f6ead6' })
    deco.push({ d: `M${P([sx + 15, sy + 2])}q2 -3 0 -5`, fill: 'none', stroke: '#f6ead6', sw: 1.2 })
    // 门口小圆桌 + 两把椅子
    const [tx, ty] = ip(x0 - 0.36, y1 + 0.42)
    deco.push({ d: ellipsePath(tx, ty - 1, 11, 5.4), fill: '#f4e7d6' })
    deco.push({ d: ellipsePath(tx, ty - 2.5, 11, 5.4), fill: '#fffaf1' })
    deco.push({ d: `M${P([tx, ty])}v8`, fill: 'none', stroke: '#8c7460', sw: 2 })
    deco.push({ d: ellipsePath(tx - 15, ty + 2, 5.5, 3), fill: '#c9b7a2' })
    deco.push({ d: ellipsePath(tx + 13, ty + 4, 5.5, 3), fill: '#c9b7a2' })
  }

  if (v.key === 'sweet') {
    // 甜品屋：玻璃甜点柜 + 柜台上的蛋糕 + 门口带伞的小桌
    const wu0 = 0.38
    const wu1 = 0.95
    deco.push({ d: faceQuad(doorFn, wu0, wu1, 10, 38), fill: 'rgba(255, 246, 246, .94)' })
    deco.push({ d: faceQuad(doorFn, wu0, wu1, 10, 38), fill: 'none', stroke: '#c98da0', sw: 2 })
    deco.push({ d: faceQuad(doorFn, wu0 + 0.02, wu1 - 0.02, 22, 23.6), fill: 'rgba(220, 150, 172, .55)' })
    // 柜里的小蛋糕：一排小方块 + 一颗樱桃
    const cakes = ['#f6c3d2', '#ffe0b8', '#e8c9f0', '#c9e6d8', '#ffd0d8']
    for (let i = 0; i < 5; i++) {
      const a = wu0 + 0.04 + i * 0.105
      const b = a + 0.07
      deco.push({ d: faceQuad(doorFn, a, b, 13, 19), fill: cakes[i] })
      deco.push({ d: faceQuad(doorFn, a + 0.012, b - 0.012, 19, 20.6), fill: '#fffaf5' })
    }
    // 招牌：高脚杯甜品 + 樱桃
    const [sx, sy] = doorFn(0.06, 48)
    deco.push({ d: poly([[sx + 3, sy], [sx + 21, sy], [sx + 21, sy - 22], [sx + 3, sy - 22]]), fill: '#fff7f4', stroke: 'rgba(160, 100, 120, .35)', sw: 1 })
    deco.push({ d: poly([[sx + 7, sy - 15], [sx + 17, sy - 15], [sx + 12, sy - 5], [sx + 12, sy - 3]]), fill: '#e88fa6' })
    deco.push({ d: ellipsePath(sx + 12, sy - 17.5, 2.4, 2.4), fill: '#d95c78' })
    // 门口带伞的小圆桌
    const [tx, ty] = ip(x0 + 0.1, y1 + 0.5)
    deco.push({ d: `M${P([tx, ty])}v-34`, fill: 'none', stroke: '#a98d92', sw: 2 })
    deco.push({ d: ellipsePath(tx, ty - 34, 20, 8), fill: '#f3b3c4' })
    deco.push({ d: ellipsePath(tx, ty - 36, 20, 8), fill: '#ffd7e1' })
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (Math.PI / 4) * i
      deco.push({ d: ellipsePath(tx + Math.cos(a) * 18, ty - 32 + Math.sin(a) * 3, 3.4, 2.6), fill: '#ffeaf0' })
    }
    deco.push({ d: ellipsePath(tx, ty - 1, 9, 4.4), fill: '#fffaf6' })
  }

  if (v.key === 'flower') {
    // 花店：整面橱窗摆花 + 窗前花桶 + 檐下条纹雨棚 + 吊篮
    const wu0 = 0.26
    const wu1 = 0.96
    deco.push({ d: faceQuad(doorFn, wu0, wu1, 10, 38), fill: 'rgba(255, 253, 244, .95)' })
    deco.push({ d: faceQuad(doorFn, wu0, wu1, 10, 38), fill: 'none', stroke: '#8fae83', sw: 2.2 })
    // 橱窗里的一排花（沿着窗台）
    for (let i = 0; i < 4; i++) {
      const [fx, fy] = doorFn(wu0 + 0.09 + i * 0.16, 17)
      deco.push({ d: ellipsePath(fx, fy, 4.4, 4.8), fill: ['#f4a0b8', '#ffd9a0', '#d9b8ea', '#ffc2cf'][i] })
      deco.push({ d: ellipsePath(fx - 2, fy + 5, 2.8, 3.2), fill: '#9cbb8e' })
    }
    // 雨棚：手画在橱窗之上（通用雨棚会被橱窗盖掉）
    const [a1x, a1y] = doorFn(wu0 - 0.03, 40)
    const [a2x, a2y] = doorFn(wu1 + 0.02, 40)
    for (let i = 0; i < 6; i++) {
      const t0 = i / 6
      const t1 = (i + 1) / 6
      const p0 = [a1x + (a2x - a1x) * t0, a1y + (a2y - a1y) * t0]
      const p1 = [a1x + (a2x - a1x) * t1, a1y + (a2y - a1y) * t1]
      deco.push({ d: poly([p0, p1, [p1[0], p1[1] - 8], [p0[0], p0[1] - 8]]), fill: i % 2 ? '#f7fbf2' : '#8fae83' })
    }
    deco.push({ d: `M${P([a1x, a1y + 1])}L${P([a2x, a2y + 1])}`, fill: 'none', stroke: 'rgba(80,100,76,.35)', sw: 1.2 })
    // 门口的三只花桶
    for (let i = 0; i < 3; i++) {
      const [px, py] = doorFn(wu0 + 0.04 + i * 0.18, 0)
      deco.push({ d: poly([[px - 5, py], [px + 5, py], [px + 4, py - 9], [px - 4, py - 9]]), fill: '#cfb79f' })
      deco.push({ d: ellipsePath(px - 2, py - 13, 3.6, 3.6), fill: ['#f4a0b8', '#ffd9a0', '#d9b8ea'][i] })
      deco.push({ d: ellipsePath(px + 2.5, py - 15, 3.2, 3.2), fill: ['#ffc2cf', '#fff0c8', '#f0c8ff'][i] })
      deco.push({ d: `M${P([px, py - 9])}v-3`, fill: 'none', stroke: '#8fae83', sw: 1.8 })
    }
    // 吊篮
    const [hx, hy] = doorFn(0.88, 50)
    deco.push({ d: `M${P([hx, hy - 9])}v6`, fill: 'none', stroke: '#8a7361', sw: 1.4 })
    deco.push({ d: ellipsePath(hx, hy - 1, 5.6, 3.8), fill: '#b98a6f' })
    deco.push({ d: ellipsePath(hx - 2.6, hy - 5, 3.8, 3.2), fill: '#f0a2bc' })
    deco.push({ d: ellipsePath(hx + 2.8, hy - 6, 3.4, 2.8), fill: '#ffd6a8' })
  }

  if (extraRoof.length) roofParts.push(...extraRoof)

  return {
    type: 'venue',
    id: `v-${v.key}`,
    key: v.key,
    label: v.label,
    en: v.en,
    depth: x1 + y1,
    shadow: poly([
      ip(x0 + 0.1, y0 + 0.1), ip(x1 + 0.7, y0 + 0.1), ip(x1 + 0.7, y1 + 0.7), ip(x0 + 0.1, y1 + 0.7)
    ]),
    halo: poly([
      ip(x0 - 0.35, y0 - 0.35), ip(x1 + 0.35, y0 - 0.35), ip(x1 + 0.35, y1 + 0.35), ip(x0 - 0.35, y1 + 0.35)
    ]),
    faces: {
      left: poly([ip(x0, y1, 0), ip(x1, y1, 0), ip(x1, y1, h), ip(x0, y1, h)]),
      right: poly([ip(x1, y0, 0), ip(x1, y1, 0), ip(x1, y1, h), ip(x1, y0, h)])
    },
    wallL: v.wallL,
    wallR: v.wallR,
    deco: deco.concat(yardProps(v)),
    roofParts,
    labelPos: ip((x0 + x1) / 2, (y0 + y1) / 2, h + (v.labelLift != null ? v.labelLift : (v.pitched ? 48 : 24)))
  }
}

/* =========================================================
   门前小院：房子外面那一圈
   —— 全部画在地面坐标系里，按 (x+y) 从小到大画（远的先、近的压上），
      这样门口的花桶不会被远处的挡板盖住
   ========================================================= */
function yardProps (v) {
  const x0 = v.x
  const y0 = v.y
  const x1 = v.x + v.w
  const y1 = v.y + v.d
  const groups = []
  const add = (cx, cy, parts) => groups.push({ k: cx + cy, parts })

  /** 地面上的一块方砖 */
  const sq = (ax, ay, bx, by, fill, z = 0) => ({
    d: poly([ip(ax, ay, z), ip(bx, ay, z), ip(bx, by, z), ip(ax, by, z)]),
    fill
  })
  /** 落在地上的影子 */
  const sh = (cx, cy, rx, ry, op = 0.15) => ({
    d: ellipsePath(...ip(cx, cy, 1), rx, ry),
    fill: `rgba(96, 70, 94, ${op})`
  })
  /** 小花盆 */
  const pot = (cx, cy, sc = 1, tone = '#f4a0b8') => [
    sh(cx, cy, 6.5 * sc, 3 * sc, 0.13),
    ...boxParts(cx - 0.075 * sc, cy - 0.075 * sc, 0.15 * sc, 0.15 * sc, 0, 9 * sc, { l: '#bd8a72', r: '#d2a086', t: '#8f6a58' }),
    { d: ellipsePath(...ip(cx, cy, 10 * sc), 5.6 * sc, 4.4 * sc), fill: tone },
    { d: ellipsePath(...ip(cx - 0.05 * sc, cy - 0.02, 13 * sc), 3.4 * sc, 2.8 * sc), fill: '#ffe2ea' }
  ]

  // 门的位置（右开门的那栋，院子往 +x 长）
  const du = v.doorU || [0.4, 0.62]
  const rightDoor = v.doorFace === 'right'
  const dcx = rightDoor ? x1 : x0 + v.w * (du[0] + du[1]) / 2
  const dcy = rightDoor ? y0 + v.d * (du[0] + du[1]) / 2 : y1
  /** 从门口往外 t 格、横向偏 side 格的地面点 */
  const pt = (t, side = 0) => (rightDoor ? [x1 + t, dcy + side] : [dcx + side, y1 + t])

  /* ---------- 1. 台阶（两级） ---------- */
  if (!rightDoor) {
    add(dcx, dcy + 0.2, [
      ...boxParts(dcx - 0.26, y1 + 0.02, 0.52, 0.2, 0, 5, { l: '#d3c0cb', r: '#e4d2da', t: '#c6b0bb' }),
      ...boxParts(dcx - 0.3, y1 + 0.22, 0.6, 0.2, 0, 2.6, { l: '#cab6c1', r: '#dcc9d2', t: '#bda8b3' })
    ])
  } else {
    add(dcx + 0.2, dcy, [
      ...boxParts(x1 + 0.02, dcy - 0.26, 0.2, 0.52, 0, 5, { l: '#d3c0cb', r: '#e4d2da', t: '#c6b0bb' }),
      ...boxParts(x1 + 0.22, dcy - 0.3, 0.2, 0.6, 0, 2.6, { l: '#cab6c1', r: '#dcc9d2', t: '#bda8b3' })
    ])
  }

  /* ---------- 2. 石板小径：门口一路铺出去 ---------- */
  {
    const parts = []
    for (let i = 0; i < 4; i++) {
      const t = 0.42 + i * 0.36
      const side = i % 2 ? 0.1 : -0.07
      const [px, py] = pt(t, side)
      const w = 0.3 - i * 0.022
      parts.push(sh(px, py, 11, 4, 0.08))
      parts.push(sq(px - w / 2, py - 0.14, px + w / 2, py + 0.14, i % 2 ? '#e3d6c7' : '#d7c7b6'))
      parts.push({
        d: poly([ip(px - w / 2, py - 0.14, 0.6), ip(px + w / 2, py - 0.14, 0.6), ip(px + w / 2, py + 0.14, 0.6), ip(px - w / 2, py + 0.14, 0.6)]),
        fill: 'none', stroke: 'rgba(150,124,118,.3)', sw: 0.8
      })
    }
    const [ex, ey] = pt(0.9)
    add(ex, ey, parts)
  }

  /* ---------- 3. 墙根：碎石带 + 青苔 ---------- */
  {
    const parts = []
    for (let i = 0; i < 9; i++) {
      const gx = x0 + 0.1 + (i * (v.w - 0.2)) / 8
      const gy = y1 + 0.06 + (i % 3) * 0.045
      parts.push({ d: ellipsePath(...ip(gx, gy, 1.4), 4 + (i % 3) * 1.2, 1.8), fill: i % 2 ? '#cfc2b8' : '#bcaea6' })
    }
    // 青苔：贴墙根的一串小绿团
    for (let i = 0; i < 5; i++) {
      const gx = x0 + 0.24 + (i * (v.w - 0.5)) / 4
      parts.push({ d: ellipsePath(...ip(gx, y1 + 0.03, 1), 7 + (i % 2) * 3, 2.6), fill: 'rgba(150,178,128,.45)' })
    }
    add(x0 + v.w / 2, y1, parts)
    // 右墙根也来一段
    const parts2 = []
    for (let i = 0; i < 6; i++) {
      const gy = y0 + 0.2 + (i * (v.d - 0.4)) / 5
      parts2.push({ d: ellipsePath(...ip(x1 + 0.05, gy, 1.4), 3.4, 2.2), fill: i % 2 ? '#c8bab0' : '#b6a89f' })
    }
    parts2.push({ d: ellipsePath(...ip(x1 + 0.03, y1 - 0.22, 1), 8, 3), fill: 'rgba(150,178,128,.4)' })
    add(x1, y0 + v.d / 2, parts2)
  }

  /* ---------- 4. 零星小草 + 落花 ---------- */
  {
    const parts = []
    const spots = [[0.12, 0.62], [0.4, 1.32], [0.72, 0.5], [0.88, 1.05], [0.28, 0.32], [0.62, 1.55]]
    spots.forEach(([u, t]) => {
      const gx = x0 + v.w * u
      const gy = y1 + t
      const [gx2, gy2] = ip(gx, gy, 0)
      parts.push({ d: `M${P([gx2 - 2, gy2])}q-1 -5 -3 -7M${P([gx2, gy2])}q0 -6 1 -9M${P([gx2 + 2, gy2])}q2 -4 3 -7`, fill: 'none', stroke: '#9cb884', sw: 1.2, opacity: 0.9 })
    })
    add(x0 + v.w * 0.5, y1 + 0.9, parts)

    const petalParts = []
    const petals = [[0.16, 0.86], [0.36, 1.18], [0.55, 0.7], [0.74, 1.42], [0.9, 0.96], [0.46, 1.68]]
    petals.forEach(([u, t], i) => {
      const gx = x0 + v.w * u
      const gy = y1 + t
      petalParts.push({ d: ellipsePath(...ip(gx, gy, 0.8), 3.2, 1.7), fill: i % 2 ? 'rgba(255,205,220,.9)' : 'rgba(255,232,240,.85)' })
    })
    add(x0 + v.w * 0.5, y1 + 1.1, petalParts)
  }

  /* ---------- 5. 墙角灌木 ---------- */
  add(x0 - 0.1, y1 + 0.06, [
    sh(x0 - 0.08, y1 + 0.08, 12, 4.4, 0.12),
    { d: ellipsePath(...ip(x0 - 0.2, y1 + 0.1, 8), 8, 6), fill: '#a3bb8c' },
    { d: ellipsePath(...ip(x0 + 0.02, y1 + 0.14, 10), 7, 6), fill: '#b5c9a0' },
    { d: ellipsePath(...ip(x0 - 0.06, y1 + 0.05, 14), 5, 4.4), fill: '#c4d6b0' }
  ])

  /* =========================================================
     每栋楼自己的院子
     ========================================================= */
  if (v.key === 'gamehome') {
    // 木栅栏（院子左侧一排尖头木条 + 两道横档）
    {
      const fx = x0 - 0.42
      const yA = y1 + 0.12
      const yB = y1 + 1.78
      const parts = [sh(fx, (yA + yB) / 2, 9, 28, 0.1)]
      for (let i = 0; i <= 6; i++) {
        const yy = yA + ((yB - yA) * i) / 6
        const [bx, by] = ip(fx, yy, 0)
        parts.push({ d: poly([[bx, by], [bx + 4.4, by], [bx + 4.4, by - 20], [bx + 2.2, by - 25], [bx, by - 20]]), fill: i % 2 ? '#d8c0a8' : '#cdb59f' })
      }
      parts.push({ d: `M${P(ip(fx, yA, 7))}L${P(ip(fx, yB, 7))}M${P(ip(fx, yA, 16))}L${P(ip(fx, yB, 16))}`, fill: 'none', stroke: '#b99a84', sw: 2 })
      add(fx, (yA + yB) / 2, parts)
    }
    // 小邮箱
    {
      const mx = dcx + 0.52
      const my = y1 + 0.3
      const [sx, sy] = ip(mx, my, 0)
      add(mx, my, [
        sh(mx, my, 5, 2.4, 0.14),
        { d: `M${P([sx, sy])}V${round1(sy - 21)}`, fill: 'none', stroke: '#8a6a5a', sw: 2 },
        ...boxParts(mx - 0.075, my - 0.06, 0.15, 0.12, 21, 31, { l: '#c46b6b', r: '#d98383', t: '#a95656' }),
        { d: poly([[sx + 4, sy - 23], [sx + 10, sy - 25], [sx + 10, sy - 29], [sx + 4, sy - 27]]), fill: '#e8c26a' }
      ])
    }
    // 门口小花坛
    {
      const bx = x0 + 0.2
      const by = y1 + 0.5
      const parts = [
        ...boxParts(bx, by, 0.62, 0.3, 0, 8, { l: '#c9a48e', r: '#dcbba4', t: '#9a7660' }),
        sq(bx + 0.04, by + 0.04, bx + 0.58, by + 0.26, '#7f9a6f', 8)
      ]
      for (let i = 0; i < 5; i++) {
        const px = bx + 0.08 + i * 0.115
        parts.push({ d: ellipsePath(...ip(px, by + 0.15, 12), 3.4, 2.8), fill: ['#f4a0b8', '#ffd9a0', '#e9b8f0', '#ffc2cf', '#fff2c8'][i] })
      }
      add(bx + 0.3, by, parts)
    }
    // 迷你樱花树苗
    {
      const tx = x0 + 0.3
      const ty = y1 + 1.24
      const [sx, sy] = ip(tx, ty, 0)
      add(tx, ty, [
        sh(tx, ty, 9, 4, 0.14),
        { d: `M${P([sx - 3, sy])}L${P([sx - 1, round1(sy - 26)])}L${P([sx + 3, round1(sy - 26)])}L${P([sx + 2, sy])}Z`, fill: '#7a5a4e' },
        { d: `M${P([sx - 1, sy - 20])}L${P([sx - 11, sy - 30])}M${P([sx, sy - 23])}L${P([sx + 9, sy - 32])}`, fill: 'none', stroke: '#7a5a4e', sw: 1.6 },
        { d: ellipsePath(sx - 2, sy - 34, 11, 9), fill: '#f7bacd' },
        { d: ellipsePath(sx + 7, sy - 30, 8, 6.6), fill: '#f9c8d8' },
        { d: ellipsePath(sx - 8, sy - 38, 6.4, 5.4), fill: '#ffd7e3' }
      ])
    }
    // 户外小桌椅
    {
      const tx = x0 + 1.22
      const ty = y1 + 1.1
      const [sx, sy] = ip(tx, ty, 0)
      add(tx, ty, [
        sh(tx, ty, 14, 6, 0.12),
        { d: ellipsePath(sx, sy - 13, 12, 4.6), fill: '#e6cfb4' },
        { d: ellipsePath(sx, sy - 15, 12, 4.6), fill: '#f8ecdc' },
        { d: `M${P([sx, sy - 13])}V${round1(sy - 2)}`, fill: 'none', stroke: '#8a6a5a', sw: 2 },
        { d: ellipsePath(sx - 18, sy + 2, 5.4, 2.6), fill: '#d8bda4' },
        { d: ellipsePath(sx - 18, sy - 5, 5.4, 2.6), fill: '#e4cdb6' },
        { d: ellipsePath(sx + 17, sy + 5, 5.4, 2.6), fill: '#d8bda4' },
        { d: ellipsePath(sx + 17, sy - 2, 5.4, 2.6), fill: '#e4cdb6' }
      ])
    }
    // 晾衣绳 + 三件小衣服
    {
      const ax = x0 + 0.6
      const bx = x0 + 1.9
      const yy = y1 + 1.66
      const [p1x, p1y] = ip(ax, yy, 0)
      const [p2x, p2y] = ip(bx, yy, 0)
      const parts = [
        { d: `M${P([p1x, p1y])}V${round1(p1y - 36)}M${P([p2x, p2y])}V${round1(p2y - 36)}`, fill: 'none', stroke: '#a98d83', sw: 2 },
        { d: `M${P([p1x, p1y - 36])}Q${P([(p1x + p2x) / 2, (p1y + p2y) / 2 - 27])} ${P([p2x, p2y - 36])}`, fill: 'none', stroke: '#cbb2a6', sw: 1.2 }
      ]
      const cloths = ['#f6c9d5', '#d8e4f0', '#fff3d8']
      for (let i = 0; i < 3; i++) {
        const t = 0.24 + i * 0.26
        const cx = p1x + (p2x - p1x) * t
        const cy = p1y - 36 + (p2y - p1y) * t - 10 * Math.sin(Math.PI * t)
        parts.push({ d: poly([[cx - 6, cy], [cx + 6, cy], [cx + 5.2, cy + 13], [cx - 5.2, cy + 13]]), fill: cloths[i] })
      }
      add((ax + bx) / 2, yy, parts)
    }
  }

  if (v.key === 'home') {
    // 立式招牌（A 字木牌 + 一摞小书）
    {
      const sx0 = dcx - 0.66
      const sy0 = y1 + 0.5
      const [ax, ay] = ip(sx0, sy0, 0)
      add(sx0, sy0, [
        sh(sx0, sy0, 10, 3.6, 0.14),
        { d: poly([[ax - 9, ay], [ax + 9, ay], [ax + 7, ay - 26], [ax - 7, ay - 26]]), fill: '#fdf4ec' },
        { d: poly([[ax - 9, ay], [ax + 9, ay], [ax + 9, ay + 2.4], [ax - 9, ay + 2.4]]), fill: '#c9a48e' },
        { d: poly([[ax - 7, ay - 26], [ax + 7, ay - 26], [ax + 8, ay - 29], [ax - 8, ay - 29]]), fill: '#8f6a5e' },
        { d: poly([[ax - 5, ay - 6], [ax + 5, ay - 6], [ax + 5, ay - 9], [ax - 5, ay - 9]]), fill: '#d4708c' },
        { d: poly([[ax - 5, ay - 10], [ax + 4, ay - 10], [ax + 4, ay - 13], [ax - 5, ay - 13]]), fill: '#7f9fc9' },
        { d: poly([[ax - 4, ay - 18], [ax + 5, ay - 18], [ax + 5, ay - 20], [ax - 4, ay - 20]]), fill: '#b98a7f' }
      ])
    }
    // 落地展示柜（玻璃罩里放书）
    {
      const bx = dcx + 0.44
      const by = y1 + 0.4
      add(bx, by, [
        ...boxParts(bx - 0.3, by - 0.17, 0.6, 0.34, 0, 12, { l: '#e8d3c4', r: '#f6e6d8', t: '#d8bfae' }),
        ...boxParts(bx - 0.27, by - 0.14, 0.54, 0.28, 12, 23, { l: 'rgba(214,238,240,.86)', r: 'rgba(224,244,246,.8)', t: '#eaf6f8' }),
        sq(bx - 0.2, by - 0.05, bx + 0.18, by + 0.04, '#d4708c', 13),
        sq(bx - 0.16, by - 0.03, bx + 0.1, by + 0.06, '#e0a05c', 15),
        sq(bx - 0.22, by + 0.06, bx + 0.16, by + 0.12, '#7f9fc9', 13)
      ])
    }
    // 门口一摞一摞的书
    {
      const stacks = [[dcx - 0.28, y1 + 0.9], [dcx + 0.62, y1 + 1.0]]
      stacks.forEach(([sx0, sy0], k) => {
        const parts = [sh(sx0, sy0, 9, 3.4, 0.13)]
        for (let i = 0; i < 4; i++) {
          parts.push(...boxParts(sx0 - 0.14, sy0 - 0.1, 0.28 - i * 0.02, 0.2, i * 4, i * 4 + 3.6, {
            l: ['#d4708c', '#e0a05c', '#7f9fc9', '#8fb98b'][(i + k) % 4],
            r: ['#c4617d', '#cf8f4c', '#6f8fba', '#7fa97b'][(i + k) % 4],
            t: '#fff6ee'
          }))
        }
        add(sx0, sy0, parts)
      })
    }
    // 门上的花环
    {
      const [wx, wy] = ip(dcx, y1, 0)
      const parts = []
      for (let i = 0; i < 9; i++) {
        const a = ((Math.PI * 2) / 9) * i
        parts.push({ d: ellipsePath(wx + Math.cos(a) * 7, wy - 24 + Math.sin(a) * 7, 2.6, 2.6), fill: i % 2 ? '#8fae83' : '#f2a0b6' })
      }
      parts.push({ d: ellipsePath(wx + 1, wy - 16, 2.2, 2.2), fill: '#d95c78' })
      add(dcx, dcy, parts)
    }
  }

  if (v.key === 'store') {
    // 门口防滑垫
    add(dcx, y1 + 0.36, [sq(dcx - 0.36, y1 + 0.24, dcx + 0.36, y1 + 0.48, '#8d9a92'), sq(dcx - 0.32, y1 + 0.27, dcx + 0.32, y1 + 0.45, '#9daaa1')])
    // 户外冰柜
    {
      const bx = dcx + 0.62
      const by = y1 + 0.42
      add(bx, by, [
        sh(bx, by, 12, 5, 0.14),
        ...boxParts(bx - 0.3, by - 0.18, 0.6, 0.36, 0, 16, { l: '#e4eef0', r: '#f4fbfc', t: '#cfe0e4' }),
        ...boxParts(bx - 0.27, by - 0.15, 0.54, 0.3, 16, 20, { l: 'rgba(198,232,238,.9)', r: 'rgba(210,240,244,.9)', t: '#eaf7f9' }),
        sq(bx - 0.2, by - 0.05, bx - 0.1, by + 0.06, '#e0576f', 17),
        sq(bx - 0.06, by - 0.05, bx + 0.04, by + 0.06, '#6fae9d', 17),
        sq(bx + 0.07, by - 0.05, bx + 0.17, by + 0.06, '#f0c46a', 17)
      ])
    }
    // 户外小推车
    {
      const cx2 = dcx - 0.6
      const cy2 = y1 + 0.66
      const [sx, sy] = ip(cx2, cy2, 0)
      add(cx2, cy2, [
        sh(cx2, cy2, 11, 4.4, 0.14),
        { d: poly([[sx - 11, sy - 12], [sx + 11, sy - 12], [sx + 9, sy - 2], [sx - 9, sy - 2]]), fill: '#f4e2cf' },
        { d: poly([[sx - 11, sy - 12], [sx + 11, sy - 12], [sx + 11, sy - 15], [sx - 11, sy - 15]]), fill: '#d9bfa6' },
        { d: `M${P([sx - 11, sy - 14])}L${P([sx - 18, sy - 24])}`, fill: 'none', stroke: '#a98d83', sw: 1.6 },
        { d: ellipsePath(sx - 6, sy, 3.4, 3.4), fill: '#6f5a5e' },
        { d: ellipsePath(sx + 6, sy, 3.4, 3.4), fill: '#6f5a5e' },
        { d: ellipsePath(sx - 4, sy - 18, 3.4, 2.6), fill: '#f2a0b6' },
        { d: ellipsePath(sx + 4, sy - 19, 3, 2.4), fill: '#ffd9a0' }
      ])
    }
    // 自动门感应器
    {
      const [sx, sy] = ip(dcx, y1, 0)
      add(dcx, dcy, [
        { d: poly([[sx - 12, sy - 33], [sx + 12, sy - 33], [sx + 12, sy - 39], [sx - 12, sy - 39]]), fill: '#8f9a94' },
        { d: poly([[sx - 3, sy - 39], [sx + 3, sy - 39], [sx + 3, sy - 41], [sx - 3, sy - 41]]), fill: '#6f7a76' },
        { d: `M${P([sx - 24, sy - 36])}h8`, fill: 'none', stroke: 'rgba(190, 240, 220, .8)', sw: 1.2 }
      ])
    }
    // 两盆绿植
    add(dcx - 0.5, y1 + 0.44, pot(dcx - 0.5, y1 + 0.44, 1, '#8fae83'))
    add(dcx + 0.2, y1 + 1.1, pot(dcx + 0.2, y1 + 1.1, 0.9, '#a8c98f'))
  }

  if (v.key === 'gym') {
    // 门口防滑垫
    add(dcx, y1 + 0.34, [sq(dcx - 0.34, y1 + 0.22, dcx + 0.34, y1 + 0.46, '#6f6a78'), sq(dcx - 0.3, y1 + 0.25, dcx + 0.3, y1 + 0.43, '#7d7786')])
    // 外墙哑铃标识：一块深紫小挂板，比一整面白墙板收敛得多
    {
      const [sx, sy] = ip(dcx + 0.42, y1, 0)
      add(dcx + 0.42, dcy, [
        { d: poly([[sx - 19, sy - 70], [sx + 19, sy - 70], [sx + 19, sy - 88], [sx - 19, sy - 88]]), fill: '#5b4a68' },
        { d: poly([[sx - 19, sy - 70], [sx + 19, sy - 70], [sx + 19, sy - 72.4], [sx - 19, sy - 72.4]]), fill: '#b6a0c0' },
        // 哑铃：两片配重 + 横杆
        { d: poly([[sx - 13, sy - 76], [sx - 8, sy - 76], [sx - 8, sy - 83], [sx - 13, sy - 83]]), fill: '#fff3e2' },
        { d: poly([[sx + 8, sy - 76], [sx + 13, sy - 76], [sx + 13, sy - 83], [sx + 8, sy - 83]]), fill: '#fff3e2' },
        { d: poly([[sx - 8, sy - 78.4], [sx + 8, sy - 78.4], [sx + 8, sy - 80.6], [sx - 8, sy - 80.6]]), fill: '#fff3e2' }
      ])
    }
    // 户外训练架（引体向上 + 吊环）
    {
      const bx = dcx + 0.66
      const by = y1 + 1.05
      const [ax, ay] = ip(bx - 0.36, by, 0)
      const [cx2, cy2] = ip(bx + 0.36, by, 0)
      add(bx, by, [
        sh(bx, by, 18, 7, 0.12),
        { d: `M${P([ax, ay])}V${round1(ay - 46)}M${P([cx2, cy2])}V${round1(cy2 - 46)}`, fill: 'none', stroke: '#7c6379', sw: 3.4 },
        { d: `M${P([ax, ay - 44])}L${P([cx2, cy2 - 44])}`, fill: 'none', stroke: '#8f7a94', sw: 3 },
        { d: `M${P([ax + 8, ay - 44])}v11M${P([cx2 - 8, cy2 - 44])}v11`, fill: 'none', stroke: '#a9929a', sw: 1.6 },
        { d: ellipsePath(ax + 8, ay - 31, 3.6, 3.6), fill: 'none', stroke: '#a9929a', sw: 1.8 },
        { d: ellipsePath(cx2 - 8, cy2 - 31, 3.6, 3.6), fill: 'none', stroke: '#a9929a', sw: 1.8 }
      ])
    }
    add(dcx - 0.56, y1 + 0.5, pot(dcx - 0.56, y1 + 0.5, 1, '#9cb88d'))
  }

  if (v.key === 'school') {
    // 校门拱门
    {
      const ay0 = y1 + 1.0
      const pxs = [dcx - 0.52, dcx + 0.52]
      const parts = []
      pxs.forEach((px) => {
        parts.push(sh(px, ay0, 8, 3.4, 0.14))
        parts.push(...boxParts(px - 0.09, ay0 - 0.09, 0.18, 0.18, 0, 46, { l: '#d9c8bd', r: '#ecdbd0', t: '#f6e9df' }))
        parts.push(...boxParts(px - 0.12, ay0 - 0.12, 0.24, 0.24, 46, 51, { l: '#c4b0a6', r: '#d8c4ba', t: '#e8d6cc' }))
      })
      const [l1, l2] = ip(dcx - 0.52, ay0, 49)
      const [r1, r2] = ip(dcx + 0.52, ay0, 49)
      const mx = (l1 + r1) / 2
      const myy = Math.min(l2, r2)
      parts.push({ d: `M${P([l1, l2 - 4])}Q${P([mx, myy - 22])} ${P([r1, r2 - 4])}`, fill: 'none', stroke: '#cbb4a8', sw: 5.4 })
      parts.push({ d: `M${P([l1, l2 - 4])}Q${P([mx, myy - 22])} ${P([r1, r2 - 4])}`, fill: 'none', stroke: '#e8d6cb', sw: 2.6 })
      parts.push({ d: poly([[mx - 17, myy - 6], [mx + 17, myy - 6], [mx + 17, myy - 17], [mx - 17, myy - 17]]), fill: '#8f6f8c' })
      parts.push({ d: poly([[mx - 12, myy - 10], [mx + 12, myy - 10], [mx + 12, myy - 12], [mx - 12, myy - 12]]), fill: '#e3cfe0' })
      add(dcx, ay0, parts)
    }
    // 石质校碑
    {
      const bx = dcx + 0.92
      const by = y1 + 0.52
      add(bx, by, [
        sh(bx, by, 12, 5, 0.14),
        ...boxParts(bx - 0.3, by - 0.17, 0.6, 0.34, 0, 9, { l: '#cfc6bd', r: '#ded5cc', t: '#eee6de' }),
        ...boxParts(bx - 0.22, by - 0.11, 0.44, 0.22, 9, 36, { l: '#d8cfc6', r: '#e9e0d7', t: '#f4ece4' }),
        sq(bx - 0.1, by - 0.06, bx + 0.14, by + 0.02, 'rgba(150,130,120,.45)', 35),
        sq(bx - 0.08, by - 0.05, bx + 0.04, by + 0.01, 'rgba(255,255,255,.5)', 36)
      ])
    }
    // 两侧成排的小圆樱花树
    {
      const trees = [x0 + 0.42, x0 + 0.95, x1 - 0.95, x1 - 0.42]
      trees.forEach((tx) => {
        const ty = y1 + 1.05
        const [sx, sy] = ip(tx, ty, 0)
        add(tx, ty, [
          sh(tx, ty, 8, 3.6, 0.13),
          { d: `M${P([sx - 2.6, sy])}L${P([sx - 1, round1(sy - 22)])}L${P([sx + 2.6, round1(sy - 22)])}L${P([sx + 2, sy])}Z`, fill: '#7a5a4e' },
          { d: ellipsePath(sx, sy - 30, 10, 8.4), fill: '#f7bacd' },
          { d: ellipsePath(sx - 6, sy - 34, 6.4, 5.4), fill: '#ffd7e3' },
          { d: ellipsePath(sx + 5, sy - 32, 5.6, 4.6), fill: '#f9c8d8' }
        ])
      })
    }
    // 花坛 + 升旗台
    {
      const bx = x0 + 0.25
      const by = y1 + 0.42
      const parts = [
        ...boxParts(bx, by, 0.9, 0.28, 0, 8, { l: '#c9a48e', r: '#dcbba4', t: '#9a7660' }),
        sq(bx + 0.04, by + 0.04, bx + 0.86, by + 0.24, '#7f9a6f', 8)
      ]
      for (let i = 0; i < 6; i++) {
        parts.push({ d: ellipsePath(...ip(bx + 0.1 + i * 0.13, by + 0.14, 12), 3.2, 2.6), fill: ['#f4a0b8', '#ffd9a0', '#e9b8f0', '#ffc2cf', '#fff2c8', '#f6b3c6'][i] })
      }
      add(bx + 0.45, by, parts)
    }
    {
      const fx = dcx - 0.95
      const fy = y1 + 1.62
      const [sx, sy] = ip(fx, fy, 0)
      add(fx, fy, [
        ...boxParts(fx - 0.28, fy - 0.28, 0.56, 0.56, 0, 7, { l: '#d6c9bc', r: '#e9ddd0', t: '#f4e9dc' }),
        { d: `M${P([sx, sy - 7])}V${round1(sy - 62)}`, fill: 'none', stroke: '#a9929a', sw: 2.2 },
        { d: poly([[sx + 1, sy - 62], [sx + 20, sy - 57], [sx + 20, sy - 47], [sx + 1, sy - 52]]), fill: '#ef98ac' }
      ])
    }
  }

  if (v.key === 'cafe') {
    // 门口小黑板 + 两盆绿植 + 门口花箱
    {
      const sx0 = dcx - 0.58
      const sy0 = y1 + 0.5
      const [ax, ay] = ip(sx0, sy0, 0)
      add(sx0, sy0, [
        sh(sx0, sy0, 9, 3.4, 0.14),
        { d: poly([[ax - 9, ay], [ax + 9, ay], [ax + 7, ay - 24], [ax - 7, ay - 24]]), fill: '#5a4a44' },
        { d: poly([[ax - 7.4, ay - 1.6], [ax + 7.4, ay - 1.6], [ax + 6, ay - 22], [ax - 6, ay - 22]]), fill: '#3f4f42' },
        { d: `M${P([ax - 4, ay - 17])}h6M${P([ax - 4, ay - 13])}h4M${P([ax - 4, ay - 9])}h5`, fill: 'none', stroke: 'rgba(255,246,232,.72)', sw: 1 },
        { d: poly([[ax - 7, ay - 24], [ax + 7, ay - 24], [ax + 7, ay - 26], [ax - 7, ay - 26]]), fill: '#7a5a4e' }
      ])
    }
    add(dcx + 0.58, y1 + 0.44, pot(dcx + 0.58, y1 + 0.44, 1, '#7f9f74'))
    add(dcx - 0.3, y1 + 1.26, pot(dcx - 0.3, y1 + 1.26, 0.9, '#f4a0b8'))
    // 窗下的花箱
    add(x0 + 1.5, y1 + 0.24, [
      ...boxParts(x0 + 1.15, y1 + 0.1, 0.7, 0.22, 0, 9, { l: '#c9a48e', r: '#dcbba4', t: '#9a7660' }),
      ...Array.from({ length: 5 }, (_, i) => ({ d: ellipsePath(...ip(x0 + 1.24 + i * 0.14, y1 + 0.21, 13), 3.2, 2.6), fill: ['#f4a0b8', '#ffd9a0', '#e9b8f0', '#ffc2cf', '#fff2c8'][i] }))
    ])
  }

  if (v.key === 'sweet') {
    // 甜品推车 + 门口花箱 + 气球
    {
      const cx2 = dcx - 0.6
      const cy2 = y1 + 0.62
      const [sx, sy] = ip(cx2, cy2, 0)
      add(cx2, cy2, [
        sh(cx2, cy2, 11, 4.4, 0.14),
        { d: poly([[sx - 11, sy - 14], [sx + 11, sy - 14], [sx + 9, sy - 2], [sx - 9, sy - 2]]), fill: '#fff2f4' },
        { d: poly([[sx - 11, sy - 14], [sx + 11, sy - 14], [sx + 11, sy - 17], [sx - 11, sy - 17]]), fill: '#f3b3c4' },
        { d: `M${P([sx - 11, sy - 16])}L${P([sx - 18, sy - 26])}`, fill: 'none', stroke: '#a98d83', sw: 1.6 },
        { d: ellipsePath(sx - 6, sy, 3.2, 3.2), fill: '#7a5a62' },
        { d: ellipsePath(sx + 6, sy, 3.2, 3.2), fill: '#7a5a62' },
        { d: ellipsePath(sx - 3, sy - 20, 3.2, 2.8), fill: '#f6c3d2' },
        { d: ellipsePath(sx + 4, sy - 21, 2.8, 2.4), fill: '#ffe0b8' }
      ])
    }
    add(dcx + 0.56, y1 + 0.44, pot(dcx + 0.56, y1 + 0.44, 1, '#e88fa6'))
    add(x0 + 0.3, y1 + 1.2, pot(x0 + 0.3, y1 + 1.2, 0.9, '#f6c3d2'))
  }

  if (v.key === 'flower') {
    // 门口两层花架（比花桶更有花店的样子）
    {
      const bx = x1 + 0.62
      const by = dcy + 0.5
      const [sx, sy] = ip(bx, by, 0)
      add(bx, by, [
        sh(bx, by, 11, 4.6, 0.14),
        { d: `M${P([sx - 10, sy])}V${round1(sy - 26)}M${P([sx + 10, sy - 3])}V${round1(sy - 29)}`, fill: 'none', stroke: '#a98d83', sw: 2 },
        { d: poly([[sx - 11, sy - 12], [sx + 11, sy - 15], [sx + 11, sy - 17], [sx - 11, sy - 14]]), fill: '#c9a48e' },
        { d: poly([[sx - 11, sy - 24], [sx + 11, sy - 27], [sx + 11, sy - 29], [sx - 11, sy - 26]]), fill: '#c9a48e' },
        { d: ellipsePath(sx - 6, sy - 20, 4, 3.6), fill: '#f4a0b8' },
        { d: ellipsePath(sx + 2, sy - 21, 4, 3.6), fill: '#ffd9a0' },
        { d: ellipsePath(sx - 4, sy - 32, 4.2, 3.8), fill: '#d9b8ea' },
        { d: ellipsePath(sx + 5, sy - 33, 3.8, 3.4), fill: '#ffc2cf' }
      ])
    }
    add(x1 + 0.34, dcy - 0.62, pot(x1 + 0.34, dcy - 0.62, 1, '#9cb88d'))
    // 小木牌
    {
      const bx = x1 + 0.32
      const by = dcy + 1.02
      const [sx, sy] = ip(bx, by, 0)
      add(bx, by, [
        { d: `M${P([sx, sy])}V${round1(sy - 16)}`, fill: 'none', stroke: '#a98d83', sw: 2 },
        { d: poly([[sx - 10, sy - 16], [sx + 10, sy - 18], [sx + 10, sy - 25], [sx - 10, sy - 23]]), fill: '#f6ecdc' },
        { d: `M${P([sx - 6, sy - 20])}h9`, fill: 'none', stroke: '#b98a7f', sw: 1.4 }
      ])
    }
  }

  if (v.key === 'station') {
    // 月台上的花箱（平台高 8）
    const py = y1 + 1.4
    ;[x0 + 0.55, x0 + v.w - 0.55].forEach((px) => {
      add(px, py, [
        ...boxParts(px - 0.24, py - 0.13, 0.48, 0.26, 8, 16, { l: '#c9a48e', r: '#dcbba4', t: '#9a7660' }),
        ...Array.from({ length: 3 }, (_, i) => ({ d: ellipsePath(...ip(px - 0.15 + i * 0.15, py, 19), 3.4, 2.8), fill: ['#f4a0b8', '#ffd9a0', '#ffc2cf'][i] }))
      ])
    })
  }

  // 远的先画、近的压上
  groups.sort((a, b) => a.k - b.k)
  const out = []
  for (const g of groups) out.push(...g.parts)
  return out
}

const venues = BUILDINGS.map(buildVenue)

// 公园是「开放场地」：没有房子，给一块透明热区就能点
const parkVenue = {
  type: 'venue',
  id: 'v-park',
  key: 'park',
  label: '公园',
  en: 'PARK',
  depth: parkSpec.x + parkSpec.y + 0.1,
  shadow: null,
  halo: park.patch,
  faces: { left: 'M0 0Z', right: 'M0 0Z' },
  wallL: 'none',
  wallR: 'none',
  deco: [],
  roofParts: [],
  labelPos: ip(11.9, 13.1, 66)
}
venues.push(parkVenue)

/* ---------- 树 / 灯 / 长椅 / 灌木 / 石头 ---------- */
function buildTree (t) {
  const [bx, by] = ip(t.x, t.y)
  const s = t.s || 1
  const th = 56 * s
  const top = by - th
  const blobs = [
    { dx: 0, dy: 0, rx: 31, ry: 24, fill: 'url(#canopy)', opacity: 0.92 },
    { dx: -25, dy: 4, rx: 24, ry: 19, fill: 'url(#canopy)', opacity: 0.88 },
    { dx: 24, dy: 2, rx: 23, ry: 18, fill: 'url(#canopy)', opacity: 0.86 },
    { dx: -7, dy: -20, rx: 29, ry: 23, fill: 'url(#canopyLit)', opacity: 0.9 },
    { dx: 12, dy: -34, rx: 21, ry: 17, fill: 'url(#canopyLit)', opacity: 0.86 },
    { dx: -18, dy: -30, rx: 17, ry: 14, fill: 'url(#canopyLit)', opacity: 0.7 }
  ].map((b) => ({
    cx: round1(bx + b.dx * s),
    cy: round1(top + b.dy * s + 8 * s),
    rx: round1(b.rx * s),
    ry: round1(b.ry * s),
    fill: b.fill,
    opacity: b.opacity
  }))
  const dots = []
  for (let i = 0; i < 9; i++) {
    const a = i * 2.1
    dots.push([
      round1(bx + Math.cos(a) * 22 * s * (0.4 + (i % 3) * 0.3)),
      round1(top + Math.sin(a * 1.3) * 14 * s - 4 * s),
      round1(1.6 * s)
    ])
  }
  return {
    type: 'tree',
    id: `t-${t.x}-${t.y}`,
    depth: t.x + t.y,
    bx, by, s,
    trunk: `M${P([bx - 3.6 * s, by])}Q${P([bx - 2.2 * s, by - th * 0.6])} ${P([bx - 1 * s, top])}` +
      `L${P([bx + 1 * s, top])}Q${P([bx + 2.6 * s, by - th * 0.55])} ${P([bx + 3.6 * s, by])}Z`,
    branch: `M${P([bx, by - th * 0.72])}q${-12 * s} ${-6 * s} ${-16 * s} ${-14 * s}` +
      `M${P([bx + 0.5 * s, by - th * 0.62])}q${12 * s} ${-5 * s} ${15 * s} ${-12 * s}`,
    blobs,
    dots
  }
}

const TREES = [
  // 公园里的三棵大樱花
  { x: 11.5, y: 11.9, s: 1.12 },
  { x: 13.1, y: 13.0, s: 0.96 },
  { x: 10.5, y: 13.7, s: 0.9 },
  // 书店背后的小林
  { x: 2.0, y: 3.5, s: 0.94 },
  { x: 0.9, y: 5.4, s: 0.82 },
  // 便利店背后
  { x: 5.5, y: 0.9, s: 0.84 },
  { x: 8.7, y: 1.0, s: 0.88 },
  // 家旁边
  { x: 15.05, y: 7.5, s: 0.9 },
  { x: 14.75, y: 9.7, s: 0.8 },
  // 健身房前
  { x: 1.3, y: 14.6, s: 0.86 },
  { x: 6.0, y: 15.3, s: 0.8 },
  // 凉亭一带
  { x: 15.4, y: 5.5, s: 0.82 },
  { x: 13.2, y: 2.0, s: 0.78 },
  // 左角与正前方
  { x: 0.8, y: 9.8, s: 0.82 },
  { x: 8.2, y: 15.6, s: 0.78 },
  // 广场前方的空地
  { x: 6.6, y: 12.9, s: 0.84 },
  { x: 9.1, y: 13.6, s: 0.78 },
  // 新街区：车站一带与右前方
  { x: 16.6, y: 14.2, s: 0.9 },
  { x: 18.9, y: 16.1, s: 0.8 },
  { x: 19.8, y: 12.4, s: 0.86 },
  { x: 15.5, y: 17.8, s: 0.76 },
  { x: 3.6, y: 18.6, s: 0.82 },
  { x: 19.4, y: 8.4, s: 0.78 },
  // 左侧边缘
  { x: 0.6, y: 7.2, s: 0.86 },
  { x: 1.4, y: 12.2, s: 0.8 },
  { x: 17.6, y: 15.6, s: 0.82 }
]

const LAMPS = [
  { x: 6.3, y: 6.3 },
  { x: 10.7, y: 6.3 },
  { x: 6.3, y: 10.7 },
  { x: 10.7, y: 10.7 },
  { x: 12.9, y: 4.6 },
  { x: 9.2, y: 13.4 },
  { x: 9.8, y: 16.2 },
  { x: 16.2, y: 9.0 },
  { x: 20.0, y: 11.2 }
].map((l, i) => {
  const [bx, by] = ip(l.x, l.y)
  return {
    type: 'lamp',
    id: `lamp${i}`,
    depth: l.x + l.y,
    bx, by,
    pole: `M${P([bx, by])}V${round1(by - 44)}`,
    head: `M${P([bx - 6, by - 46])}h12l-2-9h-8Z`,
    cap: `M${P([bx - 8, by - 56])}h16`
  }
})

const BENCHES = [
  { x: 12.6, y: 12.1 },
  { x: 11.9, y: 13.9 },
  { x: 7.05, y: 15.25 },
  { x: 9.2, y: 18.2 },
  { x: 17.4, y: 11.2 }
].map((b, i) => {
  const [bx, by] = ip(b.x, b.y)
  return {
    type: 'bench',
    id: `bench${i}`,
    depth: b.x + b.y,
    bx, by,
    seat: poly([ip(b.x - 0.34, b.y - 0.12, 8), ip(b.x + 0.34, b.y - 0.12, 8), ip(b.x + 0.34, b.y + 0.12, 8), ip(b.x - 0.34, b.y + 0.12, 8)]),
    back: poly([ip(b.x - 0.34, b.y + 0.12, 8), ip(b.x + 0.34, b.y + 0.12, 8), ip(b.x + 0.34, b.y + 0.12, 18), ip(b.x - 0.34, b.y + 0.12, 18)]),
    legs: `M${P([bx - 14, round1(by - 4)])}V${round1(by + 4)}M${P([bx + 10, round1(by - 8)])}V${round1(by)}`
  }
})

const BUSHES = [
  { x: 1.6, y: 7.6 }, { x: 5.9, y: 5.6 }, { x: 9.6, y: 5.4 }, { x: 11.0, y: 7.2 },
  { x: 3.4, y: 9.6 }, { x: 14.2, y: 4.6 }, { x: 0.9, y: 11.6 }, { x: 6.6, y: 12.4 },
  { x: 8.4, y: 13.4 }, { x: 12.2, y: 10.4 }, { x: 15.6, y: 8.2 }, { x: 4.4, y: 4.2 },
  { x: 9.4, y: 2.4 }, { x: 16.0, y: 6.2 }, { x: 2.2, y: 12.6 }, { x: 7.0, y: 9.9 },
  { x: 15.2, y: 15.6 }, { x: 17.8, y: 17.6 }, { x: 20.0, y: 15.2 }, { x: 19.0, y: 10.6 },
  { x: 4.8, y: 17.4 }, { x: 8.0, y: 19.2 }, { x: 16.4, y: 19.0 },
  { x: 0.4, y: 8.6 }, { x: 2.0, y: 6.4 }, { x: 19.6, y: 15.4 }, { x: 16.2, y: 10.6 }
].map((b, i) => {
  const [bx, by] = ip(b.x, b.y)
  return { type: 'bush', id: `bush${i}`, depth: b.x + b.y, bx, by }
})

const ROCKS = [
  { x: 1.6, y: 2.2 }, { x: 16.1, y: 4.2 }, { x: 7.4, y: 15.9 },
  { x: 3.0, y: 16.5 }, { x: 13.4, y: 15.3 }, { x: 0.7, y: 13.1 }
].map((r, i) => {
  const [bx, by] = ip(r.x, r.y)
  return {
    type: 'rock',
    id: `rock${i}`,
    depth: r.x + r.y,
    body: `M${P([bx - 11, by])}L${P([bx - 6, by - 9])}L${P([bx + 4, by - 10])}L${P([bx + 11, by - 2])}L${P([bx + 6, by + 3])}Z`,
    lit: `M${P([bx - 6, by - 9])}L${P([bx + 4, by - 10])}L${P([bx + 2, by - 4])}L${P([bx - 5, by - 3])}Z`
  }
})

// 喷泉：广场中心的地标
const fountain = (() => {
  const [bx, by] = ip(PCX, PCY)
  return {
    type: 'fountain',
    id: 'fountain',
    depth: PCX + PCY,
    bx, by,
    basinOuter: `M${P([bx - 44, by])}a44 22 0 1 0 88 0a44 22 0 1 0 -88 0Z`,
    water: `M${P([bx - 33, by])}a33 16.5 0 1 0 66 0a33 16.5 0 1 0 -66 0Z`,
    basinInner: `M${P([bx - 37, by])}a37 18.5 0 1 0 74 0a37 18.5 0 1 0 -74 0Z`,
    column: poly([ip(PCX - 0.23, PCY - 0.23, 0), ip(PCX + 0.23, PCY - 0.23, 0), ip(PCX + 0.23, PCY - 0.23, 36), ip(PCX - 0.23, PCY - 0.23, 36)]),
    columnShade: poly([ip(PCX + 0.23, PCY - 0.23, 0), ip(PCX + 0.23, PCY + 0.23, 0), ip(PCX + 0.23, PCY + 0.23, 36), ip(PCX + 0.23, PCY - 0.23, 36)]),
    jetLeft: `M${P([bx - 4, by - 42])}q${-14} ${-10} ${-18} ${4}`,
    jetRight: `M${P([bx + 4, by - 42])}q${14} ${-10} ${18} ${4}`
  }
})()

/* ---------- 车站：铁轨 + 停靠的小电车 ---------- */
const track = (() => {
  const ty = 20.05
  const gx0 = 7.6
  const gx1 = 21.2
  const parts = []
  // 道床
  parts.push({
    d: poly([ip(gx0, ty - 0.4, 3), ip(gx1, ty - 0.4, 3), ip(gx1, ty + 0.4, 3), ip(gx0, ty + 0.4, 3)]),
    fill: '#c6b6a5'
  })
  // 枕木
  for (let x = gx0 + 0.14; x < gx1 - 0.1; x += 0.38) {
    parts.push({
      d: poly([ip(x, ty - 0.32, 4), ip(x + 0.11, ty - 0.32, 4), ip(x + 0.11, ty + 0.32, 4), ip(x, ty + 0.32, 4)]),
      fill: '#a2856f'
    })
  }
  // 两条钢轨
  parts.push({ d: `M${P(ip(gx0, ty - 0.17, 6))}L${P(ip(gx1, ty - 0.17, 6))}`, fill: 'none', stroke: '#6b606e', sw: 2.2 })
  parts.push({ d: `M${P(ip(gx0, ty + 0.17, 6))}L${P(ip(gx1, ty + 0.17, 6))}`, fill: 'none', stroke: '#6b606e', sw: 2.2 })
  return { type: 'track', id: 'track', depth: 6, parts }
})()

const train = (() => {
  const ty = 20.05
  const y0 = ty - 0.26
  const d = 0.52
  const parts = []
  // 车体：车头 + 一节车厢
  const cars = [[12.15, 2.05, true], [14.35, 2.05, false]]
  for (const [cx, cw, isHead] of cars) {
    parts.push(...boxParts(cx, y0, cw, d, 7, 36, { l: '#fdf3f4', r: '#e6d3da', t: '#fffafb' }))
    // 车窗带
    parts.push({
      d: poly([ip(cx + 0.14, y0 + d, 21), ip(cx + cw - 0.14, y0 + d, 21), ip(cx + cw - 0.14, y0 + d, 30), ip(cx + 0.14, y0 + d, 30)]),
      fill: '#c6e6ef'
    })
    for (let i = 1; i < 5; i++) {
      const x = cx + 0.14 + ((cw - 0.28) / 5) * i
      parts.push({
        d: poly([ip(x - 0.025, y0 + d, 21), ip(x + 0.025, y0 + d, 21), ip(x + 0.025, y0 + d, 30), ip(x - 0.025, y0 + d, 30)]),
        fill: '#8fb6c6'
      })
    }
    // 车顶 + 腰带（樱色）
    parts.push({ d: poly([ip(cx, y0 + d, 36), ip(cx + cw, y0 + d, 36), ip(cx + cw, y0 + d, 38.5), ip(cx, y0 + d, 38.5)]), fill: '#c4aab6' })
    parts.push({ d: poly([ip(cx, y0 + d, 15), ip(cx + cw, y0 + d, 15), ip(cx + cw, y0 + d, 18), ip(cx, y0 + d, 18)]), fill: '#e07d92' })
    // 车底转向架
    parts.push({ d: poly([ip(cx + 0.2, y0 + d, 3.5), ip(cx + 0.62, y0 + d, 3.5), ip(cx + 0.62, y0 + d, 7), ip(cx + 0.2, y0 + d, 7)]), fill: '#5c5060' })
    parts.push({ d: poly([ip(cx + cw - 0.62, y0 + d, 3.5), ip(cx + cw - 0.2, y0 + d, 3.5), ip(cx + cw - 0.2, y0 + d, 7), ip(cx + cw - 0.62, y0 + d, 7)]), fill: '#5c5060' })
    if (isHead) {
      // 车头：斜切的鼻子 + 头灯 + 前窗
      parts.push({
        d: poly([ip(cx + cw, y0 + d, 7), ip(cx + cw + 0.22, y0 + d, 15), ip(cx + cw + 0.22, y0 + d, 33), ip(cx + cw, y0 + d, 36)]),
        fill: '#f6e7ea'
      })
      parts.push({
        d: poly([ip(cx + cw + 0.04, y0 + d, 22), ip(cx + cw + 0.2, y0 + d, 26), ip(cx + cw + 0.2, y0 + d, 32), ip(cx + cw + 0.04, y0 + d, 33)]),
        fill: '#bfe0ea'
      })
      const [hx, hy] = ip(cx + cw + 0.16, y0 + d, 16)
      parts.push({ d: ellipsePath(hx, hy, 3, 3), fill: '#fff2c4' })
    }
  }
  return { type: 'train', id: 'train', depth: 16.4 + ty, parts }
})()

// 站在广场上的小人：给地图一个「这是我」的锚点
const walker = (() => {
  const [bx, by] = ip(9.92, 9.66)
  return {
    type: 'walker',
    id: 'walker',
    depth: 9.92 + 9.66,
    bx, by,
    body: `M${P([bx - 5.5, by - 22])}Q${P([bx - 6.5, by - 4])} ${P([bx - 4, by])}L${P([bx + 4, by])}Q${P([bx + 6.5, by - 4])} ${P([bx + 5.5, by - 22])}Z`,
    hair: `M${P([bx - 7.6, by - 32])}a7.6 7.6 0 0 1 15.2 0q${-7.6} ${-4} ${-15.2} 0Z`
  }
})()

/** 通用的落地小箱子：自动出两个侧面 + 顶面 */
function boxParts (x0, y0, w, d, z0, z1, colors) {
  const x1 = x0 + w
  const y1 = y0 + d
  return [
    { d: poly([ip(x0, y1, z0), ip(x1, y1, z0), ip(x1, y1, z1), ip(x0, y1, z1)]), fill: colors.l },
    { d: poly([ip(x1, y0, z0), ip(x1, y1, z0), ip(x1, y1, z1), ip(x1, y0, z1)]), fill: colors.r },
    { d: poly([ip(x0, y0, z1), ip(x1, y0, z1), ip(x1, y1, z1), ip(x0, y1, z1)]), fill: colors.t }
  ]
}

// 广场边的自动贩卖机：夜里自己会亮的那种
const vending = (() => {
  const x0 = 7.16
  const y0 = 10.18
  const w = 0.44
  const d = 0.3
  return {
    type: 'box',
    id: 'vending',
    depth: x0 + y0 + w + d,
    parts: boxParts(x0, y0, w, d, 0, 26, { l: '#e05a72', r: '#b8415c', t: '#f08498' }),
    glow: poly([ip(x0 + 0.04, y0 + d, 12), ip(x0 + w - 0.04, y0 + d, 12), ip(x0 + w - 0.04, y0 + d, 23), ip(x0 + 0.04, y0 + d, 23)]),
    cap: poly([ip(x0 - 0.03, y0 - 0.03, 26), ip(x0 + w + 0.03, y0 - 0.03, 26), ip(x0 + w + 0.03, y0 + d + 0.03, 26), ip(x0 - 0.03, y0 + d + 0.03, 26)])
  }
})()

// 凉亭：四根柱子 + 攒尖顶，摆在右后方那块空地上
const gazebo = (() => {
  const x0 = 13.8
  const y0 = 2.9
  const w = 1.5
  const d = 1.5
  const x1 = x0 + w
  const y1 = y0 + d
  const baseH = 6
  const postH = 46
  const apex = ip((x0 + x1) / 2, (y0 + y1) / 2, postH + 30)
  const posts = [[x0 + 0.16, y0 + 0.16], [x1 - 0.16, y0 + 0.16], [x1 - 0.16, y1 - 0.16], [x0 + 0.16, y1 - 0.16]]
  const parts = [
    ...boxParts(x0, y0, w, d, 0, baseH, { l: '#d3bbae', r: '#c0a69b', t: '#e2cec2' }),
    ...posts.map(([px, py]) => boxParts(px - 0.06, py - 0.06, 0.12, 0.12, baseH, postH, { l: '#9c7683', r: '#7b5966', t: '#ad8a97' })).flat(),
    { d: poly([ip(x1 + 0.2, y0 - 0.2, postH), ip(x1 + 0.2, y1 + 0.2, postH), apex]), fill: '#6d4a64' },
    { d: poly([ip(x0 - 0.2, y1 + 0.2, postH), ip(x1 + 0.2, y1 + 0.2, postH), apex]), fill: '#8d6484' },
    { d: `M${P(apex)}l-2.6 -6 5.2 0Z`, fill: '#c9a3b8' } // 顶上那颗珠子
  ]
  return {
    type: 'gazebo',
    id: 'gazebo',
    depth: x1 + y1,
    parts,
    shadow: poly([ip(x0 - 0.1, y0 - 0.1), ip(x1 + 0.5, y0 - 0.1), ip(x1 + 0.5, y1 + 0.5), ip(x0 - 0.1, y1 + 0.5)])
  }
})()

/** 画家算法：x+y 越大越靠近镜头，最后画 */
const scene = computed(() => [
  ...venues,
  ...TREES.map(buildTree),
  ...LAMPS,
  ...BENCHES,
  ...BUSHES,
  ...ROCKS,
  fountain,
  vending,
  bridge,
  gazebo,
  track,
  train,
  walker
].sort((a, b) => a.depth - b.depth))

/* =========================================================
   名牌：把 SVG 坐标换算成容器里的像素，交给 HTML 定位
   —— SVG 里的 text 会跟着 viewBox 一起缩小，手机上就看不见了
   ========================================================= */
const stageEl = ref(null)
const stageW = ref(0)
const stageH = ref(0)

/* =========================================================
   地图分页：全景 + 三个街区
   —— 切页只是换 viewBox（推近镜头），房子并没有搬家，
      所以名牌、点击热区会跟着一起走；换框的瞬间用淡出遮掉跳变
   ========================================================= */
const FULL_BOX = { x: VBX, y: VBY, w: VBW, h: VBH }

/** 把一组建筑框成取景框（含名牌上方的留白），再按 1.72 补齐比例 */
function frameOf (keys, pad = 82) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  const add = ([px, py]) => {
    x0 = Math.min(x0, px)
    y0 = Math.min(y0, py)
    x1 = Math.max(x1, px)
    y1 = Math.max(y1, py)
  }
  const boxes = BUILDINGS.filter((b) => keys.includes(b.key))
  if (keys.includes('park')) boxes.push({ x: 10.0, y: 11.2, w: 3.8, d: 3.4, h: 44 })
  boxes.forEach((b) => {
    const x2 = b.x + b.w
    const y2 = b.y + b.d
    const top = b.h + 58
    add(ip(b.x, b.y, 0))
    add(ip(x2, b.y, 0))
    add(ip(b.x, y2, 0))
    add(ip(x2, y2, 0))
    add(ip(b.x, y2, top))
    add(ip(x2, y2, top))
  })
  x0 -= pad
  x1 += pad
  y0 -= pad + 24
  y1 += pad
  const AR = 1.72
  let w = x1 - x0
  let h = y1 - y0
  if (w / h < AR) w = h * AR
  else h = w / AR
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

const PAGE_DEFS = [
  { key: 'all', label: '全景', en: 'OVERVIEW', keys: null, box: FULL_BOX },
  { key: 'honmachi', label: '本町', en: 'TOWN CENTER', keys: ['home', 'store', 'gamehome', 'park'], box: null },
  { key: 'street', label: '商店街', en: 'SHOPPING STREET', keys: ['cafe', 'sweet', 'flower', 'gym'], box: null },
  { key: 'school', label: '学校·车站', en: 'SCHOOL & STATION', keys: ['school', 'station'], box: null }
].map((p) => ({ ...p, box: p.box || frameOf(p.keys) }))

const page = ref(0)
const flipping = ref(false)
const vb = ref({ ...FULL_BOX })
const vbStr = computed(() => `${round1(vb.value.x)} ${round1(vb.value.y)} ${round1(vb.value.w)} ${round1(vb.value.h)}`)
const pageKeys = computed(() => PAGE_DEFS[page.value].keys)

let flipTimer = null
let flipTimer2 = null
function goPage (i) {
  const n = PAGE_DEFS.length
  const next = ((i % n) + n) % n
  if (next === page.value || flipping.value) return
  flipping.value = true
  clearTimeout(flipTimer)
  clearTimeout(flipTimer2)
  flipTimer = setTimeout(() => {
    page.value = next
    vb.value = { ...PAGE_DEFS[next].box }
    flipTimer2 = setTimeout(() => { flipping.value = false }, 40)
  }, 170)
}
function nextPage () { goPage(page.value + 1) }
function prevPage () { goPage(page.value - 1) }

const spots = computed(() => {
  const scale = Math.min(stageW.value / vb.value.w, stageH.value / vb.value.h) || 0
  const dx = (stageW.value - vb.value.w * scale) / 2 - vb.value.x * scale
  const dy = (stageH.value - vb.value.h * scale) / 2 - vb.value.y * scale
  const only = pageKeys.value
  return venues.filter((v) => !only || only.includes(v.key)).map((v) => {
    const px = dx + v.labelPos[0] * scale
    const py = dy + v.labelPos[1] * scale
    // 贴边时把名牌拉回画面内，免得被小岛外框裁掉一角
    const pad = 54
    return {
      key: v.key,
      label: v.label,
      en: v.en,
      px: round1(Math.min(Math.max(px, pad), stageW.value - pad)),
      // 上下也要夹：收紧取景框后，最上面那排建筑的名牌会被画框切掉
      py: round1(Math.min(Math.max(py, 58), stageH.value - 26))
    }
  })
})
/* ---------- 悬停 / 视差 ---------- */
const hover = ref(null)
const tilt = ref({ x: 0, y: 0 })
const reduceMotion = ref(false)

const stageStyle = computed(() => ({
  transform: `translate3d(${tilt.value.x}px, ${tilt.value.y}px, 0)`
}))

function onPointerMove (e) {
  if (reduceMotion.value) return
  const rect = stageEl.value ? stageEl.value.getBoundingClientRect() : null
  if (!rect) return
  const nx = (e.clientX - rect.left) / rect.width - 0.5
  const ny = (e.clientY - rect.top) / rect.height - 0.5
  tilt.value = { x: -nx * 16, y: -ny * 12 }
}
function onPointerLeave () {
  tilt.value = { x: 0, y: 0 }
}

/* ---------- Canvas 花瓣 ---------- */
const petalCanvas = ref(null)
const gusting = ref(false)
let canvasCtx = null
let width = 0
let height = 0
let dpr = 1
let petals = []
let raf = null
let lastTime = 0
let resizeObserver = null
let gustTimer = null

function random (min, max) {
  return min + Math.random() * (max - min)
}

function makePetal (x, y, burst = false) {
  const depth = random(0.35, 1.35)
  const ambient = !burst
  return {
    x,
    y,
    depth,
    size: random(4.2, 9.2) * depth,
    vx: ambient ? random(-5, 18) * depth : random(55, 245) * depth,
    vy: ambient ? random(10, 28) * depth : random(-62, 48) * depth,
    rot: random(0, Math.PI * 2),
    spin: random(-3.4, 3.4),
    phase: random(0, Math.PI * 2),
    wave: random(12, 44) * depth,
    scale: random(0.75, 1.25),
    alpha: random(0.36, 0.88) * Math.min(1, 0.58 + depth * 0.38),
    age: 0,
    ttl: burst ? random(2.8, 4.6) : Infinity,
    ambient,
    hue: Math.random() < 0.24 ? '#e5b7ee' : (Math.random() < 0.5 ? '#ffd0e2' : '#f4a7c8')
  }
}

function seedAmbient () {
  petals = []
  const count = reduceMotion.value ? 12 : 30
  for (let i = 0; i < count; i++) {
    petals.push(makePetal(random(0, width), random(-height * 0.2, height), false))
  }
}

function burstPetals () {
  if (!width || !height) return
  const count = reduceMotion.value ? 48 : 160
  for (let i = 0; i < count; i++) {
    // 花雨从小岛右前方那几棵大樱花上炸开
    const x = width * random(0.42, 0.82)
    const y = height * random(0.3, 0.62)
    petals.push(makePetal(x, y, true))
  }
  if (petals.length > 460) petals = petals.slice(petals.length - 460)
  gusting.value = false
  requestAnimationFrame(() => { gusting.value = true })
  clearTimeout(gustTimer)
  gustTimer = setTimeout(() => { gusting.value = false }, 1500)
}

function resizeCanvas () {
  const cvs = petalCanvas.value
  if (!cvs) return
  const rect = cvs.getBoundingClientRect()
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  cvs.width = Math.round(width * dpr)
  cvs.height = Math.round(height * dpr)
  canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  seedAmbient()
}

function drawPetal (p, time) {
  const flutter = 1 + Math.sin(time * 4 + p.phase) * 0.22
  const scale = p.scale * flutter
  canvasCtx.save()
  canvasCtx.translate(p.x, p.y)
  canvasCtx.rotate(p.rot)
  canvasCtx.scale(scale, scale)
  canvasCtx.globalAlpha = Math.max(0, p.alpha)
  if (p.depth < 0.6) canvasCtx.filter = 'blur(.55px)'
  canvasCtx.fillStyle = p.hue
  canvasCtx.beginPath()
  canvasCtx.moveTo(0, -p.size)
  canvasCtx.bezierCurveTo(p.size * 0.9, -p.size * 0.85, p.size * 1.08, p.size * 0.25, 0, p.size)
  canvasCtx.bezierCurveTo(-p.size * 1.08, p.size * 0.25, -p.size * 0.9, -p.size * 0.85, 0, -p.size)
  canvasCtx.fill()
  canvasCtx.globalAlpha *= 0.55
  canvasCtx.strokeStyle = '#fff4fa'
  canvasCtx.lineWidth = 0.65
  canvasCtx.beginPath()
  canvasCtx.moveTo(0, -p.size * 0.72)
  canvasCtx.lineTo(0, p.size * 0.65)
  canvasCtx.stroke()
  canvasCtx.restore()
}

function frame (time) {
  if (!lastTime) lastTime = time
  const dt = Math.min(0.04, (time - lastTime) / 1000)
  lastTime = time
  canvasCtx.clearRect(0, 0, width, height)
  const seconds = time / 1000

  for (const p of petals) {
    p.age += dt
    const gust = gusting.value ? 26 : 6
    p.vx += gust * p.depth * dt
    p.vy += (p.ambient ? 2.2 : 17) * p.depth * dt
    p.x += (p.vx + Math.sin(seconds * 1.8 + p.phase) * p.wave) * dt
    p.y += p.vy * dt
    p.rot += p.spin * dt

    if (p.ambient) {
      if (p.y > height + 18 || p.x > width + 28 || p.x < -35) {
        Object.assign(p, makePetal(random(-40, width * 0.7), -18, false))
      }
    } else if (p.age > p.ttl - 1) {
      p.alpha = Math.max(0, p.alpha - dt * 0.72)
    }
    drawPetal(p, seconds)
  }

  petals = petals.filter((p) => p.ambient || (p.age < p.ttl && p.alpha > 0.015 && p.x < width + 180 && p.y < height + 100))
  raf = requestAnimationFrame(frame)
}

/* ---------- 生命周期 ---------- */
let stageObserver = null

function syncStage () {
  const el = stageEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  stageW.value = rect.width
  stageH.value = rect.height
}

onMounted(() => {
  refreshWallet()
  startTicker()
  reduceMotion.value = !motionEnabled()

  syncStage()
  stageObserver = new ResizeObserver(syncStage)
  if (stageEl.value) stageObserver.observe(stageEl.value)

  const cvs = petalCanvas.value
  canvasCtx = cvs.getContext('2d')
  resizeCanvas()
  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(cvs)
  raf = requestAnimationFrame(frame)
  window.addEventListener('resize', syncStage)
  window.addEventListener('keydown', onPageKey)
})

function onPageKey (e) {
  if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage() }
  else if (e.key === 'ArrowRight') { e.preventDefault(); nextPage() }
}

onBeforeUnmount(() => {
  if (stageObserver) stageObserver.disconnect()
  if (raf) cancelAnimationFrame(raf)
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', syncStage)
  window.removeEventListener('keydown', onPageKey)
  clearTimeout(flipTimer)
  clearTimeout(flipTimer2)
  clearTimeout(gustTimer)
})
</script>

<style scoped>
.town-page {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 100vh;
  padding: 0 10px 10px;
}
.town {
  position: relative;
  width: min(1600px, 100%);
  height: calc(100svh - 104px);
  min-height: 640px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 30px;
  background: linear-gradient(180deg, #d3c2e6 0%, #ecd2e2 42%, #fbe6dc 74%, #fff4e7 100%);
  box-shadow: 0 34px 80px -42px rgba(102, 64, 100, 0.55), var(--gloss);
  isolation: isolate;
}

/* 天空：右上角一枚很淡的太阳 */
.town__sky {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.sky__sun {
  position: absolute;
  top: 6%;
  right: 12%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 246, 219, 0.85), rgba(255, 246, 219, 0) 68%);
}

.town__stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  transition: transform 0.5s var(--ease);
  will-change: transform;
}
.town__svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---------- 云的缓慢横移 ---------- */
.cloud {
  transform-box: fill-box;
  transform-origin: center;
}
.cloud--a { animation: cloud-drift 38s ease-in-out infinite; }
.cloud--b { animation: cloud-drift 46s ease-in-out infinite reverse; }
.cloud--c { animation: cloud-drift 32s ease-in-out infinite; }
@keyframes cloud-drift {
  0%, 100% { transform: translateX(-14px); }
  50% { transform: translateX(26px); }
}

/* ---------- 建筑交互 ---------- */
.venue {
  cursor: pointer;
  outline: none;
}
.venue__body {
  transform-box: fill-box;
  transform-origin: center bottom;
  transition: transform 0.35s var(--ease), filter 0.35s var(--ease);
  will-change: transform;
}
.venue.is-hot .venue__body {
  transform: translateY(-7px) scale(1.012);
  filter: drop-shadow(0 12px 14px rgba(86, 48, 78, 0.24));
}
.venue__halo {
  transition: opacity 0.35s var(--ease);
}
.venue.is-hot .venue__halo {
  opacity: 0.24;
}
.venue__shadow {
  transition: opacity 0.35s var(--ease);
}
.venue.is-hot .venue__shadow {
  opacity: 0.26;
}
.venue:focus-visible .venue__halo {
  opacity: 0.32;
  stroke: rgba(255, 255, 255, 0.9);
  stroke-width: 2;
}

/* 樱花树：点一下落花 */
.tree {
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center bottom;
  transition: transform 0.4s var(--ease);
}
.tree:hover { transform: scale(1.03); }
.tree:focus-visible { outline: none; }

.walker__ring {
  transform-box: fill-box;
  transform-origin: center;
  animation: walker-pulse 3s ease-in-out infinite;
}
.walker {
  animation: walker-bob 3.4s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center bottom;
}
@keyframes walker-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.86); }
  50% { opacity: 0.75; transform: scale(1.1); }
}
@keyframes walker-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2.5px); }
}
.waterfall {
  animation: fall-breathe 4.5s ease-in-out infinite;
}
@keyframes fall-breathe {
  0%, 100% { opacity: 0.86; }
  50% { opacity: 1; }
}
.fountain__jet {
  animation: jet-breathe 3.6s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center bottom;
}
@keyframes jet-breathe {
  0%, 100% { opacity: 0.5; transform: scaleY(0.9); }
  50% { opacity: 0.85; transform: scaleY(1.08); }
}
.water__shimmer {
  animation: shimmer 6s ease-in-out infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.85; }
}

/* ---------- 建筑名牌（HTML 层） ---------- */

/* ---------- 地图翻页 ---------- */
.town__svg,
.hotspots { transition: opacity .18s ease; }
.is-flipping .town__svg,
.is-flipping .hotspots { opacity: 0; }

.mapnav {
  position: absolute;
  top: 50%;
  z-index: 6;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border: 1px solid rgba(255, 255, 255, .92);
  border-radius: 50%;
  background: rgba(255, 253, 253, .8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #7a5570;
  cursor: pointer;
  box-shadow: 0 10px 24px -14px rgba(88, 50, 84, .8);
  transition: transform .25s var(--ease), background .25s;
}
.mapnav svg { width: 20px; height: 20px; }
.mapnav--prev { left: 14px; }
.mapnav--next { right: 14px; }
.mapnav:hover { background: #fff; transform: scale(1.07); }
.mapnav:active { transform: scale(.96); }

.mapdots {
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, .92);
  border-radius: 999px;
  background: rgba(255, 253, 253, .74);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 12px 26px -18px rgba(88, 50, 84, .7);
  transform: translateX(-50%);
}
.mapdot {
  display: grid;
  gap: 1px;
  padding: 5px 13px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #8b6f83;
  font: inherit;
  cursor: pointer;
  transition: background .25s, color .25s;
}
.mapdot b { font-size: 11.5px; font-weight: 700; letter-spacing: .1em; }
.mapdot i { font-style: normal; font-size: 7px; letter-spacing: .16em; opacity: .55; }
.mapdot.is-on {
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  color: #fff;
  box-shadow: 0 8px 18px -12px rgba(232, 84, 127, .95);
}
.mapdot.is-on i { opacity: .8; }
.mapdots__hint {
  padding: 0 6px 0 4px;
  font-size: 9.5px;
  letter-spacing: .1em;
  color: rgba(140, 110, 130, .62);
}

.hotspots {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
.hotspot {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 15px 7px;
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 13px;
  background: rgba(255, 253, 253, 0.9);
  box-shadow: 0 10px 22px -14px rgba(88, 50, 84, 0.8);
  color: #6b4864;
  font: inherit;
  line-height: 1.05;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -100%);
  transition: transform 0.28s var(--ease), background 0.28s, box-shadow 0.28s;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  white-space: nowrap;
}
.hotspot__cn {
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.hotspot__en {
  font-size: 8px;
  letter-spacing: 0.18em;
  color: rgba(140, 110, 130, 0.7);
}
.hotspot__tail {
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-right: 1px solid rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.9);
  background: inherit;
  transform: rotate(45deg);
  border-radius: 0 0 2px 0;
}
.hotspot.is-hot {
  transform: translate(-50%, calc(-100% - 6px));
  background: linear-gradient(120deg, #c9658f, #8a6bb4);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 16px 30px -16px rgba(112, 52, 104, 0.9);
  color: #fffbff;
}
.hotspot.is-hot .hotspot__en { color: rgba(255, 245, 252, 0.75); }
.hotspot.is-hot .hotspot__tail { border-color: rgba(255, 255, 255, 0.5); }
.hotspot:focus-visible {
  outline: 2px solid var(--sakura-500);
  outline-offset: 4px;
}

/* ---------- 钱包胶囊 ---------- */
.town__wallet {
  position: absolute;
  z-index: 6;
  top: 16px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 252, 253, 0.82);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 30px -22px rgba(102, 64, 100, 0.8);
}
.tw__coin {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 700;
  color: #8a5f27;
  font-variant-numeric: tabular-nums;
}
.tw__coin i {
  width: 17px;
  height: 17px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-style: normal;
  font-size: 9.5px;
  color: #7a5a24;
  background: radial-gradient(circle at 34% 28%, #fff4d4, #f0c976 58%, #d9a94f);
}
.tw__sep { width: 1px; height: 14px; background: rgba(140, 110, 130, 0.18); }
.tw__energy { display: inline-flex; align-items: baseline; gap: 3px; font-variant-numeric: tabular-nums; }
.tw__energy b { font-size: 13px; color: #6b4864; }
.tw__energy i { font-style: normal; font-size: 10px; color: rgba(140, 110, 130, 0.7); }
.tw__energy em { font-style: normal; font-size: 9px; letter-spacing: 0.1em; color: rgba(140, 110, 130, 0.6); margin-left: 2px; }
.tw__mood { display: inline-flex; align-items: baseline; gap: 4px; font-variant-numeric: tabular-nums; }
.tw__mood b { font-size: 13px; transition: color .4s var(--ease); }
.tw__mood em { font-style: normal; font-size: 9px; letter-spacing: 0.06em; color: rgba(140, 110, 130, 0.6); white-space: nowrap; }

/* ---------- 花瓣层 ---------- */
.town__petals {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* ---------- 文案：左上角一块玻璃卡，压在天空上 ---------- */
.town__intro {
  position: absolute;
  z-index: 6;
  top: 20px;
  left: 20px;
  width: 272px;
  padding: 19px 20px 17px;
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 22px;
  background: rgba(255, 252, 253, 0.74);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow: 0 22px 46px -30px rgba(96, 58, 92, 0.85), var(--gloss);
  color: #503e5d;
}
.town__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: #825a85;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
}
.town__eyebrow span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d67eac;
  box-shadow: 0 0 0 5px rgba(255, 223, 237, 0.34);
}
.town__intro h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 500;
  line-height: 1.34;
  letter-spacing: 0.02em;
  color: #4d395b;
}
.town__intro h1 em {
  font-style: normal;
  background: linear-gradient(110deg, #77517c, #ba6f9a);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.town__lede {
  margin: 12px 0 0;
  color: rgba(82, 61, 91, 0.74);
  font-size: 11.5px;
  line-height: 1.85;
}

/* ---------- 属性速览 ---------- */
.town__stats {
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px dashed rgba(150, 110, 132, .22);
}
.town__stats-title { margin: 0; font-size: 10px; letter-spacing: .08em; color: var(--ink-soft); }
.town__stats-title b { font-family: var(--font-serif); font-size: 12px; color: var(--sakura-700); letter-spacing: .04em; }
.town__stats-list {
  list-style: none;
  margin: 9px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px 10px;
}
.town__stats-list li {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 9px;
  color: var(--ink-soft);
}
.town__stats-dot { width: 5px; height: 5px; border-radius: 50%; flex: none; }
.town__stats-list em { font-style: normal; white-space: nowrap; letter-spacing: .02em; }
.town__stats-list b {
  margin-left: 2px;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.town__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 15px; }
.town__primary,
.town__secondary {
  height: 36px;
  border-radius: 999px;
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: transform 0.25s var(--ease), box-shadow 0.25s, background 0.25s;
}
.town__primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
  border: 0;
  background: linear-gradient(120deg, #d780ac, #9a78bd);
  color: #fff9fc;
  box-shadow: 0 14px 30px -18px rgba(141, 78, 126, 0.8);
}
.town__primary svg { width: 14px; height: 14px; transition: transform 0.25s; }
.town__primary:hover { transform: translateY(-2px); box-shadow: 0 18px 34px -18px rgba(141, 78, 126, 0.9); }
.town__primary:hover svg { transform: translateX(3px); }
.town__secondary {
  padding: 0 13px;
  border: 1px solid rgba(160, 107, 143, 0.28);
  background: rgba(255, 247, 251, 0.5);
  color: #815879;
}
.town__secondary:hover { transform: translateY(-2px); background: rgba(255, 249, 252, 0.85); }
.town__click-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 12px 0 0;
  color: rgba(115, 78, 111, 0.62);
  font-size: 10px;
  letter-spacing: 0.04em;
}
.town__click-hint span { color: #c17ca5; animation: hint-pulse 2.8s ease-in-out infinite; }
@keyframes hint-pulse {
  50% { transform: rotate(45deg) scale(1.15); opacity: 0.55; }
}
.town__foot {
  position: absolute;
  z-index: 6;
  right: 26px;
  bottom: 16px;
  margin: 0;
  color: rgba(120, 78, 112, 0.5);
  font-size: 8px;
  letter-spacing: 0.2em;
}
/* 四角压暗：让视线落在中间的小岛上 */
.town__vig {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: radial-gradient(120% 90% at 50% 42%, rgba(255, 255, 255, 0) 46%, rgba(126, 92, 122, 0.14) 100%);
}

/* ---------- 小笔记本（仍然是电脑端，只是窗口窄一点） ---------- */
@media (max-width: 1180px) {
  .town__intro { width: 250px; padding: 17px 18px 16px; }
  .town__intro h1 { font-size: 24px; }
  .town__lede { font-size: 11px; }
}

/* 动效关闭态由 <html class="no-motion"> 驱动，见 composables/useMotion.js */
html.no-motion .cloud,
html.no-motion .walker,
html.no-motion .walker__ring,
html.no-motion .fountain__jet,
html.no-motion .waterfall,
html.no-motion .water__shimmer,
html.no-motion .town__click-hint span { animation: none; }
html.no-motion .town__stage { transition: none; transform: none !important; }
html.no-motion .venue__body { transition: none; }
</style>
