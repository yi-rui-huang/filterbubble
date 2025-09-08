/**
 * Response Generator for Multi-Agent Movie Discussion
 * 
 * This module generates structured conversations between agents based on:
 * - 12 movies (6 in-profile, 6 out-of-profile)
 * - 3 agent profiles with different matching dimensions
 * - User scenario and preferences
 * - Uses LLM API for dynamic response generation
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
    // DEBUG: Log all input parameters
    console.log('[DEBUG] generateAgentConversation called with:');
    console.log('  movieData:', movieData);
    console.log('  agentProfiles:', agentProfiles);
    console.log('  userProfile:', userProfile);
    console.log('  userScenario:', userScenario);
    
    // Validate inputs
    if (!movieData || !agentProfiles || !userProfile) {
      throw new Error('Missing required parameters: movieData, agentProfiles, or userProfile');
    }

    if (!Array.isArray(agentProfiles) || agentProfiles.length !== 3) {
      throw new Error('agentProfiles must be an array of exactly 3 agents');
    }

    // Parse movie data structure
    const { inProfileMovies, outOfProfileMovies } = parseMovieData(movieData);
    
    // DEBUG: Log parsed movie data
    console.log('[DEBUG] Parsed movie data:');
    console.log('  inProfileMovies:', inProfileMovies);
    console.log('  outOfProfileMovies:', outOfProfileMovies);
    
    // Map agents to their roles
    const agents = mapAgentsToRoles(agentProfiles);
    
    // DEBUG: Log mapped agents
    console.log('[DEBUG] Mapped agents:', agents);
    
    // Generate conversation script using LLM
    const conversation = await generateConversationScript(
      agents,
      inProfileMovies,
      outOfProfileMovies,
      userProfile,
      userScenario
    );

    console.log('[DEBUG] Generated conversation:', conversation);
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
 * Generate the main conversation script using LLM API
 */
async function generateConversationScript(agents, inProfileMovies, outOfProfileMovies, userProfile, userScenario) {
  const conversation = [];
  
  // Get movie titles for easier reference
  const inProfileTitles = inProfileMovies.map(m => getMovieTitle(m));
  const outOfProfileTitles = outOfProfileMovies.map(m => getMovieTitle(m));
  
  // DEBUG: Log movie titles extraction
  console.log('[DEBUG] generateConversationScript - movie titles:');
  console.log('  inProfileMovies raw:', inProfileMovies);
  console.log('  outOfProfileMovies raw:', outOfProfileMovies);
  console.log('  inProfileTitles:', inProfileTitles);
  console.log('  outOfProfileTitles:', outOfProfileTitles);
  
  try {
    // Agent B starts with in-profile recommendations
    console.log('[DEBUG] Starting Agent B opening generation...');
    const agentBOpening = await generateAgentBOpening(inProfileTitles, userScenario, userProfile);
    conversation.push({
      agent_id: "Agent B",
      dialogue: agentBOpening
    });

    // Agent A responds with out-of-profile suggestions (demographics angle)
    const agentAResponse = await generateAgentAResponse(outOfProfileTitles, userProfile, agents.agentA, agentBOpening);
    conversation.push({
      agent_id: "Agent A", 
      dialogue: agentAResponse
    });

    // Agent C adds more out-of-profile suggestions (personality angle)
    const agentCResponse = await generateAgentCResponse(outOfProfileTitles, userProfile, agents.agentC, agentBOpening, agentAResponse);
    conversation.push({
      agent_id: "Agent C",
      dialogue: agentCResponse
    });

    // Agent B defends in-profile choices
    const agentBDefense = await generateAgentBDefense(inProfileTitles, userProfile, agentAResponse, agentCResponse);
    conversation.push({
      agent_id: "Agent B",
      dialogue: agentBDefense
    });

    // Agent A provides more demographic-based arguments
    const agentAFollowup = await generateAgentAFollowup(outOfProfileTitles, userProfile, agents.agentA, agentBDefense);
    conversation.push({
      agent_id: "Agent A",
      dialogue: agentAFollowup
    });

    // Agent C concludes with personality-based reasoning
    const agentCConclusion = await generateAgentCConclusion(outOfProfileTitles, inProfileTitles, userProfile, agentAFollowup, agentBDefense);
    conversation.push({
      agent_id: "Agent C", 
      dialogue: agentCConclusion
    });

    return conversation;
  } catch (error) {
    console.error('Error generating conversation with LLM:', error);
    return generateFallbackConversation();
  }
}

