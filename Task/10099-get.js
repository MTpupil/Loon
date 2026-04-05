// 目标网址配置
const TARGET_URL = "https://app.10099.com.cn/contact-web/api/busi/qryUserRes";
const ACCESS_KEY = "10099_access";
const DATA_KEY = "10099_data";

console.log("【流量参数提取脚本】启动");

(function() {
    const requestObj = $request;
    if (!requestObj || !requestObj.url.includes(TARGET_URL)) {
        $done({});
        return;
    }
    
    console.log("【匹配】检测到目标网址，开始提取参数");
    
    // 1. 提取access（兼容大小写）
    const access = 
        requestObj.headers["Access"] || 
        requestObj.headers["access"] || 
        requestObj.headers["ACCESS"];
    
    // 2. 提取data（根目录data字段）
    let data = null;
    if (requestObj.body && typeof requestObj.body === "string") {
        try {
            const body = JSON.parse(requestObj.body);
            data = body.data;
        } catch (e) {
            console.log("【错误】解析请求体失败:", e.message);
        }
    }
    
    // 3. 存储参数
    if (access) {
        $persistentStore.write(access, ACCESS_KEY);
        console.log("【存储】access已保存:", access.slice(0, 8) + "...");
    }
    if (data !== null) {
        $persistentStore.write(data, DATA_KEY);
        console.log("【存储】data已保存:", data.slice(0, 10) + "...");
    }
    
    // 4. 核心修复：完整保留原请求头+请求体，只放行不修改
    const modifiedRequest = {
        url: requestObj.url,
        method: requestObj.method,
        headers: {
            ...requestObj.headers,
            // 强制补全Content-Type，双重保险
            "Content-Type": "application/json; charset=utf-8"
        },
        body: requestObj.body
    };
    
    // 5. 发送通知
    $notification.post(
        "📶 广电流量参数提取",
        "",
        `✅ 目标网址已检测\n🔑 access: ${access ? "已存储" : "未获取到"}\n📦 data: ${data ? "已存储" : "未获取到"}`
    );
    
    // 6. 放行完整请求，解决415
    $done(modifiedRequest);
})();