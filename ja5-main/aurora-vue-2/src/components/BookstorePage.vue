<template>
  <TownShell
    :user="user"
    active="home"
    tag="BOOKSTORE"
    title="樱花书店"
    desc="木书架从地板顶到天花板，每一本都被翻得卷了边。挑一本坐下，风会把樱瓣夹进书页里。"
    @navigate="$emit('navigate', $event)"
    @logout="$emit('logout')"
  >
    <template #hud>
      <span class="shelf-count">已入手 <b>{{ wallet.ownedCount }}</b> 本</span>
    </template>

    <!-- 选书工具条：搜索 + 分类 + 只看未入手 -->
    <section class="tools">
      <label class="searchbox">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.4" />
          <path d="m16 16 4.4 4.4" />
        </svg>
        <input
          v-model.trim="keyword"
          type="search"
          placeholder="找一本书：书名、作者或标签"
          aria-label="搜索书目"
          @keyup.enter="applySearch"
        />
        <button v-if="keyword" class="searchbox__clear" type="button" aria-label="清空" @click="clearSearch">✕</button>
      </label>

      <div class="chips">
        <button
          v-for="c in categoryChips"
          :key="c.id"
          class="chip"
          :class="{ on: activeCategory === c.id }"
          type="button"
          @click="pickCategory(c.id)"
        >{{ c.name }}</button>
      </div>

      <button class="only-free" :class="{ on: onlyUnowned }" type="button" @click="toggleOnlyUnowned">
        {{ onlyUnowned ? '只看还没入手的' : '显示全部书目' }}
      </button>
    </section>

    <!-- 书架 -->
    <section v-if="loading" class="grid">
      <div v-for="n in 6" :key="n" class="book book--ghost">
        <div class="book__cover"></div>
        <div class="book__sk"></div>
        <div class="book__sk book__sk--short"></div>
      </div>
    </section>

    <section v-else-if="error" class="empty">
      <span class="empty__ico">✕</span>
      <p>{{ error }}</p>
      <button class="empty__btn" type="button" @click="load(1)">重新找找</button>
    </section>

    <section v-else-if="!books.length" class="empty">
      <span class="empty__ico">✿</span>
      <p>{{ keyword ? `书架上没有和「${keyword}」有关的书` : '这个书架还空着' }}</p>
      <button class="empty__btn" type="button" @click="resetFilter">回到全部书目</button>
    </section>

    <section v-else class="grid">
      <article
        v-for="book in visibleBooks"
        :key="book.id"
        class="book"
        :class="{ 'book--owned': hasOwned(book.id) }"
      >
        <!-- 书封：按分类上色，像一本立在架上的旧书 -->
        <button class="book__cover" :style="coverStyle(book)" type="button" @click="$emit('open-article', book.id)">
          <span class="book__spine"></span>
          <span class="book__cat">{{ book.category || '手记' }}</span>
          <span class="book__title">{{ book.title }}</span>
          <span class="book__author">{{ book.author }}</span>
          <span v-if="hasOwned(book.id)" class="book__stamp">藏</span>
        </button>

        <div class="book__body">
          <p class="book__summary">{{ book.summary }}</p>
          <div class="book__meta">
            <span>{{ book.minutes }} 分钟</span>
            <span>·</span>
            <span>{{ book.views }} 次翻阅</span>
          </div>

          <div class="book__foot">
            <span class="book__price" :class="{ free: !book.price }">
              <template v-if="!book.price">免费试读</template>
              <template v-else>{{ book.price }} <i>金币</i></template>
            </span>

            <!-- 已入手：直接翻开 -->
            <button
              v-if="hasOwned(book.id)"
              class="book__btn book__btn--read"
              type="button"
              @click="$emit('open-article', book.id)"
            >翻开阅读</button>

            <!-- 免费本 -->
            <button
              v-else-if="!book.price"
              class="book__btn book__btn--read"
              type="button"
              @click="$emit('open-article', book.id)"
            >直接试读</button>

            <!-- 需购买 -->
            <button
              v-else
              class="book__btn"
              :class="{ 'book__btn--short': !user || wallet.money < book.price, 'is-busy': buying === book.id }"
              type="button"
              :disabled="buying === book.id"
              @click="onBuy(book)"
            >
              <template v-if="buying === book.id">结算中…</template>
              <template v-else-if="!user">登录后购买</template>
              <template v-else-if="wallet.money < book.price">还差 {{ book.price - wallet.money }} 币</template>
              <template v-else>买下它</template>
            </button>
          </div>
        </div>
      </article>
    </section>

    <!-- 分页 -->
    <nav v-if="pages > 1" class="pager" aria-label="翻页">
      <button type="button" :disabled="page <= 1" @click="load(page - 1)">上一页</button>
      <span>{{ page }} / {{ pages }}</span>
      <button type="button" :disabled="page >= pages" @click="load(page + 1)">下一页</button>
    </nav>

    <!-- 收银台：确认购买 -->
    <Teleport to="body">
      <Transition name="pay">
        <div v-if="payTarget" class="pay" role="dialog" aria-modal="true" @click.self="payTarget = null">
          <div class="pay__panel">
            <span class="pay__tag">CHECKOUT</span>
            <h3 class="pay__title">{{ payTarget.title }}</h3>
            <p class="pay__desc">{{ payTarget.summary }}</p>
            <dl class="pay__rows">
              <div><dt>售价</dt><dd>{{ payTarget.price }} 金币</dd></div>
              <div><dt>当前余额</dt><dd>{{ wallet.money }} 金币</dd></div>
              <div><dt>买后余额</dt><dd>{{ wallet.money - payTarget.price }} 金币</dd></div>
            </dl>
            <div class="pay__actions">
              <button class="pay__ghost" type="button" @click="payTarget = null">再想想</button>
              <button class="pay__ok" type="button" :disabled="buying === payTarget.id" @click="confirmBuy">
                {{ buying === payTarget.id ? '正在盖章…' : '付钱买下' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </TownShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import TownShell from './TownShell.vue'
import { searchArticles, fetchCategories } from '../api/search'
import { useEconomy } from '../composables/useEconomy'
import { toast } from '../composables/useToast'

const props = defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['navigate', 'logout', 'open-article', 'need-login'])

const { wallet, hasOwned, buy, refresh, refreshOwned } = useEconomy()

const keyword = ref('')
const activeCategory = ref(null)
const onlyUnowned = ref(false)
const sort = ref('hot')

const books = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const pages = ref(1)
const PAGE_SIZE = 9

const buying = ref(null)
const payTarget = ref(null)

/** 分类 chips：全部 + 二级分类（这里用一级分类，数量刚好够一行） */
const categoryChips = computed(() => [{ id: null, name: '全部' }, ...categories.value])

/** 「只看还没入手的」在前端过滤，避免每次切换都多打一次接口 */
const visibleBooks = computed(() => {
  if (!onlyUnowned.value) return books.value
  return books.value.filter((b) => !hasOwned(b.id))
})

/** 书封配色：按分类挑一组低饱和渐变，和全站樱粉基调不冲突 */
const COVER_PALETTE = {
  前端: ['#cfe6fb', '#9bc6ee', '#3f6f9c'],
  后端: ['#d8ecd9', '#a8d3ae', '#3f6f52'],
  数据库: ['#fbe6cd', '#eec488', '#8a5f27'],
  设计: ['#e8dcf7', '#c3aee6', '#5f4a86'],
  工程: ['#fadbe6', '#eeaac5', '#8d3f60'],
  小说: ['#ffd9e6', '#f2a6c3', '#8f3a5c']
}
function coverStyle (book) {
  const p = COVER_PALETTE[book.category] || ['#f1e6f1', '#d9bcd6', '#6b4f6a']
  return {
    background: `linear-gradient(160deg, ${p[0]} 0%, ${p[1]} 62%, ${p[2]} 100%)`,
    boxShadow: `0 18px 30px -22px ${p[2]}`
  }
}

async function load (target = 1) {
  loading.value = true
  error.value = ''
  page.value = target
  try {
    const res = await searchArticles(keyword.value, {
      categoryId: activeCategory.value,
      sort: sort.value,
      page: target,
      size: PAGE_SIZE
    })
    books.value = (res && res.list) || []
    pages.value = (res && res.pages) || 1
  } catch (e) {
    error.value = (e && e.message) || '书店暂时打不开，请稍后再来'
    books.value = []
  } finally {
    loading.value = false
  }
}

function applySearch () { load(1) }
function clearSearch () { keyword.value = ''; load(1) }
function pickCategory (id) {
  activeCategory.value = id
  load(1)
}
function toggleOnlyUnowned () {
  onlyUnowned.value = !onlyUnowned.value
  // 过滤后可能当前页空了，回到第一页重新取一批
  if (onlyUnowned.value && !visibleBooks.value.length && page.value < pages.value) load(page.value + 1)
}
function resetFilter () {
  keyword.value = ''
  activeCategory.value = null
  onlyUnowned.value = false
  load(1)
}

/** 点「买下它」：先弹收银台确认，避免手滑扣钱 */
function onBuy (book) {
  if (!props.user) {
    toast.info('买书要先把名字写在借书卡上')
    emit('need-login')
    return
  }
  if (wallet.money < book.price) {
    toast.error(`还差 ${book.price - wallet.money} 金币，去便利店打一班吧`)
    return
  }
  payTarget.value = book
}

async function confirmBuy () {
  const book = payTarget.value
  if (!book) return
  buying.value = book.id
  try {
    await buy(book.id)
    toast.success(`《${book.title}》已经放进你的书架`)
    payTarget.value = null
    refreshOwned()
  } catch (e) {
    toast.error((e && e.message) || '付款失败，请稍后再试')
  } finally {
    buying.value = null
  }
}

onMounted(async () => {
  load(1)
  refresh()
  refreshOwned().catch(() => {})
  try {
    categories.value = await fetchCategories()
  } catch (e) {
    categories.value = []
  }
})
</script>

<style scoped>
.shelf-count {
  font-size: 11.5px;
  letter-spacing: .06em;
  color: var(--muted);
}
.shelf-count b { color: var(--sakura-700); font-variant-numeric: tabular-nums; }

/* ---------- 工具条 ---------- */
.tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 22px;
}
.searchbox {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 12px;
  border-radius: 13px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: var(--lift);
  transition: border-color .3s, box-shadow .3s;
}
.searchbox:focus-within { border-color: var(--sakura-300); box-shadow: var(--lift-hover); }
.searchbox svg {
  width: 15px;
  height: 15px;
  flex: none;
  fill: none;
  stroke: var(--faint);
  stroke-width: 1.8;
  stroke-linecap: round;
}
.searchbox input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: none;
  font: inherit;
  font-size: 13px;
  color: var(--ink);
}
.searchbox input::placeholder { color: var(--faint); }
.searchbox__clear {
  border: 0;
  background: none;
  color: var(--faint);
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
}
.searchbox__clear:hover { color: var(--sakura-600); }

