/**
 * 堆糖解锁svip功能
 * 奶由解锁vip
 * 公众号：木瞳科技Pro
 * [MITM]
 * hostname = *.duitang.com
 */

const SCRIPT_NAME = '堆糖';

const duitang = /https?:\/\/(www|api(-2))\.duitang\.com\/napi\/people\/me.*/;
const naiyou = /^https?:\/\/nz-api\.duitang\.com\/account\/me.*/;

if (duitang.test($request.url)) {
    let obj = JSON.parse($response.body);
    obj.data["username"] = "木瞳科技Pro";
    obj.data["vip"] = true;
    obj.data["vip_level"] = 11;
    obj.data["vip_end_at"] = 4102380638;
    obj.data["vip_end_at_mills"] = 4102380638000;
    obj.data["svip_mechanism"] = 1;
    obj.data["latest_vip_level"] = 11;
    obj.data["avatar"] = "https://s1.ax1x.com/2022/11/23/z8LIPO.jpg";
    obj.data["vipstatus"] = "open";
    obj.data["be_follow_count"] = 999999;
    obj.data["ipaddr"] = "木瞳科技Pro破解";
    obj.data["score"] = 999999;
    obj.data["vip_remain"] = 0;
    let body = JSON.stringify(obj);
    $done({ body })
}

if (naiyou.test($request.url)) {
    let obj = JSON.parse($response.body);
    obj.data["nickname"] = "木瞳科技Pro";
    obj.data["vip"] = true;
    obj.data["id"] = 5201314;
    let body = JSON.stringify(obj);
    $done({ body })
}