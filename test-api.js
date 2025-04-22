const axios = require('axios');

// 使用您代码中的API配置
const API_KEY = 'sk-SE3cDjGLJoAcscUqzyfVELo1yNnrxgJ18jFkhcwwhTqqUJUn';
const BASE_URL = 'https://api.tao-shen.com/v1';
const MODEL = 'gpt-4o';
const API_TIMEOUT = 30000; // 30秒超时

async function testApiConnection() {
  console.log('开始测试API连接...');
  
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
    
    console.log('发送API请求...');
    const startTime = Date.now();
    
    const response = await axios.post(
      `${BASE_URL}/chat/completions`, 
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
    } else {
      console.error('API响应格式不符合预期:', response.data);
    }
  } catch (error) {
    console.error('API调用出错:');
    if (error.response) {
      // 服务器响应了，但状态码不在2xx范围内
      console.error('响应状态:', error.response.status);
      console.error('响应头:', error.response.headers);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('未收到响应，可能是网络问题或API服务器未响应');
      console.error(error.request);
    } else {
      // 设置请求时发生了错误
      console.error('请求配置错误:', error.message);
    }
    console.error('错误详情:', error.toJSON());
  }
}

// 执行测试
testApiConnection();
