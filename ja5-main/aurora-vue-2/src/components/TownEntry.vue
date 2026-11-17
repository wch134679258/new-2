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
    <!-- 主视觉：与小镇、后山同一套画法的矢量插画
         天空 / 远山 / 湖 / 山脚小镇 / 近景草坡上的千年樱 —— 五层景深，
         配色全部取自 style.css 与 BackHill 的同一组渐变，不掺照片质感 -->
    <div class="entry__media" aria-hidden="true">
      <svg class="entry__art" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="eSky" cx="58%" cy="16%" r="88%">
            <stop offset="0%" stop-color="#fffbfd" />
            <stop offset="34%" stop-color="#fdf0f6" />
            <stop offset="72%" stop-color="#eef1f9" />
            <stop offset="100%" stop-color="#dce7f6" />
          </radialGradient>
          <linearGradient id="eFarB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e9ecf7" />
            <stop offset="100%" stop-color="#dfe7f2" />
          </linearGradient>
          <linearGradient id="eFarC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e4ecdb" />
            <stop offset="100%" stop-color="#d3e0c8" />
          </linearGradient>
          <linearGradient id="eWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e4f1fa" />
            <stop offset="42%" stop-color="#c9e0f1" />
            <stop offset="100%" stop-color="#aecbe4" />
          </linearGradient>
          <linearGradient id="eGrass" x1="0" y1="0" x2=".1" y2="1">
            <stop offset="0%" stop-color="#d3e3bd" />
            <stop offset="40%" stop-color="#bcd3a4" />
            <stop offset="100%" stop-color="#9dba88" />
          </linearGradient>
          <linearGradient id="eGrassLip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c6d8ae" />
            <stop offset="100%" stop-color="#a8c091" />
          </linearGradient>
          <radialGradient id="eCanopyA" cx="38%" cy="30%" r="74%">
            <stop offset="0%" stop-color="#ffd9e6" />
            <stop offset="62%" stop-color="#f6bcd0" />
            <stop offset="100%" stop-color="#e794b0" />
          </radialGradient>
          <radialGradient id="eGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffe2ec" stop-opacity=".92" />
            <stop offset="56%" stop-color="#f6d2e5" stop-opacity=".32" />
            <stop offset="100%" stop-color="#e8d0ef" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="eHaze" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#f6f0f8" stop-opacity=".0" />
            <stop offset="100%" stop-color="#f8eff6" stop-opacity=".66" />
          </linearGradient>
          <filter id="eSoft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="eSoftBig" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <!-- 花冠的毛边：用噪声位移把光滑的椭圆轮廓打碎，
               否则一整团粉色只会像云，不像花 -->
          <filter id="eRuff" x="-14%" y="-14%" width="128%" height="128%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="9" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="20" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <!-- 树皮用的小一号位移，只让轮廓不那么顺滑 -->
          <filter id="eBark" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <!-- 天空 -->
        <rect x="0" y="0" width="1200" height="720" fill="url(#eSky)" />

        <!-- 云：三团柔边，压在右上留白之外，不挡文案 -->
        <g fill="#ffffff" filter="url(#eSoftBig)">
          <ellipse cx="742" cy="104" rx="118" ry="30" opacity=".72" />
          <ellipse cx="826" cy="92" rx="66" ry="22" opacity=".58" />
          <ellipse cx="1010" cy="176" rx="96" ry="24" opacity=".5" />
          <ellipse cx="504" cy="86" rx="82" ry="20" opacity=".46" />
          <ellipse cx="196" cy="132" rx="90" ry="20" opacity=".34" />
        </g>

        <!-- 远山：雪线 + 两层山影 -->
        <g>
          <path d="M640 404 L742 320 L806 372 L866 330 L960 404Z" fill="#eef2fb" opacity=".92" />
          <path d="M742 320 L776 350 L806 372 L772 372 L742 356Z" fill="#fbfcff" opacity=".9" />
          <path d="M866 330 L900 356 L866 372 L840 356Z" fill="#fbfcff" opacity=".8" />
        </g>
        <path d="M-40 436 Q140 372 332 408 Q500 440 660 392 Q830 340 1002 400 Q1132 442 1240 406
                 L1240 720 L-40 720Z"
              fill="url(#eFarB)" opacity=".9" />
        <path d="M-40 470 Q180 424 380 456 Q560 486 730 442 Q900 400 1060 450 Q1160 480 1240 458
                 L1240 720 L-40 720Z"
              fill="url(#eFarC)" opacity=".82" />

        <!-- 湖：小镇临水，湖在最远的一道低处 -->
        <path d="M-40 506 Q200 484 460 494 Q720 504 962 490 Q1122 482 1240 496
                 L1240 574 Q1122 560 962 568 Q720 580 460 572 Q200 564 -40 584Z"
              fill="url(#eWater)" />
        <!-- 湖面：几道反光 + 小镇与山的倒影 -->
        <g stroke="#ffffff" stroke-linecap="round" fill="none" opacity=".72">
          <path d="M150 524 H236" stroke-width="2.4" />
          <path d="M330 536 H402" stroke-width="2" />
          <path d="M520 528 H572" stroke-width="1.8" />
          <path d="M700 540 H792" stroke-width="2.2" />
          <path d="M880 526 H936" stroke-width="1.8" />
          <path d="M1004 538 H1088" stroke-width="2" />
          <path d="M246 552 H302" stroke-width="1.6" opacity=".6" />
          <path d="M612 556 H676" stroke-width="1.6" opacity=".6" />
        </g>
        <g opacity=".16" fill="#a9bcd4">
          <path d="M604 560 L640 560 L640 574 L604 574Z" />
          <path d="M682 556 L716 556 L716 572 L682 572Z" />
          <path d="M760 562 L800 562 L800 576 L760 576Z" />
          <path d="M842 554 L880 554 L880 570 L842 570Z" />
          <path d="M926 560 L966 560 L966 574 L926 574Z" />
          <path d="M1012 552 L1054 552 L1054 568 L1012 568Z" />
        </g>

        <!-- 山脚小镇：房子用与地图同一套色（深紫屋顶 / 粉白墙 / 暖窗） -->
        <g class="entry-town">
          <!-- 镇子脚下的一块地：不铺的话房子会「浮」在白色背景上 -->
          <path d="M498 664 Q660 618 860 616 Q1060 614 1240 600 L1240 720 L498 720Z"
                fill="#d3e1bd" />
          <path d="M498 664 Q660 618 860 616 Q1060 614 1240 600 L1240 614 Q1060 628 860 630 Q660 632 498 678Z"
                fill="#c2d4a8" opacity=".85" />
          <ellipse cx="900" cy="632" rx="330" ry="26" fill="#8fa87f" opacity=".14" filter="url(#eSoftBig)" />

          <!-- 镇子后面的两棵行道樱 -->
          <g v-for="(t, i) in townTrees" :key="`tt${i}`">
            <path :d="t.trunk" fill="#7a5a4e" />
            <ellipse v-for="(b, j) in t.blobs" :key="`tb${i}-${j}`"
                     :cx="b[0]" :cy="b[1]" :rx="b[2]" :ry="b[3]"
                     :fill="j === 0 ? '#eda6bf' : j === 1 ? '#f7bfd2' : '#ffd7e4'" />
          </g>

          <g v-for="(h, i) in houses" :key="`h${i}`">
            <!-- 落地阴影 -->
            <ellipse :cx="h.cx" :cy="h.baseY - 1" :rx="h.w * 0.58" :ry="3.6"
                     fill="#7d8f6c" opacity=".18" />
            <!-- 墙 -->
            <path :d="h.wall" :fill="h.wallFill" />
            <path :d="h.shade" fill="rgba(126, 92, 116, .12)" />
            <!-- 屋顶：中紫主面 + 浅紫左坡 + 浅紫脊线 -->
            <path :d="h.roof" :fill="h.roofFill" />
            <path :d="h.roofLit" :fill="h.roofLitFill" />
            <path :d="h.ridge" fill="#b6a3c9" opacity=".9" />
            <path :d="h.eave" fill="rgba(92, 62, 88, .18)" />
            <!-- 窗 -->
            <rect v-for="(w, j) in h.wins" :key="`w${i}-${j}`"
                  :x="w[0]" :y="w[1]" :width="w[2]" :height="w[3]" rx="1.4"
                  fill="#ffe0a2" />
            <rect v-for="(w, j) in h.wins" :key="`wf${i}-${j}`"
                  :x="w[0]" :y="w[1]" :width="w[2]" :height="w[3]" rx="1.4"
                  fill="none" stroke="rgba(112, 78, 100, .42)" stroke-width="1.1" />
            <!-- 门 -->
            <path :d="h.door" fill="#8a6081" />
            <path :d="h.doorLit" fill="#a87c9c" opacity=".7" />
            <!-- 雨棚 / 招牌 -->
            <path v-if="h.awning" :d="h.awning" :fill="h.awningFill" opacity=".92" />
            <path v-if="h.board" :d="h.board" fill="#fffdf8" stroke="rgba(112,78,100,.34)" stroke-width="0.9" />
            <path v-if="h.boardLine" :d="h.boardLine" :fill="h.awningFill || '#c98d7f'" opacity=".72" />
          </g>
        </g>

        <!-- 一层很薄的雾：只压在山脚与湖之间
             早先它画在最后，把近景的树干切成了两半 -->
        <path d="M-40 424 Q180 404 400 422 Q620 440 840 422 Q1060 404 1240 424
                 L1240 492 Q1060 476 840 490 Q620 504 400 490 Q180 476 -40 496Z"
              fill="url(#eHaze)" opacity=".58" />

        <!-- 近景：后山草坡（左近右远的斜向纵深） -->
        <path d="M-40 436 Q110 418 242 430 Q362 444 452 480 Q536 514 596 586
                 Q640 646 652 720 L-40 720Z"
              fill="url(#eGrass)" />
        <!-- 坡面暗部：只压下半截，像一道缓坡的背光面 -->
        <path d="M-40 508 Q130 490 258 508 Q378 524 470 562 Q556 598 610 660
                 Q634 690 640 720 L-40 720Z"
              fill="#93b07c" opacity=".26" />
        <!-- 坡沿一条亮线：草坡的转折 -->
        <path d="M-40 470 Q120 452 250 466 Q376 480 466 518 Q552 554 606 618"
              fill="none" stroke="#a9c491" stroke-width="2.4" opacity=".48" />

        <!-- 坡上的碎石小路：从台地一路盘到坡脚 -->
        <g>
          <path :d="pathRibbon" fill="#ecdfcd" opacity=".92" />
          <path :d="pathRibbon" fill="none" stroke="#d3bfa8" stroke-width="1.6" opacity=".6" />
          <ellipse v-for="(s2, i) in pathStones" :key="`pst${i}`"
                   :cx="s2[0]" :cy="s2[1]" :rx="s2[2]" :ry="s2[3]"
                   :fill="i % 3 === 0 ? '#f6ede0' : i % 3 === 1 ? '#eaddca' : '#ded0bb'"
                   opacity=".92" />
        </g>

        <!-- 坡上的苔石 -->
        <g v-for="(r, i) in rocks" :key="`rk${i}`">
          <ellipse :cx="r[0] + 3" :cy="r[1] + 4" :rx="r[2]" :ry="r[2] * 0.3" fill="#6f7d63" opacity=".16" />
          <path :d="rockPath(r)" fill="#c3c9bb" />
          <path :d="rockLitPath(r)" fill="#dbdfd2" />
          <ellipse :cx="r[0] - r[2] * 0.2" :cy="r[1] - r[2] * 0.2" :rx="r[2] * 0.36" :ry="r[2] * 0.13" fill="#a8bf92" opacity=".7" />
        </g>

        <!-- 坡上的小樱：只做气氛，不抢主树 -->
        <g v-for="(t, i) in hillTrees" :key="`ht${i}`">
          <ellipse :cx="t.x + 4" :cy="t.y + 3" :rx="22 * t.s" :ry="7 * t.s" fill="#6b4b69" opacity=".18" />
          <path :d="t.trunk" fill="#7a5a4e" />
          <ellipse v-for="(b, j) in t.blobs" :key="`hb${i}-${j}`"
                   :cx="b[0]" :cy="b[1]" :rx="b[2]" :ry="b[3]"
                   :fill="j === 0 ? '#eda6bf' : j === 1 ? '#f7bfd2' : '#ffd7e4'" />
        </g>

        <!-- 千年樱：站在坡顶台地上 -->
        <g class="entry-giant">
          <ellipse cx="290" cy="512" rx="170" ry="34" fill="#6b4b69" opacity=".2" filter="url(#eSoft)" />
          <circle cx="292" cy="200" r="238" fill="url(#eGlow)" opacity=".82" />

          <!-- 树根：贴地向两侧铺，不要做成尖刺 -->
          <g fill="#6b4a44" filter="url(#eBark)">
            <path d="M262 498 C236 500 210 506 190 516 C206 522 234 518 258 510Z" />
            <path d="M332 498 C358 500 384 506 404 516 C388 522 360 518 336 510Z" />
            <path d="M270 512 C252 522 238 530 228 536 C242 536 260 528 278 518Z" opacity=".94" />
            <path d="M324 512 C342 522 356 530 366 536 C352 536 334 528 316 518Z" opacity=".94" />
            <path d="M290 514 C284 524 280 532 278 540 C288 536 294 526 296 514Z" opacity=".88" />
          </g>

          <!-- 树干：根粗上收，比原来细一档，别像柱子 -->
          <path d="M270 508 C264 452 270 404 278 362 C284 328 288 296 290 262
                   L324 262 C326 296 332 328 340 364 C350 408 358 456 364 508Z"
                fill="#6b4741" filter="url(#eBark)" />
          <path d="M270 508 C264 452 270 404 278 362 C284 328 288 296 290 262 L304 262
                   C302 296 298 330 294 364 C286 408 280 458 284 508Z"
                fill="#8a6057" opacity=".38" />
          <!-- 树皮竖纹 -->
          <g stroke="#543634" stroke-width="2.2" fill="none" opacity=".36" stroke-linecap="round">
            <path d="M284 494 C278 442 284 392 290 350" />
            <path d="M308 498 C312 444 318 396 322 352" />
            <path d="M336 488 C342 438 350 396 354 358" />
            <path d="M298 470 C292 424 296 380 300 344" />
          </g>
          <!-- 树瘤 -->
          <ellipse cx="286" cy="384" rx="8" ry="19" fill="#5b3b36" opacity=".3" />
          <ellipse cx="348" cy="446" rx="6.4" ry="13" fill="#5b3b36" opacity=".26" />

          <!-- 花冠：五层色 + 噪声毛边。
               顺序是「背光 -> 主体 -> 亮面 -> 高光 -> 枝干透出 -> 花簇颗粒」，
               背光层要露出下缘，树冠才有厚度；枝干要压在花上，才不像一整团云 -->
          <g class="canopy" filter="url(#eRuff)">
            <!-- 背光层：只在下方与右侧露出一圈 -->
            <g fill="#cf7097" opacity=".96">
              <ellipse cx="166" cy="256" rx="62" ry="36" />
              <ellipse cx="232" cy="288" rx="66" ry="34" />
              <ellipse cx="304" cy="292" rx="68" ry="34" />
              <ellipse cx="374" cy="268" rx="60" ry="32" />
              <ellipse cx="436" cy="234" rx="41" ry="25" />
              <ellipse cx="110" cy="274" rx="39" ry="25" />
            </g>
            <!-- 主体 -->
            <g fill="#e390b1">
              <ellipse cx="174" cy="228" rx="62" ry="40" />
              <ellipse cx="244" cy="248" rx="60" ry="37" />
              <ellipse cx="318" cy="246" rx="62" ry="37" />
              <ellipse cx="388" cy="220" rx="60" ry="38" />
              <ellipse cx="434" cy="192" rx="38" ry="27" />
              <ellipse cx="120" cy="244" rx="38" ry="27" />
              <ellipse cx="210" cy="200" rx="56" ry="35" />
              <ellipse cx="284" cy="196" rx="60" ry="37" />
              <ellipse cx="352" cy="180" rx="54" ry="35" />
            </g>
            <!-- 顶部起伏：树冠顶不能是一条平线 -->
            <g fill="#e390b1">
              <ellipse cx="258" cy="156" rx="40" ry="27" />
              <ellipse cx="322" cy="146" rx="34" ry="24" />
              <ellipse cx="196" cy="168" rx="30" ry="21" />
            </g>
            <!-- 亮面 -->
            <g fill="#f3b4ca">
              <ellipse cx="190" cy="200" rx="48" ry="30" />
              <ellipse cx="252" cy="212" rx="46" ry="29" />
              <ellipse cx="314" cy="204" rx="45" ry="29" />
              <ellipse cx="374" cy="182" rx="42" ry="29" />
              <ellipse cx="228" cy="166" rx="46" ry="29" />
              <ellipse cx="294" cy="154" rx="48" ry="29" />
              <ellipse cx="350" cy="148" rx="40" ry="25" />
              <ellipse cx="150" cy="218" rx="34" ry="22" />
              <ellipse cx="424" cy="166" rx="28" ry="20" />
            </g>
            <!-- 高光：光从左上下来 -->
            <g fill="#fbcbdd">
              <ellipse cx="204" cy="170" rx="34" ry="21" />
              <ellipse cx="262" cy="178" rx="32" ry="20" />
              <ellipse cx="314" cy="166" rx="30" ry="19" />
              <ellipse cx="362" cy="150" rx="27" ry="17" />
              <ellipse cx="240" cy="134" rx="32" ry="19" />
              <ellipse cx="294" cy="122" rx="30" ry="18" />
              <ellipse cx="174" cy="194" rx="23" ry="15" />
            </g>
            <g fill="#fff4f9" opacity=".9">
              <ellipse cx="222" cy="148" rx="20" ry="12" />
              <ellipse cx="282" cy="132" rx="18" ry="11" />
              <ellipse cx="334" cy="132" rx="14" ry="9" />
            </g>

            <!-- 枝干透出花丛：没有这几笔，一大片粉色就是云 -->
            <g stroke="#8a6152" fill="none" stroke-linecap="round" opacity=".38">
              <path d="M292 272 C268 252 232 242 200 240" stroke-width="3.6" />
              <path d="M312 266 C338 246 374 238 404 240" stroke-width="3.4" />
              <path d="M298 246 C294 222 294 198 300 178" stroke-width="3" />
              <path d="M276 250 C260 232 240 218 220 210" stroke-width="2.4" />
              <path d="M330 244 C348 226 368 214 388 206" stroke-width="2.4" />
            </g>

            <!-- 花簇颗粒：尺寸不一、深浅交错，落在轮廓内外都有 -->
            <g fill="#dd8bac">
              <circle v-for="(c, i) in canopyEdge" :key="`ce${i}`" :cx="c[0]" :cy="c[1]" :r="c[2]" />
            </g>
            <g fill="#f5bcd0" opacity=".92">
              <circle v-for="(d, i) in canopyDots" :key="`cd${i}`" :cx="d[0]" :cy="d[1]" :r="d[2]" />
            </g>
            <!-- 透光缝隙 -->
            <g fill="#fbeaf2" opacity=".7">
              <ellipse cx="250" cy="236" rx="10" ry="5.4" transform="rotate(-18 250 236)" />
              <ellipse cx="328" cy="226" rx="8.4" ry="4.6" transform="rotate(12 328 226)" />
              <ellipse cx="194" cy="212" rx="7.4" ry="4.2" transform="rotate(-26 194 212)" />
              <ellipse cx="380" cy="196" rx="6.8" ry="4" transform="rotate(20 380 196)" />
            </g>
          </g>

          <!-- 精修：细垂枝 —— 从花冠下缘垂下来，挂着几朵花。
               早先试过从树干中段伸出粗枝，缩略看就是两只「牛角」 -->
          <g stroke="#8a6152" fill="none" stroke-linecap="round" opacity=".62">
            <path d="M352 268 C356 294 352 314 342 330" stroke-width="2" />
            <path d="M244 276 C240 298 244 316 252 332" stroke-width="1.8" />
          </g>
          <g fill="#e792b3">
            <circle cx="342" cy="332" r="7.4" />
            <circle cx="333" cy="322" r="5.6" />
            <circle cx="252" cy="334" r="6.6" />
            <circle cx="260" cy="324" r="4.8" />
            <circle cx="402" cy="308" r="5.6" />
          </g>
          <g fill="#f9cadd">
            <circle cx="346" cy="326" r="4.2" />
            <circle cx="248" cy="328" r="3.6" />
          </g>

          <!-- 探出花冠的枝梢：只从左右两侧的下缘伸出去，
               头顶不要画 —— 花冠一毛糙，头顶的枝就成了「眉毛」 -->
          <g stroke="#6b4741" fill="none" opacity=".8" stroke-linecap="round">
            <path d="M112 258 q-30 12 -40 32" stroke-width="3.2" />
            <path d="M132 282 q-24 16 -28 38" stroke-width="2.6" />
            <path d="M460 216 q30 10 38 32" stroke-width="3" />
            <path d="M446 250 q22 16 24 40" stroke-width="2.4" />
          </g>
          <!-- 垂枝 -->
          <g stroke="#8a6152" fill="none" stroke-width="1.9" opacity=".5" stroke-linecap="round">
            <path d="M462 226 q10 36 -6 68" />
            <path d="M108 250 q-8 32 6 58" />
            <path d="M406 268 q6 26 -4 46" />
            <path d="M196 292 q4 22 -4 38" />
          </g>
        </g>

        <!-- 倚着树干休息的人 -->
        <g class="entry-rest" transform="translate(350 514) scale(1.34) translate(-350 -514)">
          <ellipse cx="356" cy="514" rx="26" ry="5.6" fill="#6b4b69" opacity=".22" />
          <!-- 腿：随意伸开 -->
          <path d="M344 512 C334 517 324 518 316 516" stroke="#8b7284" stroke-width="6.4" stroke-linecap="round" fill="none" />
          <path d="M344 514 C336 520 328 522 320 522" stroke="#a68a9c" stroke-width="5.2" stroke-linecap="round" fill="none" opacity=".9" />
          <!-- 身体：浅色上衣，靠着树干微微后仰 -->
          <path d="M340 514 C336 494 341 478 350 470 C357 463 366 464 371 472 C378 482 380 498 379 514Z"
                fill="#fdf0ea" />
          <path d="M340 514 C336 494 341 478 350 470 C354 466 358 465 362 466
                   C356 477 352 495 352 514Z"
                fill="#e6d2cd" opacity=".85" />
          <!-- 撑在身后的手 -->
          <path d="M376 486 C386 492 389 503 385 513" stroke="#f6e7e0" stroke-width="5.2" stroke-linecap="round" fill="none" />
          <!-- 头 + 头发 -->
          <circle cx="358" cy="456" r="9" fill="#f9dfc8" />
          <path d="M348.8 453 a9.2 9.2 0 0 1 18.4 0 q-9.2 -5.8 -18.4 0Z" fill="#5f4844" />
          <path d="M348.8 455 q-1.8 7 0.8 10" stroke="#5f4844" stroke-width="2.8" stroke-linecap="round" fill="none" />
          <path d="M367 456 q2 6 -0.4 9" stroke="#5f4844" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".9" />
        </g>

        <!-- 前景：草叶、落花 -->
        <g stroke="#8dab78" stroke-width="1.5" fill="none" opacity=".62" stroke-linecap="round">
          <path v-for="(g, i) in grass" :key="`g${i}`" :d="g" />
        </g>
        <g>
          <ellipse v-for="(p2, i) in fallPetals" :key="`fp${i}`"
                   :cx="p2[0]" :cy="p2[1]" :rx="p2[2]" :ry="p2[2] * 0.5"
                   :fill="i % 2 ? 'rgba(255,205,220,.9)' : 'rgba(255,236,242,.86)'"
                   :transform="`rotate(${p2[3]} ${p2[0]} ${p2[1]})`" />
        </g>

      </svg>
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

