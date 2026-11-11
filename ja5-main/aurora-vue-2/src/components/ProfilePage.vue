<template>
  <div class="profile">
    <SiteNav :user="user" active="profile" @go="onGo" @logout="$emit('logout')" />

    <main class="subpage profile__main">
      <header class="subhead">
        <span class="subhead__tag">Profile</span>
        <h1>我的花笺</h1>
        <p>读过的、收起的、玩过的，都记在这里。</p>
      </header>

      <!-- ============ 个人信息卡 ============ -->
      <section class="pcard">
        <StateBlock v-if="loading" variant="skeleton" shape="line" />
        <StateBlock
          v-else-if="error"
          variant="error"
          title="个人资料加载失败"
          :desc="error"
          @action="load"
        />
        <template v-else>
          <div class="pcard__head">
            <div class="pcard__avatar">{{ avatarText }}</div>
            <div class="pcard__id">
              <h2 class="pcard__name">{{ profile.user.name }}</h2>
              <p class="pcard__sub">
                ID · {{ profile.user.id }}
                <span v-if="profile.user.joinedAt"> · 加入于 {{ profile.user.joinedAt }}</span>
              </p>
            </div>
            <button class="pcard__logout" type="button" @click="$emit('logout')">退出登录</button>
          </div>

          <!-- 钱包：小镇里的金币、体力与藏书 -->
          <div class="purse">
            <span class="purse__item">
              <i class="purse__coin">¥</i><b>{{ wallet.money }}</b><em>金币</em>
            </span>
            <span class="purse__item">
              <b>{{ wallet.energy }}</b><em>/{{ wallet.energyMax }} 体力</em>
            </span>
            <span class="purse__item">
              <b>{{ wallet.ownedCount }}</b><em>本藏书</em>
            </span>
            <button class="purse__go" type="button" @click="$emit('navigate', 'home')">逛书店 →</button>
            <button class="purse__go purse__go--ghost" type="button" @click="$emit('navigate', 'store')">去打工</button>
          </div>

          <!-- 统计 -->
          <div class="stats">
            <button class="stat" type="button" @click="$emit('navigate', 'favorites')">
              <b>{{ profile.stats.favorites }}</b>
              <span>收进书签</span>
            </button>
            <div class="stat">
              <b>{{ profile.stats.history }}</b>
              <span>读过</span>
            </div>
            <div class="stat">
              <b>{{ profile.stats.likes }}</b>
              <span>点赞</span>
            </div>
            <button class="stat" type="button" @click="$emit('navigate', 'gamehome')">
              <b>{{ profile.game.best }}</b>
              <span>游戏最高分</span>
            </button>
          </div>

          <p class="pcard__game" v-if="profile.game.playCount > 0">
            花瓣贪吃蛇：玩过 {{ profile.game.playCount }} 局，当前排名 第 {{ profile.game.rank }} 名
          </p>
          <p class="pcard__game pcard__game--muted" v-else>
            还没有游戏记录，去接一捧樱瓣吧 →
            <button class="pcard__link" type="button" @click="$emit('navigate', 'gamehome')">回家开机</button>
          </p>
        </template>
      </section>

      <!-- ============ 浏览历史 ============ -->
      <section class="hist">
        <div class="hist__head">
          <h2 class="hist__title">阅读足迹</h2>
          <button
            v-if="history.length && !histLoading"
            class="hist__clear"
            type="button"
            :disabled="clearing"
            @click="clearAll"
          >
            {{ clearing ? '清空中…' : '清空' }}
          </button>
        </div>

        <div v-if="histLoading" class="hist__list">
          <StateBlock v-for="i in 3" :key="'sk' + i" variant="skeleton" shape="card" />
        </div>

        <StateBlock
          v-else-if="histError"
          variant="error"
          title="浏览历史加载失败"
          :desc="histError"
          @action="loadHistory"
        />

        <StateBlock
          v-else-if="!history.length"
          variant="empty"
          icon="✿"
          title="还没有留下足迹"
          desc="打开任意一篇文章，风会把花瓣留在这一页。"
          action-text="去首页看看"
          @action="$emit('navigate', 'home')"
        />

        <template v-else>
          <div class="hist__list">
            <article v-for="h in history" :key="h.id" class="hcard">
              <div class="hcard__body" @click="$emit('open-article', h.id)">
                <h3 class="hcard__title">{{ h.title }}</h3>
                <p class="hcard__summary">{{ h.summary }}</p>
                <div class="hcard__foot">
                  <span class="hcard__cat">{{ h.category }}</span>
                  <span class="hcard__dot">·</span>
                  <span>{{ h.author }}</span>
                  <span class="hcard__dot">·</span>
                  <span>浏览于 {{ h.viewedAt }}</span>
                </div>
              </div>
              <button
                class="hcard__del"
                type="button"
                title="删除这条记录"
                @click="removeOne(h)"
              >×</button>
            </article>
          </div>

          <!-- 分页 -->
          <div v-if="histPages > 1" class="pager">
            <button class="pager__btn" :disabled="histPage <= 1" @click="goPage(histPage - 1)">上一页</button>
            <span class="pager__num">{{ histPage }} / {{ histPages }}</span>
            <button class="pager__btn" :disabled="histPage >= histPages" @click="goPage(histPage + 1)">下一页</button>
          </div>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SiteNav from './SiteNav.vue'
