<template>
  <TownShell
    :user="user"
    :active="shop.key"
    :tag="shop.tag"
    :title="shop.title"
    :desc="shop.desc"
    @navigate="$emit('navigate', $event)"
    @logout="$emit('logout')"
  >
    <template #hud>
      <span class="shop-tip">{{ shop.tip }}</span>
    </template>

    <div class="shop">
      <!-- ============ 左：招牌 + 价目 ============ -->
      <section class="menu">
        <header class="menu__head">
          <div class="sign" :class="`sign--${shop.key}`" aria-hidden="true">
            <span class="sign__icon" v-html="shop.icon"></span>
          </div>
          <div class="menu__intro">
            <h2>{{ shop.title }}</h2>
            <p>{{ shop.tagline }}</p>
          </div>
        </header>

        <ul class="items">
          <li v-for="it in shop.items" :key="it.name" class="item" :class="{ 'is-picked': picked && picked.name === it.name }">
            <span class="item__dot" :style="{ background: it.color }" aria-hidden="true"></span>
            <span class="item__body">
              <b>{{ it.name }}</b>
              <i>{{ it.note }}</i>
            </span>
            <span class="item__price">{{ it.price }}<em>币</em></span>
            <button type="button" class="item__btn" @click="order(it)">来一份</button>
          </li>
        </ul>

        <p class="menu__note">
          小镇上买东西大多记账，月底一起算 —— 所以这里按下去不会扣金币。
        </p>
      </section>

      <!-- ============ 右：小票 + 老板的话 ============ -->
      <aside class="side">
        <section class="card card--slip">
          <h2 class="card__title">小票</h2>

          <Transition name="slip" mode="out-in">
            <div v-if="picked" :key="picked.name" class="slip">
              <div class="slip__top">
                <span class="slip__shop">{{ shop.short }}</span>
                <span class="slip__no">{{ slipNo }}</span>
              </div>
              <div class="slip__row">
                <span>{{ picked.name }}</span>
                <b>{{ picked.price }} 币</b>
              </div>
              <div class="slip__row slip__row--sm">
                <span>{{ slipDate }}</span>
                <span>未付款 · 记账</span>
              </div>
              <div class="slip__cut" aria-hidden="true"></div>
              <p class="slip__thanks">{{ shop.thanks }}</p>
            </div>
            <p v-else class="card__desc">还没点东西。左边挑一样，老板会给你扯一张小票。</p>
          </Transition>
        </section>

        <section class="card">
          <h2 class="card__title">和老板聊两句</h2>
          <blockquote class="quote">
            <p>{{ line }}</p>
          </blockquote>
          <button type="button" class="card__btn" @click="talk">再听一句</button>
          <p class="card__foot">已经在这里坐过 <b>{{ visits }}</b> 次</p>
        </section>
      </aside>
    </div>
  </TownShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import TownShell from './TownShell.vue'

const props = defineProps({
  user: { type: Object, default: null },
  shopKey: { type: String, default: 'cafe' }
})
defineEmits(['navigate', 'logout'])

