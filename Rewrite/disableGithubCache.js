/**
 * 禁止GitHub资源缓存
 * 公众号：木瞳科技Pro
 * [MITM]
 * hostname = raw.githubusercontent.com
 */

const SCRIPT_NAME = 'GitHub缓存控制';

const github = /^https?:\/\/raw\.githubusercontent\.com\/.*/;

if (github.test($request.url)) {
    $done({
        headers: {
            ...$request.headers,
            'Cache-Control': 'no-cache'
        }
    });
}