import { API_KEY, BASE_URL, MODEL } from '../config.js';

/**
 * @typedef {Object} Movie
 * (类型定义无变化)
 */

/**
 * @typedef {Object} UserProfile
 * (类型定义无变化)
 */

/**
 * 数据质量检查函数
 * (此函数无变化)
 */
export function checkDataQuality(movies) {
  // ... (代码无变化) ...
  const report = {
    totalMovies: movies.length,
    validMovies: 0,
    issues: {
      missingTconst: 0,
      missingTitle: 0,
      invalidYear: 0,
      missingGenres: 0,
      invalidGenres: 0
    },
    genreDistribution: {},
    yearRange: { min: Infinity, max: -Infinity }
  };

  const ALL_GENRES = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Musical', 
    'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
  ];

  movies.forEach(movie => {
    let isValid = true;

    // 检查必需字段
    if (!movie.tconst) {
      report.issues.missingTconst++;
      isValid = false;
    }
    if (!movie.primaryTitle) {
      report.issues.missingTitle++;
      isValid = false;
    }

    // 检查年份
    const year = parseInt(movie.startYear, 10);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      report.issues.invalidYear++;
      isValid = false;
    } else {
      report.yearRange.min = Math.min(report.yearRange.min, year);
      report.yearRange.max = Math.max(report.yearRange.max, year);
    }

    // 检查类型
    if (!movie.genres || movie.genres === '\\N' || movie.genres === '') {
      report.issues.missingGenres++;
      isValid = false;
    } else {
      const genres = movie.genres.split(',').map(g => g.trim());
      const validGenres = genres.filter(g => ALL_GENRES.includes(g));
      
      if (validGenres.length === 0) {
        report.issues.invalidGenres++;
        isValid = false;
      } else {
        // 统计类型分布
        validGenres.forEach(genre => {
          report.genreDistribution[genre] = (report.genreDistribution[genre] || 0) + 1;
        });
      }
    }

    if (isValid) {
      report.validMovies++;
    }
  });

  return report;
}

/**
 * Fisher-Yates (aka Knuth) Shuffle algorithm.
 * (此函数无变化)
 */
export function shuffleArray(array) {
  // ... (代码无变化) ...
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
}

/**
 * [API调用 - 验证器] 调用LLM API进行场景符合度验证。
 * (此函数无变化, 仅修改了Prompt中的示例文字以匹配我们的讨论)
 */
