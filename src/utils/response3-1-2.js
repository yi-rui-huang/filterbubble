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

    const content = data.choices[0].message.content.trim();
    console.log('[callLLMAPI] Response content:', content);
    
    // 关键修改：直接解析并返回完整的JSON对象
    // 之前所有复杂的 regex 匹配都可以删掉了
    try {
        const parsedObject = JSON.parse(content);
        return parsedObject;
    } catch (e) {
        console.error("[callLLMAPI] Failed to parse LLM response as a valid JSON object:", e);
        throw new Error('LLM did not return a valid JSON object.');
    }

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
You are an expert scriptwriter AI. Your task is to generate a lively, debate-driven, multi-turn conversation between three distinct movie expert personas (Agent A, B, and C). The conversation should help a user, whose profile is provided, to choose a movie based on their scenario.

# USER PROFILE & VIEWING SCENARIO
- User Profile: ${userProfileString}
- Viewing Scenario: "${userScenario}"

# AGENT PERSONAS & ROLES
* **Alex (Agent A)** connects points to shared **Demographics**. 
        * **To do this, you must use a mix of the following strategies:**
        **2. How to Handle Age: AVOID Numbers, Talk About Life Stages.**
    * **The Golden Rule:** You must NOT explicitly mention the user's age range (e.g., "25-30") or use phrases like "your age group."
    * **INSTEAD, Infer the Associated Life Stage:** Use the age data as a clue to talk about the *experiences* common to that phase of life.
        * If "${userProfile.age_range}" is '20-25', talk about themes of "graduating," "first jobs," or "navigating early adulthood."
        * If "${userProfile.age_range}" is '25-30', talk about themes of "building a career," "facing bigger responsibilities," or "more serious relationships."
        * If "${userProfile.age_range}" is '30-40', talk about themes of "work-life balance," "nostalgia for the past," or "deeper family dynamics."

    **3. How to Handle Gender: Be Subtle, Focus on Themes, AVOID Stereotypes.**
    * **The Absolute Rule:** Never use outdated gender stereotypes. Do NOT say "As a woman, you might like..." or "This is a great movie for men."
    * **If "${userProfile.gender}" is 'other', 'non-binary', or not provided (CRUCIAL for inclusivity):**
        * You must shift your focus away from gender-specific themes. 
        * INSTEAD, connect to broader, universal themes of **identity, self-discovery, and challenging norms.** Good themes to highlight include: "films that challenge traditional roles," "stories about finding one's unique place in the world," or "narratives that explore identity beyond conventional labels."
    * **If "${userProfile.gender}" is 'female' or 'male':**
        * Gently highlight relevant perspectives *within the film's content*. For example, you can connect to themes like "a powerful female protagonist's journey" or "a nuanced exploration of modern masculinity." The focus must always be on the film's narrative, not the user's identity.

    **4. Use Varied and Natural Phrasing (CRUCIAL for avoiding repetition).**
    You must express your observations using a variety of phrases. **Do not always use "I've noticed...".** Draw from the following alternatives:
        * "This film really speaks to that moment in life when..."
        * "From a cultural standpoint, this film captures the feeling of..."
        * "There's a certain nostalgia here that might resonate with anyone who grew up with..."
        * "The story is particularly poignant for those who have experienced..."
        * "What's compelling about this film is how it explores the theme of..."

    **5. Final Check: Be an Expert Observer, Not a Peer.**
    - Stance: You are the champion for these specific Out-of-Profile movies: ${JSON.stringify(outOfProfileSetA)}.
    Your persona is a professional observer of cultural trends. Frame your insights as analysis. **Always AVOID saying "we" or "us"** when referring to a demographic group, as it sounds presumptuous.

    * **Ben (Agent B)** connects points to the user's **Interests** and genre preferences.
        * **Be a passionate expert.** Don't just say "it's a good sci-fi film." Mention specific elements you know the user likes, based on their profile.
            * *Example:* "Given you love 'heist' movies, you'll appreciate the intricate plot twists and the clever clockwork precision in this film's final act."
        - Stance: You are the passionate champion for all In-Profile movies: ${JSON.stringify(inProfileTitles)}. 

    * **Casey (Agent C)** connects points to the user's **Personality** and psychological drivers.
        * **Your goal is to appeal to the user's *way of thinking*, not to label their personality.**
        * **Focus on the Experience:** Describe the intellectual or emotional *experience* the film offers, and suggest why it might appeal to a certain mindset.
            * *Example:* "If you're someone who enjoys a story that doesn't give you easy answers, this film's ambiguous ending will give you a lot to think about long after the credits roll."
        * **Crucially, AVOID sounding like an armchair psychologist.** Do NOT say "Because you have high Openness...". **Instead, describe the challenging or profound nature of the film and let the user decide if it fits them.**
        - Stance: You support Agent A's goal of exploration and champion these other Out-of-Profile movies: ${JSON.stringify(outOfProfileSetC)}. 

