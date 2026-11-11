<template>
  <!-- ============ 骨架屏：加载中占位，避免页面「白一下」 ============ -->
  <div v-if="variant === 'skeleton'" class="sk" :class="'sk--' + shape" aria-busy="true">
    <template v-if="shape === 'card'">
      <div class="sk__line sk__line--title"></div>
      <div class="sk__line"></div>
      <div class="sk__line sk__line--short"></div>
      <div class="sk__foot">
        <span class="sk__chip"></span>
        <span class="sk__chip sk__chip--sm"></span>
      </div>
    </template>
    <template v-else-if="shape === 'paper'">
      <div class="sk__line sk__line--title"></div>
      <div class="sk__line"></div>
      <div class="sk__line"></div>
      <div class="sk__line"></div>
      <div class="sk__line sk__line--short"></div>
      <div class="sk__line"></div>
      <div class="sk__line sk__line--short"></div>
    </template>
    <template v-else>
      <div class="sk__line"></div>
      <div class="sk__line sk__line--short"></div>
    </template>
  </div>

  <!-- ============ 空状态：有图标、有说明、有行动按钮 ============ -->
  <div v-else-if="variant === 'empty'" class="state">
    <div class="state__icon" aria-hidden="true">{{ icon }}</div>
    <p class="state__title">{{ title }}</p>
    <p v-if="desc" class="state__desc">{{ desc }}</p>
    <button v-if="actionText" class="state__btn" type="button" @click="$emit('action')">
      {{ actionText }}
    </button>
  </div>

  <!-- ============ 错误状态：说明 + 重试 ============ -->
  <div v-else class="state state--error">
    <div class="state__icon" aria-hidden="true">!</div>
    <p class="state__title">{{ title || '加载失败' }}</p>
    <p v-if="desc" class="state__desc">{{ desc }}</p>
    <button class="state__btn" type="button" @click="$emit('action')">重新加载</button>
  </div>
</template>

<script setup>
/**
 * 三合一状态组件：骨架屏 / 空状态 / 错误重试。
 *
 * variant: skeleton（加载中占位，shape 可选 card / paper / line）
 *          empty（空状态，可配 icon / title / desc / actionText）
 *          error（加载失败，内置「重新加载」按钮）
 * 三个分支都以 @action 回调向外抛出交互事件。
 */
defineProps({
  variant: { type: String, default: 'skeleton' }, // skeleton | empty | error
  shape: { type: String, default: 'card' },       // skeleton 专用：card | paper | line
  icon: { type: String, default: '☆' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  actionText: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<style scoped>
/* ---------- 骨架屏：樱花纸感的浅粉流光 ---------- */
.sk {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, .7);
  display: grid;
  gap: 10px;
}

.sk--paper { gap: 14px; padding: 22px; }

.sk__line,
.sk__chip {
  background: linear-gradient(
    100deg,
    var(--sakura-50) 20%,
    var(--sakura-100) 38%,
    var(--sakura-50) 58%
  );
  background-size: 220% 100%;
  animation: skShine 1.5s linear infinite;
}

.sk__line {
  height: 12px;
  border-radius: 999px;
}

.sk__line--title { height: 18px; width: 62%; }
.sk__line--short { width: 42%; }

.sk__foot { display: flex; gap: 8px; margin-top: 4px; }
.sk__chip { height: 20px; width: 64px; border-radius: 999px; }
.sk__chip--sm { width: 40px; }

@keyframes skShine {
  from { background-position: 120% 0; }
  to   { background-position: -120% 0; }
}

/* ---------- 空 / 错误状态 ---------- */
.state {
  padding: 44px 24px;
  border-radius: 20px;
  border: 1px dashed var(--sakura-200);
  background: rgba(255, 255, 255, .55);
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 10px;
}

.state__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 19px;
  color: var(--sakura-500);
  background: var(--sakura-50);
  border: 1px solid var(--sakura-100);
}

.state--error .state__icon {
  color: var(--sakura-700);
  background: var(--sakura-100);
  border-color: var(--sakura-200);
  font-weight: 700;
}

.state__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: .03em;
  color: var(--ink);
}
.state__desc {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  max-width: 42ch;
  line-height: 1.7;
}

.state__btn {
  margin-top: 6px;
  padding: 9px 20px;
  border-radius: 999px;
  border: 0;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 14px 26px -18px rgba(232, 84, 127, .9);
  transition: transform .2s var(--ease, ease), box-shadow .2s;
}
.state__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 32px -20px rgba(232, 84, 127, 1);
}

/* 动效关闭态由 <html class="no-motion"> 驱动，见 composables/useMotion.js */
html.no-motion .sk__line,
html.no-motion .sk__chip { animation: none; }
</style>
