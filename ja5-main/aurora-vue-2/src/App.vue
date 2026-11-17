<template>
  <!-- 序章页与小镇自带画面，不叠站内的天空与花瓣 -->
  <SakuraBackground v-if="!bareStage" :night="night" />
  <div class="grain"></div>
  <PetalField v-if="!bareStage" :density="night ? 1 : 0.85" :opacity="night ? 1 : 0.88" />

  <!-- 全局轻提示 -->
  <ToastHost />

  <!-- 登录 / 注册页 -->
  <main v-if="view === 'auth'" class="stage">
    <header class="stage__brand">
      <span class="stage__mark"></span>
      <span class="stage__name">樱见</span>
      <span class="stage__en">SAKURA NOTE</span>
    </header>

    <section class="card" ref="card" @pointermove="onMove" @pointerleave="onLeave">
      <div class="card__spin"></div>
      <div class="card__fill"></div>
      <div class="card__spot" ref="spot"></div>

      <div class="card__inner">
        <BrandPanel />
        <AuthPanel ref="authPanel" @success="onSuccess" />
      </div>

      <SuccessOverlay :show="showDone" :title="doneTitle" :sub="doneSub" @reset="onReset" />
    </section>

    <p class="stage__foot">
      春风穿过鸟居，樱瓣落在书页上 —— 欢迎回到这里。
    </p>
  </main>

  <!-- 后台管理登录页：仅登录，不提供注册入口 -->
  <main v-else-if="view === 'admin-login'" class="stage">
    <header class="stage__brand">
      <span class="stage__mark"></span>
      <span class="stage__name">樱见</span>
      <span class="stage__en">SAKURA NOTE</span>
    </header>

    <section class="card" ref="card" @pointermove="onMove" @pointerleave="onLeave">
      <div class="card__spin"></div>
      <div class="card__fill"></div>
      <div class="card__spot" ref="spot"></div>
      <div class="card__inner">
        <BrandPanel />
        <AdminLoginPanel @success="onAdminSuccess" @back="goTown()" />
      </div>
    </section>

    <p class="stage__foot">月色落在书页上 —— 静候每一位守站人。</p>
  </main>

  <!-- 后台管理主界面 -->
  <AdminConsole
    v-else-if="view === 'admin'"
    :user="user"
    @back="goTown()"
    @logout="doLogout"
  />

  <!-- 序章页：登录之后、进小镇之前的一屏 -->
  <TownEntry
    v-else-if="view === 'entry'"
    :user="user"
    @enter="goTown()"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <!-- 新的默认首页：樱花小镇 -->
  <SakuraTown
    v-else-if="view === 'town'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <!-- 后山：日常地图的延伸，巨樱在最深处 -->
  <BackHill
    v-else-if="view === 'backhill'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
    @enter-realm="goRealm()"
  />

  <!-- 樱之异境：从后山巨樱的雾里进去的副本 -->
  <Dungeon
    v-else-if="view === 'dungeon'"
    @exit-realm="onExitRealm"
    @navigate="onNavigate"
  />

  <!-- 商店街三间小店：咖啡馆 / 甜品屋 / 花店，共用 ShopPage -->
  <ShopPage
    v-else-if="view === 'cafe' || view === 'sweet' || view === 'flower'"
    :user="user"
    :shop-key="view"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <!-- 樱花学校：黑板课程表 + 图书角 -->
  <SchoolPage
    v-else-if="view === 'school'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <!-- 樱花车站：发车牌 + 时刻表 + 取车票 -->
  <StationPage
    v-else-if="view === 'station'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <!-- 书店：原「手记馆」的文章列表，改成可以买书的书架 -->
  <BookstorePage
    v-else-if="view === 'home'"
    :user="user"
    @navigate="onNavigate"
    @open-article="openArticle"
    @logout="doLogout"
    @need-login="goAuth"
  />

  <!-- 家：小游戏搬进书桌的笔记本，床可以睡觉回体力 -->
  <HomeRoomPage
    v-else-if="view === 'gamehome'"
    :user="user"
    @navigate="onNavigate"
    @open-article="openArticle"
    @logout="doLogout"
  />

  <!-- 便利店：打工赚金币 -->
  <ConvenienceStorePage
    v-else-if="view === 'store'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <!-- 健身房：花金币练体力上限 -->
  <GymPage
    v-else-if="view === 'gym'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <!-- 公园：长椅歇脚 + 路边贩卖机 -->
  <ParkPage
    v-else-if="view === 'park'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <ArticleDetail
    v-else-if="view === 'article'"
    :article-id="articleId"
    :user="user"
    @back="goHome()"
    @open-article="openArticle"
    @open-category="onOpenCategory"
    @open-tag="onOpenTag"
    @navigate="onNavigate"
    @logout="doLogout"
    @need-login="goAuth"
  />

  <FavoritesPage
    v-else-if="view === 'favorites'"
    :user="user"
    @navigate="onNavigate"
    @open-article="openArticle"
    @open-category="onOpenCategory"
    @open-tag="onOpenTag"
    @logout="doLogout"
    @need-login="goAuth"
  />

  <DiscoverPage
    v-else-if="view === 'discover'"
    :user="user"
    @navigate="onNavigate"
    @open-article="openArticle"
    @open-category="onOpenCategory"
    @open-tag="onOpenTag"
    @open-home="goHome"
    @logout="doLogout"
  />

  <AboutPage
    v-else-if="view === 'about'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <SpaceSnake
    v-else-if="view === 'game'"
    :user="user"
    @navigate="onNavigate"
    @open-article="openArticle"
    @open-category="onOpenCategory"
    @open-tag="onOpenTag"
    @open-home="goHome"
    @logout="doLogout"
  />

  <TetrisPage
    v-else-if="view === 'tetris'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <FishGamePage
    v-else-if="view === 'fish'"
    :user="user"
    @navigate="onNavigate"
    @logout="doLogout"
  />

  <ProfilePage
    v-else-if="view === 'profile'"
    :user="user"
    @navigate="onNavigate"
    @open-article="openArticle"
    @logout="doLogout"
  />

  <!-- 全站页脚（登录页与全屏游戏页不显示） -->
  <div v-if="showFooter" class="footwrap">
    <SiteFooter @go="onNavigate" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import SakuraBackground from './components/SakuraBackground.vue'
