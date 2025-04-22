import { createRouter, createWebHistory } from 'vue-router';
import { hasUserId } from '../utils/userIdentifier';
import { logSystemEvent } from '../services/loggingService';

// Import views
import AppEntry from '../views/AppEntry.vue';
import InitialQuestionnaire from '../views/InitialQuestionnaire.vue';
import FirstRoundConversation from '../views/FirstRoundConversation.vue';
import TransitionPage from '../views/TransitionPage.vue';
import MiddleQuestionnaire from '../views/MiddleQuestionnaire.vue';
import SecondRoundConversation from '../views/SecondRoundConversation.vue';
import V2SecondRoundConversation from '../views/V2SecondRoundConversation.vue';
import FinalQuestionnaire from '../views/FinalQuestionnaire.vue';
import ThankYou from '../views/ThankYou.vue';
import AdminView from '../views/AdminView.vue';
import FirebaseTest from '../views/FirebaseTest.vue';
import OmdbApiTest from '../views/OmdbApiTest.vue';

const routes = [
  {
    path: '/',
    name: 'Entry',
    component: AppEntry,
    meta: { requiresNoUserId: false }
  },
  {
    path: '/initial-questionnaire',
    name: 'InitialQuestionnaire',
    component: InitialQuestionnaire,
    meta: { requiresUserId: true }
  },
  {
    path: '/first-round',
    name: 'FirstRoundConversation',
    component: FirstRoundConversation,
    meta: { requiresUserId: true }
  },
  {
    path: '/transition',
    name: 'TransitionPage',
    component: TransitionPage,
    meta: { requiresUserId: true }
  },
  {
    path: '/middle-questionnaire',
    name: 'MiddleQuestionnaire',
    component: MiddleQuestionnaire,
    meta: { requiresUserId: true }
  },
  {
    path: '/second-round',
    name: 'SecondRoundConversation',
    component: SecondRoundConversation,
    meta: { requiresUserId: true }
  },
  {
    path: '/v2-second-round',
    name: 'V2SecondRoundConversation',
    component: V2SecondRoundConversation,
    meta: { requiresUserId: true }
  },
  {
    path: '/final-questionnaire',
    name: 'FinalQuestionnaire',
    component: FinalQuestionnaire,
    meta: { requiresUserId: true }
  },
  {
    path: '/thank-you',
    name: 'ThankYou',
    component: ThankYou,
    meta: { requiresUserId: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresUserId: false }
  },
  {
    path: '/firebase-test',
    name: 'FirebaseTest',
    component: FirebaseTest,
    meta: { requiresUserId: false }
  },
  {
    path: '/omdb-test',
    name: 'OmdbApiTest',
    component: OmdbApiTest,
    meta: { requiresUserId: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach((to, from, next) => {
  // Log page navigation
  logSystemEvent('page_navigation', {
    from: from.path,
    to: to.path
  });
  
  // Check if route requires a user ID
  if (to.meta.requiresUserId && !hasUserId()) {
    next({ name: 'Entry' });
  } 
  // Check if route requires NO user ID (like a fresh start page)
  else if (to.meta.requiresNoUserId && hasUserId()) {
    next({ name: 'InitialQuestionnaire' });
  }
  else {
    next();
  }
});

export default router;
