/**
 * Loon脚本 CC‑Switch AI Provider管理
 * 存储字段：provider_name, base_url, api_key, balance_query_url, balance_parser_type
 * parser_type: newapi | openai_billing 对应CC‑Switch sqlite usage_script
 */
const STORE_KEY = "ccswitch_ai_provider_config";
const isLoon = typeof $loon !== "undefined";

// 持久化读写封装
const storage = {
    read() {
        try {
            const raw = $persistentStore.read(STORE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    },
    write(obj) {
        $persistentStore.write(JSON.stringify(obj), STORE_KEY);
    }
};

/**
 * 余额解析器，复刻CC‑Switch sqlite里面两种usage_script逻辑
 * type newapi：passion8 /4router /bytecat 这类 newapi模板
 * type openai_billing：dataeyes 兼容openai billing/v1/dashboard/billing/usage
 */
function parseBalance(respBody, parserType) {
    const data = typeof respBody === "string" ? JSON.parse(respBody) : respBody;
    if (parserType === "newapi") {
        // CC‑Switch newapi模板 extractor
        if (!data.success || !data.data) {
            return { isValid: false, msg: "查询失败：接口返回异常" };
        }
        const d = data.data;
        const unit = "USD";
        const remaining = d.quota / 500000;
        const used = d.used_quota / 500000;
        const total = (d.quota + d.used_quota) / 500000;
        return {
            isValid: true,
            planName: d.group || "默认套餐",
            remaining: remaining.toFixed(4),
            used: used.toFixed(4),
            total: total.toFixed(4),
            unit,
            extra: ""
        };
    } else if (parserType === "openai_billing") {
        // openai / v1/dashboard/billing/usage
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
    } else {
        return { isValid: false, msg: "未知解析器类型" };
    }
}

// http get封装 loon
function httpGet(url, headers, cb) {
    $httpClient.get({
        url,
        headers: { "Content-Type": "application/json", ...headers },
        timeout: 10000
    }, (err, resp, body) => {
        cb(err, resp, body);
    });
}

// BoxJS网页面板渲染
function renderBoxJSPage() {
    const cfg = storage.read();
    const html = `
<!DOCTYPE html>
<html lang="zh‑CN">
<head>
<meta charset="utf‑8">
<title>CC‑Switch AI Provider配置</title>
<meta name="viewport" content="width=device‑width,initial‑scale=1">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:16px;max-width:640px;margin:0 auto;}
.item{margin:12px 0;}
label{display:block;margin:4px 0 2px;}
input,select{width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:16px;box-sizing:border-box;}
button{padding:10px 14px;border:none;background:#007aff;color:white;border-radius:6px;margin:4px 2px;font-size:15px;}
pre{background:#f5f5f7;padding:10px;border-radius:6px;white-space:pre‑wrap;font-size:12px;}
</style>
</head>
<body>
<h2>AI服务商配置（复刻CC‑Switch）</h2>
<div class="item">
<label>服务商名称 provider_name</label>
<input id="provider_name" value="${cfg.provider_name || ""}" placeholder="例如 passion8 / dataeyes">
</div>
<div class="item">
<label>BaseURL</label>
<input id="base_url" value="${cfg.base_url || ""}" placeholder="https://passion8.cc/v1">
</div>
<div class="item">
<label>API‑Key</label>
<input id="api_key" value="${cfg.api_key || ""}" placeholder="sk‑xxxx">
</div>
<div class="item">
<label>余额查询URL（对应CC‑Switch usage_script request url）</label>
<input id="balance_query_url" value="${cfg.balance_query_url || ""}" placeholder="https://passion8.cc/api/user/self">
</div>
<div class="item">
<label>解析模板（复刻CC‑Switch extractor）</label>
<select id="parser_type">
<option value="newapi" ${cfg.balance_parser_type==="newapi"?"selected":""}>newapi模板(passion8/4router/bytecat)</option>
<option value="openai_billing" ${cfg.balance_parser_type==="openai_billing"?"selected":""}>openai billing模板(dataeyes)</option>
</select>
</div>
<div>
<button onclick="saveConfig()">保存配置</button>
<button onclick="queryBalance()">立即查询余额</button>
<button onclick="clearConfig()">清空配置</button>
</div>
<pre id="result">等待操作...</pre>
<script>
function getVal(id){return document.getElementById(id).value.trim();}
async function saveConfig(){
    const config={
        provider_name:getVal("provider_name"),
        base_url:getVal("base_url"),
        api_key:getVal("api_key"),
        balance_query_url:getVal("balance_query_url"),
        balance_parser_type:getVal("parser_type")
    };
    await $notify("保存成功","配置已写入Loon持久存储");
    document.getElementById("result").innerText=JSON.stringify(config,null,2);
}
async function queryBalance(){
    document.getElementById("result").innerText="正在请求余额接口...";
    const cfg={
        api_key:getVal("api_key"),
        balance_query_url:getV