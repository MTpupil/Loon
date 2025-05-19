/**
 * 广电流量每日通知
 *
 */
const access = $persistentStore.read("10099_access");
const updata = $persistentStore.read("10099_data");
if (!access || !updata) {
    $notification.post("参数错误", "", "请先设置access和data参数");
    $done();
}
const isMerge = $argument.isMerge; // 是否合并
const isTimeEnabled = $argument.isTimeEnable; // 是否显示时间
const isForecastEnabled = $argument.isForecastEnable; // 是否显示预计

let gb = 1024 * 1024;
let time = getFormattedDate();

function formatNumber(num) {
    return Number(num.toFixed(2));
}

function formatDetail(name, balance, highFee) {
    const percent = balance === highFee ? " 💯" : balance === 0 ? " ⛔" : ` (${formatNumber((balance / highFee) * 100)}%) 🟢`;
    return `${name}: ${formatNumber(balance / gb)} / ${formatNumber(highFee / gb)} GB ${percent}`;
}

function calculateForecast(used, total) {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDay;

    const avgDailyUsage = formatNumber(used / currentDay);
    const avgDailyUsagePercent = formatNumber((used / total) * (1 / currentDay) * 100);

    const avgDailyRemaining = remainingDays > 0 ? formatNumber((total - used) / remainingDays) : 0;
    const avgDailyRemainingPercent = remainingDays > 0 ? formatNumber(((total - used) / total) * (1 / remainingDays) * 100) : 0;

    return `每日平均已用：${avgDailyUsage} GB（${avgDailyUsagePercent}%）\n每日平均剩余：${avgDailyRemaining} GB（${avgDailyRemainingPercent}%）`;
}

const url = "https://app.10099.com.cn/contact-web/api/busi/qryUserRes";
const headers = {
    "Access": access,
    "Content-Type": "application/json",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9"
};
const data = { "data": updata };

const myRequest = { url, method: "POST", headers, body: JSON.stringify(data) };

$httpClient.post(myRequest, (error, response, data) => {
    if (error) {
        $notification.post("查询失败", "", "请求异常");
        return $done();
    }
    const result = JSON.parse(data);
    if (result.message !== "操作成功") {
        $notification.post("查询失败", "", result.message);
        return $done();
    }

    console.log("查询成功");
    const used = result.data.intfResultBean.userExtResList.length > 0 ? result.data.intfResultBean.userExtResList[0].addupTotalValue / gb : 0;
    const resList = result.data.intfResultBean.userResList;
    const nameMap = {}; // 用于存放合并结果
    let details = [];
    let total = 0;

    if (isMerge) {
        // 合并相同 name 的数据
        resList.forEach(item => {
            let name = item.itemName.replace(/.*【(.*?)】.*/, '$1').replace(/上月/g, "").replace(/流量/g, "");
            const highFee = parseFloat(item.highFee);
            const balance = parseFloat(item.balance);

            if (!nameMap[name]) {
                nameMap[name] = { balance: 0, highFee: 0 };
            }
            nameMap[name].balance += balance;
            nameMap[name].highFee += highFee;
        });

        for (const name in nameMap) {
            const { balance, highFee } = nameMap[name];
            total += highFee;
            details.push(formatDetail(name, balance, highFee));
        }
    } else {
        // 不合并，直接逐条处理
        resList.forEach(item => {
            let name = item.itemName.replace(/.*【(.*?)】.*/, '$1').replace(/上月/g, "").replace(/流量/g, "");
            const highFee = parseFloat(item.highFee);
            const balance = parseFloat(item.balance);

            total += highFee;
            details.push(formatDetail(name, balance, highFee));
        });
    }

    total = total / gb;
    const pct = (used / total) * 100;
    const detailsString = details.join("\n");

    // 可视化进度条
    let usagePic = "";
    const xiaoshu = pct % 10;

    usagePic += "🌕".repeat(9 - Math.floor(pct / 10));
    usagePic += xiaoshu >= 8.75 ? "🌑" : xiaoshu >= 6.25 ? "🌘" : xiaoshu >= 3.75 ? "🌗" : xiaoshu >= 1.25 ? "🌖" : "🌕";
    usagePic += "🌑".repeat(Math.floor(pct / 10));

    // 显示已用、剩余、预计详情
    const forecastString = isForecastEnabled ? "\n\n" + calculateForecast(used, total) : "";
    const title = isTimeEnabled ? `流量通知 🕐${time}` : "流量通知";

    $notification.post(
        title,
        "已使用：" + formatNumber(used) + " GB（" + formatNumber(pct) + "%）",
        "总量：" + formatNumber(total) + " GB\n剩余：" + formatNumber(total - used) + " GB\n" + usagePic + " (" + formatNumber(100 - pct) + "%)" + "\n\n" + detailsString + forecastString
    );

    $done();
}, reason => {
    $notification.post("流量通知", "", "运行异常，请检查");
    $done();
});

function getFormattedDate() {
    const date = new Date();

    // 获取年、月、日、小时和分钟
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // 拼接成需要的格式
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}