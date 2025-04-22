import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initializeFirebase } from './services/firebase';
import { initLoggingService } from './services/loggingService';

// Initialize Firebase
initializeFirebase();

// Initialize logging service
initLoggingService();

// Create and mount the Vue application
const app = createApp(App);
app.use(router);
app.mount('#app');
