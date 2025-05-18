/**
 * 微信运动步数
 * author：木瞳
 * 
 * 
 */
let notice = $persistentStore.read("mtpupil_wxstep_notice");
let user = $persistentStore.read("mtpupil_wxstep_user");
let pwd = $persistentStore.read("mtpupil_wxstep_pwd");
let step = $persistentStore.read("mtpupil_wxstep_step");
step = formatStep(step);

let option = {
    url: "https://api.leafone.cn/api/misport",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: `user=${user}&password=${pwd}&step=${step}`,
};

//开始刷步
$httpClient.post(option, (error, response, data) => {
    if (error) {
        console.log(error);
        $notification.post("通知", "接口目前失效中", "有空修复");
        $done();
        return;
    }
    
    let body = JSON.parse(data);
    let msg = body.msg;
    
    if (msg.includes("成功")) {
        $notification.post("刷步成功", `本次步数: ${step}`, "木瞳科技Pro感谢您的使用");
    } else {
        $notification.post("刷步失败", `错误信息: ${msg}`, "木瞳科技Pro提醒您检查信息填写是否正确");
    }
    
    $done();
});

//步数信息处理，用于判断数据合法以及随机数生成
function formatStep(step) {
    let pattern = /^[\d@]+$/;
    if (!pattern.test(step)) {
        $notification.post("❌错误", "步数格式有误，程序已退出", "");
        $done();
    }
    
    if (step.includes("@")) {
        let steps = step.split("@");
        if (Number(steps[0]) < Number(steps[1]) && Number(steps[1]) <= 98800) {
            return Math.floor(Math.random() * (Number(steps[1]) - Number(steps[0]) + 1) + Number(steps[0]));
        } else {
            $notification.post("❌错误", "步数格式有误，程序已退出", "");
            $done();
        }
    } else {
        if (Number(step) <= 98800) {
            return step;
        } else {
            $notification.post("❌错误", "步数格式有误，程序已退出", "");
            $done();
        }
    }
}