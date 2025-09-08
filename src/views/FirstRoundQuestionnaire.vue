<template>
  <div class="questionnaire-container">
    <div class="card questionnaire-card">
      <h2 class="card-title">Mid-Study Questionnaire</h2>
      <p class="questionnaire-description">
        Thank you for completing the conversation round. Please answer the following questions
        about your experience with the AI assistant.
      </p>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- First Conversation Experience -->
        <section class="form-section">
          <!-- <h3>Satisfaction and Engagement</h3> -->
          
          <div class="form-group">
            <label class="form-label" for="satisfaction">1. Overall, I am satisfied with this recommendation experience.</label>
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
            <label class="form-label" for="helpfulness">2. I found the interaction with the agents engaging.</label>
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
            <label class="form-label" for="bias-perception">3. This explanation helped me understand why these movies were recommended.</label>
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
            <label class="form-label" for="transparency">4. This explanation was clear, natural, and easy to understand.</label>
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
            <label class="form-label" for="trust">5. This explanation was relevant to my interests and needs.</label>
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
            <label class="form-label" for="control-transparency">6. This explanation made me feel that my preferences were understood by the system.</label>
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
            <label class="form-label" for="understanding">7. This explanation was closely aligned with my personal situation and preferences.</label>
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
            <label class="form-label" for="user-control-trust">8. This explanation made me trust the recommendation results more.</label>
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
            <label class="form-label" for="monitoring">9. This explanation increased my confidence in choosing a good movie.</label>
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
            <label class="form-label" for="implicit-bias">10. This explanation made me more willing to learn more about the recommended movies.</label>
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
            <label class="form-label" for="recommendation-trust">11. If given the opportunity in the future, I would be willing to use this type of recommendation explanation again.</label>
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
            <label class="form-label" for="satisfaction-level">12. Even after considering these explanations, I still feel I can make choices autonomously rather than being manipulated.</label>
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
            <label class="form-label" for="reuse-intention">13. If possible, I would be willing to use this system again.</label>
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
            <label class="form-label" for="recommend-intention">14. I would recommend this system to others.</label>
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
            <label class="form-label" for="explore-intention">15. I would be willing to further explore or watch movies based on the system's recommendations.</label>
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
        </section>
        
        <div class="form-actions">
          <button type="submit" class="btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Submit and Continue to Transition' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { logUserEvent, logQuestionnaireResponses } from '../services/loggingService';
import { getSystemOrder, completeCurrentSystem, getNextRouteAfterQuestionnaire } from '../services/systemOrderService';

export default {
  name: 'FirstRoundQuestionnaire',
  data() {
    return {
      isSubmitting: false,
      responses: {
        // First Conversation Experience
        satisfaction: null,
        helpfulness: null,
        biasPerception: null,
        
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
        exploreIntention: null
      }
    };
  },
  created() {
    // Log page view
    logUserEvent('view_first_round_questionnaire');
  },
  methods: {
    async submitQuestionnaire() {
      this.isSubmitting = true;
      
      try {
        // Log form submission start
        logUserEvent('first_round_questionnaire_submit_attempt');
        
        // Submit questionnaire responses to Firebase
        const success = await logQuestionnaireResponses('first_round', this.responses);
        
        if (success) {
          // Log successful submission
          logUserEvent('first_round_questionnaire_submitted', {
            timestamp: new Date().toISOString()
          });
          
          // 标记当前系统（第一轮）为已完成
          completeCurrentSystem();
          
          // 使用系统服务决定下一步去哪里
          const nextRoute = getNextRouteAfterQuestionnaire();
          console.log('FirstRoundQuestionnaire 下一步导航到:', nextRoute);
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
