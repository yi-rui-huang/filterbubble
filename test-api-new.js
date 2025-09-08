const axios = require('axios');

// 使用SecondRoundConversation.vue中的API配置
const API_KEY = 'sk-SE3cDjGLJoAcscUqzyfVELo1yNnrxgJ18jFkhcwwhTqqUJUn';
const BASE_URL = 'https://api.tao-shen.com/v1';
const MODEL = 'gpt-4o';
const API_TIMEOUT = 30000; // 30秒超时

async function testApiConnection() {
  console.log('=== API连接测试开始 ===');
  console.log(`API基础URL: ${BASE_URL}`);
  console.log(`模型: ${MODEL}`);
  console.log(`超时设置: ${API_TIMEOUT}ms`);
  console.log('------------------------');
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };
    
    // 简单的测试消息
    const data = {
      model: MODEL,
      messages: [{
        role: 'user',
        content: '请用一句话回复以确认API连接正常。'
      }],
      max_tokens: 50
    };
    
    console.log('正在发送API请求...');
    const startTime = Date.now();
    
    // 发送请求
    const response = await axios.post(
      `${BASE_URL}/chat/completions`, 
      data, 
      { 
        headers, 
        timeout: API_TIMEOUT 
      }
    );
    
    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;
    
    console.log(`✓ 请求成功! 响应时间: ${responseTime.toFixed(2)}秒`);
    
    // 检查响应格式
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      console.log('✓ 响应格式正确');
      console.log(`✓ 模型响应: "${response.data.choices[0].message.content}"`);
      
      // 显示模型详细信息
      if (response.data.model) {
        console.log(`✓ 使用的模型: ${response.data.model}`);
      }
      
      // 显示token使用情况
      if (response.data.usage) {
        console.log('✓ Token使用情况:');
        console.log(`  - 提示tokens: ${response.data.usage.prompt_tokens}`);
        console.log(`  - 完成tokens: ${response.data.usage.completion_tokens}`);
        console.log(`  - 总tokens: ${response.data.usage.total_tokens}`);
      }
      
      console.log('=== API测试结果: 成功 ===');
      return true;
    } else {
      console.error('✗ 响应格式不符合预期:');
      console.error(JSON.stringify(response.data, null, 2));
      console.log('=== API测试结果: 失败 (响应格式错误) ===');
      return false;
    }
  } catch (error) {
    console.error('✗ API调用失败:');
    
    if (error.response) {
      // 服务器响应了，但状态码不在2xx范围内
      console.error(`✗ 错误状态码: ${error.response.status}`);
      console.error('✗ 错误响应:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      // 检查常见错误
      if (error.response.status === 401) {
        console.error('✗ 认证失败: API密钥可能无效或已过期');
      } else if (error.response.status === 404) {
        console.error('✗ 资源未找到: API端点可能不正确');
      } else if (error.response.status === 429) {
        console.error('✗ 请求过多: 已超过API速率限制');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('✗ 未收到响应: 可能是网络问题、API服务器未响应或URL错误');
      console.error(`✗ 请求超时设置: ${API_TIMEOUT}ms`);
    } else {
      // 设置请求时发生了错误
      console.error(`✗ 请求配置错误: ${error.message}`);
    }
    
    // 提供可能的解决方案
    console.log('\n可能的解决方案:');
    console.log('1. 检查API密钥是否正确且未过期');
    console.log('2. 确认API基础URL是否正确');
    console.log('3. 检查网络连接是否稳定');
    console.log('4. 尝试增加超时时间');
    console.log('5. 确认模型名称是否正确且可用');
    
    console.log('=== API测试结果: 失败 ===');
    return false;
  }
}

// 执行测试
testApiConnection().then(success => {
  if (!success) {
    console.log('\n尝试备用方案...');
    console.log('您可以尝试使用其他API提供商，如OpenAI、Anthropic或Azure OpenAI');
  }
});