/* ============================================================
   主视觉数据：全部按 1200×720 的 viewBox 排
   —— 配色抄的是 style.css 与 BackHill 的同一组渐变，
      房子的深紫屋顶 / 粉白墙 / 暖窗也和地图上的建筑一致，
      所以这一屏和小镇、后山看起来是同一个世界。
   ============================================================ */

/** 山脚小镇：八栋侧视小屋，越靠右越远、越矮 */
const houses = (() => {
  // roof 用小镇地图上的紫（#7a6199 主面 / #9d8ab8 亮坡），
  // 之前写 #6b5589 又叠了两层深色，缩到远景就成了黑尖帽
  const LAYOUT = [
    { x: 566, w: 62, h: 52, rh: 24, wall: '#fbeade', roof: '#7a6199', lit: '#9d8ab8', kind: 'plain', wins: 2 },
    { x: 632, w: 76, h: 68, rh: 32, wall: '#fdf1e4', roof: '#8a76a8', lit: '#a795c0', kind: 'shop', wins: 3 },
    { x: 712, w: 56, h: 46, rh: 22, wall: '#e4cbd3', roof: '#7a6199', lit: '#9d8ab8', kind: 'plain', wins: 2 },
    { x: 772, w: 88, h: 78, rh: 38, wall: '#fbeade', roof: '#6f5a8c', lit: '#9d8ab8', kind: 'book', wins: 3 },
    { x: 864, w: 64, h: 56, rh: 26, wall: '#e9d9cf', roof: '#7a6199', lit: '#9d8ab8', kind: 'plain', wins: 2 },
    { x: 932, w: 80, h: 70, rh: 34, wall: '#fdf1e4', roof: '#8a76a8', lit: '#a795c0', kind: 'store', wins: 3 },
    { x: 1016, w: 56, h: 46, rh: 22, wall: '#e4cbd3', roof: '#7a6199', lit: '#9d8ab8', kind: 'plain', wins: 1 },
    { x: 1076, w: 72, h: 60, rh: 28, wall: '#fbeade', roof: '#6f5a8c', lit: '#9d8ab8', kind: 'plain', wins: 2 }
  ]

  return LAYOUT.map((h) => {
    // 底边：右侧更远，整体抬高一点，形成温和的透视
    const baseY = 642 - (h.x - 566) * 0.05
    const top = baseY - h.h
    const peak = top - h.rh
    const x2 = h.x + h.w

    // 窗：等分墙面，右侧留出门的位置
    const wins = []
    const pad = 9
    const doorW = 15
    const span = h.w - pad * 2 - doorW
    for (let i = 0; i < h.wins; i++) {
      const ww = Math.max(8, span / h.wins - 7)
      const wx = h.x + pad + (span / h.wins) * i + (span / h.wins - ww) / 2
      wins.push([wx, top + 12, Math.max(7, ww * 0.82), 11])
      if (h.h > 58) wins.push([wx, top + 30, Math.max(7, ww * 0.82), 11])
    }

    const dx = x2 - pad - doorW
    const out = {
      x: h.x,
      w: h.w,
      cx: h.x + h.w / 2,
      baseY,
      wall: `M${h.x} ${top} L${x2} ${top} L${x2} ${baseY} L${h.x} ${baseY}Z`,
      wallFill: h.wall,
      shade: `M${x2 - h.w * 0.2} ${top} L${x2} ${top} L${x2} ${baseY} L${x2 - h.w * 0.2} ${baseY}Z`,
      roof: `M${h.x - 7} ${top + 1} L${h.x + h.w / 2} ${peak} L${x2 + 7} ${top + 1}Z`,
      roofFill: h.roof,
      roofLit: `M${h.x - 7} ${top + 1} L${h.x + h.w / 2} ${peak} L${h.x + h.w / 2} ${top + 1}Z`,
      roofLitFill: h.lit,
      ridge: `M${h.x + h.w / 2} ${peak} L${x2 + 7} ${top + 1} L${x2 + 7} ${top + 3.4} L${h.x + h.w / 2} ${peak + 2.6}Z`,
      eave: `M${h.x - 7} ${top + 1} L${x2 + 7} ${top + 1} L${x2 + 7} ${top + 4} L${h.x - 7} ${top + 4}Z`,
      wins,
      door: `M${dx} ${baseY - 22} L${dx + doorW} ${baseY - 22} L${dx + doorW} ${baseY} L${dx} ${baseY}Z`,
      doorLit: `M${dx + 1.4} ${baseY - 20} L${dx + doorW - 1.4} ${baseY - 20} L${dx + doorW - 1.4} ${baseY - 2} L${dx + 1.4} ${baseY - 2}Z`,
      awning: null,
      awningFill: '',
      board: null,
      boardLine: null
    }

    if (h.kind === 'shop') {
      // 便利店：门上一道雨棚 + 屋顶一块灯箱
      out.awning = `M${h.x + 4} ${top + 25} L${x2 - 4} ${top + 25} L${x2 - 1.6} ${top + 31} L${h.x + 1.6} ${top + 31}Z`
      out.awningFill = '#8fa3cf'
      out.board = `M${h.x + 11} ${top + 6} L${x2 - 11} ${top + 6} L${x2 - 11} ${top + 17} L${h.x + 11} ${top + 17}Z`
      out.boardLine = `M${h.x + 16} ${top + 10} L${x2 - 22} ${top + 10} L${x2 - 22} ${top + 13} L${h.x + 16} ${top + 13}Z`
    } else if (h.kind === 'store') {
      // 书店：屋顶挂牌 + 橱窗雨棚
      out.board = `M${h.x + 10} ${peak + 20} L${x2 - 10} ${peak + 20} L${x2 - 10} ${peak + 32} L${h.x + 10} ${peak + 32}Z`
      out.boardLine = `M${h.x + 16} ${peak + 24} L${x2 - 18} ${peak + 24} L${x2 - 18} ${peak + 27} L${h.x + 16} ${peak + 27}Z`
      out.awningFill = '#c98d7f'
    } else if (h.kind === 'book') {
      // 这是「家的方向」那栋小高台：顶上加一圈小檐，别和书店弄混
      out.awning = `M${h.x + 3} ${top + 46} L${x2 - 3} ${top + 46} L${x2 - 1} ${top + 52} L${h.x + 1} ${top + 52}Z`
      out.awningFill = '#c9a0b6'
    }

    return out
  })
})()

