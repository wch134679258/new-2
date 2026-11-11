<template>
  <div class="detail">
    <SiteNav :user="user" active="article" @go="$emit('navigate', $event)" @logout="$emit('logout')" />

    <main class="main">
      <!-- 返回 + 操作行 -->
      <div class="topbar">
        <button class="back" type="button" @click="$emit('back')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          返回
        </button>

        <!-- 收藏按钮：未登录点击 -> 引导登录 -->
        <button
          v-if="article"
          class="fav"
          :class="{ 'fav--on': article.favorited, 'fav--pending': favPending }"
          type="button"
          :disabled="favPending"
          @click="toggleFavorite"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z" />
          </svg>
          <span>{{ favText }}</span>
        </button>

        <!-- 点赞按钮：未登录点击 -> 引导登录 -->
        <button
          v-if="article"
          class="fav fav--like"
          :class="{ 'fav--on': article.liked, 'fav--pending': likePending }"
          type="button"
          :disabled="likePending"
          @click="toggleLike"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3z" />
            <path d="M7 10l4.2-7.4a1.6 1.6 0 0 1 2.9 1.3L13 9h4.6a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 16.2 20H7" />
          </svg>
          <span>{{ likeText }}</span>
        </button>
      </div>

      <!-- 加载骨架 -->
      <div v-if="loading" class="skeleton">
        <div class="sk-line sk-line--cat"></div>
        <div class="sk-line sk-line--title"></div>
        <div class="sk-line sk-line--meta"></div>
        <div class="sk-line"></div>
        <div class="sk-line"></div>
        <div class="sk-line sk-line--short"></div>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="state state--error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
             stroke-linecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4.5M12 16h.01" />
        </svg>
        <p>{{ error }}</p>
        <button class="state__btn" type="button" @click="load">重试</button>
      </div>

      <!-- 文章正文 -->
      <template v-else-if="article">
        <article class="paper">
          <header class="paper__head">
            <button
              v-if="article.category"
              class="paper__cat"
              type="button"
              @click="$emit('open-category', article.categoryId, article.category)"
            >{{ article.category }}</button>
            <h1 class="paper__title">{{ article.title }}</h1>
            <div class="paper__meta">
              <span class="paper__author">{{ article.author || '佚名' }}</span>
              <span class="paper__dot"></span>
              <span>{{ article.createdAt }}</span>
              <span class="paper__dot"></span>
              <span>{{ article.views }} 次浏览</span>
              <span class="paper__dot"></span>
              <span>{{ article.likes || 0 }} 次点赞</span>
              <span class="paper__dot"></span>
              <span>约 {{ readingMinutes }} 分钟读完</span>
            </div>
          </header>

          <div class="paper__body" :class="{ 'paper__body--dropcap': canDropCap }">
            <p v-for="(para, i) in paragraphs" :key="i">{{ para }}</p>
          </div>

          <!-- 书店试读墙：没买下这本书时，正文只到这里 -->
          <section v-if="article.locked" class="paywall">
            <p class="paywall__fade" aria-hidden="true"></p>
            <div class="paywall__card">
              <span class="paywall__tag">SAKURA BOOKSTORE</span>
              <h3>这片书页还夹在店里</h3>
              <p class="paywall__lede">
                已读到试读部分。全文约 {{ article.wordCount }} 字，买下后永久可读，
                书架里也会留一本。
              </p>
              <div class="paywall__actions">
                <button
                  class="paywall__buy"
                  type="button"
                  :disabled="payBusy || (user && wallet.money < article.price)"
                  @click="onBuy"
                >
                  <template v-if="payBusy">正在盖章…</template>
                  <template v-else-if="!user">登录后购买</template>
                  <template v-else-if="wallet.money < article.price">还差 {{ article.price - wallet.money }} 金币</template>
                  <template v-else>买下它 · {{ article.price }} 金币</template>
                </button>
                <button class="paywall__ghost" type="button" @click="$emit('navigate', 'home')">回书店</button>
              </div>
              <p class="paywall__wallet">
                当前余额 <b>{{ wallet.money }}</b> 金币 · 去便利店打工可以赚
              </p>
            </div>
          </section>

          <footer v-if="article.tags && article.tags.length" class="paper__tags">
            <button
              v-for="t in article.tags"
              :key="t"
              class="rtag"
              type="button"
              @click="$emit('open-tag', t)"
            >{{ t }}</button>
          </footer>
        </article>

        <!-- 收藏引导条：未登录时说明 -->
        <p v-if="!user" class="login-hint">
          登录后即可收藏这篇文章 ·
          <button class="link-inline" type="button" @click="$emit('need-login')">去登录</button>
        </p>

        <!-- 相关文章 -->
        <section v-if="related.length" class="related">
          <h2 class="related__title">相关文章</h2>
          <div class="related__grid">
            <article
              v-for="a in related"
              :key="a.id"
              class="relcard"
              tabindex="0"
              role="button"
              @click="$emit('open-article', a.id)"
              @keydown.enter="$emit('open-article', a.id)"
            >
              <h3 class="relcard__title">{{ a.title }}</h3>
              <p class="relcard__summary">{{ a.summary }}</p>
              <div class="relcard__foot">
                <span>{{ a.author }}</span>
                <span class="paper__dot"></span>
                <span>{{ a.views }} 次浏览</span>
              </div>
            </article>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import SiteNav from './SiteNav.vue'
