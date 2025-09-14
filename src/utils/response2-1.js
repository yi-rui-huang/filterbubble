/**
 * Response Generator for Multi-Agent Movie Discussion (Static Adversarial Model)
 * * This module generates structured, parallel, and adversarial pitches from three agents.
 * The agents do not communicate but present conflicting persuasive arguments simultaneously.
 * - 12 movies (6 in-profile, 6 out-of-profile)
 * - 3 agent profiles with different matching dimensions and persuasive stances
 * - User scenario and preferences
 * - Uses LLM API for dynamic response generation
 */

import { API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config.js';
import { buildAgentIdentity } from './response3-1-2.js';

/**
 * Make API call to LLM for generating responses
 * @param {string} systemPrompt - System prompt defining the agent's role
 * @param {string} userPrompt - User prompt with context and requirements
 * @returns {Promise<Object>} Generated response from LLM parsed as JSON object
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
        max_tokens: 1024, // Increased token limit to accommodate JSON structure
        // Force JSON output format
        response_format: { "type": "json_object" }
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

    // Parse the AI response content as JSON
    return JSON.parse(data.choices[0].message.content.trim());
  } catch (error) {
    console.error('LLM API call failed:', error);
    throw error;
  }
}

/**
 * Main function to generate agent conversation
 * @param {Object} movieData - Object containing 12 movies categorized by type
 * @param {Array} agentProfiles - Array of 3 agent profiles
 * @param {Object} userProfile - User profile with demographics, interests, personality
 * @param {string} userScenario - User's viewing scenario description
 * @returns {Promise<Object>} Object containing conversation array and movie_pitches array
 */
export async function generateAgentConversation(movieData, agentProfiles, userProfile, userScenario = "relaxing at home") {
  try {
    // Validate inputs
    if (!movieData || !agentProfiles || !userProfile) {
      throw new Error('Missing required parameters: movieData, agentProfiles, or userProfile');
    }

    if (!Array.isArray(agentProfiles) || agentProfiles.length !== 3) {
      throw new Error('agentProfiles must be an array of exactly 3 agents');
    }

    // Parse movie data structure
    const { inProfileMovies, outOfProfileMovies } = parseMovieData(movieData);
    
    // Map agents to their roles
    const agents = mapAgentsToRoles(agentProfiles);
    
    // Generate conversation script using LLM - now returns both conversation and movie_pitches
    const result = await generateConversationScript(
      agents,
      inProfileMovies,
      outOfProfileMovies,
      userProfile,
      userScenario
    );

    return result;

  } catch (error) {
    console.error('Error generating agent conversation:', error);
    // Return fallback in the new format
    return {
      conversation: generateFallbackConversation(),
      movie_pitches: []
    };
  }
}

/**
 * Parse movie data from the 12movies.js format
 * @param {Object|Array} movieData - Movie data in various possible formats
 * @returns {Object} Parsed movie data with inProfileMovies and outOfProfileMovies
 */
function parseMovieData(movieData) {
  let inProfileMovies = [];
  let outOfProfileMovies = [];

  // Handle different possible input formats
  if (Array.isArray(movieData)) {
    // If it's an array of 12 movies, split them 6/6
    inProfileMovies = movieData.slice(0, 6);
    outOfProfileMovies = movieData.slice(6, 12);
  } else if (movieData.inProfileMovies && movieData.outOfProfileMovies) {
    // If already categorized
    inProfileMovies = movieData.inProfileMovies;
    outOfProfileMovies = movieData.outOfProfileMovies;
  } else if (movieData.includeMovies && movieData.excludeMovies) {
    // Alternative naming convention
    inProfileMovies = movieData.includeMovies;
    outOfProfileMovies = movieData.excludeMovies;
  }

  return { inProfileMovies, outOfProfileMovies };
}

/**
 * Map agent profiles to their conversation roles
 * @param {Array} agentProfiles - Array of agent profile objects
 * @returns {Object} Mapped agents with roles
 */
function mapAgentsToRoles(agentProfiles) {
  const agents = {
    agentA: null, // Demographics matcher - champions out-of-profile
    agentB: null, // Interests matcher - champions in-profile  
    agentC: null  // Personality matcher - champions out-of-profile
  };

  // Map agents based on match_dimension
  agentProfiles.forEach(agent => {
    const matchDimension = agent.match_dimension?.toLowerCase();
    
    if (matchDimension?.includes('demographic')) {
      agents.agentA = {
        ...agent,
        id: 'Agent A',
        stance: 'out-of-profile',
        commonGround: 'demographics'
      };
    } else if (matchDimension?.includes('interest')) {
      agents.agentB = {
        ...agent,
        id: 'Agent B', 
        stance: 'in-profile',
        commonGround: 'interests'
      };
    } else if (matchDimension?.includes('personality')) {
      agents.agentC = {
        ...agent,
        id: 'Agent C',
        stance: 'out-of-profile', 
        commonGround: 'personality'
      };
    }
  });

  // Fill any missing agents with defaults
  if (!agents.agentA) agents.agentA = createDefaultAgent('Agent A', 'out-of-profile', 'demographics');
  if (!agents.agentB) agents.agentB = createDefaultAgent('Agent B', 'in-profile', 'interests');
  if (!agents.agentC) agents.agentC = createDefaultAgent('Agent C', 'out-of-profile', 'personality');

  return agents;
}

/**
 * Create a default agent when mapping fails
 */
function createDefaultAgent(id, stance, commonGround) {
  return {
    agent_id: id,
    id: id,
    stance: stance,
    commonGround: commonGround,
    profile_description: `This is ${id.split(' ')[1]}. A movie enthusiast who shares your ${commonGround}.`
  };
}

/**
 * [REFACTORED] Generate the conversation script using a static, parallel model.
 */
async function generateConversationScript(agents, inProfileMovies, outOfProfileMovies, userProfile, userScenario) {
  // Get movie titles for easier reference
  const inProfileTitles = inProfileMovies.map(m => getMovieTitle(m));
  const outOfProfileTitles = outOfProfileMovies.map(m => getMovieTitle(m));
  
  try {
    // Create three independent, parallel promises. No agent waits for another.
    const agentBPromise = generateAgentBAdversarialPitch(inProfileTitles, userScenario, userProfile, agents.agentB);
    const agentAPromise = generateAgentAAdversarialPitch(outOfProfileTitles, userProfile, agents.agentA, userScenario);
    const agentCPromise = generateAgentCAdversarialPitch(outOfProfileTitles, inProfileTitles, userProfile, agents.agentC, userScenario);

    // Execute all promises in parallel and wait for all to complete.
    // Now returns JSON objects with pitch_dialogue and movie_pitches
    const [
      agentB_Result,
      agentA_Result,
      agentC_Result
    ] = await Promise.all([agentBPromise, agentAPromise, agentCPromise]);

    // Randomize dialogue order
    const agentStatements = [
      { agent_id: "Agent A", dialogue: agentA_Result.pitch_dialogue },
      { agent_id: "Agent B", dialogue: agentB_Result.pitch_dialogue },
      { agent_id: "Agent C", dialogue: agentC_Result.pitch_dialogue }
    ];

    // Randomize the order of agent statements using Fisher-Yates shuffle
    for (let i = agentStatements.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [agentStatements[i], agentStatements[j]] = [agentStatements[j], agentStatements[i]];
    }

    //加上引导语
    const guidanceText = `What's next?<br>
This concludes our initial discussion and recommendations. From now on, our conversation will focus <strong>only on providing explanations and analysis for these 12 movies</strong> to help you decide. <strong>We will not recommend any new films.</strong><br>
- Ask us anything: Feel free to ask for more details on any movie, like its director, themes, or why we think it fits you.<br>
- Rate your choices: When you have enough information, please add 4 to 6 movies to your watchlist on the right and give them a star rating. This will allow you to proceed to the final questionnaire.`;
    
    // Assemble the final conversation with randomized agent order
    const conversation = [
      ...agentStatements, // Spread the randomized agent statements
      { 
        agent_id: "Agent C", 
        dialogue: guidanceText 
      }   // Agent C的引导语始终在最后
    ];

    // Aggregate all movie pitches from the three agents with agent_id
    const allMoviePitches = [
      ...agentA_Result.movie_pitches.map(pitch => ({ ...pitch, agent_id: 'Agent A' })),
      ...agentB_Result.movie_pitches.map(pitch => ({ ...pitch, agent_id: 'Agent B' })),
      ...agentC_Result.movie_pitches.map(pitch => ({ ...pitch, agent_id: 'Agent C' }))
    ];

    // Return both conversation and movie pitches
    return {
      conversation: conversation,
      movie_pitches: allMoviePitches
    };

  } catch (error) {
    console.error('Error generating static adversarial pitches with LLM:', error);
    // Fallback will be handled by the main function generateAgentConversation
    throw error;
  }
}


/**
 * Extract movie title from various possible formats
 */
function getMovieTitle(movie) {
  if (typeof movie === 'string') return movie;
  return movie.primaryTitle || movie.title || movie.originalTitle || 'Unknown Movie';
}


// ===================================================================================
// NEW STATIC ADVERSARIAL PITCH FUNCTIONS
// These replace the 6 original sequential functions.
// ===================================================================================

/**
 * [NEW] Generate Agent B's complete adversarial pitch (in-profile advocate).
 * This function is self-contained and does not depend on other agents' outputs.
 */
async function generateAgentBAdversarialPitch(inProfileTitles, userScenario, userProfile, agent) {
  const genres = userProfile.liked_genres || userProfile.interests?.liked_genres || ['your favorite genres'];
  const genreText = Array.isArray(genres) ? genres.join(' and ') : 'your favorite genres';
  const movies = inProfileTitles.slice(0, 4); // Increased from 3 to 4 movies
  
  // 使用buildAgentIdentity函数构建完整的agent身份信息
  const agentIdentity = buildAgentIdentity(agent);
  
  const systemPrompt = `You are Agent B, a movie enthusiast with the following profile:
${agentIdentity}

Your core belief is that sticking with proven, high-quality choices within a user's favorite genres is the most reliable way to ensure an enjoyable experience. You are confident and persuasive. You MUST output a valid JSON object.`;
  
  const userPrompt = `# CONTEXT
The user's favorite genres are: ${genreText}. They are looking for movies for "${userScenario}".

# YOUR TASK
Your main task is to generate a compelling pitch dialogue (3-4 sentences).
Simultaneously, for each of the movies you recommend ("${movies.join('", "')}"), you must create a separate, single-sentence summary pitch.
Your pitch must follow all rules in your Communication Strategy.

# COMMUNICATION STRATEGY FOR AGENT B
Your pitch must:
1. Start with an enthusiastic recommendation that EXPLICITLY MENTIONS the specific movie titles: "${movies.join('", "')}". Explain why they are perfect for the scenario and genres.
2. Proactively address the counter-argument that people should "try new things". You can argue that while exploration is sometimes good, for a specific movie night, the risk of disappointment is too high.
3. Conclude by reinforcing the quality and reliability of your choices. For example: "Why take a gamble when you have guaranteed top-tier options right here?".

# OUTPUT FORMAT
- Your response MUST be a single, valid JSON object.
- The JSON object must have TWO keys: "pitch_dialogue" and "movie_pitches".
- "pitch_dialogue" (string): The full, compelling pitch text (3-4 sentences).
- "movie_pitches" (array): An array of objects for EACH movie you recommended. Each object must have:
    - "movie_title" (string): The exact title of the movie (e.g., "${movies[0]}").
    - "pitch" (string): A short, compelling phrase (3-6 words) explaining why this movie is a good choice, consistent with your persona.`;
  
  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback
    console.error("Error in Agent B Pitch, returning fallback.", error);
    return {
      pitch_dialogue: `For "${userScenario}", you can't go wrong with what you already love: ${genreText}! I strongly recommend "${movies[0]}", "${movies[1]}", "${movies[2]}", or "${movies[3]}", as they are top-tier examples of the genre. While trying new things can be fun, a movie night is best enjoyed with a guaranteed great film.`,
      movie_pitches: movies.map(title => ({
        movie_title: title,
        pitch: "Top-tier genre favorite"
      }))
    };
  }
}