/** 镇子后面的两棵行道樱 */
const townTrees = (() => {
  const defs = [
    { x: 742, y: 606, s: 1.0 },
    { x: 990, y: 610, s: 0.9 }
  ]
  return defs.map((t) => {
    const s0 = t.s
    return {
      trunk: `M${t.x - 3 * s0} ${t.y} L${t.x - 1.6 * s0} ${t.y - 26 * s0}
              L${t.x + 1.6 * s0} ${t.y - 26 * s0} L${t.x + 3 * s0} ${t.y}Z`,
      blobs: [
        [t.x - 6 * s0, t.y - 40 * s0, 17 * s0, 13 * s0],
        [t.x + 6 * s0, t.y - 36 * s0, 14 * s0, 11 * s0],
        [t.x, t.y - 50 * s0, 12 * s0, 9 * s0]
      ]
    }
  })
})()

/** 坡上的小樱 */
const hillTrees = (() => {
  const defs = [
    { x: 148, y: 470, s: 0.92 },
    { x: 470, y: 528, s: 0.86 },
    { x: 566, y: 600, s: 0.8 },
    { x: 74, y: 620, s: 1.0 }
  ]
  return defs.map((t) => {
    const s0 = t.s
    return {
      x: t.x,
      y: t.y,
      s: s0,
      trunk: `M${t.x - 5 * s0} ${t.y} C${t.x - 4 * s0} ${t.y - 14 * s0} ${t.x - 3 * s0} ${t.y - 20 * s0} ${t.x - 2.4 * s0} ${t.y - 26 * s0}
              L${t.x + 2.4 * s0} ${t.y - 26 * s0} C${t.x + 3 * s0} ${t.y - 20 * s0} ${t.x + 4 * s0} ${t.y - 14 * s0} ${t.x + 5 * s0} ${t.y}Z`,
      blobs: [
        [t.x - 11 * s0, t.y - 36 * s0, 17 * s0, 14 * s0],
        [t.x + 10 * s0, t.y - 34 * s0, 15 * s0, 12 * s0],
        [t.x + 1 * s0, t.y - 48 * s0, 16 * s0, 12 * s0],
        [t.x - 6 * s0, t.y - 26 * s0, 13 * s0, 10 * s0],
        [t.x + 6 * s0, t.y - 22 * s0, 11 * s0, 9 * s0]
      ]
    }
  })
})()

