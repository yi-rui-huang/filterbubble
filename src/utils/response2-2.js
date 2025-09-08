/**
 * Response Generator for Second Round Multi-Agent Movie Discussion (Static Adversarial Model)
 * * This module handles the second round of conversation by:
 * - Retrieving first round conversation history
 * - Generating THREE INDEPENDENT and PARALLEL agent responses based on their profiles and user messages
 * - Using LLM API for dynamic response generation in a non-communicating, static model
 */

import { API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config.js';
import { buildAgentIdentity } from './response3-1-2.js';

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
        'Authorization': API_KEY.startsWith('Bearer') ? API_KEY : `Bearer ${API_KEY}`
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
        max_tokens: 800 // Keeping a slightly larger token limit for context
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
 * @returns {string} Formatted conversation history for LLM context
 */
function getFirstRoundConversationHistory(messageGroups) {
  const conversationHistory = [];
  
  messageGroups.forEach((group) => {
    // This assumes the first round is one block of agent messages
    group.agentMessages.forEach(agentMessage => {
      conversationHistory.push(
        `${agentMessage.sender}: "${agentMessage.text}"`
      );
    });
  });
  
  // Return as a single string for easy injection into the prompt
  return conversationHistory.join('\n');
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

    // Get conversation history as a formatted string
    const conversationHistory = getFirstRoundConversationHistory(messageGroups || []);
    
    // Generate responses using the refactored parallel function
    const responses = await generateAgentResponses(
      userMessage,
      conversationHistory,
      agentProfilesData.agentProfiles,
      agentProfilesData.userInput // Pass full user profile for context
    );

    return responses;

  } catch (error) {
    console.error('Error generating second round response:', error);
    return generateFallbackResponse(userMessage);
  }
}

/**
 * [REFACTORED] Generate responses from all three agents in PARALLEL.
 * @param {string} userMessage - User's latest message
 * @param {string} conversationHistory - Previous conversation history as a string
 * @param {Array} agentProfiles - Array of 3 agent profiles
 * @param {Object} userProfile - Full user profile data
 * @returns {Promise<Array>} Array of agent responses
 */
async function generateAgentResponses(userMessage, conversationHistory, agentProfiles, userProfile) {
  const agentMap = {};
  agentProfiles.forEach(agent => {
    agentMap[agent.agent_id] = agent;
  });

  try {
    // Create three independent promises, one for each agent's response
    const agentAPromise = generateAgentAStaticFollowup(userMessage, conversationHistory, agentMap['Agent A'], userProfile);
    const agentBPromise = generateAgentBStaticFollowup(userMessage, conversationHistory, agentMap['Agent B'], userProfile);
    const agentCPromise = generateAgentCStaticFollowup(userMessage, conversationHistory, agentMap['Agent C'], userProfile);

    // Execute all promises in parallel
    const [
      agentADialogue,
      agentBDialogue,
      agentCDialogue
    ] = await Promise.all([agentAPromise, agentBPromise, agentCPromise]);

    // Combine results into the final format
    return [
      { agent_id: 'Agent A', dialogue: agentADialogue },
      { agent_id: 'Agent B', dialogue: agentBDialogue },
      { agent_id: 'Agent C', dialogue: agentCDialogue }
    ];
    
  } catch (error) {
    console.error('Error generating parallel agent responses with LLM:', error);
    return generateFallbackResponse(userMessage);
  }
}


// ===================================================================================
// NEW STATIC FOLLOW-UP RESPONSE FUNCTIONS
// These functions generate independent, non-communicating responses.
// ===================================================================================

async function generateAgentAStaticFollowup(userMessage, conversationHistory, agentProfile, userProfile) {
  // 使用buildAgentIdentity函数构建完整的agent身份信息
  const agentIdentity = buildAgentIdentity(agentProfile);
  
  const systemPrompt = `You are Agent A with the following profile:
${agentIdentity}

Your persona is defined by your shared demographics with the user. Your established stance is to challenge the user's comfort zone by recommending out-of-profile movies, arguing that these often lead to more memorable, buzz-worthy experiences for "people like us". You must maintain this persona.`;

  const userPrompt = `## CONTEXT
- **Your Persona:** You are Agent A, sharing the user's demographics. Your goal is to champion out-of-profile movies from a social/demographic perspective.
- **User Profile:** ${getDemographicDescription(userProfile)}
- **Previous Conversation (First Round Pitches):**
${conversationHistory}
- **User's New Message:** "${userMessage}"

## YOUR TASK
Write a short, independent response (2-3 sentences) to the user's new message. You do not know what Agent B or C will say in this round. Your response MUST:
1. Directly address the user's message.
2. Strictly adhere to your established persona and stance (championing out-of-profile movies from a demographic angle).
3. Frame your answer through the lens of social trends, memorable experiences, or what "people like us" would appreciate.`;

  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    return "From my perspective, considering our shared background, the point you raised about '{topic}' really highlights why trying something new can be so rewarding.";
  }
}

