import './assets/main.css'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/flex-utils.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(IonicVue)
app.use(pinia)
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})
