import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primevue/themes/aura';
import App from './App.vue'
// import * as StellarSdk from 'stellar-sdk';
import '@/assets/styles.scss';
// const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

const app = createApp(App)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
});
app.use(ToastService)
app.mount('#app')