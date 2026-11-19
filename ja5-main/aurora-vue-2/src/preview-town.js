import { createApp, h } from 'vue'
import SakuraTown from './components/SakuraTown.vue'
import './style.css'
import { applyMotionClass } from './composables/useMotion'
applyMotionClass()
document.body.classList.add('view-home')
createApp({ render: () => h(SakuraTown, { user: { name: 'verify用户', id: 2 }, onNavigate: () => {}, onLogout: () => {} }) }).mount('#app')