import { fetchArticle, fetchRelated } from '../api/article'
import { useEconomy } from '../composables/useEconomy'
import { addFavorite, removeFavorite } from '../api/favorites'
import { addLike, removeLike } from '../api/likes'
import { recordHistory } from '../api/history'
import { toast } from '../composables/useToast'

const props = defineProps({
  articleId: { type: [String, Number], required: true },
  user: { type: Object, default: null }
})
const emit = defineEmits(['back', 'open-article', 'open-category', 'open-tag', 'navigate', 'logout', 'need-login'])

// 书店：买书解锁全文
const { wallet, buy } = useEconomy()
const payBusy = ref(false)

async function onBuy () {
  if (!article.value || payBusy.value) return
  if (!props.user) { emit('need-login'); return }
  payBusy.value = true
  try {
    await buy(article.value.id)
    toast.success('已放进你的书架')
    // 重新拉一次详情：这一次服务端会返回全文
    await load()
  } catch (e) {
    toast.error((e && e.message) || '付款失败，请稍后再试')
  } finally {
    payBusy.value = false
  }
}

const article = ref(null)
const related = ref([])
const loading = ref(false)
const error = ref('')
const favPending = ref(false)
const likePending = ref(false)

/** 预计阅读时长：中文按 400 字/分钟估算，至少 1 分钟 */
const readingMinutes = computed(() => {
  const text = (article.value && article.value.content) || ''
  return Math.max(1, Math.round(text.replace(/\s/g, '').length / 400))
})

/** 正文按空行拆段，空行合并 */
const paragraphs = computed(() => {
  const c = article.value && article.value.content
  if (!c) return []
  return String(c)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean)
})

/**
 * 首字下沉只在「首字是有意义的中文字/字母」时开启。
 * 若正文以《「“（ 等标点开头，::first-letter 会把标点放大、与后文拆开（《龙 族》），
 * 这种情况直接放弃下沉，保持整体观感。
 */
