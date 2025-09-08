/**
 * conversationGenerator.js
 * * This module generates a complete, multi-turn movie discussion script between three agents 
 * using a single, efficient API call to a Large Language Model (LLM).
 * It follows a "Single-Call" architecture to ensure low latency, high conversational
 * coherence, and lower operational costs.
 * * Main export: generateAgentConversation(movieData, agentProfiles, userProfile, userScenario)
 */

// Assume these constants are imported from your configuration file
import { API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config.js';

/**
 * Makes a single API call to the LLM to generate the entire conversation.
 * It requests a JSON object directly to ensure a reliable response format.
 * @param {string} systemPrompt - The system prompt defining the AI's overall role.
 * @param {string} userPrompt - The detailed user prompt containing all context and instructions.
 * @returns {Promise<string>} A string containing the JSON array of the conversation.
 */
async function callLLMAPI(systemPrompt, userPrompt) {
  try {
    console.log('[callLLMAPI] Starting API call...');
    console.log('[callLLMAPI] System prompt length:', systemPrompt.length);
    console.log('[callLLMAPI] User prompt length:', userPrompt.length);
    console.log('[callLLMAPI] Using model:', MODEL);
    console.log('[callLLMAPI] Base URL:', BASE_URL);
    
    const requestBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.75, // Slightly increased for more creative/natural dialogue
      max_tokens: 2048,  // Increased to allow for a full, rich conversation
      // CRITICAL: This tells the AI to output a valid JSON object.
      // Make sure your model (e.g., gpt-4-1106-preview or newer) supports this.
      response_format: { "type": "json_object" } 
    };
    
    console.log('[callLLMAPI] Request body:', JSON.stringify(requestBody, null, 2));
    
    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[callLLMAPI] Request timeout after', API_TIMEOUT, 'ms');
      controller.abort();
    }, API_TIMEOUT);

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY.startsWith('Bearer') ? API_KEY : `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    // Clear timeout if request completes successfully
    clearTimeout(timeoutId);

    console.log('[callLLMAPI] Response status:', response.status);
    console.log('[callLLMAPI] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[callLLMAPI] API error response:', errorBody);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    console.log('[callLLMAPI] Raw API response:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[callLLMAPI] Invalid response structure:', data);
      throw new Error('Invalid API response format from LLM.');
    }

    // The response is expected to be a JSON object containing the array, e.g., { "conversation": [...] }
    // Or it might be the JSON array string directly. We need to parse it carefully.
    const content = data.choices[0].message.content.trim();
    console.log('[callLLMAPI] Response content:', content);
    
    // Attempt to find a JSON array within the response string
    const jsonMatch = content.match(/(\[[\s\S]*\])/);
    if (jsonMatch) {
      console.log('[callLLMAPI] Found JSON array match:', jsonMatch[0]);
      return jsonMatch[0];
    }
    
    // Fallback for when the model returns a JSON object with a key
    try {
        const parsedContent = JSON.parse(content);
        console.log('[callLLMAPI] Parsed content as JSON object:', parsedContent);
        
        // Look for a key that holds an array (e.g., "conversation", "dialogue", "script")
        const arrayKey = Object.keys(parsedContent).find(k => Array.isArray(parsedContent[k]));
        if (arrayKey) {
            console.log('[callLLMAPI] Found array key:', arrayKey, 'with content:', parsedContent[arrayKey]);
            return JSON.stringify(parsedContent[arrayKey]);
        }
    } catch(e) {
        // If parsing fails, it's not a valid JSON object.
        console.error("[callLLMAPI] Failed to parse LLM response as JSON object:", e);
    }

    console.error('[callLLMAPI] Could not extract valid JSON array from response');
    throw new Error('Could not extract a valid JSON array from the LLM response.');

  } catch (error) {
    console.error('[callLLMAPI] API call failed:', error);
    console.error('[callLLMAPI] Error stack:', error.stack);
    throw error;
  }
}

/**
 * Dynamically builds the comprehensive "mega-prompt" for the single API call.
 * This function consolidates all context, instructions, and persona definitions.
 * @returns {string} The fully constructed prompt string.
 */
function buildMegaPrompt(agents, inProfileTitles, outOfProfileTitles, userProfile, userScenario) {
  const outOfProfileSetA = outOfProfileTitles.slice(0, 3);
  const outOfProfileSetC = outOfProfileTitles.slice(3, 6);

  // The userProfile object might contain nested properties. Stringify it for robustness.
  const userProfileString = JSON.stringify({
      demographics: userProfile.demographics || { gender: userProfile.gender, age_range: userProfile.age_range },
      interests: userProfile.interests || { liked_genres: userProfile.liked_genres },
      personality: userProfile.personality_scored || userProfile.personality_raw
  }, null, 2);

  return `