async function callLLMToVerifyScenario(movies, userQuery) {
  // 如果没有电影需要验证，直接返回空集合
  if (!movies || movies.length === 0) {
    return new Set();
  }
  
  console.log(`[LLM Guard] 开始为场景 "${userQuery}" 验证 ${movies.length} 部电影...`);
  
  const apiKey = API_KEY;
  const apiUrl = `${BASE_URL}/chat/completions`;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1秒

  const moviesForLLM = movies.map(m => ({
      tconst: m.tconst,
      title: m.primaryTitle,
      originalTitle: m.originalTitle,
      year: m.startYear,
      runtime: m.runtimeMinutes,
      genres: m.genres,
  }));

  const prompt = `
    你是一位电影推荐顾问。
    用户的场景是："${userQuery}"。
    下面是一个JSON字符串，其中包含多部电影的信息，包括标题、年份、时长和类型。
    输入数据:
    ${JSON.stringify(moviesForLLM.slice(0, 100))} 
    
    请根据电影的标题、类型、年份和时长等信息，判断哪些电影适合用户的场景：
    - 对于"和小孩看"或"和家里人一起看"场景，严格避免恐怖、血腥暴力、成人内容、主题压抑或过于悲伤的电影。
    - 对于"深夜观影"场景，可以包含悬疑、惊悚类电影。
    - 请根据你对电影的了解和常识进行判断。

    请**只**返回一个JSON对象，该对象包含一个名为 "approved_tconsts" 的键，其值为一个数组，数组中包含那些你认为【适合】用户场景的电影的tconst ID。不要包含任何其他解释或文字。
    例如: {"approved_tconsts": ["tt0110912", "tt0133093"]}
  `;

  // 重试机制 (代码无变化)
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const payload = {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error("Invalid API response structure");
      }
      
      const responseText = result.choices[0].message.content;
      const parsedResponse = JSON.parse(responseText);

      if (Array.isArray(parsedResponse.approved_tconsts)) {
        console.log(`[LLM Guard] API验证完成，${parsedResponse.approved_tconsts.length} 部电影符合场景。`);
        return new Set(parsedResponse.approved_tconsts);
      } else {
        console.warn("[LLM Guard] LLM返回的格式不正确，本次验证结果视为0通过。");
        return new Set();
      }
    } catch (error) {
      console.error(`[LLM Guard] 第${attempt}次尝试失败:`, error.message);
      
      if (attempt === MAX_RETRIES) {
        console.error("[LLM Guard] 所有重试都失败，返回空集合");
        return new Set();
      }
      
      console.log(`[LLM Guard] ${RETRY_DELAY}ms后进行第${attempt + 1}次重试...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}


/**
 * [API调用 - 风险预审] (*** 新增函数 ***)
 * 调用LLM评估一组类型与给定场景的匹配风险。
 * @param {string[]} targetGenres - 6个目标类型
 * @param {string} userQuery - 用户场景
 * @returns {Promise<Object>} 返回一个风险评估对象, e.g., {'Animation': 'low-risk', 'Crime': 'high-risk'}
 */
async function callLLMToPreScreenGenres(targetGenres, userQuery) {
  console.log(`[LLM Pre-Screen] 开始为场景 "${userQuery}" 评估6个类型的风险...`);
  const apiKey = API_KEY;
  const apiUrl = `${BASE_URL}/chat/completions`;

  const prompt = `
    你是一位资深的电影内容审查专家。
    用户的场景是："${userQuery}"。
    请你判断以下电影类型与这个场景的匹配风险。
    - "low-risk": 表示该类型电影大概率适合此场景 (例如 "Animation" 和 "和小孩看")。
    - "high-risk": 表示该类型电影普遍不适合此场景，但可能存在少数特例 (例如 "Crime" 和 "和小孩看")。

    类型列表: ${JSON.stringify(targetGenres)}

    请**只**返回一个JSON对象，其中键是类型名，值是 "low-risk" 或 "high-risk"。
    例如:
    {"Action": "high-risk", "Animation": "low-risk", "Crime": "high-risk", "Drama": "high-risk", "Family": "low-risk", "Horror": "high-risk"}
  `;

  try {
    const payload = {
      model: MODEL, 
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
      response_format: { type: "json_object" }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    const result = await response.json();
    const parsedResponse = JSON.parse(result.choices[0].message.content);
    
    // 验证返回结果是否包含所有类型
    let allKeysPresent = true;
    for (const genre of targetGenres) {
      if (!(genre in parsedResponse)) {
        allKeysPresent = false;
        break;
      }
    }
    
    if (allKeysPresent) {
      console.log("[LLM Pre-Screen] 风险评估完成:", parsedResponse);
      return parsedResponse;
    } else {
      throw new Error("LLM返回的风险评估格式不完整");
    }

  } catch (error) {
    console.error("[LLM Pre-Screen] 风险评估失败:", error.message);
    // 极端情况下的回退：如果预审失败，将所有类型都视为“低风险”，退回到原先的随机盲选逻辑
    const fallbackProfile = {};
    targetGenres.forEach(g => fallbackProfile[g] = 'low-risk');
    console.warn("[LLM Pre-Screen] 启用备用方案：所有类型均视为 'low-risk'");
    return fallbackProfile;
  }
}

/**
 * [API调用 - 提名器] (*** 新增函数 ***)
 * 调用LLM为一个“高风险”类型提名适合特定场景的电影。
 * @param {string} highRiskGenre - 高风险类型
 * @param {string} userQuery - 用户场景
 * @returns {Promise<string[]>} 返回一个包含电影标题的数组
 */
async function callLLMToNominateMovies(highRiskGenre, userQuery) {
  console.log(`[LLM Nominator] 开始为高风险类型 \"${highRiskGenre}\" (场景: \"${userQuery}\") 提名电影...`);
  const apiKey = API_KEY;
  const apiUrl = `${BASE_URL}/chat/completions`;

  const prompt = `
    你是一位拥有海量电影知识的资深电影专家。
    我需要你执行一个特殊的“针尖上挑特例”任务。
    用户的场景是：\"${userQuery}\"。
    电影类型是：\"${highRiskGenre}\"。
    
    这个类型（${highRiskGenre}）通常【不适合】这个场景（${userQuery}）。
    但是，请你利用你渊博的知识，找出 10 部属于 ${highRiskGenre} 类型、但又是【非常适合】这个场景的【例外电影】。

    例如，如果类型是 \"Crime\" 场景是 \"和小孩看\"，你可能会想到 \"Zootopia\" (疯狂动物城)。
    例如，如果类型是 \"War\" 场景是 \"和家里人一起看\"，你可能会想到 \"Life Is Beautiful\" (美丽人生)。

    请**只**返回一个JSON对象，包含一个 \"nominations\" 键，其值为一个最多10个电影标题（原始英文标题或最著名标题）的数组。不要任何解释。
    例如: {\"nominations\": [\"Zootopia\", \"Knives Out\", \"Enola Holmes\"]}
  `;

  try {
    const payload = {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    };
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    const result = await response.json();
    const parsedResponse = JSON.parse(result.choices[0].message.content);

    if (Array.isArray(parsedResponse.nominations)) {
      console.log(`[LLM Nominator] 成功提名 ${parsedResponse.nominations.length} 部电影 for ${highRiskGenre}`);
      return parsedResponse.nominations;
    } else {
      throw new Error("LLM返回的提名列表格式不正确");
    }
  } catch (error) {
    console.error(`[LLM Nominator] 提名失败 for ${highRiskGenre}:`, error.message);
    return []; // 失败时返回空列表
  }
}

/**
 * [辅助函数 - 确认器] (*** 新增函数 ***)
 * 将LLM提名的电影标题与我们的数据库进行交叉确认。
 * @param {string[]} nominatedTitles - LLM提名的标题数组
 * @param {Movie[]} candidatePool - 我们的全量候选池
 * @returns {Movie[]} 确认存在于我们数据库中且高质量的电影数组
 */
function confirmNominationsWithDB(nominatedTitles, candidatePool) {
  const confirmedMovies = [];
  const titlesSet = new Set(nominatedTitles.map(t => t.toLowerCase()));

  for (const movie of candidatePool) {
    if (titlesSet.has(movie.primaryTitle.toLowerCase()) || titlesSet.has(movie.originalTitle.toLowerCase())) {
      confirmedMovies.push(movie);
    }
  }
  
  // 也可以在这里加入额外的质量排序，但目前只是确认存在
  console.log(`[DB Confirm] LLM提名了 ${titlesSet.size} 个标题, 在我们的数据库中成功确认并找到了 ${confirmedMovies.length} 部电影。`);
  return shuffleArray(confirmedMovies); // 随机打乱已确认的列表，以增加随机性
}


/**
 * [核心逻辑 - 自适应策略版] (*** 重大修改 ***)
 * @param {Movie[]} fullMovieDataset - 全量电影数据集
 * @param {UserProfile} userProfile - 用户画像
 * @param {string} userQuery - 用户场景描述
 * @returns {Promise<Movie[]>} 最终的12部电影列表
 */
export async function selectMoviesForExperiment(fullMovieDataset, userProfile, userQuery) {
  console.log(`--- 开始为场景 \"${userQuery}\" 构建实验电影列表 (自适应策略版 4x3) ---`);

  // --- 配置与常量定义 ---
  const ALL_GENRES = [
      'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 
      'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Musical', 
      'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'// 共21种类型
  ];
  
  const validateGenres = (genreString) => {
    if (!genreString || genreString === '\\N' || genreString === '' || genreString === 'undefined') return false;
    const genres = genreString.split(',').map(g => g.trim());
    return genres.some(genre => ALL_GENRES.includes(genre));
  };
  const MAX_ITERATIONS = 15;
  const MIN_YEAR = 1970;
  const REJECTION_THRESHOLD = 3; 
  const MAX_REPLACEMENT_ATTEMPTS = 15; 

  if (!userProfile.in_profile_genres || userProfile.in_profile_genres.length < 2) {
      throw new Error("用户画像 (UserProfile) 必须至少包含2个偏好类型以支持4x3结构。");
  }

  // --- 阶段一：动态确定4大目标类型 ---
  const shuffledInProfile = shuffleArray([...userProfile.in_profile_genres]);
  const selectedInProfileGenres = shuffledInProfile.slice(0, 2); 

  const outOfProfilePool = ALL_GENRES.filter(g => !userProfile.in_profile_genres.includes(g));
  const shuffledOutOfProfile = shuffleArray(outOfProfilePool);
  const selectedOutOfProfileGenres = shuffledOutOfProfile.slice(0, 2); 
  
  let targetGenres = [...selectedInProfileGenres, ...selectedOutOfProfileGenres];
  console.log(`[阶段1] 动态类型选择完成 (2+2)。圈内: ${selectedInProfileGenres.join(', ')} | 圈外: ${selectedOutOfProfileGenres.join(', ')}`);  
  
  // 熔断机制相关变量 (无变化)
  const rejectionTracker = new Map(); 
  const replacedGenres = new Set(); 
  const replacementAttempts = { inProfile: 0, outOfProfile: 0 }; 
  let availableInProfilePool = userProfile.in_profile_genres.filter(g => !selectedInProfileGenres.includes(g));
  let availableOutOfProfilePool = ALL_GENRES.filter(g => !userProfile.in_profile_genres.includes(g) && !selectedOutOfProfileGenres.includes(g));
  let bestEffortMode = false; 
  
  // 初始类型池状态日志
  console.log(`\n=== 类型池初始状态 ===`);
  console.log(`用户偏好类型 (${userProfile.in_profile_genres.length}个): [${userProfile.in_profile_genres.join(', ')}]`);
  console.log(`已选圈内类型 (2个): [${selectedInProfileGenres.join(', ')}]`);
  console.log(`圈内备用池 (${availableInProfilePool.length}个): [${availableInProfilePool.join(', ')}]`);
  console.log(`已选圈外类型 (2个): [${selectedOutOfProfileGenres.join(', ')}]`); 
  console.log(`圈外备用池 (${availableOutOfProfilePool.length}个): [${availableOutOfProfilePool.slice(0, 10).join(', ')}${availableOutOfProfilePool.length > 10 ? '...' : ''}]`);

  // --- 阶段二：数据准备与全量候选池构建 ---
  // (此部分过滤逻辑无变化, 仅简化日志)
  console.log(`\n=== 数据集过滤 ===`);
  console.log(`原始数据集大小: ${fullMovieDataset.length}`);
  const candidatePool = fullMovieDataset.filter(movie => 
      movie.titleType === 'movie' &&
      movie.isAdult === '0' &&
      parseInt(movie.startYear, 10) >= MIN_YEAR &&
      validateGenres(movie.genres)
  );
  console.log(`过滤后候选池大小: ${candidatePool.length} 部电影`);

  // 构建基础的 Genre -> Movies 映射 (用于低风险类型)
  const genreToMoviesMap = new Map();
  for (const genre of targetGenres) {
      const moviesForGenre = shuffleArray(candidatePool
          .filter(m => {
              const movieGenres = m.genres.split(',').map(g => g.trim());
              return movieGenres.includes(genre);
          }));
      genreToMoviesMap.set(genre, moviesForGenre);
  }
  
  // --- 阶段 2.5: 非对称自适应结构策略 --- (*** 全新核心逻辑 ***)
  console.log(`\n=== 阶段 2.5: 非对称自适应结构策略启动 ===`);
  
  // 1. 圈内画像分析 (In-Profile Analysis)
  console.log(`\n[步骤1] 圈内画像分析 - 评估用户偏好类型风险`);
  const inProfileRiskProfile = await callLLMToPreScreenGenres(selectedInProfileGenres, userQuery);
  
  // 2. 确定圈内构成 (Determine In-Profile Composition)
  console.log(`\n[步骤2] 确定圈内构成`);
  const inProfileHighRisk = selectedInProfileGenres.filter(genre => inProfileRiskProfile[genre] === 'high-risk');
  const inProfileLowRisk = selectedInProfileGenres.filter(genre => inProfileRiskProfile[genre] === 'low-risk');
  
  console.log(`圈内高风险类型 (${inProfileHighRisk.length}个): [${inProfileHighRisk.join(', ')}]`);
  console.log(`圈内低风险类型 (${inProfileLowRisk.length}个): [${inProfileLowRisk.join(', ')}]`);
  
  let inProfileComposition;
  if (inProfileHighRisk.length > 0 && inProfileLowRisk.length > 0) {
      inProfileComposition = 'mixed'; // 混合型: [1个高风险 + 1个低风险]
      console.log(`✓ 圈内构成类型: 混合型 [1高风险 + 1低风险]`);
  } else if (inProfileLowRisk.length === 2) {
      inProfileComposition = 'safe'; // 安全型: [2个低风险]
      console.log(`✓ 圈内构成类型: 安全型 [2低风险]`);
  } else {
      inProfileComposition = 'challenge'; // 挑战型: [2个高风险]
      console.log(`✓ 圈内构成类型: 挑战型 [2高风险]`);
  }
  
  // 3. 镜像圈外构成 (Mirror Out-of-Profile Composition)
  console.log(`\n[步骤3] 镜像圈外构成 - 评估圈外类型风险`);
  const outProfileRiskProfile = await callLLMToPreScreenGenres(selectedOutOfProfileGenres, userQuery);
  
  const outProfileHighRisk = selectedOutOfProfileGenres.filter(genre => outProfileRiskProfile[genre] === 'high-risk');
  const outProfileLowRisk = selectedOutOfProfileGenres.filter(genre => outProfileRiskProfile[genre] === 'low-risk');
  
  console.log(`圈外高风险类型 (${outProfileHighRisk.length}个): [${outProfileHighRisk.join(', ')}]`);
  console.log(`圈外低风险类型 (${outProfileLowRisk.length}个): [${outProfileLowRisk.join(', ')}]`);
  
  // 尝试镜像圈内构成
  let finalOutProfileGenres = [...selectedOutOfProfileGenres];
  let outProfileComposition = 'fallback';
  
  console.log(`尝试镜像圈内构成类型: ${inProfileComposition}`);
  
  if (inProfileComposition === 'mixed') {
      // 尝试构建 [1高 + 1低]
      if (outProfileHighRisk.length >= 1 && outProfileLowRisk.length >= 1) {
          finalOutProfileGenres = [outProfileHighRisk[0], outProfileLowRisk[0]];
          outProfileComposition = 'mixed';
          console.log(`✓ 成功镜像: 圈外混合型 [${outProfileHighRisk[0]} (高风险) + ${outProfileLowRisk[0]} (低风险)]`);
      } else {
          console.log(`⚠️ 无法完美镜像混合型，采用降级策略`);
          outProfileComposition = 'fallback';
      }
  } else if (inProfileComposition === 'safe') {
      // 尝试构建 [2低]
      if (outProfileLowRisk.length >= 2) {
          finalOutProfileGenres = outProfileLowRisk.slice(0, 2);
          outProfileComposition = 'safe';
          console.log(`✓ 成功镜像: 圈外安全型 [${finalOutProfileGenres.join(' + ')} (均为低风险)]`);
      } else {
          console.log(`⚠️ 无法完美镜像安全型，采用降级策略`);
          outProfileComposition = 'fallback';
      }
  } else if (inProfileComposition === 'challenge') {
      // 尝试构建 [2高]
      if (outProfileHighRisk.length >= 2) {
          finalOutProfileGenres = outProfileHighRisk.slice(0, 2);
          outProfileComposition = 'challenge';
          console.log(`✓ 成功镜像: 圈外挑战型 [${finalOutProfileGenres.join(' + ')} (均为高风险)]`);
      } else {
          console.log(`⚠️ 无法完美镜像挑战型，采用降级策略`);
          outProfileComposition = 'fallback';
      }
  }
  
  // 4. 降级策略 (Fallback)
  if (outProfileComposition === 'fallback') {
      console.log(`\n[步骤4] 执行降级策略`);
      if (outProfileHighRisk.length >= 2) {
          finalOutProfileGenres = outProfileHighRisk.slice(0, 2);
          outProfileComposition = 'challenge';
          console.log(`降级为挑战型: [${finalOutProfileGenres.join(' + ')} (均为高风险)]`);
      } else if (outProfileLowRisk.length >= 2) {
          finalOutProfileGenres = outProfileLowRisk.slice(0, 2);
          outProfileComposition = 'safe';
          console.log(`降级为安全型: [${finalOutProfileGenres.join(' + ')} (均为低风险)]`);
      } else if (outProfileHighRisk.length >= 1 && outProfileLowRisk.length >= 1) {
          finalOutProfileGenres = [outProfileHighRisk[0], outProfileLowRisk[0]];
          outProfileComposition = 'mixed';
          console.log(`降级为混合型: [${outProfileHighRisk[0]} (高风险) + ${outProfileLowRisk[0]} (低风险)]`);
      } else {
          // 极端情况：保持原有选择
          console.log(`⚠️ 极端情况：保持原有圈外类型选择`);
      }
  }
  
  // 更新目标类型列表
  targetGenres = [...selectedInProfileGenres, ...finalOutProfileGenres];
  console.log(`\n=== 最终推荐蓝图 ===`);
  console.log(`圈内构成 (${inProfileComposition}): [${selectedInProfileGenres.join(', ')}]`);
  console.log(`圈外构成 (${outProfileComposition}): [${finalOutProfileGenres.join(', ')}]`);
  console.log(`完整4类型蓝图: [${targetGenres.join(', ')}]`);
  
  // 5. 构建合并的风险档案
  const genreRiskProfile = { ...inProfileRiskProfile, ...outProfileRiskProfile };
  
  // 6. 构建自适应候选池
  console.log(`\n[步骤5] 构建自适应候选池`);
  const adaptiveGenrePools = new Map();
  for (const genre of targetGenres) {
      const risk = genreRiskProfile[genre] || 'low-risk';
      
      if (risk === 'high-risk') {
          // 高风险类型：特例智能检索 (Intelligent Exception-Finding Retrieval)
          console.log(`[特例智能检索] ${genre} 被标记为 [高风险], 启动LLM提名...`);
          const nominatedTitles = await callLLMToNominateMovies(genre, userQuery);
          const confirmedSafePool = confirmNominationsWithDB(nominatedTitles, candidatePool);
          adaptiveGenrePools.set(genre, confirmedSafePool);
          console.log(`[特例智能检索] ${genre} 安全池已创建，包含 ${confirmedSafePool.length} 部电影。`);
      } else {
          // 低风险类型：标准随机检索 (Standard Stochastic Retrieval)
          console.log(`[标准随机检索] ${genre} 被标记为 [低风险], 使用标准随机池。`);
          const standardPool = genreToMoviesMap.get(genre) || [];
          adaptiveGenrePools.set(genre, standardPool);
          console.log(`[标准随机检索] ${genre} 标准池大小: ${standardPool.length} 部电影。`);
      }
  }

  // --- 阶段三：循环审查与替换 ---
  let finalMovies = [];
  let triedTconsts = new Set();
  let iteration = 0;

  // *** 增强的 pickNextMovieForGenre 函数，实现差异化检索策略 ***
  const pickNextMovieForGenre = (genre, attemptNumber = 1) => {
      const candidates = adaptiveGenrePools.get(genre) || [];
      const availableCandidates = candidates.filter(movie => !triedTconsts.has(movie.tconst));
      
      if (availableCandidates.length === 0) {
          return null;
      }
      
      const risk = genreRiskProfile[genre] || 'low-risk';
      
      if (risk === 'low-risk') {
          // 低风险类型：标准随机检索，给予更高的容错机会
          console.log(`    [标准随机检索] ${genre} 第${attemptNumber}次尝试，候选池大小: ${availableCandidates.length}`);
          const randomIndex = Math.floor(Math.random() * availableCandidates.length);
          const selectedMovie = availableCandidates[randomIndex];
          triedTconsts.add(selectedMovie.tconst);
          return { ...selectedMovie, targetGenre: genre, riskLevel: 'lowrisk' };
      } else {
          // 高风险类型：特例智能检索，从精心筛选的安全池中选择
          console.log(`    [特例智能检索] ${genre} 第${attemptNumber}次尝试，安全池大小: ${availableCandidates.length}`);
          const randomIndex = Math.floor(Math.random() * availableCandidates.length);
          const selectedMovie = availableCandidates[randomIndex];
          triedTconsts.add(selectedMovie.tconst);
          return { ...selectedMovie, targetGenre: genre, riskLevel: 'highrisk' };
      }
  };

  console.log(`\n=== 初始电影选择过程 (基于自适应池和差异化检索) ===`);
  let moviesToVerify = [];
  
  // 为低风险类型实现增强容错机制
  const genreMovieAttempts = new Map(); // 记录每个类型的尝试次数
  
  for (const genre of targetGenres) {
      console.log(`\n为 ${genre} 类型选择3部电影:`);
      const availableCount = (adaptiveGenrePools.get(genre) || []).length;
      const risk = genreRiskProfile[genre] || 'low-risk';
      console.log(`  可用候选电影: ${availableCount} 部 (风险级别: ${risk})`);
      
      if (risk === 'low-risk') {
          console.log(`  [标准随机检索] 采用标准随机选择策略，保留随机性和新鲜感`);
          console.log(`  [增强容错] 所有类型均获得充分尝试机会 (3部电影 x 3次机会 = 9次尝试)`);
      } else {
          console.log(`  [特例智能检索] 采用LLM提名的安全池，主动寻找针尖上的特例`);
      }
      
      genreMovieAttempts.set(genre, 0); // 初始化尝试计数器
      
      for (let i = 0; i < 3; i++) { 
          const movie = pickNextMovieForGenre(genre, i + 1);
          if (movie) {
              moviesToVerify.push(movie);
              console.log(`  ✓ 选择第${i+1}部: ${movie.primaryTitle} (${movie.startYear})`);
          } else {
              console.log(`  ✗ 第${i+1}部: 无更多可用电影`);
          }
      }
  }

  console.log(`\n初始选择结果: ${moviesToVerify.length}/12 部电影`);
  if (moviesToVerify.length < 12) {
      console.warn(`⚠️ 警告：初始候选电影数量不足12部 (${moviesToVerify.length}部)，可能无法生成完整列表。`);
  }
  
  // 循环审查与增强容错机制
  // 低风险类型将获得更多尝试机会，高风险类型使用精心筛选的安全池
  
  while (finalMovies.length < 12 && iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(`[阶段3 - 迭代 ${iteration}/${MAX_ITERATIONS}] 开始验证 ${moviesToVerify.length} 部电影...`);

      if (moviesToVerify.length === 0) {
          console.log("没有更多电影可供验证，提前结束。");
          break;
      }
      
      const approvedTconstsSet = await callLLMToVerifyScenario(moviesToVerify, userQuery);
      
      console.log(`\n=== LLM验证结果详情 ===`);
      console.log(`待验证电影: ${moviesToVerify.length} 部`);
      console.log(`LLM通过: ${approvedTconstsSet.size} 部`);
      
      let addedThisRound = 0;
      for (const movie of moviesToVerify) {
          const isApproved = approvedTconstsSet.has(movie.tconst);
          const willAdd = isApproved && finalMovies.length < 12;
          
          console.log(`  ${movie.primaryTitle} (${movie.targetGenre}): ${isApproved ? '✓通过' : '✗拒绝'} ${willAdd ? '→ 已添加' : ''}`);
          
          if (willAdd) {
              finalMovies.push(movie);
              addedThisRound++;
          }
      }
      
      console.log(`本轮添加 ${addedThisRound} 部，总计 ${finalMovies.length}/12 部。`);
      
      // 增强的智能熔断机制（为低风险类型提供更多容错）
      console.log(`\n=== 增强的智能熔断检查 ===`);
      for (const movie of moviesToVerify) {
          const isRejected = !approvedTconstsSet.has(movie.tconst);
          if (isRejected) {
              const genre = movie.targetGenre;
              const risk = genreRiskProfile[genre] || 'low-risk';
              const currentAttempts = genreMovieAttempts.get(genre) || 0;
              genreMovieAttempts.set(genre, currentAttempts + 1);
              
              // 所有类型均获得相同的容错机会
              const maxAttempts = 9; // 低风险和高风险均为: 9次机会
              
              const currentCount = rejectionTracker.get(genre) || 0;
              rejectionTracker.set(genre, currentCount + 1);
              
              console.log(`${genre} (风险: ${risk}) 失败计数: ${currentCount + 1}/${REJECTION_THRESHOLD}, 尝试次数: ${currentAttempts + 1}/${maxAttempts}`);
              
              // 所有类型在达到最大尝试次数后才触发熔断
              if (currentAttempts + 1 >= maxAttempts) {
                  console.log(`⚠️ ${genre} (${risk}) 已达到最大尝试次数 (${maxAttempts}), 可能需要熔断`);
              }
          }
      }
      
      const genresToReplace = [];
      for (const [genre, failureCount] of rejectionTracker.entries()) {
          const risk = genreRiskProfile[genre] || 'low-risk';
          const maxAttempts = 9; // 所有类型均为9次尝试机会
          const currentAttempts = genreMovieAttempts.get(genre) || 0;
          
          // 所有类型需要同时满足失败次数和尝试次数的条件
          const shouldReplace = failureCount >= REJECTION_THRESHOLD && currentAttempts >= maxAttempts;
              
          if (shouldReplace && !replacedGenres.has(genre)) {
              genresToReplace.push(genre);
              console.log(`熔断触发: ${genre} (风险: ${risk}, 失败: ${failureCount}/${REJECTION_THRESHOLD}, 尝试: ${currentAttempts}/${maxAttempts})`);
          }
      }
      
      // 执行熔断和替换 (逻辑无变化, 3+3的日志已更新)
      if (genresToReplace.length > 0 && !bestEffortMode) {
          console.log(`\n🔥 触发熔断机制！需要替换的类型: ${genresToReplace.join(', ')}`);
          
          for (const genreToReplace of genresToReplace) {
              replacedGenres.add(genreToReplace);
              
              const isInProfile = selectedInProfileGenres.includes(genreToReplace);
              let replacementGenre = null;
              
              const attemptKey = isInProfile ? 'inProfile' : 'outOfProfile';
              if (replacementAttempts[attemptKey] >= MAX_REPLACEMENT_ATTEMPTS) {
                  console.log(`⚠️ ${isInProfile ? '圈内' : '圈外'}类型已达到最大替换次数(${MAX_REPLACEMENT_ATTEMPTS})，进入尽力而为模式`);
                  bestEffortMode = true;
                  break;
              }
              
              // 查找替换类型的逻辑 (包括跨界) 保持不变
              if (isInProfile) {
                  if (availableInProfilePool.length > 0) {
                      const randomIndex = Math.floor(Math.random() * availableInProfilePool.length);
                      replacementGenre = availableInProfilePool.splice(randomIndex, 1)[0];
                      replacementAttempts.inProfile++;
                      console.log(`   📋 圈内池变化: 移除 [${replacementGenre}], 剩余 ${availableInProfilePool.length} 个: [${availableInProfilePool.join(', ')}]`);
                      const index = selectedInProfileGenres.indexOf(genreToReplace);
                      selectedInProfileGenres[index] = replacementGenre;
                  } else if (availableOutOfProfilePool.length > 0) {
                      // ... (跨界替补逻辑) ...
                      const randomIndex = Math.floor(Math.random() * availableOutOfProfilePool.length);
                      replacementGenre = availableOutOfProfilePool.splice(randomIndex, 1)[0];
                      replacementAttempts.inProfile++;
                      console.log(`   ⚠️ 🔄 跨界替补警告: 圈内池已空，从圈外池选择 [${replacementGenre}]`);
                      console.log(`   🚨 警告：圈内类型 ${genreToReplace} 被圈外类型 ${replacementGenre} 替换，破坏了3+3结构平衡`); 
                      const index = selectedInProfileGenres.indexOf(genreToReplace);
                      selectedInProfileGenres[index] = replacementGenre;
                  } else {
                      console.log(`⚠️ 圈内和圈外类型池都已空，进入尽力而为模式`);
                      bestEffortMode = true;
                      break;
                  }
              } else {
                  if (availableOutOfProfilePool.length > 0) {
                       // ... (圈外替换逻辑) ...
                      const randomIndex = Math.floor(Math.random() * availableOutOfProfilePool.length);
                      replacementGenre = availableOutOfProfilePool.splice(randomIndex, 1)[0];
                      replacementAttempts.outOfProfile++;
                      console.log(`   📋 圈外池变化: 移除 [${replacementGenre}], 剩余 ${availableOutOfProfilePool.length} 个`);
                      const index = selectedOutOfProfileGenres.indexOf(genreToReplace);
                      selectedOutOfProfileGenres[index] = replacementGenre;
                  } else if (availableInProfilePool.length > 0) {
                      // ... (跨界替补逻辑) ...
                      const randomIndex = Math.floor(Math.random() * availableInProfilePool.length);
                      replacementGenre = availableInProfilePool.splice(randomIndex, 1)[0];
                      replacementAttempts.outOfProfile++;
                      console.log(`   ⚠️ 🔄 跨界替补警告: 圈外池已空，从圈内池选择 [${replacementGenre}]`);
                      console.log(`   🚨 警告：圈外类型 ${genreToReplace} 被圈内类型 ${replacementGenre} 替换，破坏了3+3结构平衡`);
                      const index = selectedOutOfProfileGenres.indexOf(genreToReplace);
                      selectedOutOfProfileGenres[index] = replacementGenre;
                  } else {
                      console.log(`⚠️ 圈内和圈外类型池都已空，进入尽力而为模式`);
                      bestEffortMode = true;
                      break;
                  }
              }
              
              if (replacementGenre) {
                  // 🔥 清理门户 (逻辑不变)
                  const beforeCount = finalMovies.length;
                  finalMovies = finalMovies.filter(movie => movie.targetGenre !== genreToReplace);
                  const removedCount = beforeCount - finalMovies.length;
                  console.log(`🧹 清理门户：从最终列表中移除 ${removedCount} 部 ${genreToReplace} 类型电影`);
                  
                  const index = targetGenres.indexOf(genreToReplace);
                  targetGenres[index] = replacementGenre;
                  
                  // *** 关键：为新替换的类型，也执行自适应策略！ ***
                  // 我们需要在这里决定新类型是高风险还是低风险
                  // 为了简化流程，我们将在这里假设新替换的类型需要重新评估
                  // 但一个更简单的策略是：先假定所有替换类型都是低风险，使用标准池
                  // 让我们采用这个更简单的策略，以避免在循环中再次调用预审LLM
                  
                  // 为新类型构建标准候选池
                  const newGenreMovies = shuffleArray(candidatePool
                      .filter(m => {
                          const movieGenres = m.genres.split(',').map(g => g.trim());
                          return movieGenres.includes(replacementGenre);
                      }));
                  
                  // 将这个标准池（低风险池）添加到自适应池中
                  // (如果它在高风险池中，则使用提名池。这里逻辑会变得非常复杂)
                  // 让我们坚持最初的设计：在循环外构建所有池。
                  // 如果一个类型被替换，我们需要为 *新* 类型构建一个池。
                  
                  // *** 策略修正：我们在循环开始前，为 *所有* 21个类型都构建好标准池(genreToMoviesMap) ***
                  // *** 并在循环外，为 *所有* 6个目标类型构建自适应池 ***
                  // *** 当一个类型被替换时，我们需要为这个 *新* 类型构建它的自适应池 ***
                  // (这太复杂了。让我们回到更简单的逻辑：替换时，我们只构建新类型的“标准池”，并假设它为低风险)
                  
                  const standardNewPool = genreToMoviesMap.get(replacementGenre);
                  if (standardNewPool) {
                    adaptiveGenrePools.set(replacementGenre, standardNewPool);
                    console.log(`   [自适应策略] 为新替换类型 ${replacementGenre} 准备了标准候选池 (大小: ${standardNewPool.length})`);
                  } else {
                    // 如果连标准池都没有（这种情况不应该发生，因为我们是从池中选的），创建一个空池
                     const newGenreMovies = candidatePool
                        .filter(m => m.genres.split(',').map(g => g.trim()).includes(replacementGenre));
                     adaptiveGenrePools.set(replacementGenre, newGenreMovies);
                     console.log(`   [自适应策略] 动态为 ${replacementGenre} 创建了候选池 (大小: ${newGenreMovies.length})`);
                  }

                  console.log(`✅ 完整替换：${genreToReplace} → ${replacementGenre}`);
                  console.log(`   当前最终列表: ${finalMovies.length}/12 部电影`);
                  rejectionTracker.delete(replacementGenre);
              }
          }
          
          if (!bestEffortMode) {
              console.log(`更新后的目标类型: ${targetGenres.join(', ')}`);
          }
      }
      
      // 尽力而为模式 (逻辑无变化)
      if (bestEffortMode) {
          console.log(`\n🚨 进入尽力而为模式 - 放弃严格结构要求`);
          console.log(`当前已找到 ${finalMovies.length} 部合格电影，将直接返回`);
          console.log(`⚠️ 警告：本次推荐未能满足3+3类型结构化要求`);
          break;
      }

      if (finalMovies.length >= 12) break;

      // 准备下一轮的替换电影 (*** 目标数量已更新为 3 ***)
      console.log(`\n=== 准备下一轮替换电影 ===`);
      moviesToVerify = [];
      const currentCounts = {};
      targetGenres.forEach(g => currentCounts[g] = 0);
      finalMovies.forEach(m => {
          if (m.targetGenre && currentCounts[m.targetGenre] < 3) { // *** 修改点: 目标 3 ***
            currentCounts[m.targetGenre]++;
          }
      });
      
      console.log(`当前各类型电影数量:`, currentCounts);
      
      for (const genre of targetGenres) {
          const neededCount = 3 - (currentCounts[genre] || 0); // *** 修改点: 目标 3 ***
          console.log(`${genre}: 已有${currentCounts[genre] || 0}部，还需${neededCount}部`);
          
          if (neededCount > 0) {
              const availableCount = (adaptiveGenrePools.get(genre) || []).length; // *** 修改点: 从自适应池读取 ***
              const triedCount = Array.from(triedTconsts).filter(tconst => {
                  const candidates = adaptiveGenrePools.get(genre) || []; // *** 修改点: 从自适应池读取 ***
                  return candidates.some(m => m.tconst === tconst);
              }).length;
              
              console.log(`  可用候选: ${availableCount}部，已尝试: ${triedCount}部，剩余: ${availableCount - triedCount}部`);
              
              for (let i = 0; i < neededCount; i++) {
                  const replacement = pickNextMovieForGenre(genre, i + 1);
                  if (replacement) {
                      moviesToVerify.push(replacement);
                      console.log(`  ✓ 添加替换电影: ${replacement.primaryTitle}`);
                  } else {
                      console.log(`  ✗ 无更多${genre}类型电影可用`);
                  }
              }
          }
      }
      
      console.log(`下一轮待验证电影: ${moviesToVerify.length}部`);
  }

  // --- 阶段四：收尾与返回 --- (日志已更新为 3+3)
  if (bestEffortMode) {
      console.log(`\n=== 尽力而为模式结果 ===`);
      console.log(`⚠️ 由于场景限制，未能满足严格的3+3结构要求`);
      console.log(`返回当前找到的 ${finalMovies.length} 部合格电影`);
      console.log(`替换尝试统计: 圈内${replacementAttempts.inProfile}次, 圈外${replacementAttempts.outOfProfile}次`);
  } else if (iteration >= MAX_ITERATIONS && finalMovies.length < 12) {
      console.warn(`警告：达到最大迭代次数 (${MAX_ITERATIONS}次)，但仍未集齐12部电影。`);
  } else {
      console.log(`\n✅ 成功完成严格结构化推荐`);
  }
  
  // (最终的日志记录和统计逻辑都是通用的，无需修改)
  console.log(`\n=== 最终筛选结果 (${finalMovies.length}部电影) ===`);
  
  const includeMovies = finalMovies.filter(movie => selectedInProfileGenres.includes(movie.targetGenre));
  const excludeMovies = finalMovies.filter(movie => selectedOutOfProfileGenres.includes(movie.targetGenre));
  
  console.log(`\n[INCLUDE类型电影] 用户偏好类型 (${selectedInProfileGenres.join(', ')}):`);
  console.log(`共 ${includeMovies.length} 部电影:`);
  includeMovies.forEach((movie, index) => {
      console.log(`  ${index + 1}. [${movie.targetGenre}] ${movie.primaryTitle} (${movie.startYear}) [${movie.tconst}]`);
  });
  
  console.log(`\n[EXCLUDE类型电影] 圈外类型 (${selectedOutOfProfileGenres.join(', ')}):`);
  console.log(`共 ${excludeMovies.length} 部电影:`);
  excludeMovies.forEach((movie, index) => {
      console.log(`  ${index + 1}. [${movie.targetGenre}] ${movie.primaryTitle} (${movie.startYear}) [${movie.tconst}]`);
  });
  
  console.log(`\n=== 类型分布统计 ===`);
  const genreStats = {};
  finalMovies.forEach(movie => {
      const genre = movie.targetGenre;
      if (!genreStats[genre]) genreStats[genre] = 0;
      genreStats[genre]++;
  });
  
  Object.entries(genreStats).forEach(([genre, count]) => {
      const typeLabel = selectedInProfileGenres.includes(genre) ? 'INCLUDE' : 'EXCLUDE';
      console.log(`  ${genre}: ${count}部 (${typeLabel})`);
  });
  
  console.log(`--- 流程结束，最终生成 ${finalMovies.length} 部电影。即将随机打乱顺序。---`);
  
  return shuffleArray(finalMovies.slice(0, 12));
}

export default selectMoviesForExperiment;

