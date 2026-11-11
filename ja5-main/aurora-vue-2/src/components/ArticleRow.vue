<template>
  <!-- 内容条目：小封面 + 序号 + 标题 + 摘要 + 元信息。首页内容流用 -->
  <article
    class="row"
    :class="{ 'row--fav': favorited }"
    tabindex="0"
    role="button"
    :aria-label="'阅读文章：' + article.title"
    @click="$emit('open', article.id)"
    @keydown.enter="$emit('open', article.id)"
  >
    <!-- 缩略图：封面按 id 稳定取图，加载失败则退回樱色渐变底 -->
    <div class="row__thumb" :style="{ backgroundImage: 'url(' + cover + ')' }" aria-hidden="true">
      <span class="row__thumb-veil"></span>
    </div>

    <div class="row__body">
      <div class="row__head">
        <span class="row__no" aria-hidden="true">{{ indexLabel }}</span>
        <h3 class="row__title">{{ article.title }}</h3>
      </div>
      <p v-if="article.summary" class="row__sum">{{ article.summary }}</p>
      <div class="row__meta">
        <button
          v-if="article.category"
          class="row__cat"
          type="button"
          @click.stop="$emit('open-category', article.categoryId, article.category)"
        >{{ article.category }}</button>
        <span class="row__dim">{{ shortDate(article.createdAt) }}</span>
        <template v-if="article.minutes">
          <i class="row__dot"></i>
          <span class="row__dim">约 {{ article.minutes }} 分钟</span>
        </template>
        <template v-if="article.tags && article.tags.length">
          <i class="row__dot"></i>
          <button
            v-for="t in article.tags.slice(0, 2)"
            :key="t"
            class="row__tag"
            type="button"
            @click.stop="$emit('open-tag', t)"
          >{{ t }}</button>
        </template>
      </div>
    </div>

    <div class="row__side">
      <span class="row__views" :title="article.views + ' 次阅读'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
        {{ article.views }}
      </span>

      <button
        v-if="showFav"
        class="row__fav"
        :class="{ 'row__fav--on': favorited }"
        type="button"
        :title="favorited ? '取消书签' : '加入书签'"
        :aria-label="favorited ? '取消书签' : '加入书签'"
        @click.stop="$emit('toggle-fav', article)"
      >
        <svg viewBox="0 0 24 24" :fill="favorited ? 'currentColor' : 'none'" stroke="currentColor"
             stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z" />
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { coverFor } from '../utils/cover'

const props = defineProps({
  article: { type: Object, required: true },
  /** 序号：从 1 开始，渲染成 01 / 02 */
  index: { type: Number, default: 1 },
  favorited: { type: Boolean, default: false },
  showFav: { type: Boolean, default: false }
})
defineEmits(['open', 'open-category', 'open-tag', 'toggle-fav'])

const indexLabel = computed(() => String(props.index).padStart(2, '0'))
const cover = computed(() => coverFor(props.article.id))

/** createdAt 形如 2026-10-22 00:00:00，列表里只需要日期部分 */
function shortDate (v) {
  const s = String(v || '')
  return s.length >= 10 ? s.slice(5, 10).replace('-', '/') : s
}
</script>

<style scoped>
.row {
  position: relative;
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 14px;
  border-radius: 18px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background .38s var(--ease), border-color .38s var(--ease),
              transform .38s var(--ease), box-shadow .38s var(--ease);
}
/* 悬停：白瓷底浮起 + 左侧樱色发丝线，不用整块粉色填充 */
.row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 22%;
  bottom: 22%;
  width: 2px;
  border-radius: 2px;
  background: linear-gradient(180deg, transparent, var(--sakura-400), transparent);
  opacity: 0;
  transform: scaleY(.4);
  transition: opacity .38s var(--ease), transform .38s var(--ease);
}
.row:hover,
.row:focus-visible {
  background: var(--porcelain);
  border-color: var(--porcelain-line);
  box-shadow: var(--gloss), var(--lift-hover);
  transform: translateX(4px);
  outline: none;
}
.row:hover::before,
.row:focus-visible::before {
  opacity: 1;
  transform: scaleY(1);
}

/* 缩略图 */
.row__thumb {
  position: relative;
  width: 116px;
  height: 76px;
  border-radius: 14px;
  background-color: var(--sakura-100);
  background-size: cover;
  background-position: center;
  overflow: hidden;
  box-shadow: 0 8px 20px -14px rgba(147, 81, 108, .8);
}
.row__thumb-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 240, 246, .28), transparent 60%);
  transition: opacity .4s;
}
.row:hover .row__thumb-veil { opacity: 0; }

/* 正文 */
.row__body { min-width: 0; }
.row__head { display: flex; align-items: baseline; gap: 10px; }
.row__no {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .08em;
  font-variant-numeric: tabular-nums;
  color: var(--sakura-300);
  transition: color .3s;
}
.row:hover .row__no { color: var(--sakura-500); }
.row__title {
  font-family: var(--font-serif);
  font-size: 16.5px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: .01em;
  color: var(--ink);
  transition: color .28s;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.row:hover .row__title { color: var(--sakura-700); }
.row__sum {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--faint);
}
.row__cat {
  border: 1px solid var(--sakura-200);
  background: var(--sakura-50);
  color: var(--sakura-700);
  font: inherit;
  font-size: 10.5px;
  padding: 2px 9px;
  border-radius: 999px;
  cursor: pointer;
  transition: background .25s, border-color .25s, color .25s;
}
.row__cat:hover { background: var(--sakura-500); border-color: transparent; color: #fff; }
.row__dim { font-weight: 300; letter-spacing: .02em; }
.row__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--sakura-300);
  flex: none;
}
.row__tag {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 11.5px;
  color: var(--muted);
  cursor: pointer;
  transition: color .25s;
}
.row__tag::before { content: "#"; opacity: .55; margin-right: 1px; }
.row__tag:hover { color: var(--sky-600); }

/* 右侧 */
.row__side {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.row__views {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--faint);
  white-space: nowrap;
}
.row__views svg { width: 13px; height: 13px; opacity: .65; }
.row__fav {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid transparent;
  background: none;
  color: var(--faint);
  cursor: pointer;
  transition: color .25s, background .25s, border-color .25s, transform .25s var(--ease);
}
.row__fav svg { width: 15px; height: 15px; }
.row__fav:hover {
  color: var(--sakura-500);
  background: var(--sakura-100);
  border-color: var(--sakura-200);
  transform: translateY(-1px) scale(1.06);
}
.row__fav--on { color: var(--sakura-500); }
.row--fav .row__title { color: var(--sakura-700); }

@media (max-width: 820px) {
  .row { grid-template-columns: 84px minmax(0, 1fr) auto; gap: 12px; padding: 10px; }
  .row__thumb { width: 84px; height: 62px; border-radius: 12px; }
  .row__title { font-size: 15px; }
  .row__sum { display: none; }
  .row__no { display: none; }
}
@media (max-width: 520px) {
  .row { grid-template-columns: 68px minmax(0, 1fr) auto; gap: 10px; }
  .row__thumb { width: 68px; height: 54px; }
  .row__meta { margin-top: 6px; gap: 5px; font-size: 11px; }
  .row__views { display: none; }
}

/* 动效关闭态由 <html class="no-motion"> 驱动，见 composables/useMotion.js */
html.no-motion .row { transition: none; }
</style>