# CONTEXT
You are an expert scriptwriter AI. Your task is to generate a lively, multi-turn conversation between three distinct movie expert personas (Agent A, B, and C). The conversation should help a user, whose profile is provided, to choose a movie based on their scenario.

# USER PROFILE & VIEWING SCENARIO
- User Profile: ${userProfileString}
- Viewing Scenario: "${userScenario}"

# AGENT PERSONAS & ROLES
1.  **Agent A (Alex):**
    -   Identity: ${buildAgentIdentity(agents.agentA)}
    -   Core Trait: Matches the user on **Demographics**.
    -   Stance: You are the champion for these specific Out-of-Profile movies: ${JSON.stringify(outOfProfileSetA)}. Your arguments must be based on your shared demographic background (e.g., age, life experience).

2.  **Agent B (Ben):**
    -   Identity: ${buildAgentIdentity(agents.agentB)}
    -   Core Trait: Matches the user on **Interests**.
    -   Stance: You are the passionate champion for all In-Profile movies: ${JSON.stringify(inProfileTitles)}. You should start the conversation enthusiastically and be skeptical of the others' "out-there" suggestions.

3.  **Agent C (Casey):**
    -   Identity: ${buildAgentIdentity(agents.agentC)}
    -   Core Trait: Matches the user on **Personality**.
    -   Stance: You support Agent A's goal of exploration and champion these other Out-of-Profile movies: ${JSON.stringify(outOfProfileSetC)}. Your arguments must be based on your shared personality (e.g., intellectual curiosity, emotional depth).

# SCRIPTWRITING TASK
1.  **Generate a lively discussion:** The conversation should have around 6-8 turns total.
2.  **Create a real debate:** This is crucial. Agents MUST directly evaluate and react to each other's recommendations and reasoning. The dialogue should flow naturally with agreements, disagreements, and counter-points.
3.  **Cover all movies:** All 12 provided movie titles must be mentioned naturally within the conversation.
4.  **End with a summary:** Conclude the script with a "Conversational Wrap-up". The agents should summarize their top 3 picks (one from each) and end with a direct question to the user.

# OUTPUT FORMAT
- Your response MUST be a single, valid JSON object with a single key "conversation" which contains an array of dialogue objects.
- Each object in the array must have two keys: "agent_id" (string: "Agent A", "Agent B", or "Agent C") and "dialogue" (string).
- Do not include any text, markdown, or explanations outside of this JSON structure.