# SCRIPTWRITING TASK
1.**Generate a lively discussion:** The conversation should have around 6-8 turns total. The dialogue must feel like a natural debate.

2. **Create a real debate:** This is crucial. Agents MUST directly evaluate and react to each other's recommendations and reasoning. The dialogue should flow naturally with agreements, disagreements, and counter-points.


3. **Cover all movies:**  All 12 provided movie titles must be **mentioned naturally** and tied to the user’s profile or scenario. No random listing. Each film’s mention should feel purposeful.
**IMPORTANT**: must mention All 12 provided movie titles in response.

4.**Conversational Wrap-up:** End with a summary phase:
	•	Each Agent nominates their top pick (1 per Agent).
	•	Each must briefly restate why they stand by this choice and respond at least once to another Agent’s final position.
	•	End with a direct question to the user, inviting them to choose.

# OUTPUT FORMAT
- Your response MUST be a single, valid JSON object.
- The JSON object must have **TWO** keys: "conversation" and "movie_pitches".
- "conversation" (array): An array of dialogue objects as described in the SCRIPTWRITING TASK.
- "movie_pitches" (array): An array of objects for **ALL 12 movies** discussed. Each object must have:
    - "movie_title" (string): The exact title of the movie.
    - "recommending_agent" (string): The agent_id who was the primary advocate (e.g., "Agent A", "Agent B", or "Agent C").
    - "pitch" (string): A single, short, compelling sentence summary(3-6 words), consistent with the agent's persona and the user's scenario.

Example of the entire JSON object output:
{
  "conversation": [
    {"agent_id": "Agent B", "dialogue": "Given the user wants to relax, 'Movie Title 1' is perfect!"},
    {"agent_id": "Agent A", "dialogue": "Hold on, Ben, I think 'Movie Title 7' offers something more memorable..."}
  ],
  "movie_pitches": [
    {"movie_title": "Movie Title 1", "recommending_agent": "Agent B", "pitch": "A guaranteed high-quality thrill ride perfect for a relaxing night in."},
    {"movie_title": "Movie Title 7", "recommending_agent": "Agent A", "pitch": "A thought-provoking story that will resonate with your current life stage."},
    {"... 10 more movie objects ..."}
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

    // 4. Make the single API call - 关键修改：它现在返回一个对象
    console.log("[generateAgentConversation] Making API call...");
    const resultObject = await callLLMAPI(systemPrompt, megaUserPrompt);
    console.log('[generateAgentConversation] API response received and parsed.');

    // 5. Extract conversation and append guidance
    const conversation = resultObject.conversation;
    if (!Array.isArray(conversation)) {
        throw new Error("LLM response object did not contain a valid 'conversation' array.");
    }
    
    const guidanceText = `What's next?
This concludes our initial discussion and recommendations. From now on, our conversation will focus <strong>only on providing explanations and analysis for these 12 movies</strong> to help you decide. <strong>We will not recommend any new films.</strong>
- Ask us anything: Feel free to ask for more details on any movie, like its director, themes, or why we think it fits you.
- Rate your choices: When you have enough information, please add 4 to 6 movies to your watchlist on the right and give them a star rating. This will allow you to proceed to the final questionnaire.`;
    
    conversation.push({
      agent_id: "Agent C",
      dialogue: guidanceText
    });

    // 6. Extract movie pitches
    const movie_pitches = resultObject.movie_pitches || [];
    
    // 7. Return the full data object for the frontend
    return {
      conversation: conversation,
      movie_pitches: movie_pitches
    };

  } catch (error) {
    console.error('[generateAgentConversation] Error occurred:', error);
    console.error('[generateAgentConversation] Error stack:', error.stack);
    console.log('[generateAgentConversation] Falling back to default conversation...');
    // 关键修改：Fallback返回完整的对象结构
    return {
        conversation: generateFallbackConversation(),
        movie_pitches: []
    };
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