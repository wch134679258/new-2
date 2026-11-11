import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { applyMotionClass, syncMotionFromUrl } from './composables/useMotion'

// 动效开关要在挂载前落定：URL 参数覆盖 → 同步到 <html>。
// 放到挂载后做会让首帧先按系统设置渲染成静态样式，随后再跳到动画，出现闪动。
syncMotionFromUrl()
applyMotionClass()

createApp(App).mount('#app')
