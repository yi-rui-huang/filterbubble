// messageFormatter.js
// Simple plain text formatter for agent responses (no message splitting)

/**
 * Format agent responses without any processing (completely unmodified)
 * @param {string} text - The original text from the agent
 * @param {string} agentKey - The key identifying which agent sent the message
 * @param {object} context - The Vue component context (this)
 * @returns {Array} - Array containing a single unmodified message
 */
/**
 * 将长的 Markdown 文本分割成多个小块
 * @param {string} markdownText - 原始 Markdown 文本
 * @returns {Array<string>} - 分割后的文本数组
 */
export function splitMarkdownContent(markdownText) {
  if (!markdownText) return [];
  
  // 首先按照主要标题分割（H1、H2）
  const sections = [];
  let currentSection = '';
  
  // 按行分割文本
  const lines = markdownText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检测主要标题行
    if (line.match(/^#{1,2}\s+/)) {
      // 如果已经有内容，保存当前部分
      if (currentSection.trim()) {
        sections.push(currentSection.trim());
      }
      // 开始新部分
      currentSection = line + '\n';
    } else {
      // 继续添加到当前部分
      currentSection += line + '\n';
      
      // 如果这是列表的结束或一个大段落的结束，考虑分割
      if ((line.trim() === '' && currentSection.trim().length > 300) ||
          (i === lines.length - 1 && currentSection.trim())) {
        sections.push(currentSection.trim());
        currentSection = '';
      }
    }
  }
  
  // 添加最后一部分（如果有）
  if (currentSection.trim()) {
    sections.push(currentSection.trim());
  }
  
  return sections;
}

export async function splitAndAddMessages(text, agentKey, context) {
  console.log("%c处理代理回复", "background: #00f; color: #fff; padding: 2px;", {
    代理: agentKey,
    文本长度: text.length,
    文本开头: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  });
  
  // 重要：首先在分割消息之前提取电影推荐
  // 这确保了即使消息被分割，也能正确提取完整消息中的电影推荐
  if (context) {
    console.log(`在分割消息前提取电影推荐 (${agentKey})`);
    // 优先使用API提取电影名称，如果不可用则回退到正则表达式方法
    if (typeof context.extractMoviesWithAPI === 'function') {
      await context.extractMoviesWithAPI(text, agentKey);
    } else if (typeof context.extractMovieRecommendation === 'function') {
      await context.extractMovieRecommendation(text, agentKey);
    }
  }
  
  // 分割 Markdown 文本为多个部分
  const sections = splitMarkdownContent(text);
  
  // 如果内容很短，或者没有成功分割，则保留原始文本
  const messages = sections.length > 1 ? sections : [text];
  
  // 记录分割结果
  console.log(`%c[DEBUG] ${agentKey} 分割后的消息:`, "background: #f0f; color: #fff; padding: 2px;", {
    分割数量: messages.length,
    分割结果: messages.map((m, i) => `${i+1}: ${m.substring(0, 50)}...`),
    消息数量: messages.length,
    所有消息: messages.map((m, i) => `${i+1}: ${m.substring(0, 100)}...`)
  });
  
  // 返回包含完整原始消息的数组
  return messages;
}

/**
 * 将Markdown文本转换为纯文本
 * @param {string} markdown - Markdown格式的文本
 * @returns {string} - 转换后的纯文本
 */
function convertMarkdownToPlainText(markdown) {
  // 移除Markdown语法
  let plainText = markdown;
  
  // 移除加粗和斜体
  plainText = plainText.replace(/\*\*(.*?)\*\*/g, '$1'); // 移除加粗 **text**
  plainText = plainText.replace(/\*(.*?)\*/g, '$1');     // 移除斜体 *text*
  plainText = plainText.replace(/__(.*?)__/g, '$1');     // 移除加粗 __text__
  plainText = plainText.replace(/_(.*?)_/g, '$1');       // 移除斜体 _text_
  
  // 移除代码块和行内代码
  plainText = plainText.replace(/```[\s\S]*?```/g, function(match) {
    // 保留代码块内容，但移除```标记
    return match.replace(/```(?:\w+)?\n?|\n?```/g, '');
  });
  plainText = plainText.replace(/`(.*?)`/g, '$1');      // 移除行内代码 `code`
  
  // 处理链接 [text](url)
  plainText = plainText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  
  // 处理图片 ![alt](url)
  plainText = plainText.replace(/!\[(.*?)\]\(.*?\)/g, '$1');
  
  // 处理标题 (保留文本，移除#符号)
  plainText = plainText.replace(/^#+\s+(.*?)$/gm, '$1');
  
  // 处理引用块
  plainText = plainText.replace(/^>\s+(.*?)$/gm, '$1');
  
  // 处理水平线
  plainText = plainText.replace(/^---+$/gm, '');
  plainText = plainText.replace(/^===+$/gm, '');
  
  // 处理有序和无序列表 (保留列表项文本)
  plainText = plainText.replace(/^\s*[-*+]\s+(.*?)$/gm, '• $1');
  plainText = plainText.replace(/^\s*\d+\.\s+(.*?)$/gm, '• $1');
  
  return plainText;
}

/**
 * 将Markdown文本转换为HTML
 * @param {string} markdown - Markdown格式的文本
 * @returns {string} - 转换后的HTML
 */
export function renderMarkdown(markdown) {
  // 检查输入
  if (!markdown) return '';
  
  try {
    // 导入marked库 - 使用import语法而不是require
    // 注意：在15.0.12版本中，marked不再是默认导出
    const marked = require('marked');
    
    // 配置marked选项
    const renderer = new marked.Renderer();
    
    // 设置marked选项
    const options = {
      renderer: renderer,
      breaks: true,       // 将换行符转换为<br>
      gfm: true,          // 使用GitHub风格的Markdown
      headerIds: false,   // 不添加标题ID
      mangle: false       // 不转义HTML
    };
    
    // 使用marked.parse而不是直接调用marked
    return marked.parse(markdown, options);
  } catch (error) {
    console.error('Error rendering markdown:', error);
    // 如果出错则返回原始文本
    return markdown;
  }
}
