import axios from 'axios';
import { API_KEY, BASE_URL } from '../config';

/**
 * 基于用户问卷回答选择最佳的回复agent
 * @param {Object} questionnaireResponses - 用户填写的问卷回答
 * @param {Array} agents - 可选的agent类型数组
 * @returns {Promise<string|null>} - 返回推荐的agent类型或null
 */
export async function selectBestAgent(questionnaireResponses, agents) {
  // 构建prompt
  const prompt = `
Based on the following user profile, determine which movie discussion agent would be most suitable to respond first to this user.

User Profile:
- Movie watching frequency: ${questionnaireResponses.movieWatchingFrequency}
- Recommendation system usage: ${questionnaireResponses.recSystemUsage}
- ChatGPT for recommendations: ${questionnaireResponses.chatgptUsage}
${questionnaireResponses.favoriteGenres ? `- Favorite movie genres: ${questionnaireResponses.favoriteGenres}` : ''}
${questionnaireResponses.movieKnowledge ? `- Self-rated movie knowledge: ${questionnaireResponses.movieKnowledge}` : ''}

The available agents are:
1. Professional Critic: Has formal education in film studies and writes reviews professionally.
2. Indie Enthusiast: Passionate about independent and art-house cinema.
3. Blockbuster Fan: Loves mainstream movies, especially big franchises and action films.

Which ONE agent would be most appropriate to respond first based on this user's profile? 
Reply with ONLY the agent type: "professional_critic", "indie_enthusiast", or "blockbuster_fan".
`;

  try {
    // 调用LLM API
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that analyzes user preferences to match them with the most suitable movie expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // 设置较低的temperature以获得一致的回答
        max_tokens: 20 // 我们只需要简短的回答
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 30000
      }
    );

    // 处理LLM的回复
    const agentType = response.data.choices[0].message.content.trim().toLowerCase();
    
    // 确保返回的是有效的agent类型
    if (agents.includes(agentType)) {
      return agentType;
    } else {
      console.warn(`Invalid agent type returned by LLM: ${agentType}`, agents);
      return null; // 将使用默认逻辑
    }
  } catch (error) {
    console.error('Error selecting best agent:', error);
    return null; // 将使用默认逻辑
  }
}