const SHOPS = {
  cafe: {
    key: 'cafe',
    tag: 'CAFE HANAMI',
    short: '花见咖啡馆',
    title: '花见咖啡馆',
    desc: '开在商店街转角的小咖啡馆。窗子正对着广场的喷泉，下午三点的光会斜斜地铺在木桌上。',
    tagline: '一杯拿铁，可以坐一整个下午',
    tip: '今日特调 · 樱拿铁',
    thanks: '趁热喝，凉了就辜负这杯了。',
    icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 12h14v6a7 7 0 0 1-14 0z"/><path d="M22 14h3a3 3 0 0 1 0 6h-3"/><path d="M11 8c0-1 1-1 1-2M15 8c0-1 1-1 1-2M19 8c0-1 1-1 1-2"/></svg>',
    items: [
      { name: '樱拿铁', price: 18, note: '撒了一层盐渍花瓣，甜里带一点咸', color: '#f4a0b8' },
      { name: '手冲 · 花见', price: 26, note: '浅烘，尾韵是柑橘和樱花', color: '#c9a06a' },
      { name: '黄油吐司', price: 12, note: '厚切，烤到边缘发脆', color: '#e8c07a' },
      { name: '今日蛋糕', price: 22, note: '看老板当天心情', color: '#ffd6e0' }
    ],
    lines: [
      '「豆子是山那头烘的，一周送一次，赶上下雨就断货。」',
      '「靠窗那张桌子别坐，下午的光太亮，看手机都看不清 —— 不过看书正好。」',
      '「这镇子没什么急事，咖啡凉了可以再热。」',
      '「昨天有个孩子点了杯牛奶，坐了三小时写作业。」'
    ]
  },
  sweet: {
    key: 'sweet',
    tag: 'SWEETS',
    short: '小镇甜品屋',
    title: '小镇甜品屋',
    desc: '粉色遮阳伞下面是三张小圆桌，玻璃柜里每天只做六种甜点，卖完就挂上「今日售罄」的木牌。',
    tagline: '六种甜点，卖完就打烊',
    tip: '今日还有 3 种',
    thanks: '路上小心，盒子别晃。',
    icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14h12l-2 12H12z"/><path d="M10 14c0-4 2.7-6 6-6s6 2 6 6"/><circle cx="16" cy="6" r="2"/></svg>',
    items: [
      { name: '草莓大福', price: 16, note: '整颗草莓裹白豆沙', color: '#f7a8bb' },
      { name: '抹茶巴斯克', price: 24, note: '外面焦，里面还是流心', color: '#9cbb8e' },
      { name: '樱花水信玄饼', price: 20, note: '配黑糖蜜，要趁凉吃', color: '#ffd6e0' },
      { name: '季节芭菲', price: 28, note: '杯底藏着自家熬的果酱', color: '#d9b8ea' }
    ],
    lines: [
      '「今天只做了六个，卖完就关门 —— 做多了会不新鲜。」',
      '「水信玄饼要趁凉吃，放十分钟就化成水了。」',
      '「隔壁花店的姑娘每天来买一块，说是给店里的猫。」',
      '「甜的东西不用讲究，好吃就行。」'
    ]
  },
  flower: {
    key: 'flower',
    tag: 'FLOWER',
    short: '街角花店',
    title: '街角花店',
    desc: '月台出来第一家。门口三只铁皮花桶，早上刚从后山剪的枝，还带着露水。',
    tagline: '早上剪的枝，还带着露水',
    tip: '今日花材 · 山樱',
    thanks: '回去斜剪一刀，能多开两天。',
    icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 26V13"/><path d="M16 17c-4 0-7-2-7-5 4 0 7 2 7 5zM16 21c4 0 7-2 7-5-4 0-7 2-7 5z"/><circle cx="16" cy="8" r="4"/></svg>',
    items: [
      { name: '单枝山樱', price: 6, note: '插在玻璃瓶里就很好看', color: '#f4a0b8' },
      { name: '春日花束', price: 38, note: '樱、小手球、一点尤加利', color: '#ffc2cf' },
      { name: '小盆栽', price: 22, note: '好养，忘浇水也死不了', color: '#9cbb8e' },
      { name: '干花书签', price: 9, note: '压在书里，会有淡淡的味道', color: '#d9b8ea' }
    ],
    lines: [
      '「早上的花最好，中午太阳一晒就蔫了。」',
      '「有人买花给自己，我觉得这样很好。」',
      '「后山那棵千年樱开花的时候，全镇的花都不好意思开。」',
      '「花不用挑最贵的，挑你看着想笑的那束。」'
    ]
  }
}

const shop = computed(() => SHOPS[props.shopKey] || SHOPS.cafe)

const picked = ref(null)
const slipNo = ref('')
const slipDate = ref('')
const line = ref('')
const visits = ref(0)

const KEY_VISIT = computed(() => `aurora_shop_${shop.value.key}_visits`)

function pad (n) { return String(n).padStart(2, '0') }

