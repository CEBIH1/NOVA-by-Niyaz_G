import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip';
import Aura from '@primeuix/themes/aura'
import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'
import './assets/theme.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
library.add(fas)

const app = createApp(App)
app.use(router)
app.use(PrimeVue, {
  theme: { preset: Aura },
  ripple: true
})
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
app.directive('tooltip', Tooltip);


// Тонкие настройки
// Отключаем скролл при фокусе во всём приложении (чтобы панельки меню или иерархии не дёргались при фокусе)
document.addEventListener('focusin', (event) => {
  const target = event.target
  if (target && typeof target.focus === 'function') {
    const originalFocus = target.focus
    target.focus = function(options) {
      originalFocus.call(this, { ...options, preventScroll: true })
    }
  }
}, true)