import PetalField from './components/PetalField.vue'
import ToastHost from './components/ToastHost.vue'
import SiteFooter from './components/SiteFooter.vue'
import ProfilePage from './components/ProfilePage.vue'
import BrandPanel from './components/BrandPanel.vue'
import AuthPanel from './components/AuthPanel.vue'
import AdminLoginPanel from './components/AdminLoginPanel.vue'
import AdminConsole from './components/AdminConsole.vue'
import SuccessOverlay from './components/SuccessOverlay.vue'
import BookstorePage from './components/BookstorePage.vue'
import HomeRoomPage from './components/HomeRoomPage.vue'
import ConvenienceStorePage from './components/ConvenienceStorePage.vue'
import GymPage from './components/GymPage.vue'
import ParkPage from './components/ParkPage.vue'
import ArticleDetail from './components/ArticleDetail.vue'
import FavoritesPage from './components/FavoritesPage.vue'
import DiscoverPage from './components/DiscoverPage.vue'
import AboutPage from './components/AboutPage.vue'
import SpaceSnake from './components/SpaceSnake.vue'
import TetrisPage from './components/TetrisPage.vue'
import FishGamePage from './components/FishGamePage.vue'
import SakuraTown from './components/SakuraTown.vue'
import SchoolPage from './components/SchoolPage.vue'
import StationPage from './components/StationPage.vue'
import ShopPage from './components/ShopPage.vue'
import TownEntry from './components/TownEntry.vue'
import BackHill from './components/BackHill.vue'
import Dungeon from './components/Dungeon.vue'
import { useTilt } from './composables/useTilt'
import { toast } from './composables/useToast'
import { getMe, logout, getToken } from './api/auth'

const { card, spot, onMove, onLeave } = useTilt()

const authPanel = ref(null)
const showDone = ref(false)
const doneTitle = ref('')
const doneSub = ref('')

/**
 * 视图状态机（无 vue-router）：
 *   auth 登录 / admin-login 后台登录 / admin 管理台
 *   entry     序章页（登录后先看到的一屏：千年樱 + 进入小镇）
 *   town      樱花小镇（默认首页，六栋建筑可点）
 *   school    樱花学校（黑板课程表 / 图书角）
 *   station   樱花车站（发车牌 / 时刻表 / 车票）
 *   cafe / sweet / flower  商店街三间小店（共用 ShopPage：价目 + 小票）
 *   home      书店（原手记馆，书可买可读）
 *   gamehome  家（笔记本里玩小游戏 / 床睡觉）
 *   store     便利店（打工赚金币）
 *   gym       健身房（练体力上限 / 买蛋白饮）
 *   park      公园（长椅回体力 / 贩卖机买饮料）
 *   article   书籍详情 / profile 我的 / about 关于
 *   favorites 我的收藏（从个人中心进） / discover 旧发现页（保留路由）
 *   game / tetris / fish  三款小游戏的独立页（从家进入时是内嵌模式）
 */