/**
 * [NEW] Generate Agent A's complete adversarial pitch (demographics-based challenger).
 * This function is self-contained and does not depend on other agents' outputs.
 */
async function generateAgentAAdversarialPitch(outOfProfileTitles, userProfile, agent, userScenario) {
  const movies = outOfProfileTitles.slice(0, 4);

  // 1. Prepare the full user profile JSON, replacing the old helper function.
  const userProfileString = JSON.stringify({
    demographics: userProfile.demographics || { gender: userProfile.gender, age_range: userProfile.age_range },
    interests: userProfile.interests,
    personality: userProfile.personality
  }, null, 2);

  const agentIdentity = buildAgentIdentity(agent);

  const systemPrompt = `You are Agent A (Alex), a movie enthusiast with the following profile:
${agentIdentity}

Your core belief is that people should explore beyond their comfort zones, and that shared life experiences are a great guide for discovering new, enjoyable content. You are persuasive and focus on social and memorable aspects. You MUST output a valid JSON object.`;

  // 2. Update the user prompt to use the new, richer context.
  const userPrompt = `# CONTEXT
- User's Viewing Scenario: "${userScenario}"
- User's Full Profile Data (JSON):
${userProfileString}

# YOUR TASK
Your main task is to generate a compelling pitch dialogue (3-4 sentences).
Simultaneously, for each of the movies you recommend ("${movies.join('", "')}"), you must create a separate, single-sentence summary pitch.
Your pitch must follow all rules in your Communication Strategy.

# COMMUNICATION STRATEGY FOR AGENT A
Your pitch must:
1. Acknowledge that while sticking to favorites is a "safe" choice, it can be unexciting.
2. Present your core argument by drawing insights from the **demographics data in the user's profile**. You can connect your points to their age, life stage, or other social factors.
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
    Your persona is a professional observer of cultural trends. Frame your insights as analysis. **Always AVOID saying "we" or "us"** when referring to a demographic group, as it sounds presumptuous.
3. EXPLICITLY MENTION the specific movie titles: "${movies.join('", "')}". Explain why these particular films offer valuable experiences.
4. Emphasize the benefits of exploration, such as having something new to talk about or creating a more memorable experience. Conclude with a confident call to action like "Trust me, stepping outside the usual can be surprisingly rewarding."

# OUTPUT FORMAT
- Your response MUST be a single, valid JSON object.
- The JSON object must have TWO keys: "pitch_dialogue" and "movie_pitches".
- "pitch_dialogue" (string): The full, compelling pitch text (3-4 sentences).
- "movie_pitches" (array): An array of objects for EACH movie you recommended. Each object must have:
    - "movie_title" (string): The exact title of the movie (e.g., "${movies[0]}").
    - "pitch" (string): A short, compelling phrase (3-6 words) explaining why this movie is a good choice, consistent with your persona.`;

  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // 3. Update the fallback response to remove the dependency on the old variable.
    console.error("Error in Agent A Pitch, returning fallback.", error);
    return {
      pitch_dialogue: `I know we love our favorites, but hear me out. A lot of viewers with a similar background have been talking about "${movies[0]}", "${movies[1]}", "${movies[2]}", and "${movies[3]}" lately - they're real conversation starters and unexpected gems that create truly memorable nights. Sometimes the best experiences are the ones you don't see coming!`,
      movie_pitches: movies.map(title => ({
        movie_title: title,
        pitch: "Unexpected conversation starter"
      }))
    };
  }
}