/**
 * Extract movie title from various possible formats
 */
function getMovieTitle(movie) {
  // DEBUG: Log movie title extraction
  console.log('[DEBUG] getMovieTitle called with:', movie);
  
  if (typeof movie === 'string') {
    console.log('[DEBUG] getMovieTitle - returning string:', movie);
    return movie;
  }
  
  const title = movie.primaryTitle || movie.title || movie.originalTitle || 'Unknown Movie';
  console.log('[DEBUG] getMovieTitle - extracted title:', title);
  console.log('[DEBUG] getMovieTitle - movie object keys:', Object.keys(movie || {}));
  
  return title;
}

/**
 * Generate Agent B's opening (interests matcher, champions in-profile)
 */
async function generateAgentBOpening(inProfileTitles, userScenario, userProfile) {
  // DEBUG: Log input parameters
  console.log('[DEBUG] generateAgentBOpening called with:');
  console.log('  inProfileTitles:', inProfileTitles);
  console.log('  userScenario:', userScenario);
  console.log('  userProfile:', userProfile);
  
  const genres = userProfile.liked_genres || userProfile.interests?.liked_genres || ['your favorite genres'];
  const genreText = Array.isArray(genres) ? genres.join(' and ') : 'your favorite genres';
  const movies = inProfileTitles.slice(0, 3);
  
  // DEBUG: Log processed data
  console.log('[DEBUG] Agent B opening - processed data:');
  console.log('  genres:', genres);
  console.log('  genreText:', genreText);
  console.log('  movies (first 3):', movies);
  console.log('  movies[0]:', movies[0]);
  console.log('  movies[1]:', movies[1]);
  console.log('  movies[2]:', movies[2]);
  
  const systemPrompt = `You are Agent B, a movie enthusiast who shares the user's interests and preferences. You champion in-profile movie recommendations that match the user's favorite genres. You are enthusiastic, supportive, and believe in sticking with what works. Your role is to recommend movies that align with the user's established preferences.`;
  
  const userPrompt = `The user is looking for movies for "${userScenario}". Their favorite genres are: ${genreText}.

Recommend these 3 in-profile movies that match their preferences:
1. "${movies[0]}"
2. "${movies[1]}"
3. "${movies[2]}"

Write a enthusiastic opening response (2-3 sentences) explaining why these movies are perfect choices for their scenario and preferences. Be conversational and supportive of their established tastes. IMPORTANT: You MUST mention all three movie titles by name in your response.`;
  
  // DEBUG: Log the prompts being sent to LLM
  console.log('[DEBUG] Agent B opening - LLM prompts:');
  console.log('  systemPrompt:', systemPrompt);
  console.log('  userPrompt:', userPrompt);
  
  try {
    console.log('[DEBUG] Agent B opening - calling LLM API...');
    const response = await callLLMAPI(systemPrompt, userPrompt);
    console.log('[DEBUG] Agent B opening - LLM API response:', response);
    return response;
  } catch (error) {
    console.log('[DEBUG] Agent B opening - LLM API failed, using fallback:', error);
    // Fallback to original template
    const fallbackResponse = `Perfect! For ${userScenario}, I think we should stick with what we know you love - ${genreText}! I'd recommend starting with "${movies[0]}" - it's exactly the kind of ${genreText} film that hits all the right notes. Then we have "${movies[1]}" and "${movies[2]}" which are both fantastic examples of why these genres work so well for your viewing situation.`;
    console.log('[DEBUG] Agent B opening - fallback response:', fallbackResponse);
    return fallbackResponse;
  }
}