import StateBlock from './StateBlocks.vue'
import { fetchProfile } from '../api/profile'
import { fetchHistory, removeHistory, clearHistory } from '../api/history'
import { toast } from '../composables/useToast'
import { useEconomy } from '../composables/useEconomy'

const props = defineProps({
  user: { type: Object, default: null }
})
const emit = defineEmits(['navigate', 'open-article', 'logout'])

const emptyProfile = {
  user: { id: null, name: '探险家', joinedAt: '' },
  stats: { favorites: 0, history: 0, likes: 0 },
  game: { best: 0, rank: 0, playCount: 0 }
}

const profile = ref(emptyProfile)

// 小镇钱包：金币 / 体力 / 藏书（和个人数据一起展示）
const { wallet, refresh: refreshWallet, startTicker } = useEconomy()

// 小镇钱包：金币 / 体力 / 藏书（和个人数据一起展示）
const loading = ref(false)
const error = ref('')

const history = ref([])
const histLoading = ref(false)
const histError = ref('')
const histPage = ref(1)
const histPages = ref(1)
const clearing = ref(false)

const avatarText = computed(() => {
  const n = (profile.value.user && profile.value.user.name) || 'A'
  return n.slice(0, 1).toUpperCase()
})

async function load () {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchProfile()
    profile.value = {
      user: (data && data.user) || emptyProfile.user,
      stats: (data && data.stats) || emptyProfile.stats,
      game: (data && data.game) || emptyProfile.game
    }
  } catch (e) {
    profile.value = emptyProfile
    error.value = (e && e.message) || '个人资料加载失败'
  } finally {
    loading.value = false
  }
}

async function loadHistory (page = histPage.value) {
  histLoading.value = true
  histError.value = ''
  try {
    const res = await fetchHistory({ page, size: 6 })
    history.value = (res && res.list) || []
    histPage.value = (res && res.page) || 1
    histPages.value = (res && res.pages) || 1
  } catch (e) {
    history.value = []
    histError.value = (e && e.message) || '浏览历史加载失败'
  } finally {
    histLoading.value = false
  }
}

function goPage (p) {
  if (p < 1 || p > histPages.value) return
  loadHistory(p)
}

async function removeOne (h) {
  try {
    await removeHistory(h.id)
    history.value = history.value.filter((x) => x.id !== h.id)
    profile.value.stats.history = Math.max(0, (profile.value.stats.history || 0) - 1)
    toast.success('已删除这条记录')
    // 删完当前页没内容了，回退一页继续看
    if (!history.value.length && histPage.value > 1) {
      goPage(histPage.value - 1)
    }
  } catch (e) {
    toast.error((e && e.message) || '删除失败，请重试')
  }
}

async function clearAll () {
  clearing.value = true
  try {
    const res = await clearHistory()
    history.value = []
    histPage.value = 1
    histPages.value = 1
    profile.value.stats.history = 0
    toast.success((res && res.message) || '已清空浏览历史')
  } catch (e) {
    toast.error((e && e.message) || '清空失败，请重试')
  } finally {
    clearing.value = false
  }
}

/** 页脚 / 导航跳转统一走 navigate，由 App 决定目标视图 */
function onGo (key) {
  emit('navigate', key)
}

onMounted(() => {
  refreshWallet()
  startTicker()
  load()
  loadHistory(1)
})
</script>

<style scoped>
.profile {
  position: relative;
  z-index: 2;
  min-height: 100vh;
}

.profile__main {
  max-width: 1000px;
  display: grid;
  gap: 22px;
}

/* ---------- 个人信息卡 ---------- */
.pcard {
  padding: 24px;
  border-radius: 22px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, .78);
  box-shadow: 0 22px 46px -38px rgba(120, 60, 84, .8);
  backdrop-filter: blur(12px);
}

.pcard__head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.pcard__avatar {
  position: relative;
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(140deg, var(--sakura-400), var(--sakura-600));
  box-shadow: 0 16px 28px -16px rgba(232, 84, 127, .9), inset 0 1px 0 rgba(255, 255, 255, .5);
}

.pcard__id { min-width: 0; }
.pcard__name {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: .03em;
  color: var(--ink);
}
.pcard__sub { margin: 5px 0 0; font-size: 12.5px; color: var(--muted); }

.pcard__logout {
  margin-left: auto;
  height: 36px;
  padding: 0 17px;
  border-radius: 999px;
  border: 1px solid var(--sakura-200);
  background: #fff;
  color: var(--sakura-600);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: color .25s, border-color .25s, background .25s, transform .25s;
}
.pcard__logout:hover {
  color: var(--sakura-700);
  border-color: var(--sakura-400);
  background: var(--sakura-50);
  transform: translateY(-1px);
}

