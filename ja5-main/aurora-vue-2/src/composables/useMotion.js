// ============================================================
//  全站动效开关（唯一判定入口）
// ------------------------------------------------------------
//  为什么不再直接用 prefers-reduced-motion 决定：
//    Windows / macOS 一旦关掉「动画效果」，浏览器就会把该媒体查询
//    报成 reduce（远程桌面、Windows Server、精简版系统默认就是关的）。
//    结果是整站的 CSS 动画、樱花花瓣、卡片跟随鼠标全部消失，
//    在用户眼里就是「动态效果没了」。
//
//  现在的规则：
//    · 默认【开启】动效；
//    · 想关掉再显式关闭，两种方式都写进 localStorage：
//        localStorage.setItem('aurora_motion', 'off')
//        或访问任意页面加 ?motion=off（?motion=on 恢复）
//    · 关闭时给 <html> 加 .no-motion，CSS 用这个类兜底；
//      Canvas 动画在 JS 侧读 motionEnabled() 决定要不要跑。
//
//  之所以保留关闭能力：动效敏感人群（前庭功能障碍）需要它，
//  但默认值不能由系统设置替整站做决定 —— 这个站的视觉本身就是动画。
// ============================================================

const KEY = 'aurora_motion'

let cached = null

function readStored () {
  try {
    return localStorage.getItem(KEY) === 'off' ? false : true
  } catch (e) {
    // 隐私模式 / 禁用 storage：按开启处理
    return true
  }
}

/** 当前是否允许动效（默认 true） */
export function motionEnabled () {
  if (cached === null) cached = readStored()
  return cached
}

/** 把动效状态同步到 <html>，CSS 侧据此兜底 */
export function applyMotionClass () {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('no-motion', !motionEnabled())
}

/** 显式开关动效，立即生效并持久化 */
export function setMotion (on) {
  cached = !!on
  try {
    localStorage.setItem(KEY, cached ? 'on' : 'off')
  } catch (e) { /* 存不下就只影响本次会话 */ }
  applyMotionClass()
  return cached
}

/** 读取 URL 上的 ?motion=on|off 覆盖本地设置（启动时调一次） */
export function syncMotionFromUrl () {
  try {
    const v = new URLSearchParams(window.location.search).get('motion')
    if (v === 'off' || v === 'on') setMotion(v === 'on')
  } catch (e) { /* URL 解析失败就忽略 */ }
}
