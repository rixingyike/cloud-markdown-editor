# 多平台写作软件

## 源码

源码主目录：scripts

主文件：app.js



## 调试

本地启动调试：

yarn dev



## 构建版本

yarn build:osx
yarn build:win
yarn build:linux

注意：Wine is required to use the appCopyright, appVersion, buildVersion, icon, and 
win32metadata parameters for Windows targets.

在mac电脑上打包windows版本，需要安装wine。



## 图床配置

可以选择启用腾讯云图床
以Mac为例，配置文件真实位置在：/Users/${user}/ElectronMarkdownEditor/BlogHelper.json 


有问题欢迎关注作者公众号「程序员LIYI」交流

![](https://gitee.com/rxyk/weapp-practice/raw/master/slogon.png)