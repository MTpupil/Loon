const STORE_KEY = "ccswitch_ai_provider_list";
const $ = $loon;

// ========== 持久化存储 ==========
const storage = {
    read() {
        try {
            const raw = $.persistentStore.read(STORE_KEY);
            return raw ? JSON.parse(raw) : { list: [] };
        } catch (e) {
            return { list: [] };
        }
    },
    write(obj) {
        $.persistentStore.write(JSON.stringify(obj), STORE_KEY);
    }
};

// ========== 余额解析器 ==========
function parseBalance(respBody, parserType) {
    const data = typeof respBody === "string" ? JSON.parse(respBody) : respBody;
    if (parserType === "newapi") {
        if (!data.success || !data.data) {
            return { isValid: false, msg: "查询失败：接口返回异常" };
        }
        const d = data.data;
        return {
            isValid: true,
            planName: d.group || "默认套餐",
            remaining: (d.quota / 500000).toFixed(4),
            used: (d.used_quota / 500000).toFixed(4),
            total: ((d.quota + d.used_quota) / 500000).toFixed(4),
            unit: "USD",
            extra: ""
        };
    } else if (parserType === "openai_billing") {
        if (!data.total_usage) {
            return { isValid: false, msg: "查询失败：total_usage不存在" };
        }
        const usedCny = data.total_usage / 100;
        return {
            isValid: true,
            remaining: null,
            used: usedCny.toFixed(2),
            total: null,
            unit: "CNY",
            extra: `账号累计消费 ${usedCny.toFixed(2)} 元`
        };
    } else if (parserType === "openrouter") {
        if(typeof data.credits === "undefined"){
            return { isValid: false, msg: "OpenRouter余额接口返回异常" };
        }
        const remaining = data.credits;
        return {
            isValid: true,
            planName: "OpenRouter",
            remaining: remaining.toFixed(4),
            used: null,
            total: null,
            unit: "USD",
            extra: `剩余额度 $${remaining.toFixed(4)}`
        };
    } else {
        return { isValid: false, msg: "未知解析器类型" };
    }
}

// ========== HTTP GET 请求封装 ==========
function httpGet(url, headers) {
    return new Promise((resolve, reject) => {
        $.httpClient.get({
            url,
            headers: { "Content-Type": "application/json", ...headers },
            timeout: 10000
        }, (err, resp, body) => {
            if(err) return reject(err);
            resolve({resp, body});
        });
    })
}

// ========== 路由分发 ==========
const path = $request.path;

// 页面主页
if(path === "/ccswitch_ai_provider"){
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>CC-Switch 多服务商管理</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
body{padding:16px;background:#f6f7f9;}
.container{max-width:720px;margin:0 auto;}
h2{margin-bottom:16px;color:#222;}
.card{background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;border:1px solid #e5e7eb;}
.item{margin:8px 0;}
label{display:block;font-size:13px;color:#555;margin-bottom:3px;}
input,select{width:100%;padding:9px;border:1px solid #d2d6dc;border-radius:7px;font-size:15px;}
.btns{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
button{padding:8px 12px;border:none;border-radius:7px;font-size:14px;cursor:pointer;}
.btn-add{background:#22c55e;color:#fff;}
.btn-del{background:#ef4444;color:#fff;}
.btn-query{background:#3b82f6;color:#fff;}
.btn-save{background:#8b5cf6;color:#fff;}
#globalBtn{margin-bottom:16px;}
pre{margin-top:8px;padding:8px;background:#f3f4f6;border-radius:6px;font-size:12px;white-space:pre-wrap;}
</style>
</head>
<body>
<div class="container">
    <h2>CC-Switch AI 服务商列表</h2>
    <div id="globalBtn">
        <button class="btn-add" onclick="addRow()">➕新增服务商</button>
        <button class="btn-save" onclick="saveAll()">💾保存全部</button>
    </div>
    <div id="listWrap"></div>
</div>

<script>
let list = [];
async function loadConfig(){
    const res = await fetch("/ccswitch_ai_provider/get");
    const json = await res.json();
    list = json.list || [];
    renderList();
}
function renderList(){
    const wrap = document.getElementById("listWrap");
    wrap.innerHTML = "";
    list.forEach((item,idx)=>{
        const dom = document.createElement("div");
        dom.className = "card";
        dom.innerHTML = \`
            <div class="item"><label>服务商名称</label><input data-idx="\${idx}" data-key="provider_name" value="\${item.provider_name||''}"></div>
            <div class="item"><label>BaseURL</label><input data-idx="\${idx}" data-key="base_url" value="\${item.base_url||''}"></div>
            <div class="item"><label>API Key</label><input data-idx="\${idx}" data-key="api_key" value="\${item.api_key||''}"></div>
            <div class="item"><label>余额查询URL</label><input data-idx="\${idx}" data-key="balance_query_url" value="\${item.balance_query_url||''}"></div>
            <div 