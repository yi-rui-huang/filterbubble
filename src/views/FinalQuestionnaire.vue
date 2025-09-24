<template>
  <div class="questionnaire-container">
    <div class="card questionnaire-card">
      <h2 class="card-title">Final Questionnaire</h2>
      <p class="questionnaire-description">
        Thank you for completing both conversation rounds. Please answer the following questions
        about your overall experience with the AI assistant and the study.
      </p>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- Progress indicator -->
        <div class="progress-indicator">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div class="progress-text">Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</div>
        </div>
        
        <!-- Multi-agent Experience Questions -->
        <section class="form-section">
          <!-- <h3>Multi-agent System Experience</h3> -->
          
          <!-- Current question -->
          <transition name="fade" mode="out-in">
            <div class="form-group" :key="currentQuestionIndex">
              <label class="form-label" :for="questions[currentQuestionIndex].id">{{ questions[currentQuestionIndex].number }}. {{ questions[currentQuestionIndex].text }}</label>
              <textarea 
                :id="questions[currentQuestionIndex].id" 
                v-model="responses[questions[currentQuestionIndex].responseKey]" 
                class="form-control" 
                rows="6"
                :placeholder="questions[currentQuestionIndex].placeholder"
                required
                ref="currentQuestionInput"
              ></textarea>
            </div>
          </transition>
        </section>
        
        <!-- Navigation buttons -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="previousQuestion" 
            :disabled="currentQuestionIndex === 0"
          >
            Previous
          </button>
          
          <button 
            v-if="currentQuestionIndex < questions.length - 1" 
            type="button" 
            class="btn btn-primary" 
            @click="nextQuestion" 
            :disabled="!responses[questions[currentQuestionIndex].responseKey].trim()"
          >
            Next
          </button>
          
          <button 
            v-else 
            type="submit" 
            class="btn btn-success" 
            :disabled="isSubmitting || !responses[questions[currentQuestionIndex].responseKey].trim()"
          >
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
      currentQuestionIndex: 0,
      questions: [
        {
          id: 'exploration-impact',
          number: '1',
          text: 'Describe how this system affected your exploration of different or diverse movie recommendations.',
          placeholder: 'Please describe how the system influenced your exploration of diverse movies...',
          responseKey: 'explorationImpact'
        },
        {
          id: 'agent-explanations',
          number: '2',
          text: 'Share your thoughts on the agents\' explanations of movies and how they influenced your final movie choices.',
          placeholder: 'Please share your thoughts on how the agents\' explanations influenced your choices...',
          responseKey: 'agentExplanations'
        },
        {
          id: 'improvement-suggestions',
          number: '3',
          text: 'What suggestions do you have for improving how the AI agents interact with you or explain their recommendations?',
          placeholder: 'Please share your suggestions for improving the AI agents\' interactions or explanations...',
          responseKey: 'improvementSuggestions'
        }
      ],
      responses: {
        // Part 2: Open-Ended Feedback Questions
        explorationImpact: '',
        agentExplanations: '',
        improvementSuggestions: ''
      }
    };
  },
  computed: {
    progressPercentage() {
      return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
    }
  },
  created() {
    // Log page view
    logUserEvent('view_final_questionnaire');
  },
  methods: {
    nextQuestion() {
      // Validate current response is not empty
      const currentResponseKey = this.questions[this.currentQuestionIndex].responseKey;
      if (!this.responses[currentResponseKey].trim()) {
        return; // Don't proceed if the response is empty
      }
      
      // Move to the next question if not at the end
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
        this.$nextTick(() => {
          // Focus on the textarea of the new question
          if (this.$refs.currentQuestionInput) {
            this.$refs.currentQuestionInput.focus();
          }
        });
      }
    },
    
    previousQuestion() {
      // Move to the previous question if not at the beginning
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.$nextTick(() => {
          // Focus on the textarea of the new question
          if (this.$refs.currentQuestionInput) {
            this.$refs.currentQuestionInput.focus();
          }
        });
      }
    },
    
    async submitQuestionnaire() {
      // Validate the current response before submission
      const currentResponseKey = this.questions[this.currentQuestionIndex].responseKey;
      if (!this.responses[currentResponseKey].trim()) {
        return; // Don't submit if the last response is empty
      }
      
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

/* Progress indicator styles */
.progress-indicator {
  margin-bottom: 2rem;
}

.progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color, #4a90e2);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: #6c757d;
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--light-gray, #e9ecef);
  min-height: 300px; /* Ensure consistent height between questions */
}

.form-section h3 {
  margin-bottom: 1.5rem;
  color: var(--primary-color, #4a90e2);
}

/* Form group styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color, #4a90e2);
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(74, 144, 226, 0.25);
}

/* Button styles */
.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color, #4a90e2);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #357ab8;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #218838;
}

/* Transition animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 768px) {
  .questionnaire-card {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
