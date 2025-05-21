/**
 * 广电流量每日通知
 * 作者：木瞳
 */

const GB = 1024 * 1024;
const ACCESS = $persistentStore.read("10099_access");
const UPDATA = $persistentStore.read("10099_data");

// 提前验证必要参数
if (!ACCESS || !UPDATA) {
    $notification.post("参数错误", "", "请先设置access和data参数");
    $done();
}

// 解析参数
const parseArguments = arg => {
    const defaultArgs = {
        isMerge: false,
        isTimeEnable: false,
        isForecastEnable: false,
        isProgressBar: false // 新增参数
    };

    if (!arg) return defaultArgs;

    if (typeof arg === 'object') {
        return Object.fromEntries(
            Object.entries(defaultArgs)
                .map(([key, _]) => [key, arg[key] === true || arg[key] === 'true'])
        );
    }

    return {
        ...defaultArgs,
        ...Object.fromEntries(
            arg.split('&')
                .map(item => item.split('='))
                .map(([key, value]) => [key, value === 'true'])
        )
    };
};

// 这里加上 isProgressBar
const { isMerge, isTimeEnable, isForecastEnable, isProgressBar } = parseArguments($argument);

// 工具函数
const formatNumber = num => Number(num.toFixed(2));
const getFormattedDate = () => {
    const date = new Date();
    const pad = num => String(num).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// 格式化详情
const formatDetail = (name, balance, highFee) => {
    const getPercentEmoji = () => {
        if (balance === highFee) return " 💯";
        if (balance === 0) return " ⛔";
        return ` (${formatNumber((balance / highFee) * 100)}%) 🟢`;
    };

    return `${name}: ${formatNumber(balance / GB)} / ${formatNumber(highFee / GB)} GB${getPercentEmoji()}`;
};

// 计算预测
const calculateForecast = (used, total) => {
    const date = new Date();
    const currentDay = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDay;

    const calculate = (value, days) =>
        days > 0 ? formatNumber(value / days) : 0;

    const calculatePercent = (value, days) =>
        days > 0 ? formatNumber((value / total) * (1 / days) * 100) : 0;

    const avgDaily = calculate(used, currentDay);
    const avgDailyPercent = calculatePercent(used, currentDay);
    const avgRemaining = calculate(total - used, remainingDays);
    const avgRemainingPercent = calculatePercent(total - used, remainingDays);

    return `每日平均已用：${avgDaily} GB（${avgDailyPercent}%）\n每日平均剩余：${avgRemaining} GB（${avgRemainingPercent}%）`;
};

// 获取使用进度图标
const getUsageIcon = pct => {
    const decimal = pct % 10;
    const fullMoons = "🌕".repeat(9 - Math.floor(pct / 10));
    const emptyMoons = "🌑".repeat(Math.floor(pct / 10));
    const phaseMap = [
        [8.75, "🌑"],
        [6.25, "🌘"],
        [3.75, "🌗"],
        [1.25, "🌖"],
        [0, "🌕"]
    ];

    const currentPhase = phaseMap.find(([threshold]) => decimal >= threshold)[1];
    return fullMoons + currentPhase + emptyMoons;
};

// API请求配置
const request = {
    url: "https://app.10099.com.cn/contact-web/api/busi/qryUserRes",
    method: "POST",
    headers: {
        "Access": ACCESS,
        "Content-Type": "application/json",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9"
    },
    body: JSON.stringify({ data: UPDATA })
};

// 处理数据
const processData = data => {
    const result = JSON.parse(data);
    if (result.message !== "操作成功") {
        throw new Error(result.message);
    }

    const { intfResultBean: { userExtResList, userResList } } = result.data;
    const used = (userExtResList[0]?.addupTotalValue ?? 0) / GB;

    const processItem = item => ({
        name: item.itemName.replace(/.*【(.*?)】.*/, '$1').replace(/上月|流量/g, ""),
        balance: parseFloat(item.balance),
        highFee: parseFloat(item.highFee)
    });

    // 处理资源列表
    const processResList = () => {
        if (!isMerge) {
            return userResList.map(processItem);
        }

        const merged = userResList.reduce((acc, item) => {
            const { name, balance, highFee } = processItem(item);
            if (!acc[name]) {
                acc[name] = { balance: 0, highFee: 0 };
            }
            acc[name].balance += balance;
            acc[name].highFee += highFee;
            return acc;
        }, {});

        return Object.entries(merged).map(([name, values]) => ({
            name,
            ...values
        }));
    };

    const items = processResList();
    const total = items.reduce((sum, { highFee }) => sum + highFee, 0) / GB;
    const pct = (used / total) * 100;

    return { used, total, pct, items };
};

// 发送请求
$httpClient.post(request, (error, response, data) => {
    try {
        if (error) throw new Error("请求异常");

        const { used, total, pct, items } = processData(data);
        const details = items.map(item => formatDetail(item.name, item.balance, item.highFee));

        const title = isTimeEnable ? `流量通知 🕐${getFormattedDate()}` : "流量通知";
        const progressBarInfo = isProgressBar ? `\n${getUsageIcon(pct)} (${formatNumber(100 - pct)}%)` : "";
        const forecastInfo = isForecastEnable ? "\n\n" + calculateForecast(used, total) : "";

        $notification.post(
            title,
            `已使用：${formatNumber(used)} GB（${formatNumber(pct)}%）`,
            `总量：${formatNumber(total)} GB\n剩余：${formatNumber(total - used)} GB${progressBarInfo}\n\n${details.join("\n")}${forecastInfo}`
        );
    } catch (err) {
        $notification.post("流量通知", "", err.message || "运行异常，请检查");
    } finally {
        $done();
    }
});
