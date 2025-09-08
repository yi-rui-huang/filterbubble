const axios = require('axios');

// 使用您代码中的API配置
const API_KEY = 'sk-GDdSWdIROKEoJUm0MRebZQf2SxGP2DO7LJCe0rfu8rYKlb5s';
const BASE_URL = 'https://api.tao-shen.com/v1';
const MODEL = 'gpt-4o';
const API_TIMEOUT = 30000; // 30秒超时

// 重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 初始延迟2秒

// 延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testApiConnection() {
  console.log('开始测试API连接...');
  
  let retries = 0;
  let lastError = null;

  while (retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`尝试第 ${retries} 次重试...`);
        // 指数退避策略
        await sleep(RETRY_DELAY * Math.pow(2, retries - 1));
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      };
      
      const data = {
        model: MODEL,
        messages: [{
          role: 'user',
          content: '这是一条测试消息，请简短回复以确认API连接正常。'
        }],
        max_tokens: 50
      };
      
      console.log('发送API请求...');
      const startTime = Date.now();
  
      // OpenAI兼容接口路径
      const url = `${BASE_URL}/chat/completions`;
      
      const response = await axios.post(
        url, 
        data, 
        { 
          headers, 
          timeout: API_TIMEOUT 
        }
      );
      
      const endTime = Date.now();
      console.log(`API响应时间: ${(endTime - startTime) / 1000}秒`);
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        console.log('API调用成功!');
        console.log('API响应内容:', response.data.choices[0].message.content);
        console.log('完整响应数据:', JSON.stringify(response.data, null, 2));
        return; // 成功则退出
      } else {
        console.error('API响应格式不符合预期:', response.data);
        lastError = new Error('API响应格式不符合预期');
      }
    } catch (error) {
      lastError = error;
      console.error(`第 ${retries} 次尝试失败:`);
      if (error.response) {
        // 服务器响应了，但状态码不在2xx范围内
        console.error('响应状态:', error.response.status);
        console.error('响应头:', error.response.headers);
        console.error('响应数据:', error.response.data);
      } else if (error.request) {
        // 请求已发出，但没有收到响应
        console.error('未收到响应，可能是网络问题或API服务器未响应');
      } else {
        // 设置请求时发生了错误
        console.error('请求配置错误:', error.message);
      }
      
      // 如果不是服务器错误（5xx），则不再重试
      if (error.response && error.response.status < 500) {
        console.error('非服务器错误，停止重试');
        break;
      }
    }
    
    retries++;
  }
  
  if (lastError) {
    console.error('所有重试尝试均失败。最后的错误详情:');
    console.error(lastError.toJSON ? lastError.toJSON() : lastError);
  }
}

// 尝试备用API端点
async function tryAlternativeEndpoint() {
  console.log('\n尝试备用API端点...');
  
  // 这里可以尝试其他兼容OpenAI API的服务，如果有的话
  const alternativeBaseUrls = [
    'https://api.tao-shen.com/v1', // 原始端点
    'https://api-backup.tao-shen.com/v1', // 假设的备用端点
    // 可以添加更多备用端点
  ];
  
  for (const baseUrl of alternativeBaseUrls) {
    if (baseUrl === BASE_URL) continue; // 跳过已测试的主端点
    
    console.log(`测试备用端点: ${baseUrl}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      };
      
      const data = {
        model: MODEL,
        messages: [{
          role: 'user',
          content: '这是一条测试消息，请简短回复以确认API连接正常。'
        }],
        max_tokens: 50
      };
      
      const response = await axios.post(
        `${baseUrl}/chat/completions`, 
        data, 
        { 
          headers, 
          timeout: API_TIMEOUT 
        }
      );
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        console.log('备用API调用成功!');
        console.log('API响应内容:', response.data.choices[0].message.content);
        return true;
      }
    } catch (error) {
      console.error(`备用端点 ${baseUrl} 测试失败:`, error.message);
    }
  }
  
  return false;
}

// 执行测试
async function runTests() {
  await testApiConnection();
  
  // 如果主端点测试失败，尝试备用端点
  // await tryAlternativeEndpoint();
  
  console.log('\n测试完成。如果所有尝试均失败，请检查以下可能的原因:');
  console.log('1. API服务可能暂时不可用，请稍后再试');
  console.log('2. API密钥可能已过期或无效');
  console.log('3. 网络连接问题');
  console.log('4. 服务提供商可能已更改API端点或认证方式');
}

runTests();
