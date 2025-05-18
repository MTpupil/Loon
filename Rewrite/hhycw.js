
/**
 * 好好养宠物解锁会员
 * 公众号：木瞳科技Pro
 * 
 * [MITM]
 * hostname = chong.beijingmorning.cn
 * 
 * Quantumult X
 * [rewrite_local]
 * ^https?:\/\/chong\.beijingmorning\.cn\/user\/userinfo url script-response-body https://raw.githubusercontent.com/MTpupil/quantumultx/main/wink.js
 * 
 */

const SCRIPT_NAME = '好好养宠物';
const user = /^https?:\/\/chong\.beijingmorning\.cn\/user\/userinfo/;
const alert = /^https?:\/\/chong\.beijingmorning\.cn\/hd\/hdsp/;



if (user.test($request.url)) {
    let obj = JSON.parse($response.body);

    obj.result.rulprice = 1;
    obj.result.id = "木瞳科技Pro";
    obj.result.vip_end = "4102500000";

    obj.result.level = 1;
    obj.result.kongjian = 524288000;
    let body = JSON.stringify(obj);
    $done({ body })
}

if (alert.test($request.url)) {
    let obj = JSON.parse($response.body);
    obj = "";
    let body = JSON.stringify(obj);
    $done({ body })
    console.log("已拒绝")
}

