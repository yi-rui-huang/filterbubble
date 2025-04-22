<template>
  <div id="app">
    <!--<header>
      <h1>Filter Bubble Research</h1>
    </header> -->
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer>
      <p> {{ currentYear }} Filter Bubble Research Project</p>
    </footer>
  </div>
</template>

<script>
import { logSystemEvent } from './services/loggingService';

export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      currentYear: new Date().getFullYear()
    };
  },
  created() {
    // Log application start
    logSystemEvent('app_loaded', {
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    // Add event listeners for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Add event listener for window beforeunload
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  beforeUnmount() {
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  methods: {
    handleVisibilityChange() {
      const isVisible = document.visibilityState === 'visible';
      logSystemEvent('visibility_change', {
        isVisible,
        timestamp: new Date().toISOString()
      });
    },
    handleBeforeUnload() {
      logSystemEvent('app_unloaded', {
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  }
};
</script>

<style>
/* Global styles */
:root {
  --primary-color: #4a6fa5;
  --secondary-color: #6c757d;
  --accent-color: #47b8e0;
  --background-color: #f8f9fa;
  --text-color: #333;
  --light-gray: #e9ecef;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

main {
  flex: 1;
  padding: 0;
  max-width: 100%;
  margin: 0;
  width: 100%;
  overflow: hidden;
}

footer {
  background-color: var(--light-gray);
  padding: 0.5rem;
  text-align: center;
  flex-shrink: 0;
  font-size: 0.9rem;
  color: var(--secondary-color);
}

/* Transition effects */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Common button styles */
.btn {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #3a5a8c;
}

.btn-secondary {
  background-color: var(--secondary-color);
}

.btn-secondary:hover {
  background-color: #5a6268;
}

/* Form styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: var(--border-radius);
  font-size: 1rem;
}

/* Card styles */
.card {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-title {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

/* Responsive design */
@media (max-width: 768px) {
  main {
    padding: 1rem;
  }
  
  .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
