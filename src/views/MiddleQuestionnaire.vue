<template>
  <div class="questionnaire-container">
    <div class="card questionnaire-card">
      <h2 class="card-title">Mid-Study Questionnaire</h2>
      <p class="questionnaire-description">
        Thank you for completing the conversation round. Please answer the following questions
        about your experience with the AI assistants.
      </p>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- First Conversation Experience -->
        <section class="form-section">
          <!-- <h3>Satisfaction and Engagement</h3> -->
          
          <div class="form-group">
            <label class="form-label" for="satisfaction"><strong>1.</strong> Overall, I am satisfied with this recommendation experience involving multiple agents.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="helpfulness"><strong>2.</strong> I found observing the discussion/interaction between agents engaging.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="bias-perception"><strong>3.</strong> The agents' discussion helped me understand why these movies were recommended.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="transparency"><strong>4.</strong> The agents' discussion was clear, natural, and easy to understand.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="trust"><strong>5.</strong> The perspectives offered by the agents were overall relevant to my interests and needs.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="control-transparency"><strong>6.</strong> The agents' discussion made me feel that my preferences were understood by the system.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="understanding"><strong>7.</strong> The analysis from different perspectives by the agents made me feel it was closely aligned with my personal situation and preferences.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="user-control-trust"><strong>8.</strong> The multi-perspective information provided by the agents made me trust the recommendation results more.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="monitoring"><strong>9.</strong> After listening to the agents' discussion, I have more confidence in choosing a good movie.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="implicit-bias"><strong>10.</strong> The agents' discussion made me more willing to learn more about the mentioned movies.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="recommendation-trust"><strong>11.</strong> If given the opportunity in the future, I would be willing to use this type of multi-agent discussion-based recommendation explanation again.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
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
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="satisfaction-level"><strong>12.</strong> Even after considering these discussions, I still feel I can make choices autonomously rather than being manipulated.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="satisfaction-level" 
                    :value="n" 
                    v-model="responses.satisfactionLevel" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="reuse-intention"><strong>13.</strong> If possible, I would be willing to use this system again.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="reuse-intention" 
                    :value="n" 
                    v-model="responses.reuseIntention" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="recommend-intention"><strong>14.</strong> I would recommend this system to others.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="recommend-intention" 
                    :value="n" 
                    v-model="responses.recommendIntention" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="explore-intention"><strong>15.</strong> I would be willing to further explore or watch movies based on the system's recommendations.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="explore-intention" 
                    :value="n" 
                    v-model="responses.exploreIntention" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
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
            {{ isSubmitting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { logUserEvent, logQuestionnaireResponses } from '../services/loggingService';
import { getSystemOrder, getNextRouteAfterQuestionnaire, completeCurrentSystem } from '../services/systemOrderService';

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
        satisfactionLevel: null,
        reuseIntention: null,
        recommendIntention: null,
        exploreIntention: null,
        
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
          
          // 标记当前系统（第二轮）为已完成
          completeCurrentSystem();
          
          // 使用系统服务决定下一步去哪里
          const nextRoute = getNextRouteAfterQuestionnaire();
          console.log('MiddleQuestionnaire 下一步导航到:', nextRoute);
          this.$router.push(nextRoute);
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
  width: 100%;
}

.questionnaire-card {
  padding: 2rem;
  width: 100%;
  margin: 0 auto;
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
  white-space: nowrap;
  text-align: center;
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
  background-color: #4a90e2;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.form-actions .btn:hover {
  background-color: #357abD;
}

.form-actions .btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .questionnaire-card {
    padding: 1.5rem;
  }
  
  .rating-scale {
    flex-direction: row; /* 保持横向排列 */
    align-items: center;
    flex-wrap: wrap; /* 允许在小屏幕上换行 */
  }
  
  .rating-label {
    margin: 0.5rem;
    flex: 0 0 auto; /* 允许标签自适应宽度 */
  }
  
  .rating-options {
    margin: 0.5rem;
    flex: 1 1 100%; /* 在小屏幕上占满宽度 */
    order: 3; /* 确保选项在两个标签之后显示 */
  }
}
</style>