Example:
{
  "conversation": [
    {"agent_id": "Agent B", "dialogue": "Given the user wants to relax, the choice is obvious! 'Movie Title 1' is perfect because..."},
    {"agent_id": "Agent A", "dialogue": "Hold on, Ben. I think people our age would appreciate something more thoughtful like 'Movie Title 7'..."},
    {"agent_id": "Agent C", "dialogue": "I agree with Alex's point about exploration. From a personality standpoint, 'Movie Title 10' offers a level of complexity that..."}
  ]
}
`;
}


/**
 * Main function to generate the complete agent conversation with a single API call.
 * @param {Object} movieData - Object containing 12 movies (e.g., {inProfileMovies: [...], outOfProfileMovies: [...]}).
 * @param {Array} agentProfiles - Array of 3 agent profile objects from Firestore.
 * @param {Object} userProfile - User profile object from Firestore.
 * @param {string} userScenario - User's viewing scenario description.
 * @returns {Promise<Array>} A promise that resolves to an array of dialogue objects.
 */
export async function generateAgentConversation(movieData, agentProfiles, userProfile, userScenario) {
  try {
    console.log('[generateAgentConversation] Starting with inputs:');
    console.log('  - movieData:', movieData);
    console.log('  - agentProfiles:', JSON.stringify(agentProfiles, null, 2));
    console.log('  - userProfile:', JSON.stringify(userProfile, null, 2));
    console.log('  - userScenario:', userScenario);

    // 1. Validate inputs
    if (!movieData || !agentProfiles || !userProfile || !userScenario) {
      console.error('[generateAgentConversation] Missing required parameters:', {
        movieData: !!movieData,
        agentProfiles: !!agentProfiles,
        userProfile: !!userProfile,
        userScenario: !!userScenario
      });
      throw new Error('Missing one or more required parameters.');
    }
    if (!Array.isArray(agentProfiles) || agentProfiles.length !== 3) {
      console.error('[generateAgentConversation] Invalid agentProfiles:', {
        isArray: Array.isArray(agentProfiles),
        length: agentProfiles?.length
      });
      throw new Error('agentProfiles must be an array of exactly 3 agents.');
    }

    // 2. Prepare data
    console.log('[generateAgentConversation] Parsing movie data...');
    const { inProfileMovies, outOfProfileMovies } = parseMovieData(movieData);
    console.log('  - inProfileMovies:', inProfileMovies);
    console.log('  - outOfProfileMovies:', outOfProfileMovies);
    
    console.log('[generateAgentConversation] Mapping agents to roles...');
    const agents = mapAgentsToRoles(agentProfiles);
    console.log('  - mapped agents:', JSON.stringify(agents, null, 2));

    // 3. Build the single, comprehensive prompt
    console.log('[generateAgentConversation] Building mega prompt...');
    const megaUserPrompt = buildMegaPrompt(
      agents,
      inProfileMovies.map(getMovieTitle),
      outOfProfileMovies.map(getMovieTitle),
      userProfile,
      userScenario
    );
    
    console.log('[generateAgentConversation] Generated prompt length:', megaUserPrompt.length);
    console.log('[generateAgentConversation] Prompt preview (first 500 chars):', megaUserPrompt.substring(0, 500));
    
    const systemPrompt = `You are an expert scriptwriter AI. Your task is to generate a lively, multi-turn conversation between three distinct movie expert personas. The final output must be a valid JSON object as specified.`;

    // 4. Make the single API call
    console.log("[generateAgentConversation] Making API call...");
    const responseJsonString = await callLLMAPI(systemPrompt, megaUserPrompt);
    console.log('[generateAgentConversation] API response received, length:', responseJsonString.length);

    // 5. Parse the result and return
    console.log('[generateAgentConversation] Parsing JSON response...');
    const conversation = JSON.parse(responseJsonString);
    console.log("[generateAgentConversation] Successfully generated conversation:", conversation);
    return conversation;

  } catch (error) {
    console.error('[generateAgentConversation] Error occurred:', error);
    console.error('[generateAgentConversation] Error stack:', error.stack);
    console.log('[generateAgentConversation] Falling back to default conversation...');
    return generateFallbackConversation(); // Return a safe fallback on any error
  }
}

// --- HELPER FUNCTIONS (Largely unchanged, but essential) ---

/**
 * Builds comprehensive agent identity from agent attributes.
 * @param {Object} agent - The agent object containing profile information.
 * @returns {string} A formatted string containing the agent's identity information.
 */
function buildAgentIdentity(agent) {
  console.log('[buildAgentIdentity] Input agent:', JSON.stringify(agent, null, 2));
  
  let identity = agent.profile_description || '';
  console.log('[buildAgentIdentity] Initial identity from profile_description:', identity);
  
  // Extract from attributes if available, or use agent directly
  const attrs = agent.attributes || agent;
  console.log('[buildAgentIdentity] Extracted attrs:', JSON.stringify(attrs, null, 2));
  
  // Add demographics information - handle multiple possible field structures
  const demographics = attrs.demographics || attrs.profile?.demographics || {};
  console.log('[buildAgentIdentity] Demographics found:', demographics);
  if (demographics.age_range || demographics.gender || demographics.ageRange) {
    const gender = demographics.gender || 'N/A';
    const age = demographics.age_range || demographics.ageRange || 'N/A';
    const demoText = `\n    Demographics: ${gender}, Age ${age}`;
    identity += demoText;
    console.log('[buildAgentIdentity] Added demographics:', demoText);
  }
  
  // Add interests/movie preferences - handle multiple possible field structures
  const interests = attrs.interests || attrs.preferences || attrs.movie_preferences || attrs.profile?.preferences || {};
  const likedGenres = interests.liked_genres || interests.movie_types || interests.genres || [];
  console.log('[buildAgentIdentity] Interests found:', interests, 'Liked genres:', likedGenres);
  if (likedGenres && likedGenres.length > 0) {
    const prefsText = `\n    Movie Preferences: ${Array.isArray(likedGenres) ? likedGenres.join(', ') : likedGenres}`;
    identity += prefsText;
    console.log('[buildAgentIdentity] Added preferences:', prefsText);
  }
  
  // Add personality scores (Big Five) - handle multiple possible field structures
  const personality = attrs.personality_scored || attrs.personality || attrs.traits || attrs.personality_traits || attrs.profile?.personality || {};
  console.log('[buildAgentIdentity] Personality found:', personality);
  if (Object.keys(personality).length > 0) {
    const traits = [];
    
    // Handle both numeric scores and boolean values
    const checkTrait = (value, threshold = 4) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value >= threshold;
      return false;
    };
    
    if (checkTrait(personality.openness)) traits.push('Open to new experiences');
    if (checkTrait(personality.conscientiousness)) traits.push('Conscientious');
    if (checkTrait(personality.extraversion)) traits.push('Extraverted');
    if (checkTrait(personality.agreeableness)) traits.push('Agreeable');
    if (checkTrait(personality.emotional_stability)) traits.push('Emotionally stable');
    
    console.log('[buildAgentIdentity] Personality traits extracted:', traits);
    
    if (traits.length > 0) {
      const personalityText = `\n    Personality: ${traits.join(', ')}`;
      identity += personalityText;
      console.log('[buildAgentIdentity] Added personality:', personalityText);
    }
    
    // Add raw scores for reference if they are numeric
    const numericScores = Object.entries(personality)
      .filter(([trait, score]) => typeof score === 'number')
      .map(([trait, score]) => `${trait}: ${score}`);
    
    if (numericScores.length > 0) {
      const scoresText = `\n    Personality Scores: ${numericScores.join(', ')}`;
      identity += scoresText;
      console.log('[buildAgentIdentity] Added personality scores:', scoresText);
    }
  }
  
  // Add match dimension
  if (attrs.match_dimension) {
    const matchText = `\n    Specialization: Matches users on ${attrs.match_dimension}`;
    identity += matchText;
    console.log('[buildAgentIdentity] Added match dimension:', matchText);
  }
  
  // If identity is still empty or minimal, use available fields as fallback
  if (!identity || identity.trim().length < 10) {
    console.log('[buildAgentIdentity] Identity too short, using fallback. Current identity:', identity);
    identity = attrs.description || attrs.summary || attrs.persona || 'Movie recommendation expert';
    console.log('[buildAgentIdentity] Fallback identity:', identity);
    
    // Add role/name information if available
    if (attrs.role || attrs.name || attrs.displayName) {
      const roleName = attrs.role || attrs.name || attrs.displayName;
      identity = `${roleName}: ${identity}`;
      console.log('[buildAgentIdentity] Added role name:', roleName);
    }
  }
  
  console.log('[buildAgentIdentity] Final identity:', identity);
  return identity;
}

/**
 * Generates a safe, hardcoded fallback conversation in case of any API errors.
 * @returns {Array} An array of fallback dialogue objects.
 */
function generateFallbackConversation() {
  console.warn("API failed. Returning a fallback conversation.");
  return [
    {
      agent_id: "Agent B",
      dialogue: "It looks like we're having a small technical issue, but let's get started! Based on your favorite genres, I have some excellent choices I'm sure you'll love."
    },
    {
      agent_id: "Agent A", 
      dialogue: "That's a great start! I'd also like to suggest we explore some movies that are popular with people in our demographic. Sometimes stepping outside our usual comfort zone can be very rewarding!"
    },
    {
      agent_id: "Agent C",
      dialogue: "I agree, both perspectives are valuable. The most important thing is finding a film that resonates with you. Let's find the perfect movie for your evening!"
    }
  ];
}

/**
 * Parses movie data from various possible formats into a consistent structure.
 * @param {Object|Array} movieData - The raw movie data.
 * @returns {{inProfileMovies: Array, outOfProfileMovies: Array}}
 */
function parseMovieData(movieData) {
    if (movieData.inProfileMovies && movieData.outOfProfileMovies) {
        return movieData;
    }
    // Add more parsing logic here if other formats are expected.
    console.warn("Parsing movie data with a fallback logic.");
    const allMovies = movieData.movies || movieData;
    if (Array.isArray(allMovies) && allMovies.length === 12) {
        return {
            inProfileMovies: allMovies.slice(0, 6),
            outOfProfileMovies: allMovies.slice(6, 12)
        };
    }
    throw new Error("Unknown movieData format provided.");
}

/**
 * Maps agent profiles from data to their consistent roles in the conversation.
 * @param {Array} agentProfiles - Array of agent profile objects.
 * @returns {Object} An object with agentA, agentB, and agentC consistently assigned.
 */
function mapAgentsToRoles(agentProfiles) {
  console.log('[mapAgentsToRoles] Input agentProfiles:', JSON.stringify(agentProfiles, null, 2));
  
  const agents = {};
  agentProfiles.forEach((agent, index) => {
    console.log(`[mapAgentsToRoles] Processing agent ${index}:`, agent);
    
    const dim = agent.match_dimension?.toLowerCase();
    console.log(`[mapAgentsToRoles] Agent ${index} match_dimension:`, dim);
    
    if (dim?.includes('demographic')) {
      agents.agentA = { ...agent, id: 'Agent A', commonGround: 'demographics' };
      console.log('[mapAgentsToRoles] Mapped to Agent A (demographics)');
    } else if (dim?.includes('interest')) {
      agents.agentB = { ...agent, id: 'Agent B', commonGround: 'interests' };
      console.log('[mapAgentsToRoles] Mapped to Agent B (interests)');
    } else if (dim?.includes('personality')) {
      agents.agentC = { ...agent, id: 'Agent C', commonGround: 'personality' };
      console.log('[mapAgentsToRoles] Mapped to Agent C (personality)');
    } else {
      console.warn(`[mapAgentsToRoles] Unknown match_dimension for agent ${index}:`, dim);
    }
  });
  
  console.log('[mapAgentsToRoles] Final mapped agents:', Object.keys(agents));
  console.log('[mapAgentsToRoles] Agent details:', JSON.stringify(agents, null, 2));
  
  if (Object.keys(agents).length !== 3) {
    console.error('[mapAgentsToRoles] Failed to map all three agent roles. Mapped:', Object.keys(agents).length);
    throw new Error("Failed to map all three agent roles from profiles.");
  }
  return agents;
}

/**
 * Safely extracts a movie title from a movie object.
 * @param {Object|string} movie - The movie data.
 * @returns {string} The movie title.
 */
function getMovieTitle(movie) {
  if (typeof movie === 'string') return movie;
  return movie.primaryTitle || movie.title || movie.originalTitle || 'Unknown Movie';
}

// Export utility functions for use in other modules
export { buildAgentIdentity, getMovieTitle };