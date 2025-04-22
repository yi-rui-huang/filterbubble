// Firebase连接测试脚本
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyAMjArPuGb61Sq2g9KhoW0_YqibywsJUx4",
  authDomain: "filterbubble-260ea.firebaseapp.com",
  projectId: "filterbubble-260ea",
  storageBucket: "filterbubble-260ea.appspot.com",
  messagingSenderId: "377672244422",
  appId: "1:377672244422:web:59a7987c23d06e161a8bc7",
  measurementId: "G-R2E669RD7P"
};

// 测试Firebase连接并打印结果
async function testFirebaseConnection() {
  console.log("开始测试Firebase连接...");
  
  try {
    // 初始化Firebase
    const app = initializeApp(firebaseConfig);
    console.log("Firebase应用初始化成功");
    
    // 初始化Firestore
    const db = getFirestore(app);
    console.log("Firestore初始化成功");
    
    // 尝试读取一个集合（这里使用user_events集合，如果不存在可以替换为其他集合）
    console.log("尝试读取数据...");
    const testQuery = query(collection(db, "user_events"), limit(1));
    
    const querySnapshot = await getDocs(testQuery);
    
    if (querySnapshot.empty) {
      console.log("成功连接到Firestore，但集合为空或不存在");
    } else {
      console.log("成功连接到Firestore并读取数据");
      console.log(`读取到${querySnapshot.size}条数据`);
    }
    
    return {
      success: true,
      message: "Firebase连接测试成功"
    };
  } catch (error) {
    console.error("Firebase连接测试失败:", error);
    
    // 提供更详细的错误信息
    let errorDetails = "未知错误";
    
    if (error.code) {
      switch(error.code) {
        case 'permission-denied':
          errorDetails = "权限被拒绝，请检查Firebase规则设置";
          break;
        case 'unavailable':
          errorDetails = "Firebase服务不可用，可能是网络问题";
          break;
        case 'not-found':
          errorDetails = "请求的资源不存在";
          break;
        case 'invalid-argument':
          errorDetails = "提供了无效参数";
          break;
        default:
          errorDetails = `错误代码: ${error.code}`;
      }
    }
    
    return {
      success: false,
      message: "Firebase连接测试失败",
      error: error.message,
      details: errorDetails
    };
  }
}

// 执行测试
testFirebaseConnection()
  .then(result => {
    console.log("测试结果:", result);
    if (typeof document !== 'undefined') {
      // 如果在浏览器环境中，在页面上显示结果
      const resultElement = document.createElement('div');
      resultElement.style.padding = '20px';
      resultElement.style.margin = '20px';
      resultElement.style.border = result.success ? '2px solid green' : '2px solid red';
      resultElement.style.borderRadius = '5px';
      resultElement.innerHTML = `
        <h2 style="color: ${result.success ? 'green' : 'red'}">
          ${result.success ? '✅ 连接成功' : '❌ 连接失败'}
        </h2>
        <p>${result.message}</p>
        ${!result.success ? `<p>错误: ${result.error}</p><p>详情: ${result.details}</p>` : ''}
      `;
      document.body.appendChild(resultElement);
    }
  });

// 导出测试函数以便在其他地方使用
export { testFirebaseConnection };
