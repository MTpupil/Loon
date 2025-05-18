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
    url: `http://iot-wx.lktweixin.cn/HuaHai/index?cardNo=70032342060810`,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
};


$httpClient.get(option, (error, response, data) => {
    if (error || !response || !response.body) {
        $notification.post("wifi", "请求失败", error || "无响应数据");
        return $done();
    }
    
    let body;
    try {
        body = JSON.parse(response.body);
    } catch (e) {
        $notification.post("wifi", "数据解析失败", e.message);
        return $done();
    }
    let msg = body.msg
    if (msg.includes("OK")) {
        let data = body.data;
        let serveValidDate = new Date(data.serveValidDate);
        let now = new Date();
        let diffTime = Math.abs(serveValidDate - now);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let surplusFlow = parseFloat(data.surplusFlowText);
        let deviceMonthFlow = parseFloat(data.deviceMonthFlow);
        let flowPercentage = (surplusFlow / deviceMonthFlow) * 100;

        if (data.deviceState === '在线') {
            if (diffDays > -2 && (diffDays <= 3 || flowPercentage < 10)) {
                let message = `到期时间剩余 ${diffDays} 天，剩余流量百分比为 ${flowPercentage.toFixed(2)}%`;
                $notification.post("wifi", "到期或流量不足提醒", message);
            }
        }
    } else {
        $notification.post("wifi", "数据获取失败", msg);
    }

    $done();
}, error => {
    console.log(error);
    $done();
})