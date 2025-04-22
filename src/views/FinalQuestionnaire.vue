<template>
  <div class="questionnaire-container">
    <div class="card questionnaire-card">
      <h2 class="card-title">Final Questionnaire</h2>
      <p class="questionnaire-description">
        Thank you for completing both conversation rounds. Please answer the following questions
        about your overall experience with the AI assistant and the study.
      </p>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- Multi-agent Experience Questions -->
        <section class="form-section">
          <h3>Multi-agent System Experience</h3>
          
          <div class="form-group">
            <label class="form-label" for="overall-experience">1. How do you feel about the overall experience when interacting with multiple agents?</label>
            <textarea 
              id="overall-experience" 
              v-model="responses.overallExperience" 
              class="form-control" 
              rows="4"
              placeholder="Please describe your overall experience..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="system-difference">2. What do you think is the difference in the experience of multi-agent systems compared to traditional single recommendation systems?</label>
            <textarea 
              id="system-difference" 
              v-model="responses.systemDifference" 
              class="form-control" 
              rows="4"
              placeholder="Please describe the differences you noticed..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="problems-encountered">3. What problems or confusions have you encountered in the process of using multi-agent recommendation systems?</label>
            <textarea 
              id="problems-encountered" 
              v-model="responses.problemsEncountered" 
              class="form-control" 
              rows="4"
              placeholder="Please describe any issues or confusion you experienced..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="choice-difficulty">4. When multiple agents provide different recommendations, what impact does it have on the difficulty of making your choice?</label>
            <textarea 
              id="choice-difficulty" 
              v-model="responses.choiceDifficulty" 
              class="form-control" 
              rows="4"
              placeholder="Please describe how multiple recommendations affected your decision-making..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="customization-preferences">5. If you can customize the behavior or recommendation method of the agent, what aspects do you most want to adjust?</label>
            <textarea 
              id="customization-preferences" 
              v-model="responses.customizationPreferences" 
              class="form-control" 
              rows="4"
              placeholder="Please describe what aspects you would like to customize..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="improvement-suggestions">6. How do you think multi-agent systems should work better to provide more personalized and diverse recommendations?</label>
            <textarea 
              id="improvement-suggestions" 
              v-model="responses.improvementSuggestions" 
              class="form-control" 
              rows="4"
              placeholder="Please share your suggestions for improvement..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="interaction-burden">7. When interacting with multiple agents, what impact does it have on the burden of interaction? What features do you want to add or reduce?</label>
            <textarea 
              id="interaction-burden" 
              v-model="responses.interactionBurden" 
              class="form-control" 
              rows="4"
              placeholder="Please describe the interaction burden and desired features..."
              required
            ></textarea>
          </div>
        </section>
        
        <div class="form-actions">
          <button type="submit" class="btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Complete Study' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { logQuestionnaireResponses, logUserEvent } from '../services/loggingService';

export default {
  name: 'FinalQuestionnaire',
  data() {
    return {
      isSubmitting: false,
      responses: {
        // Multi-agent System Experience Questions
        overallExperience: '',
        systemDifference: '',
        problemsEncountered: '',
        choiceDifficulty: '',
        customizationPreferences: '',
        improvementSuggestions: '',
        interactionBurden: ''
      }
    };
  },
  created() {
    // Log page view
    logUserEvent('view_final_questionnaire');
  },
  methods: {
    async submitQuestionnaire() {
      this.isSubmitting = true;
      
      try {
        // Log form submission start
        logUserEvent('final_questionnaire_submit_attempt');
        
        // Submit questionnaire responses to Firebase
        const success = await logQuestionnaireResponses('final', this.responses);
        
        if (success) {
          // Log successful submission
          logUserEvent('final_questionnaire_submitted', {
            timestamp: new Date().toISOString()
          });
          
          // Navigate to thank you page
          this.$router.push({ name: 'ThankYou' });
        } else {
          alert('There was an error submitting your responses. Please try again.');
          this.isSubmitting = false;
        }
      } catch (error) {
        console.error('Error submitting questionnaire:', error);
        alert('There was an error submitting your responses. Please try again.');
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
.questionnaire-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 0;
}

.questionnaire-card {
  padding: 2rem;
}

.questionnaire-description {
  margin-bottom: 2rem;
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--light-gray);
}

.form-section h3 {
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.rating-scale {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.rating-label {
  flex: 0 0 100px;
  font-size: 0.9rem;
}

.rating-options {
  display: flex;
  flex: 1;
  justify-content: space-between;
  max-width: 300px;
  margin: 0 1rem;
}

.rating-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.rating-option input {
  margin-bottom: 0.25rem;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.form-actions .btn {
  min-width: 200px;
}

@media (max-width: 768px) {
  .questionnaire-card {
    padding: 1.5rem;
  }
  
  .rating-scale {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .rating-label {
    margin-bottom: 0.5rem;
  }
  
  .rating-options {
    margin: 0.5rem 0;
  }
}
</style>