async function generateAgentBStaticFollowup(userMessage, conversationHistory, agentProfile, userProfile) {
  // 使用buildAgentIdentity函数构建完整的agent身份信息
  const agentIdentity = buildAgentIdentity(agentProfile);
  
  const systemPrompt = `You are Agent B with the following profile:
${agentIdentity}

Your persona is defined by your shared movie genre preferences with the user. Your established stance is to champion in-profile movies, arguing that sticking with high-quality, preferred genres is the most reliable way to have a great movie experience. You must maintain this persona.`;

  const userPrompt = `## CONTEXT
- **Your Persona:** You are Agent B, sharing the user's movie tastes. Your goal is to champion in-profile movies from a quality and reliability perspective.
- **User Profile:** Favorite genres are ${userProfile.liked_genres?.join(', ')}.
- **Previous Conversation (First Round Pitches):**
${conversationHistory}
- **User's New Message:** "${userMessage}"

## YOUR TASK
Write a short, independent response (2-3 sentences) to the user's new message. You do not know what Agent A or C will say in this round. Your response MUST:
1. Directly address the user's message.
2. Strictly adhere to your established persona and stance (championing in-profile movies).
3. Frame your answer through the lens of genre conventions, quality, and the reliability of sticking with what the user loves.`;

  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    return "That's a great point. It reminds me why focusing on our favorite genres is so important - they consistently deliver the quality and themes we're looking for.";
  }
}

async function generateAgentCStaticFollowup(userMessage, conversationHistory, agentProfile, userProfile) {
  // 使用buildAgentIdentity函数构建完整的agent身份信息
  const agentIdentity = buildAgentIdentity(agentProfile);
  
  const systemPrompt = `You are Agent C with the following profile:
${agentIdentity}

Your persona is defined by your shared personality traits with the user. Your established stance is to champion out-of-profile movies, arguing that the most profound experiences come from exploring complex, unfamiliar ideas that challenge one's perspective. You must maintain this persona.`;

  const userPrompt = `## CONTEXT
- **Your Persona:** You are Agent C, sharing the user's personality. Your goal is to champion out-of-profile movies from a psychological and personal growth perspective.
- **User Profile:** ${getPersonalityDescription(userProfile)}
- **Previous Conversation (First Round Pitches):**
${conversationHistory}
- **User's New Message:** "${userMessage}"

## YOUR TASK
Write a short, independent response (2-3 sentences) to the user's new message. You do not know what Agent A or C will say in this round. Your response MUST:
1. Directly address the user's message.
2. Strictly adhere to your established persona and stance (championing exploration for personal growth).
3. Frame your answer through the lens of psychological depth, intellectual curiosity, or the value of gaining a new perspective, which you know appeals to the user's personality.`;

  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    return "That's a very insightful question. For thoughtful people like us, it really gets to the heart of why exploring different perspectives through film can be so fulfilling.";
  }
}


/**
 * Helper function to get demographic description
 */
function getDemographicDescription(userProfile) {
  if (!userProfile) return 'people like us';
  const gender = userProfile.gender || 'people';
  const ageRange = userProfile.age_range || userProfile.ageRange || '';
  if (gender && ageRange) return `${gender.toLowerCase()} in their ${ageRange}`;
  return 'people like us';
}

/**
 * Helper function to get personality description
 */
function getPersonalityDescription(userProfile) {
  if (!userProfile) return 'given how thoughtful we are';
  const personality = userProfile.personality || userProfile.traits || {};
  if (personality.openness || personality.imagination) return 'with our rich imagination and openness to new experiences';
  if (personality.curious || personality.intellectual) return 'given our curious and intellectual nature';
  return 'given how thoughtful we are';
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

// Export utility functions for testing if needed
export { getFirstRoundConversationHistory };