.purse {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(120deg, #fffaf2, #fff5f8);
  border: 1px solid rgba(240, 181, 86, .26);
}
.purse__item { display: inline-flex; align-items: baseline; gap: 5px; }
.purse__item b {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.purse__item em { font-style: normal; font-size: 10.5px; color: var(--faint); letter-spacing: .04em; }
.purse__coin {
  width: 16px;
  height: 16px;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  font-style: normal;
  font-size: 9px;
  color: #7a5a24;
  background: radial-gradient(circle at 34% 28%, #fff4d4, #f0c976 58%, #d9a94f);
  align-self: center;
}
.purse__go {
  margin-left: auto;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  cursor: pointer;
  font: inherit;
  font-size: 11.5px;
  color: #fff;
  background: linear-gradient(120deg, var(--sakura-500), var(--sakura-600));
  box-shadow: 0 10px 20px -14px rgba(232, 84, 127, .95);
}
.purse__go--ghost {
  margin-left: 0;
  color: var(--sakura-700);
  background: var(--sakura-50);
  border: 1px solid var(--sakura-200);
  box-shadow: none;
}
.purse__go:hover { transform: translateY(-1px); }

.stats {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0;
  border: 1px solid var(--porcelain-line);
  border-radius: 16px;
  background: linear-gradient(170deg, #fff, rgba(253, 247, 248, .86));
  box-shadow: var(--gloss), inset 0 0 0 1px rgba(255, 255, 255, .6);
  overflow: hidden;
}

/* 四格连排：用发丝线分隔，比四张独立小卡更安静 */
.stat {
  position: relative;
  padding: 17px 18px;
  border: 0;
  border-left: 1px solid var(--line-soft);
  background: none;
  display: grid;
  gap: 6px;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: default;
  transition: background .26s var(--ease);
}
.stat:first-child { border-left: 0; }
button.stat { cursor: pointer; }
button.stat:hover { background: rgba(255, 238, 244, .55); }
button.stat:hover::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--sakura-400), transparent);
}
.stat b {
  font-family: var(--font-serif);
  font-size: 25px;
  font-weight: 600;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.stat span { font-size: 11px; letter-spacing: .12em; color: var(--faint); }

.pcard__game {
  margin: 16px 0 0;
  font-size: 12.5px;
  color: var(--muted);
}
.pcard__game--muted { opacity: .95; }
.pcard__link {
  border: 0;
  background: none;
  font: inherit;
  color: var(--sakura-600);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ---------- 浏览历史 ---------- */
.hist {
  padding: 22px;
  border-radius: 22px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, .7);
  box-shadow: 0 20px 44px -38px rgba(120, 60, 84, .7);
}

.hist__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-soft);
}
.hist__title {
  position: relative;
  margin: 0;
  padding-left: 14px;
  font-family: var(--font-serif);
  font-size: 16.5px;
  font-weight: 600;
  letter-spacing: .04em;
  color: var(--ink);
}
.hist__title::before {
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
.hist__clear {
  margin-left: auto;
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--sakura-200);
  background: #fff;
  color: var(--muted);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: color .25s, border-color .25s, background .25s;
}
.hist__clear:hover:not(:disabled) {
  color: var(--sakura-600);
  border-color: var(--sakura-400);
  background: var(--sakura-50);
}
.hist__clear:disabled { opacity: .5; cursor: not-allowed; }

.hist__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.hcard {
  position: relative;
  padding: 15px 17px;
  border-radius: 16px;
  border: 1px solid var(--line-soft);
  background: #fff;
  transition: transform .25s var(--ease, ease), border-color .25s, box-shadow .25s;
}
.hcard:hover {
  transform: translateY(-3px);
  border-color: var(--sakura-200);
  box-shadow: 0 20px 34px -28px rgba(120, 60, 84, .9);
}

.hcard__body { cursor: pointer; }
.hcard__title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.45;
  padding-right: 24px;
  color: var(--ink);
}
.hcard__summary {
  margin: 7px 0 0;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hcard__foot {
  margin-top: 11px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  color: var(--faint);
}
.hcard__cat {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--sakura-50);
  border: 1px solid var(--sakura-100);
  color: var(--sakura-600);
}
.hcard__dot { opacity: .6; color: var(--sakura-300); }

.hcard__del {
  position: absolute;
  top: 11px;
  right: 11px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: var(--paper-2);
  color: var(--faint);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition: color .2s, background .2s, border-color .2s;
}
.hcard__del:hover {
  color: var(--sakura-700);
  background: var(--sakura-100);
  border-color: var(--sakura-200);
}

/* ---------- 分页 ---------- */
.pager {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.pager__btn {
  height: 34px;
  padding: 0 17px;
  border-radius: 999px;
  border: 1px solid var(--sakura-200);
  background: #fff;
  color: var(--sakura-600);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background .25s, border-color .25s, transform .25s;
}
.pager__btn:hover:not(:disabled) {
  background: var(--sakura-50);
  border-color: var(--sakura-300);
  transform: translateY(-1px);
}
.pager__btn:disabled { opacity: .45; cursor: not-allowed; }
.pager__num { font-size: 13px; color: var(--muted); }

@media (max-width: 640px) {
  .pcard__logout { display: none; }
  .pcard__name { font-size: 18px; }
}
</style>
