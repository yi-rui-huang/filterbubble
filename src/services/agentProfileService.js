/**
 * Agent Profile Service
 * 管理动态生成的Agent Profile数据
 */

// 获取保存的Agent Profiles
export function getAgentProfiles() {
  try {
    const profiles = localStorage.getItem('agentProfiles');
    return profiles ? JSON.parse(profiles) : null;
  } catch (error) {
    console.error('Error loading agent profiles:', error);
    return null;
  }
}

// 获取Agent Profiles摘要（简化版本）
export function getAgentProfilesSummary() {
  try {
    const summary = localStorage.getItem('agentProfilesSummary');
    return summary ? JSON.parse(summary) : null;
  } catch (error) {
    console.error('Error loading agent profiles summary:', error);
    return null;
  }
}

// 根据ID获取特定的Agent Profile
export function getAgentProfileById(agentId) {
  const profiles = getAgentProfiles();
  if (!profiles || !profiles.agents) return null;
  
  return profiles.agents.find(agent => agent.id === agentId);
}

// 获取用户的基准Profile
export function getUserProfile() {
  const profiles = getAgentProfiles();
  return profiles ? profiles.user : null;
}

// 获取实验配置信息
export function getExperimentConfig() {
  const profiles = getAgentProfiles();
  return profiles ? profiles.experimentConfig : null;
}

// 检查Agent Profiles是否存在
export function hasAgentProfiles() {
  return localStorage.getItem('agentProfiles') !== null;
}

// 清除Agent Profiles（用于重置实验）
export function clearAgentProfiles() {
  try {
    localStorage.removeItem('agentProfiles');
    localStorage.removeItem('agentProfilesSummary');
    console.log('Agent Profiles cleared');
    return true;
  } catch (error) {
    console.error('Error clearing agent profiles:', error);
    return false;
  }
}

// 验证Agent Profile数据的完整性
export function validateAgentProfiles() {
  const profiles = getAgentProfiles();
  
  if (!profiles) {
    return { valid: false, error: 'No agent profiles found' };
  }
  
  if (!profiles.user || !profiles.agents || !Array.isArray(profiles.agents)) {
    return { valid: false, error: 'Invalid profile structure' };
  }
  
  if (profiles.agents.length !== 3) {
    return { valid: false, error: 'Expected 3 agents, found ' + profiles.agents.length };
  }
  
  // 检查每个agent是否有必要的字段
  for (let i = 0; i < profiles.agents.length; i++) {
    const agent = profiles.agents[i];
    if (!agent.id || !agent.name || !agent.profile) {
      return { valid: false, error: `Agent ${i + 1} missing required fields` };
    }
  }
  
  return { valid: true };
}

// 获取Agent的显示信息（用于UI展示）
export function getAgentDisplayInfo(agentId) {
  const agent = getAgentProfileById(agentId);
  if (!agent) return null;
  
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    strategy: agent.strategy,
    sharedAttributes: agent.sharedAttributes,
    // 格式化的显示信息
    displayInfo: {
      gender: formatGender(agent.profile.gender),
      ageGroup: formatAgeGroup(agent.profile.ageGroup),
      movieTypes: agent.profile.favoriteMovieTypes.map(type => formatMovieType(type)).join(', '),
      movieFrequency: formatFrequency(agent.profile.movieWatchingFrequency),
      imagination: formatPersonality(agent.profile.openness2),
      curiosity: formatPersonality(agent.profile.openness1)
    }
  };
}

// 格式化函数
function formatGender(gender) {
  const genderMap = {
    'male': 'Male',
    'female': 'Female',
    'other': 'Other'
  };
  return genderMap[gender] || gender;
}

function formatAgeGroup(ageGroup) {
  const ageMap = {
    'under-18': 'Under 18',
    '18-25': '18-25',
    '26-30': '26-30',
    '31-40': '31-40',
    '41-50': '41-50',
    '51-60': '51-60',
    'over-60': 'Over 60'
  };
  return ageMap[ageGroup] || ageGroup;
}

function formatMovieType(type) {
  const typeMap = {
    'action': 'Action',
    'comedy': 'Comedy',
    'drama': 'Drama',
    'sci-fi': 'Science Fiction',
    'fantasy': 'Fantasy',
    'horror': 'Horror',
    'romance': 'Romance',
    'thriller': 'Thriller',
    'animation': 'Animation',
    'documentary': 'Documentary',
    'comics': 'Comics/Superhero'
  };
  return typeMap[type] || type;
}

function formatFrequency(frequency) {
  const frequencyMap = {
    'daily': 'Daily',
    'several-times-week': 'Several times a week',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'rarely': 'Rarely',
    'almost-never': 'Almost never'
  };
  return frequencyMap[frequency] || frequency;
}

function formatPersonality(value) {
  const personalityMap = {
    'strongly-disagree': 'Strongly Disagree',
    'disagree': 'Disagree',
    'neutral': 'Neutral',
    'agree': 'Agree',
    'strongly-agree': 'Strongly Agree'
  };
  return personalityMap[value] || value;
}

// 导出所有Agent的显示信息
export function getAllAgentsDisplayInfo() {
  const profiles = getAgentProfiles();
  if (!profiles || !profiles.agents) return [];
  
  return profiles.agents.map(agent => getAgentDisplayInfo(agent.id));
}

// 记录Agent Profile相关的日志
export function logAgentProfileEvent(eventType, data = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    event: eventType,
    agentProfilesGenerated: hasAgentProfiles(),
    ...data
  };
  
  console.log('Agent Profile Event:', logData);
  
  // 可以在这里添加发送到服务器的逻辑
  // sendToServer('agent_profile_event', logData);
}