.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  height: 32px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, .7);
  color: var(--muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: color .25s, background .25s, border-color .25s, transform .25s var(--ease);
}
.chip:hover { color: var(--sakura-700); background: var(--sakura-50); transform: translateY(-1px); }
.chip.on {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(120deg, var(--sakura-400), var(--sakura-600));
  box-shadow: 0 10px 20px -14px rgba(232, 84, 127, .95);
}

.only-free {
  height: 32px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px dashed var(--line);
  background: transparent;
  color: var(--faint);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: color .25s, border-color .25s;
}
.only-free.on { color: var(--sakura-700); border-color: var(--sakura-300); }

/* ---------- 书架 ---------- */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
  gap: 18px;
}
.book {
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(255, 255, 255, .9);
  box-shadow: var(--lift);
  transition: transform .32s var(--ease), box-shadow .32s var(--ease);
}
.book:hover { transform: translateY(-4px); box-shadow: var(--lift-hover); }
.book--owned { box-shadow: var(--lift), 0 0 0 1px rgba(255, 196, 217, .9) inset; }

.book__cover {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  height: 152px;
  padding: 16px 16px 14px 22px;
  border: 0;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  color: #fff;
  isolation: isolate;
}
.book__cover::after {
  /* 书脊高光 + 纸面纹理，让书封不像一块纯色 */
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(100deg, rgba(255, 255, 255, .34) 0%, rgba(255, 255, 255, 0) 26%),
    var(--grain);
  background-size: auto, 160px 160px;
  opacity: .5;
  mix-blend-mode: soft-light;
  z-index: -1;
}
.book__spine {
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, .35);
  box-shadow: inset -2px 0 4px rgba(0, 0, 0, .12);
}
.book__cat {
  font-size: 9.5px;
  letter-spacing: .26em;
  text-transform: uppercase;
  opacity: .82;
}
.book__title {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--font-serif);
  font-size: 16.5px;
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: .02em;
  text-shadow: 0 2px 12px rgba(60, 30, 50, .28);
}
.book__author {
  margin-top: auto;
  font-size: 10.5px;
  letter-spacing: .1em;
  opacity: .78;
}
.book__stamp {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, .82);
  font-family: var(--font-serif);
  font-size: 12px;
  color: #fff;
  background: rgba(255, 255, 255, .16);
  backdrop-filter: blur(3px);
}