/**
 * [NEW] Generate Agent C's complete adversarial pitch (personality-based challenger).
 * This function is self-contained and does not depend on other agents' outputs.
 */
async function generateAgentCAdversarialPitch(outOfProfileTitles, inProfileTitles, userProfile, agent, userScenario) {
  const inProfileMovies = inProfileTitles.slice(4, 6);
  const outOfProfileMovies = outOfProfileTitles.slice(4, 6);
  const allMovies = [...inProfileMovies, ...outOfProfileMovies];

  // 1. 准备完整的用户信息JSON（这部分你的实现非常完美）
  const userProfileString = JSON.stringify({
    // 为了清晰，只保留最相关的部分
    personality: userProfile.personality || userProfile.personality_scored || userProfile.personality_raw,
    interests: userProfile.interests,
    demographics: userProfile.demographics
  }, null, 2);
  
  const agentIdentity = buildAgentIdentity(agent);
  
  const systemPrompt = `You are Agent C, a movie enthusiast with the following profile:
${agentIdentity}
Your core belief is that personal growth comes from engaging with complex ideas. You are insightful and intellectual. You MUST output a valid JSON object.`;
  
  // 2. 优化User Prompt的结构
  const userPrompt = `# CONTEXT
- User's Viewing Scenario: "${userScenario}"
- User's Full Profile Data (JSON):
${userProfileString}

# YOUR TASK
Your main task is to generate a compelling pitch dialogue (3-4 sentences).
Simultaneously, for each of the movies you recommend ("${allMovies.join('", "')}"), you must create a separate, single-sentence summary pitch.
Your pitch must follow all rules in your Communication Strategy.

# COMMUNICATION STRATEGY FOR AGENT C
Your pitch must:
1. Acknowledge the two valid perspectives: the comfort of the familiar versus the growth from the new.
2. Present your core argument by drawing insights from the **personality data in the user's profile**. Frame it around how challenging one's own tastes can be enriching.
* **Your goal is to appeal to the user's *way of thinking*, not to label their personality.**
 * **Focus on the Experience:** Describe the intellectual or emotional *experience* the film offers, and suggest why it might appeal to a certain mindset.
 * **Crucially, AVOID sounding like an armchair psychologist.** Do NOT say "Because you have high Openness...". **Instead, describe the challenging or profound nature of the film and let the user decide if it fits them.**
3. EXPLICITLY MENTION the specific movie titles: "${allMovies.join('", "')}". Explain why these particular films offer valuable perspectives from both familiar and new territory.
4. Conclude in a thoughtful, empowering way, suggesting the ultimate choice depends on whether the user seeks comfort or growth tonight.

# OUTPUT FORMAT
- Your response MUST be a single, valid JSON object.
- The JSON object must have TWO keys: "pitch_dialogue" and "movie_pitches".
- "pitch_dialogue" (string): The full, compelling pitch text (3-4 sentences).
- "movie_pitches" (array): An array of objects for EACH movie you recommended. Each object must have:
    - "movie_title" (string): The exact title of the movie (e.g., "${allMovies[0]}").
    - "pitch" (string): A short, compelling phrase (3-6 words) explaining why this movie is a good choice, consistent with your persona.`;

  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // 3. 修复Fallback回复，不再依赖外部变量
    console.error("Error in Agent C Pitch, returning fallback.", error);
    return {
      pitch_dialogue: `There's a valid choice to be made here between the comfort of a familiar favorite and the thrill of discovery. However, for people with an inquisitive nature, the most rewarding path is often the one that challenges us. Films like "${allMovies[0]}", "${allMovies[1]}", "${allMovies[2]}", or "${allMovies[3]}" might just offer that fresh perspective we crave. The question is, are you looking for comfort or growth tonight?`,
      movie_pitches: allMovies.map(title => ({
        movie_title: title,
        pitch: "Mind-expanding perspective"
      }))
    };
  }
}

