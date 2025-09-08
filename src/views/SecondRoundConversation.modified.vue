// This is a temporary file to hold the modified code
// We'll use this to replace the original file after making changes

// The modified splitAndAddMessages function should be:
/*
splitAndAddMessages(text, agentKey) {
  console.log('Processing agent response, length:', text.length);
  
  // For long responses, don't split at all - just add the entire text as one message
  if (text.length > 500) {
    console.log('Long response detected, skipping sentence splitting');
    const messages = [text];
    this.addMessagesWithDelay(messages, agentKey);
    this.extractMovieRecommendation(text, agentKey);
    return;
  }
  
  // Extract agent role from the beginning of the text if present
  let agentRole = '';
  const roleMatch = text.match(/^([^:]+):/);
  if (roleMatch) {
    agentRole = roleMatch[1] + ': ';
    text = text.substring(roleMatch[0].length).trim();
  }
  
  // Pre-process text to protect numbered list items
  // Replace patterns like "1." "2." etc. with special markers
  const protectedText = text.replace(/(^|\s)(\d+)\.(\s|$)/g, '$1__NUM_$2__$3');
  
  // Split text into sentences
  const sentenceDelimiters = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
  let sentences = [protectedText];
  
  // Split by each delimiter
  for (const delimiter of sentenceDelimiters) {
    const newSentences = [];
    for (const sentence of sentences) {
      // Split by delimiter and preserve it
      const parts = sentence.split(delimiter);
      for (let i = 0; i < parts.length; i++) {
        if (i < parts.length - 1) {
          // Add delimiter back to all but the last part
          newSentences.push(parts[i] + delimiter.trim());
        } else {
          // Last part doesn't need a delimiter
          newSentences.push(parts[i]);
        }
      }
    }
    sentences = newSentences;
  }
  
  // Restore the numbered list items
  sentences = sentences.map(s => s.replace(/__NUM_(\d+)__/g, '$1.'));
  
  // Filter out empty sentences and trim
  sentences = sentences.map(s => s.trim()).filter(s => s.length > 0);
  console.log('Split into', sentences.length, 'sentences');
  
  // Group sentences into messages with reduced splitting probability
  const messages = [];
  let currentMessage = '';
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    
    // Decide if we should start a new message - reduced probability to 5%
    const shouldStartNewMessage = 
      currentMessage.length > 0 && 
      (currentMessage.length + sentence.length > 400 || 
       Math.random() < 0.05); // 降低到5%的概率开始新消息，并增加长度阈值到400
    
    if (shouldStartNewMessage) {
      messages.push(currentMessage);
      currentMessage = sentence;
    } else {
      if (currentMessage.length > 0) {
        currentMessage += ' ' + sentence;
      } else {
        currentMessage = sentence;
      }
    }
  }
  
  // Add the last message if not empty
  if (currentMessage.length > 0) {
    messages.push(currentMessage);
  }
  
  console.log('Grouped into', messages.length, 'messages');
  
  // If we still have multiple messages for a moderate length response, just use one message
  if (text.length < 1000 && messages.length > 1) {
    console.log('Consolidating multiple messages into one');
    const singleMessage = [text];
    this.addMessagesWithDelay(singleMessage, agentKey);
  } else {
    // Add messages to the conversation with slight delays
    this.addMessagesWithDelay(messages, agentKey);
  }
  
  // Check for movie recommendations in the agent's response
  this.extractMovieRecommendation(text, agentKey);
}
*/
