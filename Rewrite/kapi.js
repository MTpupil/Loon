/**
 * 卡皮记账解锁修改会员
 * 公众号：木瞳科技Pro
 * 
 * [MITM]
 * hostname = api.heylumi.cn
 * 
 * 
 */

const SCRIPT_NAME = '咔皮记账';
const vip = /^https?:\/\/.*?.kapii.cn\/api\/v2\/user\/account\/status\??/;




if (vip.test($request.url)) {
    let obj = JSON.parse($response.body);

    // obj.data.memberLevel = "PERMANENT_VIP";
    // obj.data.vipLevel = "PERMANENT_VIP";
    // obj.data.endTime = "2099-12-31 23:23:59";

    obj.data.memberLevel = "VIP";
    obj.data.vipLevel = "VIP";
    obj.data.endTime = "终身破解";
    obj.data.activated = true;
    obj.data.stage = "VALID";
    obj.data.freezing = false;
    obj.data.memberSubscriptionAccess = true;
    delete obj.data.availablePeriod;
    obj.data.paymentPeriod = {
        "mainTitleWording": "有效期至 终身",
        "showPayAgreement": true,
        "assistanceInfoWording": "木瞳科技 · 破解成功",
        "durationSeconds": 13824000,
        "highlightWording": "永久有效",
        "source": "ACTIVATED",
        "endDate": 4102490639000,
        "buttonMainWording": "当前支付渠道",
        "statusWording": "已激活",
        "titleWording": "木瞳💯",
        "price": 0,
        "buttonSubWording": "当前套餐扣款规则",
        "status": "PAID",
        "renewalCancel": false
    };
    

    obj.data.coins = 999999;
    let body = JSON.stringify(obj);
    $done({ body })
}