const canDropCap = computed(() => {
  const first = (paragraphs.value[0] || '').trim().charAt(0)
  return !!first && !/[\s《〈「『“"'（(【\[—-]/.test(first)
})

const favText = computed(() => {
  if (favPending.value) return '处理中…'
  return article.value && article.value.favorited ? '已收藏' : '收藏'
})

const likeText = computed(() => {
  if (likePending.value) return '处理中…'
  if (!article.value) return '点赞'
  const n = article.value.likes || 0
  return (article.value.liked ? '已点赞' : '点赞') + (n > 0 ? ` ${n}` : '')
})

async function load () {
  loading.value = true
  error.value = ''
  try {
    // 详情与相关文章并行拉取；相关文章失败不阻塞正文阅读
    const [detail, rel] = await Promise.all([
      fetchArticle(props.articleId),
      fetchRelated(props.articleId).catch(() => [])
    ])
    article.value = detail
    related.value = rel || []
  } catch (e) {
    article.value = null
    error.value = (e && e.message) || '文章加载失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

/** 收藏 / 取消收藏（未登录由 App 引导去登录页） */
async function toggleFavorite () {
  if (!props.user || favPending.value) return
  const id = article.value.id
  const wasFav = article.value.favorited
  favPending.value = true
  // 乐观更新：先翻转 UI，失败再回滚
  article.value.favorited = !wasFav
  try {
    if (wasFav) await removeFavorite(id)
    else await addFavorite(id)
  } catch (e) {
    article.value.favorited = wasFav
    error.value = (e && e.message) || '操作失败，请稍后再试'
  } finally {
    favPending.value = false
  }
}

/** 点赞 / 取消点赞（未登录由 App 引导去登录页） */
async function toggleLike () {
  if (!props.user || likePending.value) return
  const id = article.value.id
  const wasLiked = article.value.liked
  const oldCount = article.value.likes || 0
  likePending.value = true
  // 乐观更新：状态与计数一起翻转，失败回滚
  article.value.liked = !wasLiked
  article.value.likes = Math.max(0, oldCount + (wasLiked ? -1 : 1))
  try {
    const res = await (wasLiked ? removeLike(id) : addLike(id))
    // 以后端返回的真实点赞数为准，避免并发下计数漂移
    if (res && typeof res.likes === 'number') article.value.likes = res.likes
    toast.success(wasLiked ? '已取消点赞' : '已点赞')
  } catch (e) {
    article.value.liked = wasLiked
    article.value.likes = oldCount
    toast.error((e && e.message) || '操作失败，请稍后再试')
  } finally {
    likePending.value = false
  }
}

// 切换文章（从相关文章点进来）时重新加载
watch(() => props.articleId, (id) => { if (id) load() })

onMounted(load)

/**
 * 登录用户浏览过文章后上报一次浏览历史。
 * 这是「顺手做」的弱操作：失败只静默忽略，不影响阅读。
 */
watch(() => [props.user && props.user.id, props.articleId], ([uid, id]) => {
  if (!uid || !id) return
  recordHistory(id).catch(() => { /* 浏览记录失败不影响阅读 */ })
})
</script>

<style scoped>
/* ============ 页面骨架 ============ */
.detail {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 880px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 22px 24px 70px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding-top: 18px;
  animation: rise .55s var(--ease) both;
}

/* ============ 返回 + 收藏 ============ */
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
}
.back,
.fav {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, .82);
  border: 1px solid var(--line-soft);
  backdrop-filter: blur(10px);
  transition: color .25s, background .25s, border-color .25s, transform .25s var(--ease), box-shadow .25s;
}
.back:hover,
.fav:hover:not(:disabled) {
  color: var(--sakura-600);
  border-color: var(--sakura-200);
  background: #fff;
  box-shadow: 0 12px 22px -18px rgba(197, 58, 100, .8);
}
.back:hover { transform: translateX(-2px); }
.fav:hover:not(:disabled) { transform: translateY(-1px); }
.back svg,
.fav svg { width: 15px; height: 15px; }

/* 收藏 / 点赞 靠右 */
.fav { margin-left: auto; }
.fav + .fav { margin-left: 0; }

.fav--on {
  color: var(--sakura-600);
  background: var(--sakura-50);
  border-color: var(--sakura-200);
}
.fav--like.fav--on {
  color: var(--sky-600);
  background: #f2f9fd;
  border-color: #cfe8f7;
}
.fav--pending { opacity: .6; pointer-events: none; }

/* ============ 文章卡 ============ */
.paper {
  position: relative;
  padding: 52px 58px 46px;
  border-radius: 22px;
  background: var(--porcelain);
  border: 1px solid var(--porcelain-line);
  box-shadow: var(--gloss), 0 1px 2px rgba(96, 62, 78, .03),
              0 30px 60px -44px rgba(96, 62, 78, .8);
  overflow: hidden;
}
/* 纸角一片淡樱，弱化的装饰 */
.paper::before {
  content: '';
  position: absolute;
  top: -70px;
  right: -70px;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(249, 116, 159, .1), transparent 68%);
  pointer-events: none;
}
.paper__head {
  position: relative;
  padding-bottom: 26px;
  border-bottom: 1px solid var(--line-soft);
}
.paper__cat {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: .1em;
  color: var(--sakura-700);
  background: var(--sakura-50);
  border: 1px solid var(--sakura-200);
  border-radius: 999px;
  padding: 4px 13px;
  margin-bottom: 18px;
  cursor: pointer;
  font-family: inherit;
  transition: background .25s, color .25s, transform .25s;
}
.paper__cat:hover {
  color: #fff;
  background: var(--sakura-500);
  border-color: transparent;
  transform: translateY(-1px);
}
.paper__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(24px, 3.4vw, 33px);
  line-height: 1.42;
  font-weight: 600;
  letter-spacing: .01em;
  color: var(--ink);
}
.paper__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  font-size: 12.5px;
  color: var(--faint);
}
.paper__author { color: var(--sakura-600); font-weight: 500; }
.paper__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--sakura-300);
  flex: none;
}

