/**
 * 广电流量每日通知
 *
 */
const [access, updata] = [$persistentStore.read("10099_access"), $persistentStore.read("10099_data")];
if (!access || !updata) return $notification.post("参数错误", "", "请先设置access和data参数") && $done();

const { isMerge = "false", isTimeEnable = "false", isForecastEnable = "false" } = $argument;
const isMergeBool = isMerge === "true",
      isTimeEnabled = isTimeEnable === "true",
      isForecastEnabled = isForecastEnable === "true";

const gb = 1024 ** 2, // 1024*1024 语法糖
      time = getFormattedDate();

const formatNumber = num => Number(num.toFixed(2)); // 箭头函数

function formatDetail(name, balance, highFee) {
    const percent = balance === highFee ? " 💯" : balance === 0 ? " ⛔" : 
                    ` (${formatNumber((balance / highFee) * 100)}%) 🟢`;
    return `${name}: ${formatNumber(balance / gb)} / ${formatNumber(highFee / gb)} GB ${percent}`;
}

function calculateForecast(used, total) {
    const { getDate: currentDay, getFullYear: year, getMonth: month } = new Date(),
          daysInMonth = new Date(year(), month() + 1, 0).getDate(),
          remainingDays = daysInMonth - currentDay();

    const avgDailyUsage = formatNumber(used / currentDay()),
          avgDailyUsagePercent = formatNumber((used / total) * (1 / currentDay()) * 100),
          avgDailyRemaining = remainingDays > 0 ? formatNumber((total - used) / remainingDays) : 0,
          avgDailyRemainingPercent = remainingDays > 0 ? formatNumber(((total - used) / total) * (1 / remainingDays) * 100) : 0;

    return `每日平均已用：${avgDailyUsage} GB（${avgDailyUsagePercent}%）\n每日平均剩余：${avgDailyRemaining} GB（${avgDailyRemainingPercent}%）`;
}

const myRequest = {
    url: "https://app.10099.com.cn/contact-web/api/busi/qryUserRes",
    method: "POST",
    headers: { Access: access, "Content-Type": "application/json", "Accept-Language": "zh-CN,zh-Hans;q=0.9" },
    body: JSON.stringify({ data: updata })
}; // 对象字面量简写

$httpClient.post(myRequest, (error, response, data) => {
    if (error) return $notification.post("查询失败", "", "请求异常") && $done();
    
    const { message, data: resultData } = (JSON.parse(data) || {})?.data?.intfResultBean || {};
    if (message !== "操作成功") return $notification.post("查询失败", "", message) || $done();

    console.log("查询成功");
    const used = (resultData?.userExtResList[0]?.addupTotalValue || 0) / gb;
    const resList = resultData?.userResList || [];

    const details = isMergeBool 
        ? resList.reduce((acc, item) => { // reduce 替代 forEach 合并数据
            const name = item.itemName.replace(/.*【(.*?)】.*/, '$1').replace(/上月|流量/g, "");
            acc[name] = {
                balance: (acc[name]?.balance || 0) + parseFloat(item.balance),
                highFee: (acc[name]?.highFee || 0) + parseFloat(item.highFee)
            };
            return acc;
        }, {}).values()
        : resList;

    const total = details.reduce((sum, { highFee }) => sum + parseFloat(highFee), 0) / gb;
    const pct = (used / total) * 100,
          detailsString = [...details].map(({ name, balance, highFee }) => 
              formatDetail(name, balance, highFee)
          ).join("\n");

    // 进度条优化
    const full = Math.floor(pct / 10),
          part = pct % 10,
          usagePic = `🌕${"🌕".repeat(8 - full)}${part >= 8.75 ? "🌑" : part >= 6.25 ? "🌘" : part >= 3.75 ? "🌗" : part >= 1.25 ? "🌖" : "🌕"}${"🌑".repeat(full)}`;

    const forecastString = isForecastEnabled ? `\n\n${calculateForecast(used, total)}` : "",
          title = isTimeEnabled ? `流量通知 🕐${time}` : "流量通知";

    $notification.post(
        title,
        `已使用：${formatNumber(used)} GB（${formatNumber(pct)}%）`,
        `总量：${formatNumber(total)} GB\n剩余：${formatNumber(total - used)} GB\n${usagePic} (${formatNumber(100 - pct)}%)\n\n${detailsString}${forecastString}`
    );

    $done();
}, reason => {
    $notification.post("流量通知", "", "运行异常，请检查");
    $done();
});

function getFormattedDate() {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}