.book__body { display: flex; flex-direction: column; flex: 1; padding: 13px 15px 14px; }
.book__summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: var(--muted);
}
.book__meta {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  font-size: 10.5px;
  color: var(--faint);
  letter-spacing: .04em;
}
.book__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
}
.book__price {
  font-size: 13px;
  font-weight: 600;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
  letter-spacing: .02em;
}
.book__price i { font-style: normal; font-size: 10px; font-weight: 400; color: var(--faint); }
.book__price.free { color: var(--leaf-500); }

.book__btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .04em;
  color: #fff;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  box-shadow: 0 10px 20px -14px rgba(232, 84, 127, .95);
  transition: transform .25s var(--ease), box-shadow .25s, filter .25s;
}
.book__btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 24px -14px rgba(232, 84, 127, 1); }
.book__btn--read {
  color: var(--sakura-700);
  background: var(--sakura-100);
  box-shadow: none;
  border: 1px solid var(--sakura-200);
}
.book__btn--short {
  color: var(--muted);
  background: var(--paper-3);
  border: 1px solid var(--line);
  box-shadow: none;
}
.book__btn:disabled { cursor: default; opacity: .7; }

/* 骨架 */
.book--ghost { box-shadow: none; border-color: var(--line-soft); }
.book--ghost .book__cover { background: linear-gradient(120deg, #f4edf2, #faf5f8 60%, #f4edf2); animation: shimmer 1.4s linear infinite; }
.book__sk { height: 11px; margin: 14px 15px 0; border-radius: 6px; background: #f3ebf0; }
.book__sk--short { width: 55%; }

/* 空态 / 分页 */
.empty {
  padding: 60px 20px;
  text-align: center;
  border-radius: 20px;
  background: rgba(255, 253, 254, .7);
  border: 1px dashed var(--line);
}
.empty__ico { display: block; font-size: 22px; color: var(--sakura-300); margin-bottom: 12px; }
.empty p { margin: 0 0 16px; font-size: 13px; color: var(--muted); }
.empty__btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 11px;
  border: 1px solid var(--sakura-200);
  background: var(--sakura-50);
  color: var(--sakura-700);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 26px;
  font-size: 12px;
  color: var(--muted);
}
.pager button {
  height: 32px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink-soft);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.pager button:hover:not(:disabled) { color: var(--sakura-700); border-color: var(--sakura-300); }
.pager button:disabled { opacity: .4; cursor: default; }

/* ---------- 收银台 ---------- */
.pay {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(70, 36, 56, .32);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
}
.pay__panel {
  width: min(420px, 100%);
  padding: 26px 24px 22px;
  border-radius: 22px;
  background: linear-gradient(180deg, #fffdfd, #fdf5f8);
  border: 1px solid rgba(255, 255, 255, .95);
  box-shadow: 0 40px 80px -40px rgba(120, 60, 90, .55);
}
.pay__tag { font-size: 9px; letter-spacing: .32em; color: var(--sakura-500); }
.pay__title {
  margin: 10px 0 8px;
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--ink);
}
.pay__desc {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.75;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pay__rows { margin: 0 0 20px; display: flex; flex-direction: column; gap: 8px; }
.pay__rows div {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--line-soft);
  font-size: 12px;
}
.pay__rows dt { color: var(--faint); margin: 0; }
.pay__rows dd { margin: 0; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.pay__actions { display: flex; gap: 10px; }
.pay__ghost, .pay__ok {
  flex: 1;
  height: 40px;
  border-radius: 12px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.pay__ghost { border: 1px solid var(--line); background: #fff; color: var(--muted); }
.pay__ok {
  border: 0;
  color: #fff;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  box-shadow: 0 14px 26px -16px rgba(232, 84, 127, 1);
}
.pay__ok:disabled { opacity: .65; cursor: default; }

.pay-enter-active, .pay-leave-active { transition: opacity .22s var(--ease); }
.pay-enter-active .pay__panel, .pay-leave-active .pay__panel { transition: transform .28s var(--ease); }
.pay-enter-from, .pay-leave-to { opacity: 0; }
.pay-enter-from .pay__panel, .pay-leave-to .pay__panel { transform: translateY(14px) scale(.98); }

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}

@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
  .book__cover { height: 136px; }
}
</style>
