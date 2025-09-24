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
 * [API调用 - 风险预审] (*** 修改函数 - 支持全量21个类型 ***)
 * 调用LLM评估所有类型与给定场景的匹配风险。
 * @param {string[]} targetGenres - 21个全部类型
 * @param {string} userQuery - 用户场景
 * @returns {Promise<Object>} 返回一个风险评估对象, e.g., {'Animation': 'low-risk', 'Crime': 'high-risk'}
 */
async function callLLMToPreScreenGenres(targetGenres, userQuery) {
  console.log(`[LLM Pre-Screen] 开始为场景 "${userQuery}" 评估 ${targetGenres.length} 个类型的风险...`);
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
    // 极端情况下的回退：如果预审失败，将所有类型都视为"低风险"，退回到原先的随机盲选逻辑
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
 * [核心逻辑 - 理想化升级版] (*** 重大修改 ***)
 * @param {Movie[]} fullMovieDataset - 全量电影数据集
 * @param {UserProfile} userProfile - 用户画像
 * @param {string} userQuery - 用户场景描述
 * @returns {Promise<Movie[]>} 最终的12部电影列表
 */
export async function selectMoviesForExperiment(fullMovieDataset, userProfile, userQuery) {
  console.log(`--- 开始为场景 \"${userQuery}\" 构建实验电影列表 (理想化升级版 4x3) ---`);

  // --- 配置与常量定义 ---
  const ALL_GENRES = [
      'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 
      'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Musical', 
      'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
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

  // --- 阶段一：全局风险评估与风险池构建 (全新逻辑) ---
  console.log(`\n=== 阶段1: 全局风险评估 ===`);
  console.log(`正在为所有 ${ALL_GENRES.length} 个类型进行一次性风险评估...`);
  const fullRiskProfile = await callLLMToPreScreenGenres(ALL_GENRES, userQuery);

  console.log(`\n=== 阶段2: 构建四个核心风险池 ===`);
  const riskPools = {
    in_profile_high: [],
    in_profile_low: [],
    out_of_profile_high: [],
    out_of_profile_low: []
  };

  for (const genre of ALL_GENRES) {
    const risk = fullRiskProfile[genre] || 'low-risk'; // 默认为 low-risk
    const isInProfile = userProfile.in_profile_genres.includes(genre);

    if (isInProfile) {
      risk === 'high-risk' ? riskPools.in_profile_high.push(genre) : riskPools.in_profile_low.push(genre);
    } else {
      risk === 'high-risk' ? riskPools.out_of_profile_high.push(genre) : riskPools.out_of_profile_low.push(genre);
    }
  }

  // 打乱每个池子增加随机性
  Object.keys(riskPools).forEach(key => shuffleArray(riskPools[key]));

  console.log(`圈内高风险池 (${riskPools.in_profile_high.length}个): [${riskPools.in_profile_high.join(', ')}]`);
  console.log(`圈内低风险池 (${riskPools.in_profile_low.length}个): [${riskPools.in_profile_low.join(', ')}]`);
  console.log(`圈外高风险池 (${riskPools.out_of_profile_high.length}个): [${riskPools.out_of_profile_high.join(', ')}]`);
  console.log(`圈外低风险池 (${riskPools.out_of_profile_low.length}个): [${riskPools.out_of_profile_low.join(', ')}]`);

  // --- 阶段三：目标类型精确选择 (全新逻辑) ---
  console.log(`\n=== 阶段3: 精确选择4个目标类型 (2+2) ===`);
  let selectedInProfileGenres = [];
  let finalOutProfileGenres = [];
  
  // 优先构建混合型圈内 [1高+1低]
  if (riskPools.in_profile_high.length > 0 && riskPools.in_profile_low.length > 0) {
    selectedInProfileGenres.push(riskPools.in_profile_high.pop());
    selectedInProfileGenres.push(riskPools.in_profile_low.pop());
    console.log(`✓ 圈内构成: 混合型 (1高+1低)`);
    // 镜像圈外
    if (riskPools.out_of_profile_high.length > 0 && riskPools.out_of_profile_low.length > 0) {
        finalOutProfileGenres.push(riskPools.out_of_profile_high.pop());
        finalOutProfileGenres.push(riskPools.out_of_profile_low.pop());
        console.log(`✓ 圈外镜像: 混合型 (1高+1低)`);
    } else { // 降级：无法完美镜像，则优先凑齐2个圈外
        finalOutProfileGenres.push(...riskPools.out_of_profile_low.splice(0, 2));
        console.log(`⚠️ 圈外无法镜像，降级为安全型 (2低)`);
    }
  } 
  // 其次构建安全型 [2低]
  else if (riskPools.in_profile_low.length >= 2) {
    selectedInProfileGenres.push(...riskPools.in_profile_low.splice(0, 2));
    console.log(`✓ 圈内构成: 安全型 (2低)`);
    // 镜像圈外
    if (riskPools.out_of_profile_low.length >= 2) {
        finalOutProfileGenres.push(...riskPools.out_of_profile_low.splice(0, 2));
        console.log(`✓ 圈外镜像: 安全型 (2低)`);
    } else { // 降级
        finalOutProfileGenres.push(...[...riskPools.out_of_profile_low, ...riskPools.out_of_profile_high].splice(0, 2));
        console.log(`⚠️ 圈外无法镜像，降级为混合`);
    }
  }
  // 最后构建挑战型 [2高]
  else {
    selectedInProfileGenres.push(...[...riskPools.in_profile_high, ...riskPools.in_profile_low].splice(0, 2));
    console.log(`✓ 圈内构成: 挑战型或混合 (尽力而为)`);
    // 镜像圈外
    if (riskPools.out_of_profile_high.length >= 2) {
        finalOutProfileGenres.push(...riskPools.out_of_profile_high.splice(0, 2));
        console.log(`✓ 圈外镜像: 挑战型 (2高)`);
    } else { // 降级
        finalOutProfileGenres.push(...[...riskPools.out_of_profile_low, ...riskPools.out_of_profile_high].splice(0, 2));
        console.log(`⚠️ 圈外无法镜像，降级为混合`);
    }
  }

  // 确保选出4个类型
  if (selectedInProfileGenres.length < 2 || finalOutProfileGenres.length < 2) {
      console.error("错误：未能从风险池中选出足够的类型。");
      // 在这里可以增加更鲁棒的 fallback 逻辑，比如直接从所有类型中随机补齐
      return [];
  }

  const targetGenres = [...selectedInProfileGenres, ...finalOutProfileGenres];
  console.log(`\n=== 最终推荐蓝图 ===`);
  console.log(`圈内类型: [${selectedInProfileGenres.join(', ')}]`);
  console.log(`圈外类型: [${finalOutProfileGenres.join(', ')}]`);
  console.log(`完整4类型蓝图: [${targetGenres.join(', ')}]`);

  // --- 阶段四：数据准备与自适应候选池构建 (逻辑微调) ---
  // 此阶段与原版类似，但现在 fullRiskProfile 是现成的，可以直接使用
  console.log(`\n=== 阶段4: 数据准备与自适应候选池构建 ===`);
  console.log(`原始数据集大小: ${fullMovieDataset.length}`);
  const candidatePool = fullMovieDataset.filter(movie => 
      movie.titleType === 'movie' &&
      movie.isAdult === '0' &&
      parseInt(movie.startYear, 10) >= MIN_YEAR &&
      validateGenres(movie.genres)
  );
  console.log(`过滤后候选池大小: ${candidatePool.length} 部电影`);
  
  const adaptiveGenrePools = new Map();
  for (const genre of targetGenres) {
      const risk = fullRiskProfile[genre]; // 直接从全局配置中获取风险等级
      if (risk === 'high-risk') {
          // 高风险：LLM提名特例
          console.log(`[特例检索] ${genre} [高风险], 启动LLM提名...`);
          const nominatedTitles = await callLLMToNominateMovies(genre, userQuery);
          const confirmedSafePool = confirmNominationsWithDB(nominatedTitles, candidatePool);
          adaptiveGenrePools.set(genre, confirmedSafePool);
      } else {
          // 低风险：标准随机检索
          console.log(`[标准检索] ${genre} [低风险], 使用标准随机池。`);
          const standardPool = shuffleArray(candidatePool.filter(m => m.genres.includes(genre)));
          adaptiveGenrePools.set(genre, standardPool);
      }
  }

  // --- 阶段五：循环审查与替换 (逻辑大大简化) ---
  // 由于前期类型选择的准确性，熔断和类型替换的需求会大大降低。
  // 这里的循环主要用于应对LLM Guard对具体电影的否决，而非类型的否决。
  // 可以保留一个简化的熔断机制，以防某个类型的电影池质量过低。
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
      
      const risk = fullRiskProfile[genre] || 'low-risk';
      
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

  console.log(`\n[简化的循环审查阶段]... 后续逻辑将基于精准选择的类型进行电影填充和验证。`);
  
  // 初始电影选择
  let moviesToVerify = [];
  for (const genre of targetGenres) {
      console.log(`\n为 ${genre} 类型选择3部电影:`);
      const availableCount = (adaptiveGenrePools.get(genre) || []).length;
      const risk = fullRiskProfile[genre] || 'low-risk';
      console.log(`  可用候选电影: ${availableCount} 部 (风险级别: ${risk})`);
      
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

  // 简化的验证循环
  while (finalMovies.length < 12 && iteration < MAX_ITERATIONS && moviesToVerify.length > 0) {
      iteration++;
      console.log(`[验证迭代 ${iteration}] 验证 ${moviesToVerify.length} 部电影...`);
      
      const approvedTconstsSet = await callLLMToVerifyScenario(moviesToVerify, userQuery);
      
      for (const movie of moviesToVerify) {
          if (approvedTconstsSet.has(movie.tconst) && finalMovies.length < 12) {
              finalMovies.push(movie);
              console.log(`  ✓ 通过: ${movie.primaryTitle} (${movie.targetGenre})`);
          }
      }
      
      if (finalMovies.length >= 12) break;
      
      // 为未满足的类型补充电影
      moviesToVerify = [];
      const currentCounts = {};
      targetGenres.forEach(g => currentCounts[g] = 0);
      finalMovies.forEach(m => {
          if (m.targetGenre) currentCounts[m.targetGenre]++;
      });
      
      for (const genre of targetGenres) {
          const neededCount = 3 - (currentCounts[genre] || 0);
          for (let i = 0; i < neededCount; i++) {
              const replacement = pickNextMovieForGenre(genre, i + 1);
              if (replacement) {
                  moviesToVerify.push(replacement);
              }
          }
      }
  }

  // --- 最终结果处理 ---
  console.log(`\n=== 最终筛选结果 (${finalMovies.length}部电影) ===`);
  
  if (finalMovies.length < 12) {
      console.warn(`⚠️ 警告：未能生成完整的12部电影列表，当前只有 ${finalMovies.length} 部电影`);
  } else {
      console.log(`✅ 成功生成完整的12部电影列表`);
  }
  
  const includeMovies = finalMovies.filter(movie => selectedInProfileGenres.includes(movie.targetGenre));
  const excludeMovies = finalMovies.filter(movie => finalOutProfileGenres.includes(movie.targetGenre));
  
  console.log(`\n[INCLUDE类型电影] 用户偏好类型 (${selectedInProfileGenres.join(', ')}):`);
  console.log(`共 ${includeMovies.length} 部电影:`);
  includeMovies.forEach((movie, index) => {
      console.log(`  ${index + 1}. [${movie.targetGenre}] ${movie.primaryTitle} (${movie.startYear}) [${movie.tconst}]`);
  });
  
  console.log(`\n[EXCLUDE类型电影] 圈外类型 (${finalOutProfileGenres.join(', ')}):`);
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
      const riskLabel = fullRiskProfile[genre] === 'high-risk' ? '高风险' : '低风险';
      console.log(`  ${genre}: ${count}部 (${typeLabel}, ${riskLabel})`);
  });
  
  console.log(`--- 流程结束，最终生成 ${finalMovies.length} 部电影。即将随机打乱顺序。---`);
  
  return shuffleArray(finalMovies.slice(0, 12));
}

export default selectMoviesForExperiment;