/**
 * Generate Agent A's response (demographics matcher, champions out-of-profile)
 */
async function generateAgentAResponse(outOfProfileTitles, userProfile, agent, previousResponse) {
  const demographics = getDemographicDescription(userProfile);
  const movies = outOfProfileTitles.slice(0, 2);
  
  const systemPrompt = `You are Agent A, a movie enthusiast who shares the user's demographics (age, gender, etc.). You champion out-of-profile movie recommendations, believing that people should explore beyond their comfort zones. You're persuasive, confident, and emphasize how demographic peers are enjoying different types of movies. You gently challenge safe choices while being respectful.`;
  
  const userPrompt = `The user's demographic profile: ${demographics}

Agent B just recommended in-profile movies with this response: "${previousResponse}"

You want to suggest these 2 out-of-profile movies instead:
1. "${movies[0]}"
2. "${movies[1]}"

Write a response (2-3 sentences) that:
- Politely challenges Agent B's safe choices
- Emphasizes how people in the user's demographic are enjoying these different movies
- Encourages trying something unexpected
- Mentions both movie titles naturally`;
  
  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback to original template
    return `Hold on! While those are safe choices, I think ${demographics} like us sometimes need to branch out. I've been hearing great things about "${movies[0]}" - it's been really popular among people in our demographic lately. And "${movies[1]}" has this authentic feel that really resonates with our generation.`;
  }
}

/**
 * Generate Agent C's response (personality matcher, champions out-of-profile)
 */
async function generateAgentCResponse(outOfProfileTitles, userProfile, agent, agentBResponse, agentAResponse) {
  const personalityTrait = getPersonalityDescription(userProfile);
  const movies = outOfProfileTitles.slice(2, 4);
  
  const systemPrompt = `You are Agent C, a movie enthusiast who shares the user's personality traits and mindset. You champion out-of-profile movie recommendations, believing that curious and thoughtful people should explore complex, challenging films. You're insightful, intellectual, and focus on the psychological and artistic aspects of movies. You support Agent A's position but from a personality/psychological angle.`;
  
  const userPrompt = `The user's personality: ${personalityTrait}

Previous responses:
Agent B (in-profile): "${agentBResponse}"
Agent A (demographics): "${agentAResponse}"

You want to support Agent A and suggest these 2 additional out-of-profile movies:
1. "${movies[0]}"
2. "${movies[1]}"

Write a response (2-3 sentences) that:
- Agrees with Agent A's perspective
- Appeals to the user's personality traits and intellectual curiosity
- Explains why these movies would appeal to someone with their mindset
- Mentions both movie titles naturally
- Emphasizes depth, complexity, or different perspectives`;
  
  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback to original template
    return `I have to agree with Agent A here. ${personalityTrait}, I think you'd really appreciate the depth in "${movies[0]}" - it has those complex characters and layered storytelling that people like us find fascinating. And "${movies[1]}" offers a completely different perspective that could be really refreshing.`;
  }
}

/**
 * Generate Agent B's defense of in-profile choices
 */
