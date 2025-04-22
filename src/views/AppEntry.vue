<template>
  <div class="entry-container">
    <div class="card entry-card">
      <h2 class="card-title">Welcome to the Filter Bubble Research Study</h2>
      <p class="entry-description">
        Thank you for participating in our research study on filter bubbles and AI interactions.
        This study will help us understand how people interact with AI systems and how these
        interactions might influence information exposure.
      </p>
      
      <div class="research-background">
        <h3>BACKGROUND OF RESEARCH STUDY:</h3>
        <p>
          The purpose of this study aims to evaluate how AI recommendation systems may create or reinforce filter bubbles. 
          We will examine how conversational AI assistants that recommend movies influence your preferences and information exposure.
          Through this research, we hope to better understand the mechanisms behind filter bubbles and develop strategies to 
          mitigate their potential negative effects on information diversity.
        </p>
      </div>
      
      <!-- <div class="study-overview">
        <h3>Study Overview:</h3>
        <ol>
          <li>Complete an initial questionnaire about your background and preferences</li>
          <li>Engage in a first conversation with an AI assistant</li>
          <li>Engage in a second conversation with AI assistants</li>
          <li>Complete a mid-study questionnaire about your experience</li>
          <li>Complete a final questionnaire about your overall experience</li>
        </ol>
      </div> -->
      
      <div class="procedures-section">
        <h3>PROCEDURES:</h3>
        <p>
          Before the study, you will complete a questionnaire about your personal information (age, gender). 
          Then, you should find three movies of your interest by interacting with this AI chatbot. 
          After that, you will provide your evaluation feedback by completing an online questionnaire. 
          By completing the questionnaire, you will receive a bonus reward.
        </p>
        <p>
          <strong>Important:</strong> In both the first-round and second-round conversation pages, you are required to send at least 5 messages to the AI chatbot. This requirement ensures you have sufficient interaction time with the system and can fully experience the conversation. You must interact at least 5 times in each round before proceeding to the next stage of the study.
        </p>
      </div>
      
      <div class="duration-section">
        <h3>DURATION:</h3>
        <p>
          This study will take about 30 minutes to complete (including time for filling out required and optional questionnaires).
        </p>
      </div>
      
      <div class="benefits-section">
        <h3>BENEFITS:</h3>
        <p>
          This user study is to evaluate a movie recommendation chatbot that aims to recommend movies to you through conversation. 
          As evaluators of this chatbot, we believe it will be beneficial for you to experience a conversational chatbot for movie recommendations, 
          learn the new dialog-based interaction model and help us improve the chatbot design.
        </p>
      </div>
      
      <div class="consent-section">
        <h3>Consent to Participate:</h3>
        <p>
          By participating in this study, you agree that we may collect data about your interactions,
          including your conversations with the AI and your questionnaire responses. All data will be
          anonymized and used solely for research purposes.
        </p>
        
        <div class="form-group">
          <label class="checkbox-container">
            <input type="checkbox" v-model="consentGiven">
            I understand and agree to participate in this research study
          </label>
        </div>
      </div>
      
      <button 
        class="btn start-btn" 
        :disabled="!consentGiven" 
        @click="startStudy">
        Begin Study
      </button>
    </div>
  </div>
</template>

<script>
import { getUserId } from '../utils/userIdentifier';
import { logSystemEvent, logUserEvent } from '../services/loggingService';

export default {
  name: 'AppEntry',
  data() {
    return {
      consentGiven: false
    };
  },
  created() {
    // Generate or retrieve user ID as soon as they land on the entry page
    const userId = getUserId();
    
    // Log entry to the application
    logSystemEvent('study_entry', {
      userId,
      timestamp: new Date().toISOString()
    });
  },
  methods: {
    startStudy() {
      if (!this.consentGiven) {
        return;
      }
      
      // Log consent and study start
      logUserEvent('consent_given', {
        timestamp: new Date().toISOString()
      });
      
      // Navigate to the initial questionnaire
      this.$router.push({ name: 'InitialQuestionnaire' });
    }
  }
};
</script>

<style scoped>
.entry-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  padding: 0;
}

.entry-card {
  max-width: 100%;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
}

.entry-description {
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
}

.research-background,
.study-overview,
.procedures-section,
.duration-section,
.benefits-section {
  margin-bottom: 2rem;
}

.research-background h3,
.study-overview h3,
.procedures-section h3,
.duration-section h3,
.benefits-section h3 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.research-background p,
.procedures-section p,
.duration-section p,
.benefits-section p {
  font-size: 1.1rem;
  line-height: 1.6;
  text-align: justify;
}

.study-overview ol,
.procedures-section ol {
  padding-left: 1.5rem;
}

.study-overview li,
.procedures-section li {
  margin-bottom: 0.5rem;
}

.consent-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--light-gray);
  border-radius: var(--border-radius);
}

.consent-section h3 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
}

.checkbox-container input {
  margin-right: 0.5rem;
  transform: scale(1.2);
}

.start-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.start-btn:disabled {
  background-color: var(--secondary-color);
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
