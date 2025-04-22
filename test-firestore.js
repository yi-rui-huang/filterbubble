const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, limit, serverTimestamp } = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDIXYeV0yqRJmgBJrKI5PUMKvCqOQyBDp8",
  authDomain: "filter-bubble-study.firebaseapp.com",
  projectId: "filter-bubble-study",
  storageBucket: "filter-bubble-study.appspot.com",
  messagingSenderId: "1033115144656",
  appId: "1:1033115144656:web:c2e5e32d9b0c3e2f3e6f2f"
};

// 测试 Firestore 连接
async function testFirestoreConnection() {
  console.log('开始测试 Firestore 连接...');
  console.log('----------------------------');
  
  try {
    // 初始化 Firebase
    console.log('正在初始化 Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('Firebase 初始化成功!');
    
    // 获取 Firestore 实例
    console.log('正在获取 Firestore 实例...');
    const db = getFirestore(app);
    console.log('Firestore 实例获取成功!');
    
    // 测试写入操作
    console.log('正在测试写入操作...');
    const testCollection = collection(db, 'test_connection');
    const testDoc = {
      message: "测试连接",
      timestamp: new Date().toISOString(),
      testId: `test-${Date.now()}`
    };
    
    const docRef = await addDoc(testCollection, testDoc);
    console.log(`写入操作成功! 文档 ID: ${docRef.id}`);
    
    // 测试读取操作
    console.log('正在测试读取操作...');
    const q = query(testCollection, limit(5));
    const querySnapshot = await getDocs(q);
    
    console.log(`读取操作成功! 获取到 ${querySnapshot.size} 条文档:`);
    querySnapshot.forEach((doc) => {
      console.log(`- 文档 ID: ${doc.id}, 数据:`, doc.data());
    });
    
    console.log('----------------------------');
    console.log('Firestore 连接测试完成，所有操作成功!');
    return true;
  } catch (error) {
    console.error('Firestore 连接测试失败:');
    console.error(`错误类型: ${error.name}`);
    console.error(`错误消息: ${error.message}`);
    
    // 网络相关错误
    if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      console.error('\n可能的原因: 连接超时。请检查您的网络连接，或者 Firebase 服务可能暂时不可用。');
      console.error('建议:');
      console.error('1. 检查您的网络连接是否稳定');
      console.error('2. 检查您是否可以访问其他网站');
      console.error('3. 检查 Firebase 控制台是否可以访问: https://console.firebase.google.com/');
      console.error('4. 如果您使用的是代理或 VPN，请尝试禁用它们');
      console.error('5. 如果您在中国大陆，请确保您有可靠的网络代理');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n可能的原因: 连接被拒绝。Firebase 服务可能暂时不可用，或者您的网络可能被防火墙阻止。');
      console.error('建议:');
      console.error('1. 检查您的防火墙设置，确保允许与 Firebase 服务器的连接');
      console.error('2. 如果您在中国大陆，请确保您有可靠的网络代理');
    } else if (error.message.includes('permission-denied')) {
      console.error('\n可能的原因: 权限被拒绝。您可能没有足够的权限执行此操作，或者 Firestore 安全规则限制了访问。');
      console.error('建议:');
      console.error('1. 检查 Firebase 控制台中的 Firestore 安全规则');
      console.error('2. 确保您的安全规则允许读写操作，例如:');
      console.error('   rules_version = \'2\';\n   service cloud.firestore {\n     match /databases/{database}/documents {\n       match /{document=**} {\n         allow read, write: if true;\n       }\n     }\n   }');
      console.error('3. 注意: 上述规则仅适用于开发环境，生产环境应使用更严格的规则');
    }
    
    console.error('\n完整错误堆栈:');
    console.error(error.stack);
    
    console.error('----------------------------');
    console.error('Firestore 连接测试失败!');
    return false;
  }
}

// 执行测试
testFirestoreConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('测试过程中发生未处理的错误:', error);
    process.exit(1);
  });
