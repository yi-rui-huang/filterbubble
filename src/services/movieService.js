// Movie database and detection service

// Sample list of popular movies for detection
const popularMovies = [
    "The Shawshank Redemption", "The Godfather", "The Dark Knight", "The Godfather Part II",
    "12 Angry Men", "Schindler's List", "The Lord of the Rings", "Pulp Fiction",
    "The Good, the Bad and the Ugly", "Fight Club", "Forrest Gump", "Inception",
    "The Matrix", "Goodfellas", "One Flew Over the Cuckoo's Nest", "Seven Samurai",
    "Se7en", "City of God", "The Silence of the Lambs", "It's a Wonderful Life",
    "Life Is Beautiful", "The Usual Suspects", "Léon: The Professional", "Spirited Away",
    "Saving Private Ryan", "Interstellar", "The Green Mile", "The Prestige",
    "The Intouchables", "The Lion King", "The Pianist", "Back to the Future",
    "Terminator 2", "Modern Times", "Psycho", "Gladiator",
    "City Lights", "The Departed", "Whiplash", "Grave of the Fireflies",
    "Memento", "Sunset Boulevard", "Dr. Strangelove", "The Great Dictator",
    "Cinema Paradiso", "The Lives of Others", "Paths of Glory", "Django Unchained",
    "The Shining", "WALL·E", "American Beauty", "The Dark Knight Rises",
    "Aliens", "Oldboy", "Princess Mononoke", "Citizen Kane",
    "Das Boot", "Vertigo", "North by Northwest", "Star Wars: Episode VI",
    "Braveheart", "Reservoir Dogs", "Toy Story 3", "Amadeus",
    "Inglourious Basterds", "Good Will Hunting", "Requiem for a Dream", "Toy Story",
    "Unforgiven", "Eternal Sunshine of the Spotless Mind", "Full Metal Jacket", "A Clockwork Orange",
    "Taxi Driver", "2001: A Space Odyssey", "Lawrence of Arabia", "Double Indemnity",
    "To Kill a Mockingbird", "Alien", "Singin' in the Rain", "Bicycle Thieves",
    "Requiem for a Dream", "Scarface", "The Sting", "Monty Python and the Holy Grail",
    "3 Idiots", "Rashomon", "Indiana Jones", "The Apartment",
    "A Separation", "Metropolis", "Yojimbo", "All About Eve",
    "Batman Begins", "Some Like It Hot", "The Treasure of the Sierra Madre", "Unforgiven",
    "Raging Bull", "The Third Man", "Chinatown", "Die Hard",
    "Avengers: Endgame", "Avengers: Infinity War", "Spider-Man: No Way Home", "Black Panther"
];

// Store loaded movie data
let moviesData = [];

// Global map to track movie mentions across components
const globalMovieMentions = new Map();

/**
 * Load movie data from the predefined list or an API
 * @returns {Promise<Array>} Array of movie objects
 */
export function loadMoviesData() {
    // For now, we're using our predefined list
    // In a real app, this might fetch from an API
    moviesData = popularMovies.map(title => ({ title }));
    return Promise.resolve(moviesData);
}

/**
 * Detect and mark movies in a message
 * @param {string} message - The message to process
 * @param {HTMLElement} container - The container element
 * @returns {Object} Object containing marked content and detected movies
 */
/**
 * 检查是否是有效的电影标题
 * @param {string} title - 要检查的电影标题
 * @returns {boolean} - 是否是有效的电影标题
 */
export function isValidMovieTitle(title) {
    // 清理标题，移除结尾的标点符号
    title = normalizeMovieTitle(title);
    
    if (!title || title.length < 3 || title.length > 100) {
        return false; // 标题太短或太长
    }
    
    // 检查是否包含撤号，这可能是词组的一部分，而不是电影标题
    if (title.includes("'") && !title.includes(" ")) {
        return false; // 包含撤号但没有空格，可能是缩写形式如 "It's"
    }
    
    // 检查是否是常见的词组或短语
    const commonPhrases = [
        'it', 'the', 'a', 'an', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by',
        'about', 'like', 'through', 'over', 'before', 'between', 'after', 'since', 'without', 'under',
        'within', 'along', 'following', 'across', 'behind', 'beyond', 'plus', 'except', 'but', 'up',
        'out', 'around', 'down', 'off', 'above', 'below', 'this', 'that', 'these', 'those', 'they',
        'we', 'you', 'I', 'he', 'she', 'it', 'who', 'what', 'where', 'when', 'why', 'how'
        // 注意：我们移除了可能是电影名称的单词，如'alien', 'matrix', 'up', 'cars', 'jaws'等
    ];
    
    if (commonPhrases.includes(title.toLowerCase())) {
        return false;
    }
    
    // 检查是否是只包含常见词组的长句子
    if (title.split(' ').length > 10) {
        return false; // 过长的句子可能不是电影标题
    }
    
    return true;
}

