/**
 * 养基宝破解vip
 * 公众号：木瞳科技Pro
 * [MITM]
 * hostname = *.yangjibao.com
 * 
 * 
 */
const url = /^https?:\/\/(wx|app-api)\.yangjibao\.com(\/wxapi\/account|\/user\/v1\/account)/;

if (url.test($request.url)) {
    let body = JSON.parse($response.body);
    let data = body.data
    data.open_free_vip_sign = true;
    data.name = "木瞳科技Pro"
    data.is_pay = true
    data.vip_expiry_date = "终身会员"
    data.subscribe_status = 1
    data.vip_label = true
    data.show_bkxh = true
    $done({ body: JSON.stringify(body) })
}