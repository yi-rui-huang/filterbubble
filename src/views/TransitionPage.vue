<template>
  <div class="transition-container">
    <div class="transition-content">
      <h1 class="transition-title">Preparing for Film Discussion</h1>
      
      <div class="transition-card">
        <div class="transition-info">
          <p class="transition-description">
            You have completed the first round of conversation with the AI Film Assistant.
            Now, you are about to engage in a structured film discussion with our panel of experts.
          </p>
          
          <div class="agents-preview">
            <h3>Meet Your Film Discussion Panel</h3>
            <div class="agents-grid">
              <div v-for="(agent, key) in agentProfiles.agents" :key="key" class="agent-preview">
                <div class="agent-avatar-container">
                  <img :src="getAgentAvatar(key)" class="agent-avatar" :alt="`${agent.role} avatar`">
                </div>
                <h4 class="agent-role">{{ agent.role }}</h4>
                <p class="agent-brief-desc">{{ getBriefDescription(key) }}</p>
              </div>
            </div>
          </div>
          
          <div class="transition-instructions">
            <h3>How the Discussion Works</h3>
            <ul>
              <li>Share your thoughts and questions about films with our panel of experts</li>
              <li>Each expert brings a unique perspective</li>
              <li>You can use @ to mention specific experts to ask them questions</li>
              <li>Experts may recommend films based on your interests</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="transition-actions">
        <button class="btn back-btn" @click="goBack">Back to First Round</button>
        <button class="btn continue-btn" @click="continueToSecondRound">
          Continue to Film Discussion
          <span class="arrow-icon">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import agentProfiles from '../data/agent_profiles.json';
import { logSystemEvent } from '../services/loggingService';
import p1Image from '../images/p2.png';
import p2Image from '../images/p4.png';
import p3Image from '../images/p3.png';
import p4Image from '../images/p1.png';
import gptLogo from '../images/gpt_logo.png';

export default {
  name: 'TransitionPage',
  data() {
    return {
      agentProfiles,
      avatarMap: {
        professional_critic: p1Image,
        indie_enthusiast: p2Image,
        blockbuster_fan: p3Image,
        moderator: p4Image
      },
      briefDescriptions: {
        professional_critic: "Professional film critic, provides objective analysis",
        indie_enthusiast: "Independent film enthusiast, focuses on artistic innovation",
        blockbuster_fan: "Mainstream movie enthusiast, focuses on audience reception",
        moderator: "Discussion moderator, guides conversation and balances viewpoints"
      }
    };
  },
  created() {
    // Log page view
    logSystemEvent('page_view', {
      page: 'transition_page'
    });
  },
  methods: {
    getAgentAvatar(agentType) {
      return this.avatarMap[agentType] || gptLogo;
    },
    getBriefDescription(agentType) {
      return this.briefDescriptions[agentType] || "";
    },
    goBack() {
      logSystemEvent('navigation', {
        action: 'back_to_first_round',
        from: 'transition_page'
      });
      this.$router.push('/first-round');
    },
    continueToSecondRound() {
      logSystemEvent('navigation', {
        action: 'continue_to_second_round',
        from: 'transition_page'
      });
      this.$router.push({
        path: '/second-round',
        query: { fromTransition: 'true' }
      });
    }
  }
};
</script>

<style scoped>
.transition-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8f9fa;
  overflow-y: auto;
  max-height: 100vh;
}

.transition-content {
  max-width: 900px;
  width: 100%;
  overflow-y: auto;
  max-height: 90vh;
  padding-right: 10px;
}

.transition-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 2.5rem;
}

.transition-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  margin-bottom: 2rem;
  transition: transform 0.3s ease;
}

.transition-card:hover {
  transform: translateY(-5px);
}

.transition-description {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 2rem;
  text-align: center;
}

.agents-preview {
  margin-bottom: 2rem;
}

.agents-preview h3 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.5rem;
}

.agents-grid {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.agent-preview {
  text-align: center;
  width: 180px;
  transition: transform 0.2s ease;
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.agent-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.agent-avatar-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
}

.agent-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.agent-role {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.agent-brief-desc {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.transition-instructions {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
}

.transition-instructions h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.3rem;
  text-align: center;
}

.transition-instructions ul {
  padding-left: 1.5rem;
}

.transition-instructions li {
  margin-bottom: 0.8rem;
  line-height: 1.5;
  color: #555;
}

.transition-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.back-btn {
  background-color: #e9ecef;
  color: #495057;
}

.back-btn:hover {
  background-color: #dee2e6;
}

.continue-btn {
  background-color: #2196f3;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.continue-btn:hover {
  background-color: #1976d2;
  transform: translateX(5px);
}

.arrow-icon {
  font-size: 1.2rem;
  transition: transform 0.2s ease;
}

.continue-btn:hover .arrow-icon {
  transform: translateX(3px);
}

@media (max-width: 768px) {
  .transition-container {
    padding: 1rem;
  }
  
  .transition-card {
    padding: 1.5rem;
  }
  
  .transition-title {
    font-size: 2rem;
  }
  
  .agents-grid {
    gap: 1rem;
  }
  
  .agent-preview {
    width: 140px;
  }
  
  .agent-avatar-container {
    width: 60px;
    height: 60px;
  }
  
  .transition-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn {
    width: 100%;
  }
}
/* Custom scrollbar styles */
.transition-content::-webkit-scrollbar {
  width: 8px;
}

.transition-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.transition-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.transition-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