/* ---------- 坡上的碎石小路 ---------- */
const pathRibbon = 'M206 512 C246 540 276 578 300 616 C322 648 350 676 382 700 L436 700 C404 672 372 640 348 604 C324 566 296 530 258 504Z'
const pathStones = (() => {
  const out = []
  const pts = [
    [220, 522, 9, 3.6], [244, 542, 8, 3.2], [266, 566, 8.4, 3.4],
    [288, 592, 7.6, 3], [308, 618, 7.2, 3], [328, 642, 6.6, 2.8],
    [348, 664, 6, 2.6], [370, 684, 5.4, 2.4]
  ]
  pts.forEach((p, i) => {
    const off = i % 2 ? 7 : -6
    out.push([p[0] + off, p[1] + 3, p[2], p[3]])
  })
  return out
})()

/* ---------- 苔石 ---------- */
const rocks = [
  [232, 466, 15], [318, 494, 11], [452, 546, 17], [524, 606, 13], [96, 556, 14]
]
const rockPath = (r) => {
  const [x, y, rr] = r
  return `M${x - rr} ${y} Q${x - rr * 0.8} ${y - rr * 0.9} ${x} ${y - rr * 0.94}
          Q${x + rr * 0.85} ${y - rr * 0.86} ${x + rr} ${y}
          Q${x + rr * 0.6} ${y + rr * 0.34} ${x} ${y + rr * 0.36}
          Q${x - rr * 0.62} ${y + rr * 0.34} ${x - rr} ${y}Z`
}
const rockLitPath = (r) => {
  const [x, y, rr] = r
  return `M${x - rr * 0.78} ${y - rr * 0.2} Q${x - rr * 0.5} ${y - rr * 0.84} ${x + rr * 0.1} ${y - rr * 0.72}
          Q${x + rr * 0.5} ${y - rr * 0.6} ${x + rr * 0.62} ${y - rr * 0.24}
          Q${x + rr * 0.1} ${y - rr * 0.5} ${x - rr * 0.78} ${y - rr * 0.2}Z`
}

