/**
 * ssme破解vip
 * 公众号：木瞳科技Pro
 * [MITM]
 * hostname = w.5hzs.com
 * 
 * 
 */
const url = /^https?:\/\/w\.5hzs\.com\/player\/index/;
if (url.test($request.url)) {
    let body = JSON.parse($response.body);
    let data = body.data
    data.member_short_play.is_vip = true;
    data.name = "木瞳科技破解"
    data.member.is_vip = true
    $done({ body: JSON.stringify(body) })
}