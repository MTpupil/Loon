const STORE_KEY = "ccswitch_ai_provider_config";
const $ = $loon;

// 读取插件页面输入的配置（#!input/#!select）
const cfgFromPluginUI = {
    provider_name: $argument.provider_name || "",
    base_url: $argument.base_url || "",
    api_key: $argument.api_key || "",
    balance_query_url: $argument.balance_query_url || "",
    balance_parser_type: $argument.parser_type || "openrouter"
};

// 持久化存储
const storage = {
    read() {
        try {
            const raw = $.persistentStore.read(STORE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    },
    write(obj) {
        $.persistentStore.write(JSON.stringify(obj), STORE_KEY);
    }
};

// 余额解析器
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

// http get
function httpGet(url, headers, cb) {
    $.httpClient.get({
        url,
        headers: { "Content-Type": "application/json", ...headers },
        timeout: 10000
    }, (err, resp, body) => {
        cb(err, resp, body);
    });
}

// 主逻辑：运行脚本的时候执行余额查询
async function main() {
    // 把插件UI填写的配置保存到持久存储
    storage.write(cfgFromPluginUI);
    const cfg = storage.read();

    if(!cfg.api_key || !cfg.balance_query_url){
        $.notify("参数错误","API‑Key / 余额查询URL不能为空","");
        return;
    }

    httpGet(cfg.balance_query_url, { "Authorization": `Bearer ${cfg.api_key}` }, (err, resp, body)=>{
        if(err){
            $.notify("请求失败", err,"");
            return;
        }
        const ret = parseBalance(body, cfg.balance_parser_type);
        let notifyText;
        if(ret.isValid){
            notifyText = `${ret.planName} | 剩余：${ret.remaining||"-"} ${ret.unit}\n${ret.extra}`;
        }else{
            notifyText = ret.msg;
        }
        $.notify("CC‑Switch 余额查询结果", notifyText,"");
    })
}

main();