/* ---------- 草叶 ---------- */
const grass = (() => {
  const seeds = [
    [96, 486], [178, 512], [262, 548], [354, 590], [430, 632], [516, 672],
    [34, 540], [142, 578], [248, 622], [330, 664], [64, 646], [190, 690],
    [418, 700], [546, 700], [472, 578], [396, 522], [300, 494]
  ]
  return seeds.map(([x, y]) => {
    const h = 7 + ((x * 7 + y * 3) % 5)
    return `M${x} ${y} q-2 -${h * 0.7} -4 -${h}`
      + `M${x + 3} ${y} q0 -${h * 0.9} 1 -${h + 2}`
      + `M${x + 6} ${y} q2 -${h * 0.6} 4 -${h - 1}`
  })
})()

/* ---------- 落在地上的花瓣 ---------- */
const fallPetals = [
  [214, 528, 4.6, -22], [286, 556, 4.2, 14], [352, 588, 4.8, -8],
  [126, 548, 4.4, 32], [398, 626, 4, -30], [468, 652, 4.6, 8],
  [72, 596, 4.2, 18], [330, 622, 3.8, -14], [250, 604, 4.4, 26],
  [510, 690, 4.2, -6], [166, 660, 4, 12], [430, 576, 3.6, 40]
]

/* ---------- 花冠的毛边：固定值，不用随机，免得每次刷新都在变 ---------- */
const canopyEdge = (() => {
  const out = []
  const ring = [
    [112, 236], [140, 214], [170, 196], [206, 178], [244, 164], [286, 156],
    [330, 158], [370, 172], [406, 192], [438, 214], [466, 240],
    [128, 262], [162, 274], [200, 282], [244, 286], [288, 286],
    [332, 282], [374, 272], [412, 258], [448, 242]
  ]
  const top = [
    [206, 126], [244, 110], [286, 100], [328, 104], [366, 118]
  ]
  // canopy-edge-shrink：毛边滤镜会让轮廓随机外扩，颗粒得往回收一点才贴得住
  const CX = 292
  const CY = 202
  const pull = (x, y, k) => [CX + (x - CX) * k, CY + (y - CY) * k]
  for (const [x, y] of ring) {
    const [nx, ny] = pull(x, y, 0.87)
    out.push([nx, ny, 6 + ((x + y) % 4)])
  }
  for (const [x, y] of top) {
    const [nx, ny] = pull(x, y, 0.86)
    out.push([nx, ny + 6, 5.4 + ((x + y) % 3)])
  }
  return out
})()

