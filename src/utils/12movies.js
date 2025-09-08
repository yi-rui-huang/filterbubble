import { API_KEY, BASE_URL, MODEL } from '../config.js';

/**
 * @typedef {Object} Movie
 * @property {string} tconst - 电影的唯一ID
 * @property {string} titleType - 标题类型
 * @property {string} primaryTitle - 主要标题
 * @property {string} originalTitle - 原始标题
 * @property {string} isAdult - 是否为成人电影 ('0' or '1')
 * @property {string} startYear - 上映年份
 * @property {string} endYear - 结束年份
 * @property {string} runtimeMinutes - 时长
 * @property {string} genres - 类型，以逗号分隔的字符串
 * @property {string} [summary] - 电影简介（可选）。注意：当前数据集不包含此字段，LLM验证基于标题和类型进行。
 */

/**
 * @typedef {Object} UserProfile
 * @property {string[]} in_profile_genres - 用户偏好的类型列表 (应至少包含2个)
 */

/**
 * 数据质量检查函数
 * @param {Movie[]} movies - 电影数据集
 * @returns {Object} 数据质量报告
 */
export function checkDataQuality(movies) {
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
 * 用于随机打乱数组。
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
export function shuffleArray(array) {
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
 * [真实API调用] 调用LLM API进行场景符合度验证。
 * 增加了重试机制和更好的错误处理
 * @param {Movie[]} movies - 待验证的电影列表.
 * @param {string} userQuery - 用户的场景描述.
 * @returns {Promise<Set<string>>} 一个包含通过验证的电影tconst ID的集合(Set)。
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
    - 对于"和小孩看"场景，避免恐怖、暴力、成人内容的电影
    - 对于"浪漫约会"场景，推荐爱情、喜剧类电影
    - 对于"深夜观影"场景，可以包含悬疑、惊悚类电影
    - 请根据你对电影的了解和常识进行判断

    请**只**返回一个JSON对象，该对象包含一个名为 "approved_tconsts" 的键，其值为一个数组，数组中包含那些你认为【适合】用户场景的电影的tconst ID。不要包含任何其他解释或文字。
    例如: {"approved_tconsts": ["tt0110912", "tt0133093"]}
  `;

  // 重试机制
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
      
      // 等待后重试
      console.log(`[LLM Guard] ${RETRY_DELAY}ms后进行第${attempt + 1}次重试...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}


/**
 * [核心逻辑 - 新版] 为实验构建一个结构均衡的12部电影列表。
 * 采用“先筛选、后验证”的高效模式，并引入动态类型选择和循环审查机制。
 * @param {Movie[]} fullMovieDataset - 全量电影数据集
 * @param {UserProfile} userProfile - 用户画像
 * @param {string} userQuery - 用户场景描述
 * @returns {Promise<Movie[]>} 最终的12部电影列表
 */
export async function selectMoviesForExperiment(fullMovieDataset, userProfile, userQuery) {
  console.log(`--- 开始为场景 "${userQuery}" 构建实验电影列表 (新版逻辑) ---`);

  // --- 配置与常量定义 ---
  const ALL_GENRES = [
      'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 
      'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Musical', 
      'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'// 共22种类型 (基于高质量电影数据集分析结果)
  ];
  
  // 数据验证函数
  const validateGenres = (genreString) => {
    if (!genreString || genreString === '\\N' || genreString === '' || genreString === 'undefined') {
      return false;
    }
    const genres = genreString.split(',').map(g => g.trim());
    return genres.some(genre => ALL_GENRES.includes(genre));
  };
  const MAX_ITERATIONS = 15;
  const MIN_YEAR = 1970;
  const REJECTION_THRESHOLD = 3; // 熔断阈值：连续失败3次触发熔断
  const MAX_REPLACEMENT_ATTEMPTS = 15; // 每个类型池最多替换尝试次数

  if (!userProfile.in_profile_genres || userProfile.in_profile_genres.length < 2) {
      throw new Error("用户画像 (UserProfile) 必须至少包含两个偏好类型。");
  }

  // --- 阶段一：动态确定“四象限”电影类型 ---
  const shuffledInProfile = shuffleArray([...userProfile.in_profile_genres]);
  const selectedInProfileGenres = shuffledInProfile.slice(0, 2);

  const outOfProfilePool = ALL_GENRES.filter(g => !userProfile.in_profile_genres.includes(g));
  const shuffledOutOfProfile = shuffleArray(outOfProfilePool);
  const selectedOutOfProfileGenres = shuffledOutOfProfile.slice(0, 2);
  
  let targetGenres = [...selectedInProfileGenres, ...selectedOutOfProfileGenres];
  console.log(`[阶段1] 动态类型选择完成。圈内: ${selectedInProfileGenres.join(', ')} | 圈外: ${selectedOutOfProfileGenres.join(', ')}`);  
  
  // 智能熔断机制相关变量
  const rejectionTracker = new Map(); // 追踪每个类型的失败次数
  const replacedGenres = new Set(); // 记录已被替换的类型，避免重复替换
  const replacementAttempts = { inProfile: 0, outOfProfile: 0 }; // 追踪替换尝试次数
  let availableInProfilePool = userProfile.in_profile_genres.filter(g => !selectedInProfileGenres.includes(g));
  let availableOutOfProfilePool = ALL_GENRES.filter(g => !userProfile.in_profile_genres.includes(g) && !selectedOutOfProfileGenres.includes(g));
  let bestEffortMode = false; // 尽力而为模式标志
  
  // 打印初始类型池状态
  console.log(`\n=== 类型池初始状态 ===`);
  console.log(`用户偏好类型 (${userProfile.in_profile_genres.length}个): [${userProfile.in_profile_genres.join(', ')}]`);
  console.log(`已选圈内类型 (2个): [${selectedInProfileGenres.join(', ')}]`);
  console.log(`圈内备用池 (${availableInProfilePool.length}个): [${availableInProfilePool.join(', ')}]`);
  console.log(`已选圈外类型 (2个): [${selectedOutOfProfileGenres.join(', ')}]`);
  console.log(`圈外备用池 (${availableOutOfProfilePool.length}个): [${availableOutOfProfilePool.slice(0, 10).join(', ')}${availableOutOfProfilePool.length > 10 ? '...' : ''}]`);

  // --- 阶段二：数据准备与候选池构建 ---
  console.log(`\n=== 数据集调试信息 ===`);
  console.log(`原始数据集大小: ${fullMovieDataset.length}`);
  
  // 逐步调试过滤条件
  if (fullMovieDataset.length > 0) {
    const sample = fullMovieDataset[0];
    console.log(`数据样本:`, sample);
    console.log(`样本字段检查:`);
    console.log(`  titleType: "${sample.titleType}" (期望: "movie")`);
    console.log(`  isAdult: "${sample.isAdult}" (期望: "0")`);
    console.log(`  startYear: "${sample.startYear}" (期望: >= ${MIN_YEAR})`);
    // 使用toRaw或直接访问来处理Vue响应式对象
    const genresValue = sample.genres;
    console.log(`  genres: "${genresValue}" (期望: 非空且非\\N)`);
    console.log(`  genres类型: ${typeof genresValue}`);
    console.log(`  genres是否存在: ${genresValue !== undefined}`);
    console.log(`  所有字段:`, Object.keys(sample));
  }
  
  const step1 = fullMovieDataset.filter(movie => movie.titleType === 'movie');
  console.log(`过滤步骤1 (titleType === 'movie'): ${step1.length} 部电影`);
  
  const step2 = step1.filter(movie => movie.isAdult === '0');
  console.log(`过滤步骤2 (isAdult === '0'): ${step2.length} 部电影`);
  
  const step3 = step2.filter(movie => parseInt(movie.startYear, 10) >= MIN_YEAR);
  console.log(`过滤步骤3 (startYear >= ${MIN_YEAR}): ${step3.length} 部电影`);
  
  const candidatePool = step3.filter((movie, index) => {
    const hasValidGenres = validateGenres(movie.genres);
    
    // 调试前几个电影的genres字段
    if (index < 5) {
      console.log(`电影${index + 1} genres调试:`);
      console.log(`  genres值: "${movie.genres}"`);
      console.log(`  hasValidGenres: ${hasValidGenres}`);
      if (hasValidGenres) {
        const genres = movie.genres.split(',').map(g => g.trim());
        console.log(`  解析后的类型: [${genres.join(', ')}]`);
        console.log(`  有效类型: [${genres.filter(g => ALL_GENRES.includes(g)).join(', ')}]`);
      }
    }
    
    return hasValidGenres;
  });
  console.log(`过滤步骤4 (有效genres): ${candidatePool.length} 部电影`);

  const genreToMoviesMap = new Map();
  
  // 详细记录include和exclude类型的电影筛选情况
  console.log(`\n=== 电影类型筛选详情 ===`);
  
  for (const genre of targetGenres) {
      const moviesForGenre = shuffleArray(candidatePool
          .filter(m => {
              // 正确的类型匹配：按逗号分割后精确匹配
              const movieGenres = m.genres.split(',').map(g => g.trim());
              return movieGenres.includes(genre);
          })); // 随机打乱顺序
      
      genreToMoviesMap.set(genre, moviesForGenre);
      
      // 判断是include还是exclude类型
      const isIncludeType = selectedInProfileGenres.includes(genre);
      const typeLabel = isIncludeType ? 'INCLUDE (用户偏好)' : 'EXCLUDE (圈外类型)';
      
      console.log(`\n[${typeLabel}] ${genre} 类型:`);
      console.log(`  筛选出 ${moviesForGenre.length} 部电影`);
      
      if (moviesForGenre.length > 0) {
          console.log(`  前10部电影:`);
          moviesForGenre.slice(0, 10).forEach((movie, index) => {
              console.log(`    ${index + 1}. ${movie.primaryTitle} (${movie.startYear}) [${movie.tconst}]`);
          });
          if (moviesForGenre.length > 10) {
              console.log(`    ... 还有 ${moviesForGenre.length - 10} 部电影`);
          }
      } else {
          console.log(`    ⚠️ 未找到符合条件的电影`);
      }
  }
  
  console.log(`\n=== 筛选汇总 ===`);
  console.log(`INCLUDE类型 (${selectedInProfileGenres.join(', ')}): 共 ${selectedInProfileGenres.reduce((sum, genre) => sum + (genreToMoviesMap.get(genre)?.length || 0), 0)} 部电影`);
  console.log(`EXCLUDE类型 (${selectedOutOfProfileGenres.join(', ')}): 共 ${selectedOutOfProfileGenres.reduce((sum, genre) => sum + (genreToMoviesMap.get(genre)?.length || 0), 0)} 部电影`);
  
  console.log(`[阶段2] 候选池与类型数据准备完成。候选池大小: ${candidatePool.length}`);
  
  // --- 阶段三：循环审查与替换 ---
  let finalMovies = [];
  let triedTconsts = new Set();
  let iteration = 0;

  const pickNextMovieForGenre = (genre) => {
      const candidates = genreToMoviesMap.get(genre) || [];
      // 过滤出未被选过的电影
      const availableCandidates = candidates.filter(movie => !triedTconsts.has(movie.tconst));
      
      if (availableCandidates.length === 0) {
          return null;
      }
      
      // 随机选择一部电影
      const randomIndex = Math.floor(Math.random() * availableCandidates.length);
      const selectedMovie = availableCandidates[randomIndex];
      
      triedTconsts.add(selectedMovie.tconst);
      return { ...selectedMovie, targetGenre: genre }; // 附加目标类型，方便后续追踪
  };

  console.log(`\n=== 初始电影选择过程 ===`);
  let moviesToVerify = [];
  for (const genre of targetGenres) {
      console.log(`\n为 ${genre} 类型选择3部电影:`);
      const availableCount = genreToMoviesMap.get(genre)?.length || 0;
      console.log(`  可用候选电影: ${availableCount} 部`);
      
      for (let i = 0; i < 3; i++) {
          const movie = pickNextMovieForGenre(genre);
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
  
  // 循环审查
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
      
      // 智能熔断机制：追踪被拒绝的电影类型
      console.log(`\n=== 智能熔断检查 ===`);
      for (const movie of moviesToVerify) {
          const isRejected = !approvedTconstsSet.has(movie.tconst);
          if (isRejected) {
              const genre = movie.targetGenre;
              const currentCount = rejectionTracker.get(genre) || 0;
              rejectionTracker.set(genre, currentCount + 1);
              console.log(`${genre} 类型失败计数: ${currentCount + 1}/${REJECTION_THRESHOLD}`);
          }
      }
      
      // 检查是否有类型需要熔断
      const genresToReplace = [];
      for (const [genre, failureCount] of rejectionTracker.entries()) {
          if (failureCount >= REJECTION_THRESHOLD && !replacedGenres.has(genre)) {
              genresToReplace.push(genre);
          }
      }
      
      // 执行熔断和替换
      if (genresToReplace.length > 0 && !bestEffortMode) {
          console.log(`\n🔥 触发熔断机制！需要替换的类型: ${genresToReplace.join(', ')}`);
          
          for (const genreToReplace of genresToReplace) {
              replacedGenres.add(genreToReplace);
              
              // 确定是圈内还是圈外类型
              const isInProfile = selectedInProfileGenres.includes(genreToReplace);
              let replacementGenre = null;
              
              // 检查是否已达到最大替换尝试次数
              const attemptKey = isInProfile ? 'inProfile' : 'outOfProfile';
              if (replacementAttempts[attemptKey] >= MAX_REPLACEMENT_ATTEMPTS) {
                  console.log(`⚠️ ${isInProfile ? '圈内' : '圈外'}类型已达到最大替换次数(${MAX_REPLACEMENT_ATTEMPTS})，进入尽力而为模式`);
                  bestEffortMode = true;
                  break;
              }
              
              if (isInProfile) {
                  // 优先从剩余的圈内类型中选择
                  if (availableInProfilePool.length > 0) {
                      const randomIndex = Math.floor(Math.random() * availableInProfilePool.length);
                      replacementGenre = availableInProfilePool.splice(randomIndex, 1)[0];
                      replacementAttempts.inProfile++;
                      
                      console.log(`   📋 圈内池变化: 移除 [${replacementGenre}], 剩余 ${availableInProfilePool.length} 个: [${availableInProfilePool.join(', ')}]`);
                      
                      // 更新selectedInProfileGenres
                      const index = selectedInProfileGenres.indexOf(genreToReplace);
                      selectedInProfileGenres[index] = replacementGenre;
                  } else if (availableOutOfProfilePool.length > 0) {
                      // 🔄 跨界替补：圈内池已空，从圈外池中选择
                      const randomIndex = Math.floor(Math.random() * availableOutOfProfilePool.length);
                      replacementGenre = availableOutOfProfilePool.splice(randomIndex, 1)[0];
                      replacementAttempts.inProfile++;
                      
                      console.log(`   ⚠️ 🔄 跨界替补警告: 圈内池已空，从圈外池选择 [${replacementGenre}]`);
                      console.log(`   📋 圈外池变化: 移除 [${replacementGenre}], 剩余 ${availableOutOfProfilePool.length} 个`);
                      console.log(`   🚨 警告：圈内类型 ${genreToReplace} 被圈外类型 ${replacementGenre} 替换，破坏了2+2结构平衡`);
                      
                      // 更新selectedInProfileGenres（虽然实际上是圈外类型）
                      const index = selectedInProfileGenres.indexOf(genreToReplace);
                      selectedInProfileGenres[index] = replacementGenre;
                  } else {
                      console.log(`⚠️ 圈内和圈外类型池都已空，进入尽力而为模式`);
                      bestEffortMode = true;
                      break;
                  }
              } else {
                  // 优先从剩余的圈外类型中选择
                  if (availableOutOfProfilePool.length > 0) {
                      const randomIndex = Math.floor(Math.random() * availableOutOfProfilePool.length);
                      replacementGenre = availableOutOfProfilePool.splice(randomIndex, 1)[0];
                      replacementAttempts.outOfProfile++;
                      
                      console.log(`   📋 圈外池变化: 移除 [${replacementGenre}], 剩余 ${availableOutOfProfilePool.length} 个`);
                      console.log(`      圈外池前10个: [${availableOutOfProfilePool.slice(0, 10).join(', ')}${availableOutOfProfilePool.length > 10 ? '...' : ''}]`);
                      
                      // 更新selectedOutOfProfileGenres
                      const index = selectedOutOfProfileGenres.indexOf(genreToReplace);
                      selectedOutOfProfileGenres[index] = replacementGenre;
                  } else if (availableInProfilePool.length > 0) {
                      // 🔄 跨界替补：圈外池已空，从圈内池中选择
                      const randomIndex = Math.floor(Math.random() * availableInProfilePool.length);
                      replacementGenre = availableInProfilePool.splice(randomIndex, 1)[0];
                      replacementAttempts.outOfProfile++;
                      
                      console.log(`   ⚠️ 🔄 跨界替补警告: 圈外池已空，从圈内池选择 [${replacementGenre}]`);
                      console.log(`   📋 圈内池变化: 移除 [${replacementGenre}], 剩余 ${availableInProfilePool.length} 个: [${availableInProfilePool.join(', ')}]`);
                      console.log(`   🚨 警告：圈外类型 ${genreToReplace} 被圈内类型 ${replacementGenre} 替换，破坏了2+2结构平衡`);
                      
                      // 更新selectedOutOfProfileGenres（虽然实际上是圈内类型）
                      const index = selectedOutOfProfileGenres.indexOf(genreToReplace);
                      selectedOutOfProfileGenres[index] = replacementGenre;
                  } else {
                      console.log(`⚠️ 圈内和圈外类型池都已空，进入尽力而为模式`);
                      bestEffortMode = true;
                      break;
                  }
              }
              
              if (replacementGenre) {
                  // 🔥 关键步骤：清理门户 - 从finalMovies中删除所有失败类型的电影
                  const beforeCount = finalMovies.length;
                  finalMovies = finalMovies.filter(movie => movie.targetGenre !== genreToReplace);
                  const removedCount = beforeCount - finalMovies.length;
                  console.log(`🧹 清理门户：从最终列表中移除 ${removedCount} 部 ${genreToReplace} 类型电影`);
                  
                  // 更新targetGenres
                  const index = targetGenres.indexOf(genreToReplace);
                  targetGenres[index] = replacementGenre;
                  
                  // 为新类型构建候选池
                  const newGenreMovies = candidatePool
                      .filter(m => {
                          // 正确的类型匹配：按逗号分割后精确匹配
                          const movieGenres = m.genres.split(',').map(g => g.trim());
                          return movieGenres.includes(replacementGenre);
                      })
                      .sort((a, b) => parseInt(b.startYear, 10) - parseInt(a.startYear, 10));
                  genreToMoviesMap.set(replacementGenre, newGenreMovies);
                  
                  // 判断是否发生了跨界替补
                  const originalIsInProfile = isInProfile;
                  const newIsInProfile = userProfile.in_profile_genres.includes(replacementGenre);
                  const isCrossBoundary = originalIsInProfile !== newIsInProfile;
                  
                  if (isCrossBoundary) {
                      console.log(`🔄 跨界替补完成：${genreToReplace} (${originalIsInProfile ? 'INCLUDE' : 'EXCLUDE'}) → ${replacementGenre} (${newIsInProfile ? 'INCLUDE' : 'EXCLUDE'})`);
                  } else {
                      console.log(`✅ 完整替换：${genreToReplace} → ${replacementGenre} (${isInProfile ? 'INCLUDE' : 'EXCLUDE'}类型)`);
                  }
                  console.log(`   新类型可用电影: ${newGenreMovies.length} 部`);
                  console.log(`   当前最终列表: ${finalMovies.length}/12 部电影`);
                  
                  // 重置新类型的失败计数
                  rejectionTracker.delete(replacementGenre);
              }
          }
          
          if (!bestEffortMode) {
              console.log(`更新后的目标类型: ${targetGenres.join(', ')}`);
              console.log(`\n=== 类型池当前状态 ===`);
              console.log(`圈内备用池 (${availableInProfilePool.length}个): [${availableInProfilePool.join(', ')}]`);
              console.log(`圈外备用池 (${availableOutOfProfilePool.length}个): [${availableOutOfProfilePool.slice(0, 10).join(', ')}${availableOutOfProfilePool.length > 10 ? '...' : ''}]`);
              console.log(`替换尝试次数: 圈内${replacementAttempts.inProfile}/${MAX_REPLACEMENT_ATTEMPTS}, 圈外${replacementAttempts.outOfProfile}/${MAX_REPLACEMENT_ATTEMPTS}`);
          }
      }
      
      // 检查是否进入尽力而为模式
      if (bestEffortMode) {
          console.log(`\n🚨 进入尽力而为模式 - 放弃严格结构要求`);
          console.log(`当前已找到 ${finalMovies.length} 部合格电影，将直接返回`);
          console.log(`⚠️ 警告：本次推荐未能满足2+2类型结构化要求`);
          break;
      }

      if (finalMovies.length >= 12) break;

      // 准备下一轮的替换电影
      console.log(`\n=== 准备下一轮替换电影 ===`);
      moviesToVerify = [];
      const currentCounts = {};
      targetGenres.forEach(g => currentCounts[g] = 0);
      finalMovies.forEach(m => {
          // 使用附加的targetGenre来精确计数
          if (m.targetGenre && currentCounts[m.targetGenre] < 3) {
            currentCounts[m.targetGenre]++;
          }
      });
      
      console.log(`当前各类型电影数量:`, currentCounts);
      
      for (const genre of targetGenres) {
          const neededCount = 3 - (currentCounts[genre] || 0);
          console.log(`${genre}: 已有${currentCounts[genre] || 0}部，还需${neededCount}部`);
          
          if (neededCount > 0) {
              const availableCount = genreToMoviesMap.get(genre)?.length || 0;
              const triedCount = Array.from(triedTconsts).filter(tconst => {
                  const candidates = genreToMoviesMap.get(genre) || [];
                  return candidates.some(m => m.tconst === tconst);
              }).length;
              
              console.log(`  可用候选: ${availableCount}部，已尝试: ${triedCount}部，剩余: ${availableCount - triedCount}部`);
              
              for (let i = 0; i < neededCount; i++) {
                  const replacement = pickNextMovieForGenre(genre);
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

  // --- 阶段四：收尾与返回 ---
  if (bestEffortMode) {
      console.log(`\n=== 尽力而为模式结果 ===`);
      console.log(`⚠️ 由于场景限制，未能满足严格的2+2结构要求`);
      console.log(`返回当前找到的 ${finalMovies.length} 部合格电影`);
      
      // 记录替换尝试统计
      console.log(`替换尝试统计: 圈内${replacementAttempts.inProfile}次, 圈外${replacementAttempts.outOfProfile}次`);
  } else if (iteration >= MAX_ITERATIONS && finalMovies.length < 12) {
      console.warn(`警告：达到最大迭代次数 (${MAX_ITERATIONS}次)，但仍未集齐12部电影。`);
  } else {
      console.log(`\n✅ 成功完成严格结构化推荐`);
  }
  
  // 详细打印最终筛选出的12部电影，按include/exclude分类
  console.log(`\n=== 最终筛选结果 (${finalMovies.length}部电影) ===`);
  
  // 按include/exclude类型分组显示
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
  
  // 按类型统计
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