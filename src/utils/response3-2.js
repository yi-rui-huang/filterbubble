/**
 * Response Generator for Second Round Multi-Agent Movie Discussion
 * 
 * This module handles the second round of conversation by:
 * - Retrieving first round conversation history
 * - Generating agent responses based on their profiles and user messages
 * - Using LLM API for dynamic response generation
 */

import { API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config.js';

/**
 * Make API call to LLM for generating responses
 * @param {string} systemPrompt - System prompt defining the agent's role
 * @param {string} userPrompt - User prompt with context and requirements
 * @returns {Promise<string>} Generated response from LLM
 */
async function callLLMAPI(systemPrompt, userPrompt) {
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response format');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('LLM API call failed:', error);
    throw error;
  }
}

/**
 * Get conversation history from the first round
 * @param {Array} messageGroups - Message groups from the conversation
 * @returns {Array} Formatted conversation history for LLM context
 */
function getFirstRoundConversationHistory(messageGroups) {
  const conversationHistory = [];
  
  messageGroups.forEach((group, groupIndex) => {
    // Add user message
    conversationHistory.push({
      role: 'user',
      content: group.userMessage.text,
      timestamp: group.userMessage.timestamp
    });
    
    // Add agent responses
    group.agentMessages.forEach(agentMessage => {
      conversationHistory.push({
        role: 'agent',
        agent_id: agentMessage.sender,
        content: agentMessage.text,
        timestamp: agentMessage.timestamp
      });
    });
  });
  
  return conversationHistory;
}

/**
 * Generate agent responses for the second round based on user message and conversation history
 * @param {string} userMessage - User's latest message
 * @param {Array} messageGroups - Previous conversation history
 * @param {Object} agentProfilesData - Agent profiles data from Firestore
 * @returns {Promise<Array>} Array of agent responses in JSON format
 */
export async function generateSecondRoundResponse(userMessage, messageGroups, agentProfilesData) {
  try {
    // Validate inputs
    if (!userMessage || !agentProfilesData || !agentProfilesData.agentProfiles) {
      throw new Error('Missing required parameters: userMessage, messageGroups, or agentProfilesData');
    }

    if (!Array.isArray(agentProfilesData.agentProfiles) || agentProfilesData.agentProfiles.length !== 3) {
      throw new Error('agentProfiles must be an array of exactly 3 agents');
    }

    // Get conversation history
    const conversationHistory = getFirstRoundConversationHistory(messageGroups || []);
    
    // Generate responses using LLM
    const responses = await generateAgentResponses(
      userMessage,
      conversationHistory,
      agentProfilesData.agentProfiles
    );

    return responses;

  } catch (error) {
    console.error('Error generating second round response:', error);
    return generateFallbackResponse(userMessage);
  }
}

/**
 * Generate responses from all three agents using LLM API
 * @param {string} userMessage - User's latest message
 * @param {Array} conversationHistory - Previous conversation history
 * @param {Array} agentProfiles - Array of 3 agent profiles
 * @returns {Promise<Array>} Array of agent responses
 */
async function generateAgentResponses(userMessage, conversationHistory, agentProfiles) {
  // Map agents by their IDs for easier access
  const agentMap = {};
  agentProfiles.forEach(agent => {
    agentMap[agent.agent_id] = agent;
  });

  // Create system prompt for the conversation
  const systemPrompt = createSystemPrompt(agentProfiles, conversationHistory);
  
  // Create user prompt with the latest message
  const userPrompt = createUserPrompt(userMessage, conversationHistory);
  
  try {
    // Call LLM API to generate all agent responses
    const llmResponse = await callLLMAPI(systemPrompt, userPrompt);
    
    // Parse the JSON response
    const parsedResponse = parseAgentResponses(llmResponse);
    
    return parsedResponse;
    
  } catch (error) {
    console.error('Error generating agent responses with LLM:', error);
    return generateFallbackResponse(userMessage);
  }
}

/**
 * Create system prompt for the LLM based on agent profiles and conversation history
 * @param {Array} agentProfiles - Array of agent profiles
 * @param {Array} conversationHistory - Previous conversation history
 * @returns {string} System prompt
 */
