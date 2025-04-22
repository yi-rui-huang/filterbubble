<template>
  <div class="thank-you-container">
    <div class="card thank-you-card">
      <div class="thank-you-content">
        <h2 class="thank-you-title">Thank You for Participating!</h2>
        
        <div class="thank-you-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        
        <p class="thank-you-message">
          Your participation in this research study is greatly appreciated. Your responses will help us
          better understand how people interact with AI systems and how these interactions might
          influence information exposure.
        </p>
        
        <div class="study-summary">
          <h3>Study Summary</h3>
          <p>
            In this study, you completed:
          </p>
          <ul>
            <li>An initial questionnaire about your background and preferences</li>
            <li>A first conversation with an AI assistant</li>
            <li>A mid-study questionnaire about your experience</li>
            <li>A second conversation with an AI assistant</li>
            <li>A final questionnaire about your overall experience</li>
          </ul>
        </div>
        
        <div class="next-steps">
          <h3>What Happens Next?</h3>
          <p>
            Your responses have been recorded and will be analyzed as part of our research on filter
            bubbles and AI interactions. All data will be anonymized and used solely for research purposes.
          </p>
          <p>
            If you have any questions about the study or would like to receive updates on our research
            findings, please contact the research team at <a href="mailto:research@filterbubble.example.com">research@filterbubble.example.com</a>.
          </p>
        </div>
        
        <div class="feedback-confirmation">
          <h3>Your Feedback Matters</h3>
          <p>
            Your insights and feedback are invaluable to our research. Thank you for taking the time to
            share your thoughts and experiences with us.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { logUserEvent } from '../services/loggingService';

export default {
  name: 'ThankYou',
  created() {
    // Log completion of the study
    logUserEvent('study_completed', {
      timestamp: new Date().toISOString()
    });
  }
};
</script>

<style scoped>
.thank-you-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 0;
}

.thank-you-card {
  padding: 2.5rem;
  text-align: center;
}

.thank-you-content {
  max-width: 600px;
  margin: 0 auto;
}

.thank-you-title {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 2rem;
}

.thank-you-icon {
  color: #28a745;
  margin-bottom: 1.5rem;
}

.thank-you-message {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.study-summary, .next-steps, .feedback-confirmation {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--light-gray);
  text-align: left;
}

.feedback-confirmation {
  border-bottom: none;
}

h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

ul {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
}

li {
  margin-bottom: 0.5rem;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .thank-you-card {
    padding: 1.5rem;
  }
  
  .thank-you-title {
    font-size: 1.8rem;
  }
}
</style>