/* 正文：中文正文行高 1.9 左右最舒适，2.05 会显得散 */
.paper__body {
  position: relative;
  padding-top: 30px;
  font-size: 15.5px;
  line-height: 1.9;
  letter-spacing: .012em;
  color: var(--ink-soft);
}
.paper__body p {
  margin: 0 0 1.1em;
  text-align: justify;
  text-justify: inter-ideograph;
  /* 中文标点挤压，避免行首行尾出现孤立标点 */
  hanging-punctuation: allow-end;
}
.paper__body p:last-child { margin-bottom: 0; }
/**
 * 首段首字下沉。
 * 注意：正文常以「《书名》」开头，::first-letter 会把「《」当成首字放大，
 * 结果书名号与后面的字被拆开。用 ::first-letter 的 line-break 问题无法在 CSS 里规避，
 * 所以只在正文不以书名号/引号开头时生效（由模板上的 .paper__body--dropcap 控制）。
 */
.paper__body--dropcap > p:first-child::first-letter {
  float: left;
  font-family: var(--font-serif);
  font-size: 3.1em;
  line-height: .92;
  font-weight: 600;
  color: var(--sakura-600);
  padding: 4px 10px 0 0;
}

/* 文末标签 */
.paper__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 34px;
  padding-top: 24px;
  border-top: 1px solid var(--line-soft);
}
.rtag {
  border: 1px solid var(--sakura-100);
  background: #fff;
  color: var(--muted);
  font: inherit;
  font-size: 12.5px;
  padding: 5px 13px;
  border-radius: 999px;
  cursor: pointer;
  transition: color .25s, background .25s, border-color .25s, transform .25s var(--ease);
}
.rtag::before { content: '#'; margin-right: 2px; color: var(--sakura-300); }
.rtag:hover {
  color: var(--sakura-600);
  background: var(--sakura-50);
  border-color: var(--sakura-200);
  transform: translateY(-1px);
}

/* 未登录引导 */
.login-hint {
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}

/* ============ 相关文章 ============ */
.related__title {
  position: relative;
  margin: 0 0 16px;
  padding-left: 14px;
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: .04em;
  color: var(--ink);
}
.related__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 14px;
  border-radius: 3px;
  background: linear-gradient(180deg, var(--sakura-400), var(--sakura-600));
}
.related__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.relcard {
  padding: 20px 22px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, .78);
  border: 1px solid var(--line-soft);
  cursor: pointer;
  transition: transform .3s var(--ease), border-color .3s, box-shadow .3s, background .3s;
}
.relcard:hover {
  transform: translateY(-4px);
  border-color: var(--sakura-200);
  background: #fff;
  box-shadow: 0 24px 40px -32px rgba(120, 60, 84, .9);
}
.relcard:focus-visible {
  outline: 2px solid var(--sakura-300);
  outline-offset: 2px;
}
.relcard__title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--ink);
}
.relcard__summary {
  margin: 8px 0 0;
  font-size: 12.8px;
  line-height: 1.7;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.relcard__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 11.5px;
  color: var(--faint);
}