const canopyDots = (() => {
  const out = []
  const pts = [
    [150, 228], [186, 208], [224, 192], [262, 182], [300, 178],
    [338, 182], [376, 194], [410, 210], [442, 232],
    [176, 250], [216, 260], [256, 264], [298, 262], [338, 254], [376, 244],
    [236, 142], [274, 130], [312, 128], [348, 140]
  ]
  for (const [x, y] of pts) out.push([x, y, 3.2 + ((x * 3 + y) % 3)])
  return out
})()

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
  // 内联 SVG 没有 load 事件，直接下一帧触发淡入
  requestAnimationFrame(() => { ready.value = true })
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
/* 内联 SVG：自己带 preserveAspectRatio=slice，不需要 object-fit */
.entry__art {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: scale(1.06);
  transition: opacity 1.2s var(--ease), transform 3s var(--ease);
  will-change: transform, opacity;
}
.entry.is-ready .entry__art {
  opacity: 1;
  transform: scale(1.01);
  animation: entry-drift 34s ease-in-out infinite alternate;
}
/* 极缓慢的推镜：矢量图比照片更吃缩放，幅度要更小，否则边缘会露白 */
@keyframes entry-drift {
  from { transform: scale(1.01) translate3d(0, 0, 0); }
  to { transform: scale(1.045) translate3d(-0.5%, -0.4%, 0); }
}

