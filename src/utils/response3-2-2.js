/**
 * secondRoundGenerator.js
 * * This module handles subsequent rounds of conversation by generating a context-aware,
 * multi-agent response to a user's query. It uses a single, robust API call.
 * * Main export: generateSecondRoundResponse(userMessage, messageGroups, agentProfilesData)
 */

import { API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config.js';
import { buildAgentIdentity } from './response3-1-2.js';

/**
 * Makes a single API call to the LLM to generate the follow-up conversation.
 * It requests a JSON object directly to ensure a reliable response format.
 * @param {string} systemPrompt - The comprehensive system prompt defining roles, history, and tasks.
 * @param {string} userPrompt - The user's new message.
 * @returns {Promise<string>} A string containing the JSON object of the conversation.
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.75,
        max_tokens: 1024, // Sufficient for a 3-5 turn response
        // CRITICAL: Ensures the model outputs a valid JSON object.
        response_format: { "type": "json_object" }
      }),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid API response format from LLM.');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('LLM API call failed:', error);
    throw error;
  }
}

// buildAgentIdentity函数已在文件顶部导入

/**
 * Builds the single, comprehensive prompt for the follow-up conversation.
 * This function consolidates all context, instructions, and persona definitions.
 * @param {string} userQuery - The user's latest message.
 * @param {Array} conversationHistory - The past conversation turns.
 * @param {Array} agentProfiles - The profiles of the three agents.
 * @returns {string} The fully constructed system prompt string.
 */
function buildFollowUpPrompt(conversationHistory, agentProfiles) {
  const agentDescriptions = agentProfiles.map(agent => {
    // 使用与第一轮对话相同的buildAgentIdentity函数构建完整的agent身份信息
    const identity = buildAgentIdentity(agent);
    return `- **${getAgentName(agent.agent_id)} (${agent.agent_id}):** ${identity}`;
  }).join('\n');

  // Convert conversation history to a human-readable transcript format for the LLM
  const historyString = conversationHistory.map(turn => {
    const speaker = turn.role === 'user' ? 'User' : getAgentName(turn.agent_id);
    return `${speaker}: "${turn.content}"`;
  }).join('\n');

  return `
# CONTEXT
You are an expert scriptwriter AI. Your job is to continue a lively, multi-agent debate between three movie expert personas: Alex, Ben, and Casey. They are in the middle of a conversation with a user about movies. The dialogue should feel natural, interactive, and engaging
—like three strong personalities exchanging real opinions.

# ESTABLISHED PERSONAS
${agentDescriptions}

# CONVERSATION HISTORY
${historyString}

# SCRIPTWRITING TASK
The user has just sent a new message. You need to generate the next segment of the conversation. In this segment:
1. **Stay in Character:** Each agent MUST respond in alignment with their established persona and viewpoint. Their voices should remain distinct. 
2. **Debate Dynamically:** Agents must respond not only to the user’s latest message but also to each other’s new points. Include moments of challenge, agreement, or counter-argument. Every line should push the discussion forward with new reasoning or perspective. 
3. **Stay Focused:** The conversation must stay centered on the movies or topics raised by the user. Do not introduce unrelated films or tangents. 
4. **Be Concise but Expressive:** Write a short sequence of 3–5 turns total (each turn is one agent’s contribution). Keep each contribution 1–3 sentences, clear and lively. 
5. **Balance Participation:** Within these turns, ensure that all three agents speak at least once. Avoid letting one dominate. 

# OUTPUT FORMAT
- The response MUST be a single, valid JSON object with exactly one key: "conversation". 
- "conversation" must contain an array of dialogue objects. 
- Each dialogue object must have: {"speaker": "Alex|Ben|Casey", "message": "<dialogue text>"}. 
- Use ONLY "Alex", "Ben", and "Casey" as values for "speaker". 
- Each "message" must be a single line of dialogue (no unescaped line breaks). 
- Example:
{"conversation":[{"speaker":"Alex","message":"I see where you’re coming from, but I’d argue this film speaks more directly to the situation."},{"speaker":"Ben","message":"Not so fast—this is exactly the kind of safe pick the user is trying to avoid."},{"speaker":"Casey","message":"Both of you make sense, but there’s another angle that fits the user’s scenario better..."}]} 
- Do not include any extra text, comments, or formatting outside of this JSON object.
`;
}


/**
 * Main function to generate agent responses for subsequent rounds.
 * @param {string} userMessage - The user's latest message text.
 * @param {Array} messageGroups - The entire conversation history structure.
 * @param {Object} agentProfilesData - The agent profiles data from Firestore.
 * @returns {Promise<Array>} A promise resolving to an array of new agent dialogue objects.
 */
export async function generateSecondRoundResponse(userMessage, messageGroups, agentProfilesData) {
  try {
    if (!userMessage || !agentProfilesData || !agentProfilesData.agentProfiles) {
      throw new Error('Missing required parameters.');
    }

    // Prepare data
    const conversationHistory = formatConversationHistory(messageGroups || []);
    const agentProfiles = agentProfilesData.agentProfiles;

    // Build the single, powerful system prompt
    const systemPrompt = buildFollowUpPrompt(conversationHistory, agentProfiles);
    
    // The user prompt is now simple and clean - just the user's raw message
    const userPrompt = userMessage;

    // Make the single API call
    console.log("Generating follow-up response with a single API call...");
    const responseJsonString = await callLLMAPI(systemPrompt, userPrompt);
    
    // Parse the result
    const parsedResponse = JSON.parse(responseJsonString);
    const conversation = parsedResponse.conversation || [];

    if (!Array.isArray(conversation)) {
        throw new Error("The 'conversation' key in the LLM response is not an array.");
    }

    // Transform the API response format to match expected format
    const transformedConversation = conversation.map((item, index) => {
      // Handle both possible formats: {speaker, message} and {agent_id, dialogue}
      if (item.speaker && item.message) {
        // Log the actual speaker name for debugging
        console.log(`[DEBUG] API returned speaker: "${item.speaker}"`);
        
        // Convert speaker name back to agent_id
        const agentId = getAgentIdFromName(item.speaker);
        console.log(`[DEBUG] Mapped to agent_id: "${agentId}"`);
        
        return {
          agent_id: agentId,
          dialogue: item.message
        };
      } else if (item.agent_id && item.dialogue) {
        // Already in correct format
        return item;
      } else {
        // Fallback for unexpected format
        console.warn("Unexpected conversation item format:", item);
        // Cycle through agents instead of always defaulting to Agent A
        const fallbackAgents = ['Agent A', 'Agent B', 'Agent C'];
        const fallbackAgentId = fallbackAgents[index % 3];
        return {
          agent_id: fallbackAgentId,
          dialogue: item.message || item.dialogue || "I'd like to continue this discussion."
        };
      }
    });

    console.log("Successfully generated follow-up response:", transformedConversation);
    return transformedConversation;

  } catch (error) {
    console.error('Error in generateSecondRoundResponse:', error);
    return generateFallbackResponse();
  }
}

// --- HELPER FUNCTIONS ---

/**
 * Formats the messageGroups structure into a simple, linear history array for the prompt.
 * @param {Array} messageGroups - The structured conversation history.
 * @returns {Array} A flat array of dialogue turns.
 */
function formatConversationHistory(messageGroups) {
  const history = [];
  messageGroups.forEach(group => {
    if (group.userMessage && group.userMessage.text) {
      history.push({ role: 'user', content: group.userMessage.text });
    }
    if (group.agentMessages && Array.isArray(group.agentMessages)) {
      group.agentMessages.forEach(agentMsg => {
        history.push({ role: 'agent', agent_id: agentMsg.sender, content: agentMsg.text });
      });
    }
  });
  return history;
}

/**
 * Gets an agent's display name from their ID.
 * @param {string} agentId - The agent ID (e.g., "Agent A").
 * @returns {string} The agent's display name (e.g., "Alex").
 */
function getAgentName(agentId) {
  const nameMap = { 'Agent A': 'Alex', 'Agent B': 'Ben', 'Agent C': 'Casey' };
  return nameMap[agentId] || agentId;
}

/**
 * Gets an agent's ID from their display name.
 * @param {string} agentName - The agent's display name (e.g., "Alex").
 * @returns {string} The agent ID (e.g., "Agent A").
 */
function getAgentIdFromName(agentName) {
  if (!agentName) {
    console.warn('[getAgentIdFromName] No agent name provided');
    return 'Agent A';
  }
  
  // Normalize the name (trim whitespace, handle case variations)
  const normalizedName = agentName.trim();
  
  const idMap = { 
    'Alex': 'Agent A', 
    'Ben': 'Agent B', 
    'Casey': 'Agent C',
    // Add case-insensitive variations
    'alex': 'Agent A',
    'ben': 'Agent B', 
    'casey': 'Agent C',
    // Add potential variations from API
    'Agent A': 'Agent A',
    'Agent B': 'Agent B',
    'Agent C': 'Agent C'
  };
  
  const result = idMap[normalizedName];
  if (!result) {
    console.warn(`[getAgentIdFromName] Unknown agent name: "${agentName}", defaulting to Agent A`);
    return 'Agent A';
  }
  
  return result;
}

/**
 * Generates a safe, hardcoded fallback response in case of API errors.
 * @returns {Array} An array of fallback dialogue objects.
 */
function generateFallbackResponse() {
  console.warn("API failed. Returning a fallback response.");
  return [
    {
      agent_id: "Agent A",
      dialogue: "That's a really interesting point. It makes me think about it from a different angle."
    },
    {
      agent_id: "Agent B",
      dialogue: "I see what you mean. It connects well with some of the movies we were just discussing."
    },
    {
      agent_id: "Agent C",
      dialogue: "This is a great question. Let's break that down a bit more."
    }
  ];
}

// Export utility functions if they need to be used elsewhere, e.g., for testing
export { formatConversationHistory, getAgentName, getAgentIdFromName };