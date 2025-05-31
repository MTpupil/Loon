// 目标网址配置
const TARGET_URL = "https://app.10099.com.cn/contact-web/api/busi/qryUserRes";
const ACCESS_KEY = "10099_access";
const DATA_KEY = "10099_data";

console.log("【流量参数提取脚本】启动");

(function() {
    const requestObj = $request;
    if (!requestObj || requestObj.url !== TARGET_URL) {
        $done({});
        return;
    }
    
    console.log("【匹配】检测到目标网址，开始提取参数");
    
    
    // 提取access（兼容大小写）
    const access = 
        requestObj.headers["Access"] || 
        requestObj.headers["access"] || 
        requestObj.headers["ACCESS"];
    
    // 简化data提取（直接从JSON根目录的data字段获取）
    let data = null;
    if (requestObj.body && typeof requestObj.body === "string") {
        try {
            const body = JSON.parse(requestObj.body);
            data = body.data || body["data"]; // 直接提取根目录的data字段
            
        } catch (e) {
            
        }
    }
    
    // 存储参数
    if (access) {
        $persistentStore.write(access, ACCESS_KEY);
        console.log("【存储】access已保存:", access.slice(0, 8) + "...");
    }
    if (data !== null) {
        $persistentStore.write(data, DATA_KEY);
        console.log("【存储】data已保存:", data.slice(0, 10) + "...");
    } else {
        console.log("【存储】未提取到data，原始请求体:", requestObj.body?.substring(0, 100) + "...");
    }
    
    // 发送通知
    $notification.post(
        "📶 广电流量参数提取",
        "",
        `✅ 目标网址已检测\n🔑 access: ${access ? "已存储" : "未获取到"}\n📦 data: ${data ? "已存储" : "未获取到"}`
    );
    
    $done({}); // 允许请求继续
})();