const view = ref('auth')
const user = ref(null)
const articleId = ref(null)

/** 登录页与后台登录页用夜色，保证表单可读性 */
const night = computed(() => view.value === 'auth' || view.value === 'admin-login')

/** 这两屏用的是自己的完整画面（SVG 小镇 / 电影感底图），不要再叠全局天空与花瓣 */
const bareStage = computed(() => ['town', 'entry', 'backhill', 'dungeon'].includes(view.value))

const showFooter = computed(() => !['auth', 'admin-login', 'admin', 'entry', 'town', 'backhill', 'dungeon', 'gamehome', 'game', 'tetris', 'fish'].includes(view.value))

// 书店自己管理搜索 / 分类 / 分页，这里不再需要外部筛选参数

watch(view, (v) => {
  document.body.classList.toggle('view-home', v !== 'auth' && v !== 'admin-login')
  window.scrollTo({ top: 0 })
})

/* ---------- 登录流程 ---------- */
async function onSuccess (mode) {
  doneTitle.value = mode === 'signup' ? '账号创建成功' : '欢迎回来'
  doneSub.value = '樱花已为你铺好小路，正在穿过花雨…'
  showDone.value = true

  if (mode === 'signup' || mode === 'login') {
    try {
      user.value = await getMe()
      goEntry()
      showDone.value = false
    } catch (e) {
      doneSub.value = (e && e.message) || '获取用户信息失败'
    }
  }
}

function onAdminSuccess (me) {
  // 后台登录成功后进入管理台；后端已校验 permission=0
  user.value = me
  view.value = 'admin'
}

function onReset () {
  showDone.value = false
  if (authPanel.value) authPanel.value.resetToLogin()
}

function doLogout () {
  logout()
  user.value = null
  goAuth()
}

function goAuth () {
  view.value = 'auth'
  showDone.value = false
  if (authPanel.value) authPanel.value.resetToLogin()
}

/* ---------- 页面导航 ---------- */
/* 后山 → 异境 → 后山：一条独立的小循环，不走导航菜单 */
function goRealm () {
  view.value = 'dungeon'
}

function onExitRealm (payload) {
  view.value = 'backhill'
  const petals = payload && payload.petals ? payload.petals : 0
  if (payload && payload.reason === 'lose') {
    toast.info('被花瓣裹着送回了后山 —— 下次带上更多花瓣再来')
  } else if (petals > 0) {
    toast.success(`从樱之异境带回 ${petals} 片花瓣`)
  }
}

function onNavigate (key) {
  if (key === 'admin-login' && (!user.value || Number(user.value.permission) !== 0)) {
    toast.info('仅管理员可访问后台管理系统')
    return
  }
  view.value = key
}

function openArticle (id) {
  articleId.value = id
  view.value = 'article'
}

function goTown () {
  view.value = 'town'
}

/** 登录成功 / 带着 token 回到站点：先进序章页，再由用户自己推门 */
function goEntry () {
  view.value = 'entry'
}

function goHome () {
  view.value = 'home'
}

function onOpenCategory () {
  // 书店是一级入口，分类筛选交给书店自己，这里直接回书店
  view.value = 'home'
}

function onOpenTag () {
  view.value = 'home'
}

onMounted(async () => {
  if (!getToken()) return
  try {
    user.value = await getMe()
    goEntry()
  } catch (e) {
    user.value = null
    view.value = 'auth'
  }
})
</script>

<style scoped>
.footwrap {
  position: relative;
  z-index: 2;
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 0 24px 34px;
}

/* ---------- 登录页顶部品牌（悬浮在卡外） ---------- */
.stage { min-height: 100dvh; align-content: center; gap: 18px; }
.stage__brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: var(--night-ink);
}
.stage__mark {
  width: 22px;
  height: 22px;
  border-radius: 50% 0 50% 50%;
  background: linear-gradient(140deg, #fff, var(--sakura-300));
  transform: rotate(45deg) translateY(2px);
  box-shadow: 0 0 22px rgba(249, 116, 159, .9);
}
.stage__name {
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 900;
  letter-spacing: .34em;
}
.stage__en {
  font-size: 10px;
  letter-spacing: .32em;
  color: rgba(255, 236, 245, .55);
}
.stage__foot {
  font-size: 12.5px;
  letter-spacing: .12em;
  color: rgba(255, 238, 246, .62);
  text-shadow: 0 2px 12px rgba(60, 20, 40, .5);
}

@media (max-width: 900px) {
  .stage { gap: 12px; }
  .stage__foot { display: none; }
}
</style>
