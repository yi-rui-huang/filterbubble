import { createRouter, createWebHistory } from 'vue-router';
import { hasUserId } from '../utils/userIdentifier';
import { logSystemEvent } from '../services/loggingService';

// Import views
import AppEntry from '../views/AppEntry.vue';
import InitialQuestionnaire from '../views/InitialQuestionnaire.vue';
import FirstRoundConversation from '../views/FirstRoundConversation.vue';
import FirstRoundQuestionnaire from '../views/FirstRoundQuestionnaire.vue';
import TransitionPage from '../views/TransitionPage.vue';
import MiddleQuestionnaire from '../views/MiddleQuestionnaire.vue';
import SecondRoundConversation from '../views/SecondRoundConversation.vue';
import V2SecondRoundConversation from '../views/V2SecondRoundConversation.vue';
import FinalQuestionnaire from '../views/FinalQuestionnaire.vue';
import ThankYou from '../views/ThankYou.vue';
import AdminView from '../views/AdminView.vue';
import FirebaseTest from '../views/FirebaseTest.vue';
import OmdbApiTest from '../views/OmdbApiTest.vue';
import MultiAgent from '../views/multiagent.vue';
import MultiAgentTest from '../views/multiagenttest.vue';
import Interact from '../views/interact.vue';
import MultiInteract from '../views/multi-interact.vue';
import AgentProfileTest from '../views/AgentProfileTest.vue';
import MultiAgentsStatic from '../views/multiagentsstatic.vue';
import MoviesTest from '../views/12movies_test.vue';
import MovieRecommendationIntro from '../views/MovieRecommendationIntro.vue';

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
    path: '/first-round-questionnaire',
    name: 'FirstRoundQuestionnaire',
    component: FirstRoundQuestionnaire,
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
    meta: { requiresUserId: true, preventBack: true }
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
    meta: { requiresUserId: true, preventBack: true }
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
  },
  {
    path: '/multiagent',
    name: 'MultiAgent',
    component: MultiAgent,
    meta: { requiresUserId: true }
  },
  {
    path: '/multiagenttest',
    name: 'MultiAgentTest',
    component: MultiAgentTest,
    meta: { requiresUserId: false }
  },
  {
    path: '/interact',
    name: 'Interact',
    component: Interact,
    meta: { requiresUserId: false }
  },
  {
    path: '/multi-interact',
    name: 'MultiInteract',
    component: MultiInteract,
    meta: { requiresUserId: false }
  },
  {
    path: '/agent-profile-test',
    name: 'AgentProfileTest',
    component: AgentProfileTest,
    meta: { requiresUserId: false }
  }
  ,
  {
    path: '/multiagentsstatic',
    name: 'MultiAgentsStatic',
    component: MultiAgentsStatic,
    meta: { requiresUserId: false }
  },
  {
    path: '/MoviesTest',
    name: 'MoviesTest',
    component: MoviesTest,
    meta: { requiresUserId: false }
  },
  {
    path: '/movie-intro',
    name: 'MovieRecommendationIntro',
    component: MovieRecommendationIntro,
    meta: { requiresUserId: false }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach((to, from, next) => {
  try {
    // Log page navigation
    logSystemEvent('page_navigation', {
      from: from.path,
      to: to.path
    });
    
    // For deployed environment, allow access to all routes
    if (window.location.hostname.includes('surge.sh')) {
      return next();
    }
    
    // Check if route requires a user ID
    if (to.meta.requiresUserId && !hasUserId()) {
      next({ name: 'Entry' });
    } 
    // Check if route requires NO user ID (like a fresh start page)
    else if (to.meta.requiresNoUserId && hasUserId()) {
      next({ name: 'InitialQuestionnaire' });
    }
    // If the user is trying to leave a route that prevents back navigation, redirect them back to it.
    else if (from.meta.preventBack && to.name !== from.name) {
      // This logic is intended to stop the user from clicking the browser's back button.
      // A more robust implementation is handled within the component itself using popstate events.
      // This router-level guard is a fallback.
      next({ name: from.name, replace: true });
    }
    else {
      next();
    }
  } catch (error) {
    console.error('Router error:', error);
    next();
  }
});

export default router;
