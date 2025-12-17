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
const vip = /^https?:\/\/api.heylumi.cn\/note\/note-api\/user\/account\/status\??/;




if (vip.test($request.url)) {
    let obj = JSON.parse($response.body);

    // obj.data.memberLevel = "PERMANENT_VIP";
    // obj.data.vipLevel = "PERMANENT_VIP";
    // obj.data.endTime = "2099-12-31 23:23:59";

    obj.data.memberLevel = "VIP";
    obj.data.vipLevel = "VIP";
    obj.data.endTime = "终身会员";

    obj.data.coins = 999999;
    let body = JSON.stringify(obj);
    $done({ body })
}
