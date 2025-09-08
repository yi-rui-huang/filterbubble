// Function to analyze relevance of agents to user input
export function analyzeRelevance(agents, userInput) {
  const scores = {};
  for (const agentKey in agents) {
    // Example relevance calculation based on keyword matching
    const agent = agents[agentKey];
    scores[agentKey] = agent.knowledge_domains.reduce((score, domain) => {
      return score + (userInput.includes(domain) ? 1 : 0);
    }, 0);
  }
  return scores;
}

// Function to detect emotion in user input
export function detectEmotion(userInput) {
  // Simple example: detect if the input contains positive or negative words
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'love'];
  const negativeWords = ['bad', 'sad', 'angry', 'hate', 'terrible'];
  let score = 0;

  positiveWords.forEach(word => {
    if (userInput.includes(word)) score++;
  });

  negativeWords.forEach(word => {
    if (userInput.includes(word)) score--;
  });

  return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
}