function createSystemPrompt(agentProfiles, conversationHistory) {
  const agentDescriptions = agentProfiles.map(agent => {
    const matchDimension = agent.match_dimension || 'unknown';
    const agentName = getAgentName(agent.agent_id);
    
    return `- **${agent.agent_id} (${agentName}):** Matches user on **${matchDimension}**. ${agent.profile_description}`;
  }).join('\n');

  return `# SYSTEM PROMPT

## CONTEXT
You are an advanced AI model continuing your role as a trio of conversational agents: ${agentProfiles.map(a => `${getAgentName(a.agent_id)} (${a.agent_id})`).join(', ')}. You are in an ongoing conversation with a user about movie recommendations. You must strictly adhere to your established personas.

---

## AGENT PERSONAS & HISTORY
${agentDescriptions}

- **Previous Conversation History:**
${JSON.stringify(conversationHistory)}

---

## 📝 TASK
The user has now replied. Your task is to continue the discussion by responding to the user's latest query. Each of you should provide a short, in-character response.

Instructions:
1. Analyze the user's query and the conversation history.
2. Generate a response from each of the three agents.
3. Each agent's response must be consistent with their established persona and their stance in the previous conversation.
4. The agents should not just answer the user, but can also react to each other's new points to make the conversation feel dynamic.
5. Focus the discussion ONLY on the movie(s) or topics the user asked about. Do not introduce new movies unless specifically relevant.

---

## 📦 OUTPUT FORMAT
Generate the response as a single JSON array, where each object represents one turn of dialogue. Do not include any other text or explanation outside of the JSON array.

Example:
[
  {"agent_id": "Agent A", "dialogue": "That's an excellent question. From my perspective, what makes '{movie_title_user_asked_about}' so compelling is the psychological depth of the main character..."},
  {"agent_id": "Agent B", "dialogue": "See, I'm not so sure. To me, it felt a bit slow. I'd still argue that the direct thrill of '{a_previously_mentioned_movie}' is more entertaining."},
  {"agent_id": "Agent C", "dialogue": "I'm with Alex on this one. The themes it explores about 'mid-life crisis' are incredibly relevant and something I think we'd appreciate."}
]`;
}

/**
 * Create user prompt with the latest message and conversation context
 * @param {string} userMessage - User's latest message
 * @param {Array} conversationHistory - Previous conversation history
 * @returns {string} User prompt
 */
function createUserPrompt(userMessage, conversationHistory) {
  return `The user has now replied with: "${userMessage}"

Please generate responses from all three agents that:
1. Address the user's latest message directly
2. Stay consistent with each agent's established persona from the conversation history
3. Create a dynamic discussion where agents can react to each other
4. Focus only on the topics/movies the user mentioned
5. Keep responses concise but engaging (2-3 sentences each)

Remember to output ONLY the JSON array with no additional text.`;
}

/**
 * Parse agent responses from LLM output
 * @param {string} llmResponse - Raw response from LLM
 * @returns {Array} Parsed agent responses
 */
function parseAgentResponses(llmResponse) {
  try {
    // Clean the response to extract JSON
    let cleanedResponse = llmResponse.trim();
    
    // Remove any markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON array in the response
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    // Parse JSON
    const parsed = JSON.parse(cleanedResponse);
    
    if (Array.isArray(parsed)) {
      // Validate each response has required fields
      return parsed.filter(response => 
        response.agent_id && response.dialogue
      ).map(response => ({
        agent_id: response.agent_id,
        dialogue: response.dialogue.trim()
      }));
    }
    
    throw new Error('Response is not an array');
    
  } catch (error) {
    console.error('Error parsing agent responses:', error);
    console.error('Raw LLM response:', llmResponse);
    
    // Try to extract content manually if JSON parsing fails
    return extractResponsesManually(llmResponse);
  }
}

/**
 * Manually extract responses when JSON parsing fails
 * @param {string} response - Raw LLM response
 * @returns {Array} Extracted responses
 */
function extractResponsesManually(response) {
  const responses = [];
  const agentIds = ['Agent A', 'Agent B', 'Agent C'];
  
  agentIds.forEach(agentId => {
    // Look for agent responses in the text
    const regex = new RegExp(`"agent_id":\\s*"${agentId}"[^}]*"dialogue":\\s*"([^"]*)"`, 'i');
    const match = response.match(regex);
    
    if (match && match[1]) {
      responses.push({
        agent_id: agentId,
        dialogue: match[1].trim()
      });
    }
  });
  
  // If manual extraction fails, return fallback
  if (responses.length === 0) {
    return generateFallbackResponse("I'd like to hear more about that.");
  }
  
  return responses;
}

/**
 * Get agent display name from agent ID
 * @param {string} agentId - Agent ID (e.g., "Agent A")
 * @returns {string} Agent display name
 */
function getAgentName(agentId) {
  const nameMap = {
    'Agent A': 'Alex',
    'Agent B': 'Ben', 
    'Agent C': 'Casey'
  };
  return nameMap[agentId] || agentId;
}

/**
 * Generate fallback responses when LLM fails
 * @param {string} userMessage - User's message
 * @returns {Array} Fallback responses
 */
function generateFallbackResponse(userMessage) {
  return [
    {
      agent_id: "Agent A",
      dialogue: "That's a really interesting point you've raised. I'd love to explore that perspective further based on what we've discussed."
    },
    {
      agent_id: "Agent B",
      dialogue: "I can see where you're coming from, and it ties back nicely to some of the movies we talked about earlier."
    },
    {
      agent_id: "Agent C",
      dialogue: "This is exactly the kind of thoughtful discussion that makes movie conversations so engaging. What aspects resonate most with you?"
    }
  ];
}

// Export utility functions for testing
export { getFirstRoundConversationHistory, parseAgentResponses, getAgentName };