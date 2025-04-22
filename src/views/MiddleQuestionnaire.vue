<template>
  <div class="questionnaire-container">
    <div class="card questionnaire-card">
      <h2 class="card-title">Mid-Study Questionnaire</h2>
      <p class="questionnaire-description">
        Thank you for completing the first conversation round. Please answer the following questions
        about your experience with the AI assistant.
      </p>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- First Conversation Experience -->
        <section class="form-section">
          <h3>First Conversation Experience</h3>
          
          <div class="form-group">
            <label class="form-label" for="satisfaction">I think this system can help the recommendation system provide more diverse content.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="satisfaction" 
                    :value="n" 
                    v-model="responses.satisfaction" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="helpfulness">The participation of multiple agents can reduce bias or single tendency in recommendation results.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="helpfulness" 
                    :value="n" 
                    v-model="responses.helpfulness" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="bias-perception">Multi-agent systems can balance the contradiction between "personalized recommendations" and "information diversity".</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="bias-perception" 
                    :value="n" 
                    v-model="responses.biasPerception" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="transparency">Compared with a single algorithm, the recommendations of a multi-agent system are more transparent.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="transparency" 
                    :value="n" 
                    v-model="responses.transparency" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="trust">The fact that users can control the behavior of the agents increases my trust in the recommendation system.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="trust" 
                    :value="n" 
                    v-model="responses.trust" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="control-transparency">User control over the agents can improve the transparency of the recommendation system.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="control-transparency" 
                    :value="n" 
                    v-model="responses.controlTransparency" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="understanding">After adjusting the parameters of the agents, I can understand the logic of generating the recommendation results more clearly.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="understanding" 
                    :value="n" 
                    v-model="responses.understanding" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="user-control-trust">User control over the agent will increase my trust in the recommendation system.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="user-control-trust" 
                    :value="n" 
                    v-model="responses.userControlTrust" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="monitoring">User control makes the recommendation system easier to monitor and verify.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="monitoring" 
                    :value="n" 
                    v-model="responses.monitoring" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="implicit-bias">After increasing control, I am still worried about the existence of "implicit bias" in the system (such as the bias of the agent design itself).</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="implicit-bias" 
                    :value="n" 
                    v-model="responses.implicitBias" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="recommendation-trust">When I need to make a recommendation, I trust the multi-agent system more.</label>
            <div class="rating-scale">
              <div class="rating-label">Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="recommendation-trust" 
                    :value="n" 
                    v-model="responses.recommendationTrust" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Agree</div>
            </div>
          </div>
          
          <!--<div class="form-group">
            <label class="form-label" for="bias-description">If you perceived bias, please describe it briefly:</label>
            <textarea 
              id="bias-description" 
              v-model="responses.biasDescription" 
              class="form-control" 
              rows="3"
              placeholder="Please describe any bias you noticed..."
            ></textarea>
          </div> -->
        </section>
        
        <!-- Information Diversity 
        <section class="form-section">
          <h3>Information Diversity</h3>
          
          <div class="form-group">
            <label class="form-label" for="diverse-viewpoints">How well did the AI present diverse viewpoints?</label>
            <div class="rating-scale">
              <div class="rating-label">Not diverse</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="diverse-viewpoints" 
                    :value="n" 
                    v-model="responses.diverseViewpoints" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Very diverse</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="information-quality">How would you rate the quality of information provided?</label>
            <div class="rating-scale">
              <div class="rating-label">Low quality</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="information-quality" 
                    :value="n" 
                    v-model="responses.informationQuality" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">High quality</div>
            </div>
          </div>
        </section> -->
        
        <!-- Open-ended Feedback 
        <section class="form-section">
          <h3>Additional Feedback</h3>
          
          <div class="form-group">
            <label class="form-label" for="positive-aspects">What did you like most about the conversation with the AI assistant?</label>
            <textarea 
              id="positive-aspects" 
              v-model="responses.positiveAspects" 
              class="form-control" 
              rows="3"
              placeholder="Please share what you liked..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="improvement-suggestions">What could be improved about the AI assistant?</label>
            <textarea 
              id="improvement-suggestions" 
              v-model="responses.improvementSuggestions" 
              class="form-control" 
              rows="3"
              placeholder="Please share your suggestions..."
              required
            ></textarea>
          </div>
        </section> --> 
        
        <div class="form-actions">
          <button type="submit" class="btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Submit and Continue to Second Round' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { logQuestionnaireResponses, logUserEvent } from '../services/loggingService';

export default {
  name: 'MiddleQuestionnaire',
  data() {
    return {
      isSubmitting: false,
      responses: {
        // First Conversation Experience
        satisfaction: null,
        helpfulness: null,
        biasPerception: null,
        biasDescription: '',
        
        // Multi-agent System Questions
        transparency: null,
        trust: null,
        controlTransparency: null,
        understanding: null,
        userControlTrust: null,
        monitoring: null,
        implicitBias: null,
        recommendationTrust: null,
        
        // Information Diversity
        diverseViewpoints: null,
        informationQuality: null,
        
        // Open-ended Feedback
        positiveAspects: '',
        improvementSuggestions: ''
      }
    };
  },
  created() {
    // Log page view
    logUserEvent('view_middle_questionnaire');
  },
  methods: {
    async submitQuestionnaire() {
      this.isSubmitting = true;
      
      try {
        // Log form submission start
        logUserEvent('middle_questionnaire_submit_attempt');
        
        // Submit questionnaire responses to Firebase
        const success = await logQuestionnaireResponses('middle', this.responses);
        
        if (success) {
          // Log successful submission
          logUserEvent('middle_questionnaire_submitted', {
            timestamp: new Date().toISOString()
          });
          
          // Navigate to the final questionnaire
          this.$router.push({ name: 'FinalQuestionnaire' });
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
  max-width: 100%;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.questionnaire-card {
  padding: 2rem;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
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