/**
 * 标准化电影标题，移除标点符号和多余空格
 * @param {string} title - 要标准化的电影标题
 * @returns {string} - 标准化后的电影标题
 */
export function normalizeMovieTitle(title) {
    if (!title) return title;
    
    // 移除结尾的标点符号
    title = title.replace(/[.,!?;:"'\)\]]+$/, '');
    // 移除开头的标点符号、大于号、破折号等特殊字符
    title = title.replace(/^[.,!?;:"'\(\[>\-\s]+/, '');
    // 移除结尾的特殊字符
    title = title.replace(/[>\-\s]+$/, '');
    // 移除多余空格
    title = title.trim().replace(/\s+/g, ' ');
    
    return title;
}

export function markMoviesInMessage(message, container) {
    if (!message || !moviesData.length) {
        return { markedContent: message, movies: [] };
    }

    let markedContent = message;
    const detectedMovies = [];
    
    // 添加一些流行的电影到电影数据中，确保它们能被检测到
    const popularMovies = [
        "Home Alone", "The Shawshank Redemption", "The Godfather", "The Dark Knight",
        "Pulp Fiction", "Forrest Gump", "The Matrix", "Goodfellas", "Inception",
        "Fight Club", "Star Wars", "The Lord of the Rings", "Jurassic Park", "Titanic",
        "Avatar", "The Lion King", "Finding Nemo", "Toy Story", "Up", "Inside Out",
        "Frozen", "Coco", "Moana", "Zootopia", "The Incredibles", "WALL-E",
        "Back to the Future", "Indiana Jones", "Rocky", "Terminator", "Alien", "Jaws"
    ];
    
    // 确保这些流行电影在电影数据中
    popularMovies.forEach(movie => {
        if (!moviesData.some(m => m.title.toLowerCase() === movie.toLowerCase())) {
            moviesData.push({ title: movie });
        }
    });
    
    // 使用特定模式提取明确的电影推荐
    const recommendationPatterns = [
        /I recommend (?:watching |seeing )?["'](.+?)["']/ig,
        /You might enjoy ["'](.+?)["']/ig,
        /Have you seen ["'](.+?)["']/ig,
        /["'](.+?)["'] is a great film/ig,
        /["'](.+?)["'] would be perfect for you/ig,
        /["'](.+?)["'] is (?:an |a )?(?:excellent|amazing|fantastic|wonderful|great) (?:movie|film)/ig,
        /I love ["'](.+?)["']/ig,
        /["'](.+?)["'] is one of my favorites/ig,
        /check out ["'](.+?)["']/ig,
        /watch ["'](.+?)["']/ig,
        /["'](.+?)["'] - /ig  // 匹配引号中的电影名称后跟破折号的模式（常见于列表）
    ];
    
    // 首先使用特定模式提取明确的电影推荐
    for (const pattern of recommendationPatterns) {
        let match;
        while ((match = pattern.exec(message)) !== null) {
            if (match[1] && isValidMovieTitle(match[1])) {
                const normalizedTitle = normalizeMovieTitle(match[1]);
                if (!detectedMovies.includes(normalizedTitle)) {
                    detectedMovies.push(normalizedTitle);
                    // 标记电影名称
                    markedContent = markedContent.replace(
                        match[1], 
                        `<span class="movie-mention">${normalizedTitle}</span>`
                    );
                }
            }
        }
    }
    
    // 检查上下文是否表明这可能是电影名称
    const hasMovieContext = (text, movieTitle, matchIndex) => {
        // 提取匹配前后的上下文（约50个字符）
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(text.length, matchIndex + movieTitle.length + 50);
        const context = text.substring(start, end).toLowerCase();
        
        // 电影相关的上下文词汇
        const movieContextWords = [
            'movie', 'film', 'directed', 'starring', 'watched', 'cinema', 'theater',
            'actor', 'actress', 'director', 'screenplay', 'production', 'released',
            'sequel', 'prequel', 'trilogy', 'series', 'franchise', 'box office',
            'oscar', 'award', 'nominated', 'classic', 'blockbuster', 'hit', 'flop',
            'recommend', 'rating', 'stars', 'review', 'critic', 'genre', 'plot',
            'character', 'scene', 'soundtrack', 'theme', 'adaptation', 'based on',
            'watch', 'see', 'viewing', 'stream', 'netflix', 'hulu', 'amazon prime',
            'disney+', 'hbo', 'dvd', 'blu-ray', 'showing', 'premiere', 'debut',
            'title', 'film called', 'movie called', 'named', 'entitled'
        ];
        
        // 检查上下文中是否有电影相关词汇
        return movieContextWords.some(word => context.includes(word));
    };

    // 然后提取引号中的内容，更宽松地处理电影名称
    const doubleQuotePattern = /"([^"]+)"/g; // 只匹配双引号
    let quoteMatch;
    
    while ((quoteMatch = doubleQuotePattern.exec(message)) !== null) {
        const potentialMovie = quoteMatch[1];
        const matchIndex = quoteMatch.index;
        
        // 对于引号中的内容，我们更宽松地处理，假设大多数引号中的内容都是电影名称
        // 特别是在GPT的回复中，我们已经要求它用引号标记电影名称
        if (potentialMovie && potentialMovie.length >= 2 && !potentialMovie.includes('<span')) {
            const normalizedTitle = normalizeMovieTitle(potentialMovie);
            if (!detectedMovies.includes(normalizedTitle)) {
                detectedMovies.push(normalizedTitle);
                // 标记电影名称
                markedContent = markedContent.replace(
                    `"${potentialMovie}"`, 
                    `"<span class="movie-mention">${normalizedTitle}</span>"`
                );
            }
        }
    }
    
    // 最后检查电影数据库中的电影
    const sortedMovies = [...moviesData].sort((a, b) => 
        b.title.length - a.title.length
    );

    // Check for movie titles in the message
    for (const movie of sortedMovies) {
        // 跳过太短的电影名称（少于3个字符）
        if (movie.title.length < 3) continue;
        
        // 跳过已经检测到的电影
        if (detectedMovies.includes(normalizeMovieTitle(movie.title))) continue;
        
        // Create a case-insensitive regex that matches whole words
        const regex = new RegExp(`\\b${escapeRegExp(movie.title)}\\b`, 'gi');
        let match;
        
        // 使用exec而不是match，这样我们可以获取匹配位置
        while ((match = regex.exec(message)) !== null) {
            const movieTitle = match[0];
            const matchIndex = match.index;
            
            // 检查是否已经在HTML标签中（避免重复标记）
            const beforeMatch = message.substring(Math.max(0, matchIndex - 30), matchIndex);
            if (beforeMatch.includes('<span class="movie-mention">')) {
                const lastOpenTag = beforeMatch.lastIndexOf('<span class="movie-mention">');
                const lastCloseTag = beforeMatch.lastIndexOf('</span>');
                if (lastOpenTag > lastCloseTag) {
                    continue; // 已经在标签内，跳过
                }
            }
            
            // 添加到检测到的电影列表中（如果还没有添加）
            const normalizedTitle = normalizeMovieTitle(movie.title);
            if (!detectedMovies.includes(normalizedTitle)) {
                detectedMovies.push(normalizedTitle);
                // 标记电影名称
                markedContent = markedContent.replace(
                    movieTitle, 
                    `<span class="movie-mention">${normalizedTitle}</span>`
                );
            }
        }
    }

    console.log('检测到的电影:', detectedMovies);
    return {
        markedContent,
        movies: detectedMovies
    };
}

/**
 * Update the global movie list with newly detected movies
 * @param {Array} movies - Array of movie titles
 */
export function updateMovieList(movies) {
    if (!movies || !movies.length) return;

    console.log('Updating movie list with:', movies);
    
    // 确保movies是数组
    const movieArray = Array.isArray(movies) ? movies : [movies];
    
    // 创建一个延迟，确保事件不会太快发送
    const dispatchEvents = () => {
        // 获取当前所有电影的副本，用于调试
        const allMovies = Object.fromEntries(globalMovieMentions);
        console.log('All movies after update:', allMovies);
        
        // 为每个更新的电影分发事件
        movieArray.forEach(movie => {
            if (!movie) return; // 跳过空值
            
            // Strip HTML tags from movie title before dispatching event
            const cleanMovieTitle = stripHtmlTags(movie).trim();
            if (!cleanMovieTitle) return; // Skip if nothing remains after stripping HTML
            
            const count = globalMovieMentions.get(cleanMovieTitle);
            console.log(`Dispatching event for movie: ${cleanMovieTitle}, count: ${count}`);
            
            // 分发事件通知组件
            const event = new CustomEvent('movie-mentioned', {
                detail: { movie: cleanMovieTitle, count }
            });
            document.dispatchEvent(event);
        });
    };

    // 更新全局电影提及计数
    movieArray.forEach(movie => {
        if (!movie) return; // 跳过空值
        
        // Strip HTML tags from movie title before updating counts
        const cleanMovieTitle = stripHtmlTags(movie).trim();
        if (!cleanMovieTitle) return; // Skip if nothing remains after stripping HTML
        
        const currentCount = globalMovieMentions.get(cleanMovieTitle) || 0;
        const newCount = currentCount + 1;
        console.log(`Updating movie count: ${cleanMovieTitle} from ${currentCount} to ${newCount}`);
        globalMovieMentions.set(cleanMovieTitle, newCount);
    });
    
    // 使用setTimeout确保所有更新完成后再分发事件
    setTimeout(dispatchEvents, 0);
}

/**
 * Get the current movie mentions map
 * @returns {Map} Map of movie mentions
 */
export function getMovieMentions() {
    return globalMovieMentions;
}

/**
 * Helper function to escape special characters in regex
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper function to strip HTML tags from a string
 * @param {string} html - String that may contain HTML tags
 * @returns {string} String with HTML tags removed
 */
function stripHtmlTags(html) {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<\/?[^>]+(>|$)/g, '');
}
