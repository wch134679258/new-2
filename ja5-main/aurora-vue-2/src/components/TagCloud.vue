<template>
  <!-- 标签云：按文章数分四档字号，点一下即按该标签筛选 -->
  <div class="cloud">
    <button
      v-for="t in items"
      :key="t.id"
      class="cloud__tag"
      :class="[
        'cloud__tag--s' + t.size,
        { 'cloud__tag--on': activeId === t.id }
      ]"
      type="button"
      :title="tagTitle(t)"
      @click="$emit('select', t)"
    >{{ t.name }}<sup v-if="showCount">{{ t.articleCount }}</sup></button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** [{ id, name, articleCount, categoryName }] */
  tags: { type: Array, default: () => [] },
  activeId: { type: [Number, String], default: null },
  showCount: { type: Boolean, default: false },
  /** 最多展示多少个（按文章数倒序取） */
  limit: { type: Number, default: 22 }
})
defineEmits(['select'])

/**
 * 字号分档：以当前标签集的最大文章数为基准分四档。
 * 直接用绝对数值不靠谱——数据少时全都会挤进同一档，
 * 用相对比例才能保证「大标签大字号」的层次始终存在。
 */
const items = computed(() => {
  const list = (props.tags || []).slice().sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0))
  const max = list.reduce((m, t) => Math.max(m, t.articleCount || 0), 0) || 1
  return list.slice(0, props.limit).map((t) => {
    const r = (t.articleCount || 0) / max
    const size = r >= 0.8 ? 4 : r >= 0.55 ? 3 : r >= 0.3 ? 2 : 1
    return { ...t, size }
  })
})

function tagTitle (t) {
  const parts = []
  if (t.categoryName) parts.push(t.categoryName)
  parts.push(`${t.articleCount || 0} 篇文章`)
  return parts.join(' · ')
}
</script>

<style scoped>
.cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 6px;
}
.cloud__tag {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  border: 1px solid transparent;
  background: none;
  padding: 4px 8px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  font-weight: 400;
  line-height: 1.3;
  color: var(--muted);
  transition: color .25s, background .25s, border-color .25s, transform .25s var(--ease);
}
.cloud__tag::before {
  content: "#";
  opacity: .38;
  margin-right: 1px;
  font-size: .86em;
  color: var(--sakura-400);
}
.cloud__tag sup {
  font-size: 9px;
  opacity: .6;
  transform: translateY(-1px);
}
.cloud__tag:hover {
  color: var(--sakura-700);
  background: var(--sakura-100);
  border-color: var(--sakura-200);
  transform: translateY(-1px);
}
.cloud__tag--on {
  color: #fff;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-400));
  border-color: transparent;
  box-shadow: 0 8px 18px -10px rgba(232, 84, 127, .95);
}
.cloud__tag--on::before { color: rgba(255, 255, 255, .75); }

/* 四档字号 + 浓度：越大越深，形成视觉重心 */
.cloud__tag--s1 { font-size: 12px; color: var(--faint); }
.cloud__tag--s2 { font-size: 13px; color: var(--muted); }
.cloud__tag--s3 { font-size: 14.5px; color: var(--ink-soft); }
.cloud__tag--s4 { font-size: 16px; font-weight: 600; color: var(--ink); }
.cloud__tag--s3::before,
.cloud__tag--s4::before { opacity: .66; }

/* 动效关闭态由 <html class="no-motion"> 驱动，见 composables/useMotion.js */
html.no-motion .cloud__tag { transition: none; }
</style>
