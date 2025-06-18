/**
 * 微信运动步数
 * author：木瞳
 * 
 * 
 */

let notice = $argument.wxstepNotice
let user = $argument.wxstepUser
let pwd = $argument.wxstepPwd
let wxstepRandom = $argument.wxstepRandom
let stepMax = $argument.wxstepStepMax
let stepMin = $argument.wxstepStepMin
let wxstep = $argument.wxstepnum

// 参数校验
if (!user || !pwd) {
    $notification.post("木瞳提醒", "", "账号密码不能为空");
    $done();
}
if (isNaN(Number(stepMin)) || isNaN(Number(stepMax)) || isNaN(Number(wxstep))) {
    $notification.post("木瞳提醒", "", "步数参数必须为数字");
    $done();
}
if (Number(stepMin) < 0 || Number(stepMax) < 0 || Number(wxstep) < 0) {
    $notification.post("木瞳提醒", "", "步数不能为负数");
    $done();
}
if (Number(stepMax) <= Number(stepMin)) {
    $notification.post("木瞳提醒", "", "最大步数必须大于最小步数");
    $done();
}
if (Number(stepMax) > 98800 || Number(stepMin) > 98800 || Number(wxstep) > 98800) {
    $notification.post("木瞳提醒", "", "步数不能超过98800");
    $done();
}

let step = (String(wxstepRandom).toLowerCase() === "true") ? 
    Math.floor(Math.random() * (Number(stepMax) - Number(stepMin) + 1) + Number(stepMin)) : 
    wxstep;


let option = {
    url: "https://api.bugpk.com/api/yd",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: `username=${user}&password=${pwd}&step=${step}`,
    timeout: 500000,
};

//开始刷步
$httpClient.post(option, (error, response, data) => {
    if (error) {
        console.log(error);
        $notification.post("通知", "接口目前失效中", "随缘修复");
        $done();
        return;
    }
    
    let body = JSON.parse(data);
    let msg = body.msg;
    
    if (String(notice).toLowerCase() === "true") {
    $notification.post("刷步成功", `本次步数: ${step}`, "木瞳科技Pro感谢您的使用");
        }
    } else {
        $notification.post("刷步失败", `错误信息: ${msg}`, "木瞳科技Pro提醒您检查信息填写是否正确");
    }
    console.log(data); // 打印接口返回内容
console.log(body); // 打印解析后的 JSON 对象
    $done();
});