/* ============ 骨架 / 状态 ============ */
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 46px 52px;
  border-radius: 26px;
  background: rgba(255, 255, 255, .8);
  border: 1px solid var(--line-soft);
}
.sk-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(100deg, var(--sakura-50) 20%, var(--sakura-100) 40%, var(--sakura-50) 60%);
  background-size: 220% 100%;
  animation: shimmer 1.5s linear infinite;
}
.sk-line--cat { width: 64px; height: 22px; border-radius: 999px; }
.sk-line--title { width: 72%; height: 26px; }
.sk-line--meta { width: 40%; height: 12px; }
.sk-line--short { width: 55%; }
@keyframes shimmer {
  from { background-position: 120% 0; }
  to   { background-position: -120% 0; }
}
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 70px 24px;
  border-radius: 24px;
  border: 1px dashed var(--sakura-200);
  background: rgba(255, 255, 255, .6);
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}
.state svg { width: 38px; height: 38px; color: var(--sakura-300); }
.state--error svg { color: var(--sakura-400); }
.state__btn {
  border: 0;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 22px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 14px 26px -18px rgba(232, 84, 127, .9);
  transition: transform .25s;
}
.state__btn:hover { transform: translateY(-2px); }

/* ============ 响应式 ============ */
@media (max-width: 640px) {
  .detail { padding: 14px 14px 46px; gap: 14px; }
  .paper { padding: 28px 22px 26px; border-radius: 20px; }
  .paper__body { font-size: 14.8px; line-height: 1.95; }
  .related__grid { grid-template-columns: 1fr; }
  .skeleton { padding: 28px 22px; }
  .fav span { display: none; }
  .fav { padding: 0 13px; }
}

/* ---------- 书店试读墙 ---------- */
.paywall { position: relative; margin: 26px 0 6px; }
.paywall__fade {
  height: 62px;
  margin: -62px 0 0;
  background: linear-gradient(180deg, rgba(255, 253, 253, 0), #fffdfd 82%);
  pointer-events: none;
}
.paywall__card {
  position: relative;
  margin-top: 0;
  padding: 24px 22px 20px;
  border-radius: 18px;
  text-align: center;
  background:
    radial-gradient(120% 100% at 50% 0%, rgba(255, 246, 250, .95), #fffafc 60%),
    var(--porcelain);
  border: 1px solid var(--sakura-200);
  box-shadow: 0 22px 44px -30px rgba(197, 58, 100, .55);
}
.paywall__tag {
  font-size: 9px;
  letter-spacing: .3em;
  color: var(--sakura-500);
}
.paywall__card h3 {
  margin: 10px 0 8px;
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: .04em;
  color: var(--ink);
}
.paywall__lede {
  margin: 0 auto 18px;
  max-width: 420px;
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--muted);
}
.paywall__actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.paywall__buy {
  height: 42px;
  padding: 0 22px;
  border: 0;
  border-radius: 13px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: .04em;
  color: #fff;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  box-shadow: 0 16px 30px -18px rgba(232, 84, 127, 1);
  transition: transform .25s var(--ease), box-shadow .25s;
}
.paywall__buy:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 20px 34px -18px rgba(232, 84, 127, 1); }
.paywall__buy:disabled {
  color: var(--muted);
  background: var(--paper-3);
  box-shadow: none;
  cursor: default;
}
.paywall__ghost {
  height: 42px;
  padding: 0 18px;
  border-radius: 13px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--muted);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
}
.paywall__ghost:hover { color: var(--sakura-700); border-color: var(--sakura-300); }
.paywall__wallet { margin: 14px 0 0; font-size: 11px; color: var(--faint); letter-spacing: .03em; }
.paywall__wallet b { color: var(--gold); font-variant-numeric: tabular-nums; }
</style>
