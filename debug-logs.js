// 添加到 splitAndAddMessages 方法中的调试代码
console.log(`%c[DEBUG] ${agentKey} 原始完整消息:`, "background: #f0f; color: #fff; padding: 2px;", text);

// 添加到 sentences 数组处理后的调试代码
console.log(`%c[DEBUG] ${agentKey} 分割后句子:`, "background: #f0f; color: #fff; padding: 2px;", {
  句子数量: sentences.length,
  所有句子: sentences.map((s, i) => `${i+1}: ${s.substring(0, 50)}...`)
});

// 添加到最终消息数组创建后的调试代码
console.log(`%c[DEBUG] ${agentKey} 最终消息数组:`, "background: #f0f; color: #fff; padding: 2px;", {
  消息数量: messages.length,
  所有消息: messages.map((m, i) => `${i+1}: ${m.substring(0, 100)}...`)
});

// 添加到 handleAgentResponse 方法中存储消息后的调试代码
console.log(`%c[DEBUG] ${agentKey} 存储到expertMessagesMap的消息:`, "background: #606; color: #fff; padding: 2px;", {
  消息数量: this.expertMessagesMap[agentKey].length,
  所有消息: this.expertMessagesMap[agentKey].map((m, i) => `${i+1}: ${m.substring(0, 100)}...`)
});

// 添加到 interleavedAddMessages 方法开始处的调试代码
console.log(`%c[DEBUG] 交错显示前所有专家的消息:`, "background: #909; color: #fff; padding: 2px;");
for (const agentKey in agentMessages) {
  console.log(`%c[DEBUG] ${agentKey} 的所有消息:`, "background: #909; color: #fff; padding: 2px;", {
    消息数量: agentMessages[agentKey].length,
    所有消息: agentMessages[agentKey].map((m, i) => `${i+1}: ${m.substring(0, 100)}...`)
  });
}

// 添加到 interleavedAddMessages 方法中每轮迭代前的调试代码
console.log(`%c[DEBUG] 开始第 ${round + 1}/${maxRounds} 轮交错消息`, "background: #909; color: #fff; padding: 2px;", {
  本轮显示顺序: agentKeys
});

// 添加到 addMessage 方法中的调试代码
console.log(`%c[DEBUG] 添加到UI的消息:`, "background: #333; color: #bada55; padding: 2px;", {
  发送者: message.sender,
  代理类型: message.agentType || 'N/A',
  完整文本: message.text
});
