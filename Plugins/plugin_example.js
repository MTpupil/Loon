#!name = 带参数的插件Demo
#!desc = 这是一个可设定参数的插件，适用于Loon 3.2.1(build 733 +)
#!author = Loon0x00[https://github.com/Loon0x00/LoonExampleConfig]
#!homePage = https://nsloon.com
#!data = 2024-08-09
#!icon = https://raw.githubusercontent.com/Loon0x00/Loon0x00.github.io/main/static/img/loon.png
#!system = ios,tvos,macos
#!system_version = 14.0
#!loon_version = 3.2.1(734)
#!tag = 官方,Demo

[Argument]
appName = input,"Loon",tag=apppp的名字,desc=填写app的用户名，用于提交app的相关信息
appCategory = select,"Toolo","Video&Photo","Game",tag=app的分类
isSupportChinese = switch,true,tag=是否支持中文,desc=选择app是否支持中文
cron = input,"*/5 * * * *",tag=定时任务时间,desc=定时任务的cron表达式
cookieScriptEnable = switch,true,tag=是否启用获取cookie的脚本

[Script]
http-request ^https://nsloon\.app script-path = https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/Script/plugin_arg.js,argument=[{appName},{appCategory},{isSupportChinese}],enable = {cookieScriptEnable},tag=plugin_arg_demo_request

cron {cron} script-path=https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/Script/cron.js,tag = cronExample,argument=[{appName}],enable=true

[MITM]
hostname = nsloon.app
