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
        max_tokens: 500
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
 * Main function to generate agent conversation
 * @param {Object} movieData - Object containing 12 movies categorized by type
 * @param {Array} agentProfiles - Array of 3 agent profiles
 * @param {Object} userProfile - User profile with demographics, interests, personality
 * @param {string} userScenario - User's viewing scenario description
 * @returns {Promise<Array>} Array of dialogue objects in the required JSON format
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
    
    // Generate conversation script using LLM
    const conversation = await generateConversationScript(
      agents,
      inProfileMovies,
      outOfProfileMovies,
      userProfile,
      userScenario
    );

    return conversation;

  } catch (error) {
    console.error('Error generating agent conversation:', error);
    return generateFallbackConversation();
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
    const [
      agentBPitch,
      agentAPitch,
      agentCPitch
    ] = await Promise.all([agentBPromise, agentAPromise, agentCPromise]);
    
    // Assemble the final conversation turn from the parallel results.
    const conversation = [
      {
        agent_id: "Agent B",
        dialogue: agentBPitch
      },
      {
        agent_id: "Agent A", 
        dialogue: agentAPitch
      },
      {
        agent_id: "Agent C",
        dialogue: agentCPitch
      }
    ];

    return conversation;
  } catch (error) {
    console.error('Error generating static adversarial pitches with LLM:', error);
    return generateFallbackConversation();
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

Your core belief is that sticking with proven, high-quality choices within a user's favorite genres is the most reliable way to ensure an enjoyable experience. You are confident and persuasive.`;
  
  const userPrompt = `The user's favorite genres are: ${genreText}. They are looking for movies for "${userScenario}".

Your task is to write a single, compelling pitch (3-4 sentences) to persuade the user to choose from these in-profile movies: "${movies.join('", "')}".

Your pitch must:
1. Start with an enthusiastic recommendation that EXPLICITLY MENTIONS the specific movie titles: "${movies.join('", "')}". Explain why they are perfect for the scenario and genres.
2. Proactively address the counter-argument that people should "try new things". You can argue that while exploration is sometimes good, for a specific movie night, the risk of disappointment is too high.
3. Conclude by reinforcing the quality and reliability of your choices. For example: "Why take a gamble when you have guaranteed top-tier options right here?".

IMPORTANT: You must mention the specific movie titles in your response.`;
  
  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback
    return `For "${userScenario}", you can't go wrong with what you already love: ${genreText}! I strongly recommend "${movies[0]}", "${movies[1]}", "${movies[2]}", or "${movies[3]}", as they are top-tier examples of the genre. While trying new things can be fun, a movie night is best enjoyed with a guaranteed great film.`;
  }
}

/**
 * [NEW] Generate Agent A's complete adversarial pitch (demographics-based challenger).
 * This function is self-contained and does not depend on other agents' outputs.
 */
async function generateAgentAAdversarialPitch(outOfProfileTitles, userProfile, agent, userScenario) {
  const demographics = getDemographicDescription(userProfile);
  const movies = outOfProfileTitles.slice(0, 4); // Increased from 2 to 4 movies
  
  // 使用buildAgentIdentity函数构建完整的agent身份信息
  const agentIdentity = buildAgentIdentity(agent);
  
  const systemPrompt = `You are Agent A, a movie enthusiast with the following profile:
${agentIdentity}

Your core belief is that people should explore beyond their comfort zones, and that shared life experiences are a great guide for discovering new, enjoyable content. You are persuasive and focus on social and memorable aspects.`;
  
  const userPrompt = `The user's demographic profile: ${demographics}. They are looking for movies for "${userScenario}".

Your task is to write a single, compelling pitch (3-4 sentences) to persuade the user to try these out-of-profile movies: "${movies.join('", "')}".

Your pitch must:
1. Acknowledge that while sticking to favorites is a "safe" choice, it can be unexciting.
2. Present your core argument: People in your shared demographic are finding these specific out-of-profile movies highly enjoyable and buzz-worthy.
3. Emphasize the benefits of exploration, such as having something new to talk about or creating a more memorable experience. Conclude with a confident call to action like "Trust me, stepping outside the usual can be surprisingly rewarding."`;
  
  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback
    return `I know we love our favorites, but hear me out. A lot of ${demographics} like us have been talking about "${movies[0]}", "${movies[1]}", "${movies[2]}", and "${movies[3]}" lately - they're real conversation starters and unexpected gems that create truly memorable nights. Sometimes the best experiences are the ones you don't see coming!`;
  }
}