async function generateAgentBDefense(inProfileTitles, userProfile, agentAResponse, agentCResponse) {
  const movies = inProfileTitles.slice(3, 6);
  const genres = userProfile.liked_genres || userProfile.interests?.liked_genres || ['your favorite genres'];
  const genreText = Array.isArray(genres) ? genres.join(' and ') : 'your favorite genres';
  
  const systemPrompt = `You are Agent B, defending your position about in-profile movie recommendations. You believe in the reliability of established preferences and proven choices. You're diplomatic but firm, acknowledging others' points while standing by your recommendations. You emphasize quality, reliability, and the wisdom of sticking with what works.`;
  
  const userPrompt = `The user's favorite genres: ${genreText}

Agent A and C have challenged your recommendations with:
Agent A: "${agentAResponse}"
Agent C: "${agentCResponse}"

Defend your position using these 3 additional in-profile movies:
1. "${movies[0]}"
2. "${movies[1]}"
3. "${movies[2]}"

Write a response (2-3 sentences) that:
- Acknowledges their points diplomatically
- Defends the value of sticking with proven preferences
- Highlights the quality and reliability of your recommendations
- Mentions all three movie titles naturally
- Uses the rhetorical question "Why fix what isn't broken?" or similar`;
  
  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback to original template
    return `I get what you're both saying, but there's a reason we love certain genres! Look at "${movies[0]}" - it's got all the elements that make for a perfect movie night. And "${movies[1]}" is from a director who really understands what makes these stories work. Plus "${movies[2]}" has been getting amazing reviews from people who share our taste.`;
  }
}

/**
 * Generate Agent A's follow-up
 */
async function generateAgentAFollowup(outOfProfileTitles, userProfile, agent, agentBDefense) {
  const demographics = getDemographicDescription(userProfile);
  const movies = outOfProfileTitles.slice(4, 6);
  
  const systemPrompt = `You are Agent A, continuing to advocate for out-of-profile movie recommendations from a demographic perspective. You're persistent but respectful, providing additional compelling reasons why the user should try something different. You focus on social aspects, conversation value, and memorable experiences.`;
  
  const userPrompt = `The user's demographic profile: ${demographics}

Agent B defended their in-profile recommendations with: "${agentBDefense}"

You want to counter with these 2 final out-of-profile movies:
1. "${movies[0]}"
2. "${movies[1]}"

Write a response (2-3 sentences) that:
- Acknowledges Agent B's point diplomatically ("Fair point, but...")
- Emphasizes social/conversation value of these movies
- Mentions how these films appeal to your demographic
- Encourages stepping outside comfort zones
- Mentions both movie titles naturally`;
  
  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback to original template
    return `Fair point, but consider this - "${movies[0]}" has been a real conversation starter among ${demographics}. It's the kind of film that gives you something interesting to talk about afterward. And "${movies[1]}" has this universal appeal that transcends genre boundaries. Trust me, stepping outside our comfort zone can lead to some of the most memorable movie experiences!`;
  }
}

/**
 * Generate Agent C's conclusion
 */
async function generateAgentCConclusion(outOfProfileTitles, inProfileTitles, userProfile, agentAFollowup, agentBDefense) {
  const systemPrompt = `You are Agent C, providing a thoughtful conclusion to the movie recommendation discussion. You're diplomatic, balanced, and focused on helping the user make their final decision. You acknowledge all perspectives while gently leaning toward exploration and growth. You end with an engaging question to prompt user interaction.`;
  
  const userPrompt = `The conversation has covered multiple movie recommendations:
- Agent B recommended in-profile movies matching user preferences
- Agent A and you recommended out-of-profile movies for exploration
- Agent B defended with: "${agentBDefense}"
- Agent A followed up with: "${agentAFollowup}"

Write a concluding response (2-3 sentences) that:
- Acknowledges the value in all the recommendations discussed
- Maintains a balanced but slightly exploratory tone
- Emphasizes the importance of enjoying movies
- Ends with an engaging question asking which films appeal to them
- Sounds natural and conversational`;
  
  try {
    return await callLLMAPI(systemPrompt, userPrompt);
  } catch (error) {
    // Fallback to original template
    return `You know what? We've covered a lot of great options here. Whether you go with the reliable favorites or try something new like we suggested, you really can't go wrong. The most important thing is that you're taking time to enjoy a good movie. So, after hearing all our passionate arguments, which of these films is calling out to you?`;
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
    return 'With your rich imagination and openness to new experiences';
  } else if (personality.curious || personality.intellectual) {
    return 'Given your curious and intellectual nature';
  } else if (personality.creative) {
    return 'With your creative mindset';
  }
  
  return 'Given how thoughtful you are';
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