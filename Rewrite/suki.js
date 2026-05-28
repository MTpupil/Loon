/**
 * suki破解svip
 * 公众号：木瞳科技Pro
 * [MITM]
 * hostname = a1-codeffect.easemob.com
 * 
 */


const SCRIPT_NAME = 'suki';

const user = /^https?:\/\/a1-codeffect\.easemob\.com.+/;

if (user.test($request.url)) {
    let obj = JSON.parse($response.body);
    obj.entities[0].type = "pro";
    
    let body = JSON.stringify(obj);
    $done({ body })
}