/**
 * [NEW] Generate Agent C's complete adversarial pitch (personality-based challenger).
 * This function is self-contained and does not depend on other agents' outputs.
 */
async function generateAgentCAdversarialPitch(outOfProfileTitles, inProfileTitles, userProfile, agent, userScenario) {
  const personalityTrait = getPersonalityDescription(userProfile);
  const inProfileMovies = inProfileTitles.slice(4, 6); // Get remaining 2 in-profile movies
  const outOfProfileMovies = outOfProfileTitles.slice(4, 6); // Get remaining 2 out-of-profile movies
  const allMovies = [...inProfileMovies, ...outOfProfileMovies]; // Total 4 movies
  
  // 使用buildAgentIdentity函数构建完整的agent身份信息
  const agentIdentity = buildAgentIdentity(agent);
  
  const systemPrompt = `You are Agent C, a movie enthusiast with the following profile:
${agentIdentity}

Your core belief is that personal growth and the most profound experiences come from engaging with complex, challenging, and unfamiliar ideas. You are insightful, intellectual, and balanced.`;
  
  const userPrompt = `The user's personality is: ${personalityTrait}. They are looking for movies for "${userScenario}".

Your task is to write a single, compelling pitch (3-4 sentences) to persuade the user to consider both sides but ultimately lean toward exploration.

Your pitch must:
1. Acknowledge the two valid perspectives: the comfort of the familiar versus the growth from the new.
2. Present your core argument: For someone with our shared personality (${personalityTrait}), the most enriching experiences often come from challenging our own tastes.
3. Recommend these movies ("${allMovies.join('", "')}") as examples that offer valuable perspectives from both familiar and new territory.
4. Conclude in a thoughtful, empowering way, suggesting that the ultimate choice depends on whether the user seeks comfort or growth tonight.`;

  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback
    return `There's a valid choice to be made here between the comfort of a familiar favorite and the thrill of discovery. However, for people like us, ${personalityTrait}, the most rewarding path is often the one that challenges us. Films like "${allMovies[0]}", "${allMovies[1]}", "${allMovies[2]}", or "${allMovies[3]}" might just offer that fresh perspective we crave. The question is, are you looking for comfort or growth tonight?`;
  }
}

/**
 * Helper function to get demographic description
 */
function getDemographicDescription(userProfile) {
  const gender = userProfile.gender || 'people';
  const ageRange = userProfile.age_range || userProfile.ageRange || '';
  
  if (gender && ageRange) {
    return `${gender.toLowerCase()} in their ${ageRange}`;
  } else if (gender) {
    return gender.toLowerCase() === 'male' ? 'guys' : gender.toLowerCase() === 'female' ? 'women' : 'people';
  } else if (ageRange) {
    return `people in their ${ageRange}`;
  }
  return 'people like us';
}

/**
 * Helper function to get personality description
 */
function getPersonalityDescription(userProfile) {
  // Look for personality traits in various possible locations
  const personality = userProfile.personality || userProfile.traits || {};
  
  if (personality.openness || personality.imagination) {
    return 'with our rich imagination and openness to new experiences';
  } else if (personality.curious || personality.intellectual) {
    return 'given our curious and intellectual nature';
  } else if (personality.creative) {
    return 'with our creative mindset';
  }
  
  return 'given how thoughtful we are';
}

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