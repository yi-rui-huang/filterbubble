// 测试API配置是否正确
import { API_KEY, BASE_URL, MODEL } from './src/config.js';

console.log('=== API配置测试 ===');
console.log('API_KEY:', API_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('BASE_URL:', BASE_URL);
console.log('MODEL:', MODEL);

// 简单的API连通性测试
async function testAPI() {
  if (!API_KEY) {
    console.error('❌ API密钥未设置，无法进行API测试');
    return;
  }

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
            role: 'user',
            content: '测试连接，请回复"连接成功"'
          }
        ],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API连接成功！');
      console.log('响应:', data.choices[0].message.content);
    } else {
      console.error('❌ API调用失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ API测试出错:', error.message);
  }
}

// 运行测试
testAPI();