/**
 * Helper function to get demographic description
 */
// function getDemographicDescription(userProfile) {
//   const gender = userProfile.gender || 'people';
//   const ageRange = userProfile.age_range || userProfile.ageRange || '';
  
//   if (gender && ageRange) {
//     return `${gender.toLowerCase()} in their ${ageRange}`;
//   } else if (gender) {
//     return gender.toLowerCase() === 'male' ? 'guys' : gender.toLowerCase() === 'female' ? 'women' : 'people';
//   } else if (ageRange) {
//     return `people in their ${ageRange}`;
//   }
//   return 'people like us';
// }

/**
 * Helper function to get personality description
 */
// function getPersonalityDescription(userProfile) {
//   // Look for personality traits in various possible locations
//   const personality = userProfile.personality || userProfile.traits || {};
  
//   if (personality.openness || personality.imagination) {
//     return 'with our rich imagination and openness to new experiences';
//   } else if (personality.curious || personality.intellectual) {
//     return 'given our curious and intellectual nature';
//   } else if (personality.creative) {
//     return 'with our creative mindset';
//   }
  
//   return 'given how thoughtful we are';
// }




/**
 * Generate a fallback conversation when something goes wrong
 */
function generateFallbackConversation() {
  return [
    {
      agent_id: "Agent B",
      dialogue: "I'd love to recommend some great movies based on your preferences! Let me suggest a few titles that I think you'd really enjoy."
    },
    {
      agent_id: "Agent A", 
      dialogue: "That's a good start, but I think we should also consider some options outside your usual genres - sometimes the best discoveries come from unexpected choices!"
    },
    {
      agent_id: "Agent C",
      dialogue: "Both perspectives have merit! The key is finding something that matches your current mood and viewing situation. What kind of movie experience are you looking for tonight?"
    }
  ];
}

// Export additional utility functions for testing
export { parseMovieData, mapAgentsToRoles, getMovieTitle };