/* 镇子离得远，给一点点空气感，别和近景一样「实」 */
.entry-town { opacity: .96; }
/* 近景的树和人：轻微呼吸，画面才不像一张贴纸 */
.entry.is-ready .entry-giant { animation: entry-sway 16s ease-in-out infinite alternate; transform-origin: 50% 72%; }
@keyframes entry-sway {
  from { transform: rotate(-0.25deg); }
  to { transform: rotate(0.3deg); }
}

/* ---------- 调色：只提亮不压暗 ---------- */
/* 树冠那一带透下来的暖光 —— 场景里没有写实的太阳，光要落在花上 */
.entry__glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(30% 26% at 24% 22%, rgba(255, 250, 236, 0.5), rgba(255, 244, 228, 0) 74%),
    radial-gradient(36% 30% at 84% 10%, rgba(255, 253, 245, 0.34), rgba(255, 250, 240, 0) 76%);
  mix-blend-mode: screen;
  animation: entry-breathe 12s ease-in-out infinite;
}
/* 文案区后方的极淡米白纱：只抬一点点底，避免字压在云上发虚 */
.entry__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(46% 42% at 64% 38%, rgba(255, 254, 252, 0.66), rgba(255, 253, 251, 0) 76%);
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
  left: 46%;
  top: 27%;
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
.entry.is-leaving .entry__art {
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
html.no-motion .entry__art,
html.no-motion .entry__glow,
html.no-motion .userchip__dot,
html.no-motion .entry__copy,
html.no-motion .entry__copy > *,
html.no-motion .entry__hint,
html.no-motion .entry__top,
html.no-motion .entry__meta {
  animation: none !important;
}
html.no-motion .entry__art { opacity: 1; transform: none; animation: none; }
</style>
