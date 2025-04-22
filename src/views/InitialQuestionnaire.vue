<template>
  <div class="questionnaire-container">
    <div class="card questionnaire-card">
      <h2 class="card-title">Initial Questionnaire</h2>
      <p class="questionnaire-description">
        Please answer the following questions to help us understand your background and preferences.
        This information will be used for research purposes only.
      </p>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- Demographic Information -->
        <section class="form-section">
          <h3>Demographic Information</h3>
          
          <div class="form-group">
            <label class="form-label" for="gender">Gender</label>
            <select id="gender" v-model="responses.gender" class="form-control" required>
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="age">Age Group</label>
            <select id="age" v-model="responses.ageGroup" class="form-control" required>
              <option value="">Select your age group</option>
              <option value="under-18">Under 18</option>
              <option value="18-25">18-25</option>
              <option value="26-30">26-30</option>
              <option value="31-40">31-40</option>
              <option value="41-50">41-50</option>
              <option value="51-60">51-60</option>
              <option value="over-60">Over 60</option>
            </select>
          </div>
        </section>
        
        <!-- Recommendation System Usage -->
        <section class="form-section">
          <h3>Recommendation System Usage</h3>
          
          <div class="form-group">
            <label class="form-label" for="rec-system-usage">How much do you rely on recommendation systems (e.g., product recommendations, music recommendations, movie recommendations)?</label>
            <select id="rec-system-usage" v-model="responses.recSystemUsage" class="form-control" required>
              <option value="">Select your usage level</option>
              <option value="barely-rely">Barely rely (mainly active searching)</option>
              <option value="occasionally-rely">Occasionally rely</option>
              <option value="moderately-rely">Moderately rely (frequently use recommended content)</option>
              <option value="heavily-rely">Heavily rely (mainly depend on recommended content)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="chatgpt-usage">Have you used tools like ChatGPT to get content recommendations?</label>
            <select id="chatgpt-usage" v-model="responses.chatgptUsage" class="form-control" required>
              <option value="">Select your usage level</option>
              <option value="barely-rely">Barely rely (mainly active searching)</option>
              <option value="occasionally-rely">Occasionally rely</option>
              <option value="moderately-rely">Moderately rely (frequently use recommended content)</option>
              <option value="heavily-rely">Heavily rely (mainly depend on recommended content)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="filter-bubble-perception">When using tools like ChatGPT for recommendations, I feel "trapped" in repetitive content (similar topics/styles), with few new topics or perspectives.</label>
            <select id="filter-bubble-perception" v-model="responses.filterBubblePerception" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="missed-interests">When using tools like ChatGPT for recommendations, the recommendation system misses content I might be interested in (e.g., information I've explicitly expressed interest in but wasn't recommended).</label>
            <select id="missed-interests" v-model="responses.missedInterests" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="limited-info">When using tools like ChatGPT for recommendations, the recommendation system makes me feel that my access to information is limited.</label>
            <select id="limited-info" v-model="responses.limitedInfo" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="unexpected-content">When using tools like ChatGPT for recommendations, I rarely find unexpected content that goes beyond my interests in the recommendations.</label>
            <select id="unexpected-content" v-model="responses.unexpectedContent" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="diverse-perspectives">I would like to see more diverse perspectives and viewpoints in recommended content.</label>
            <select id="diverse-perspectives" v-model="responses.diversePerspectives" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
        </section>
        
        <!-- Personality Assessment (Big Five) -->
        <section class="form-section">
          <h3>Personality Assessment</h3>
          <p class="section-description">Please indicate how much you agree or disagree with each statement.</p>
          
          <!-- Openness to Experience -->
          <div class="form-group">
            <label class="form-label" for="openness-1">I am curious about many different things.</label>
            <select id="openness-1" v-model="responses.openness1" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="openness-2">I have a vivid imagination.</label>
            <select id="openness-2" v-model="responses.openness2" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <!-- Conscientiousness -->
          <div class="form-group">
            <label class="form-label" for="conscientiousness-1">I am always prepared.</label>
            <select id="conscientiousness-1" v-model="responses.conscientiousness1" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="conscientiousness-2">I pay attention to details.</label>
            <select id="conscientiousness-2" v-model="responses.conscientiousness2" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <!-- Extraversion -->
          <div class="form-group">
            <label class="form-label" for="extraversion-1">I am the life of the party.</label>
            <select id="extraversion-1" v-model="responses.extraversion1" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="extraversion-2">I feel comfortable around people.</label>
            <select id="extraversion-2" v-model="responses.extraversion2" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <!-- Agreeableness -->
          <div class="form-group">
            <label class="form-label" for="agreeableness-1">I sympathize with others' feelings.</label>
            <select id="agreeableness-1" v-model="responses.agreeableness1" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="agreeableness-2">I take time out for others.</label>
            <select id="agreeableness-2" v-model="responses.agreeableness2" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <!-- Neuroticism -->
          <div class="form-group">
            <label class="form-label" for="neuroticism-1">I get stressed out easily.</label>
            <select id="neuroticism-1" v-model="responses.neuroticism1" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="neuroticism-2">I worry about things.</label>
            <select id="neuroticism-2" v-model="responses.neuroticism2" class="form-control" required>
              <option value="">Select your level of agreement</option>
              <option value="strongly-disagree">Strongly disagree</option>
              <option value="disagree">Disagree</option>
              <option value="neutral">Neutral</option>
              <option value="agree">Agree</option>
              <option value="strongly-agree">Strongly agree</option>
            </select>
          </div>
        </section>
        
        <div class="form-actions">
          <button type="submit" class="btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Submit and Continue' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { logQuestionnaireResponses, logUserEvent } from '../services/loggingService';

export default {
  name: 'InitialQuestionnaire',
  data() {
    return {
      isSubmitting: false,
      responses: {
        // Demographic
        gender: '',
        ageGroup: '',
        
        // Recommendation System Usage
        recSystemUsage: '',
        chatgptUsage: '',
        filterBubblePerception: '',
        missedInterests: '',
        limitedInfo: '',
        unexpectedContent: '',
        diversePerspectives: '',
        
        // Big Five Personality Assessment
        // Openness to Experience
        openness1: '',
        openness2: '',
        // Conscientiousness
        conscientiousness1: '',
        conscientiousness2: '',
        // Extraversion
        extraversion1: '',
        extraversion2: '',
        // Agreeableness
        agreeableness1: '',
        agreeableness2: '',
        // Neuroticism
        neuroticism1: '',
        neuroticism2: '',
      }
    };
  },
  created() {
    // Log page view
    logUserEvent('view_initial_questionnaire');
  },
  methods: {
    async submitQuestionnaire() {
      this.isSubmitting = true;
      
      try {
        // Log form submission start
        logUserEvent('initial_questionnaire_submit_attempt');
        
        // Submit questionnaire responses to Firebase
        const success = await logQuestionnaireResponses('initial', this.responses);
        
        if (success) {
          // Log successful submission
          logUserEvent('initial_questionnaire_submitted', {
            timestamp: new Date().toISOString()
          });
          
          // Navigate to the first round conversation
          this.$router.push({ name: 'FirstRoundConversation' });
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

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-container input {
  margin-right: 0.5rem;
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
