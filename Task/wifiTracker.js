// ==UserScript==
// @name         HuaHai IoT Request
// @namespace    
// @version      0.1
// @description  wifi到期提醒
// @author       木瞳
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==
const cardNo = "70032342060810";


let option = {
    url: `http://iot-wx.lktweixin.cn/HuaHai/index?cardNo=${cardNo}`,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
    },
};


$httpClient.get(option, (errormsg, response, data) => {
    if (errormsg) {
        $notification.post("WiFi检测", "请求失败", errormsg);
        return $done();
    }

    try {
        const body = typeof data === 'string' ? JSON.parse(data) : data;
        const msg = body.msg;
        if (msg.includes("OK")) {
            const responseData = body.data;
            let serveValidDate = new Date(responseData.serveValidDate);
            let now = new Date();
            let diffTime = Math.abs(serveValidDate - now);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let surplusFlow = parseFloat(responseData.surplusFlowText);
            let deviceMonthFlow = parseFloat(responseData.deviceMonthFlow);
            let flowPercentage = (surplusFlow / deviceMonthFlow) * 100;

            if (responseData.deviceState === '在线') {
                if (diffDays > -2 && (diffDays <= 3 || flowPercentage < 10)) {
                    let message = `到期时间剩余 ${diffDays} 天，剩余流量百分比为 ${flowPercentage.toFixed(2)}%`;
                    $notification.post("WiFi检测", "到期或流量不足提醒", message);
                }
            }
        } else {
            $notification.post("WiFi检测", "数据获取失败", msg);
        }
    } catch (e) {
        $notification.post("WiFi检测", "数据处理错误", e.message);
    }

    $done();
});