function order (it) {
  const d = new Date()
  picked.value = it
  slipNo.value = `No.${String(Math.floor(Math.random() * 9000) + 1000)}`
  slipDate.value = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function talk () {
  const list = shop.value.lines
  const others = list.filter((l) => l !== line.value)
  line.value = others[Math.floor(Math.random() * others.length)] || list[0]
  visits.value += 1
  try { localStorage.setItem(KEY_VISIT.value, String(visits.value)) } catch (e) { /* 存不下就算了 */ }
}

function loadLocal () {
  try {
    visits.value = Number(localStorage.getItem(KEY_VISIT.value) || 0) || 0
  } catch (e) { visits.value = 0 }
}

watch(() => shop.value.key, () => {
  picked.value = null
  line.value = shop.value.lines[0]
  loadLocal()
})

onMounted(() => {
  line.value = shop.value.lines[0]
  loadLocal()
})
</script>

<style scoped>
.shop-tip { font-size: 11.5px; letter-spacing: .06em; color: var(--ink-soft); }

.shop {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 22px;
  margin-top: 6px;
}

/* ---------- 价目卡 ---------- */
.menu {
  padding: 26px 26px 24px;
  border: 1px solid rgba(255, 255, 255, .82);
  border-radius: 24px;
  background: var(--porcelain);
  box-shadow: var(--lift);
}
.menu__head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px dashed var(--line);
}
.sign {
  flex: none;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .5), 0 12px 26px -16px rgba(120, 70, 95, .8);
}
/* v-html 注入的 svg 拿不到 scoped 属性，必须用 :deep 才能套上尺寸 */
.sign :deep(svg) { width: 30px; height: 30px; }
.sign--cafe { background: linear-gradient(140deg, #8fae8b, #5f7f68); }
.sign--sweet { background: linear-gradient(140deg, #f4a8bd, #e0738f); }
.sign--flower { background: linear-gradient(140deg, #b8cf9e, #7f9f7a); }

.menu__intro h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 19px;
  letter-spacing: .08em;
  color: var(--ink);
}
.menu__intro p {
  margin: 6px 0 0;
  font-size: 12px;
  letter-spacing: .04em;
  color: var(--muted);
}

.items { display: grid; gap: 4px; margin: 12px 0 0; padding: 0; list-style: none; }
.item {
  display: grid;
  grid-template-columns: 10px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 13px 10px;
  border-radius: 12px;
  border-bottom: 1px dashed var(--line-soft);
  transition: background .3s;
}
.item:last-child { border-bottom: 0; }
.item.is-picked { background: linear-gradient(100deg, rgba(255, 233, 240, .85), rgba(255, 250, 252, .4)); }
.item__dot { width: 8px; height: 8px; border-radius: 50%; }
.item__body { display: grid; gap: 4px; }
.item__body b { font-size: 13.5px; font-weight: 700; letter-spacing: .05em; color: var(--ink); }
.item__body i { font-style: normal; font-size: 11px; color: var(--muted); }
.item__price {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #b0536f;
}
.item__price em { margin-left: 2px; font-style: normal; font-size: 10px; font-weight: 400; color: var(--faint); }
.item__btn {
  padding: 6px 14px;
  border: 1px solid rgba(196, 130, 156, .38);
  border-radius: 999px;
  background: rgba(255, 255, 255, .7);
  color: #8b4a63;
  font: inherit;
  font-size: 11.5px;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .25s, border-color .25s, transform .25s var(--ease);
}
.item__btn:hover { background: #fff; border-color: rgba(196, 130, 156, .7); transform: translateY(-1px); }

.menu__note {
  margin: 16px 0 0;
  font-size: 11px;
  line-height: 1.9;
  color: var(--faint);
}

/* ---------- 右侧 ---------- */
.side { display: grid; gap: 18px; align-content: start; }
.card {
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, .8);
  border-radius: 22px;
  background: var(--porcelain);
  box-shadow: var(--lift);
}
.card__title {
  margin: 0 0 12px;
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: .1em;
  color: var(--ink);
}
.card__desc { margin: 0; font-size: 12.5px; line-height: 1.95; color: var(--muted); }

.slip {
  padding: 16px 16px 14px;
  border-radius: 12px;
  background: repeating-linear-gradient(180deg, #fffdf8 0 26px, #fdf8f0 26px 27px);
  border: 1px solid rgba(206, 170, 182, .4);
  box-shadow: 0 14px 26px -20px rgba(120, 70, 95, .7);
}
.slip__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(150, 110, 130, .35);
}
.slip__shop {
  font-family: var(--font-serif);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: .14em;
  color: #6b4a5c;
}
.slip__no { font-size: 10px; letter-spacing: .1em; color: var(--faint); }
.slip__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 9px;
  font-size: 12.5px;
  color: #4f3a4e;
}
.slip__row b { color: #b0536f; }
.slip__row--sm { margin-top: 6px; font-size: 10px; letter-spacing: .06em; color: var(--faint); }
.slip__cut {
  margin: 12px -16px 10px;
  border-top: 1px dashed rgba(150, 110, 130, .45);
}
.slip__thanks {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 11.5px;
  line-height: 1.8;
  color: rgba(110, 78, 96, .8);
  text-align: center;
}

.slip-enter-active, .slip-leave-active { transition: opacity .3s var(--ease), transform .35s var(--ease); }
.slip-enter-from { opacity: 0; transform: translateY(8px) rotate(-1deg); }
.slip-leave-to { opacity: 0; transform: translateY(-6px); }

.quote {
  margin: 0 0 16px;
  padding: 14px 16px;
  border-radius: 14px;
  border-left: 3px solid var(--sakura-400);
  background: linear-gradient(120deg, rgba(255, 240, 245, .9), rgba(255, 250, 252, .55));
}
.quote p {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 12.5px;
  line-height: 1.95;
  color: #6a4a5c;
}

.card__btn {
  width: 100%;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(115deg, var(--sakura-400), var(--sakura-500));
  color: #fff;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: .12em;
  cursor: pointer;
  box-shadow: 0 16px 30px -18px rgba(232, 84, 127, .85);
  transition: transform .28s var(--ease);
}
.card__btn:hover { transform: translateY(-2px); }
.card__foot {
  margin: 12px 0 0;
  font-size: 11px;
  letter-spacing: .06em;
  color: var(--muted);
  text-align: center;
}
.card__foot b { color: var(--sakura-600); }

@media (max-width: 1080px) {
  .shop { grid-template-columns: 1fr; }
}
</style>
