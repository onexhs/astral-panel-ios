# 星骇面板 · iOS 壳应用（Capacitor）

把面板包成一个 iOS App 的工程。**打包在 GitHub Actions 的 macOS 机器上完成**，本地 Windows 不需要 Xcode。

---

## 一、先解决证书（不然 App 打不开面板）

iOS 的 WKWebView **没有** Safari 那个「继续访问」按钮：证书不受信任时页面直接空白。

所以 App 能用的大前提是：`https://mc.astraldread.cn:24636` 有**公网受信任的证书**。三选一：

| 方案 | 需要什么 | 费用 |
|---|---|---|
| ACME（Let's Encrypt） | 域名 DNS 的 API 权限，我用 DNS-01 自动签发 + 续期 | 0 |
| Cloudflare Tunnel | 域名托管到 Cloudflare | 0 |
| 买 DV 证书 | 淘宝/云厂商，拿到 .pem/.pfx 导入 | ¥30~100/年 |

搞定后把 `capacitor.config.json` 里的 `server.url` 保持为 `https://mc.astraldread.cn:24636/?shell=desktop` 即可。

---

## 二、在 GitHub 上打出 ipa（免费额度足够）

1. 在 GitHub 新建一个**私有仓库**
2. 把本项目推到仓库（只需这几个文件）：

```
AstralPanelIOS/
├── package.json
├── capacitor.config.json
├── www/index.html
└── .github/workflows/build-ios-ipa.yml   ← 放在仓库根目录的 .github/workflows/
```

3. 进仓库 → **Actions** → 左侧 `build-ios-ipa` → 右侧 **Run workflow**
4. 等 5~10 分钟，构建完成后在该次运行页面底部下载 **Artifacts → AstralPanel-unsigned-ipa**
5. 解压得到 `AstralPanel-unsigned.ipa`

> 私有仓库每月有 2000 分钟免费 macOS 额度，单次构建约 6~8 分钟，够用一年。

---

## 三、买超级签名并安装

**淘宝搜「超级签名」**，价格通常 ¥10~50/台/月（按设备数计费）。

流程一般是这样：

1. 卖家给你一个「**获取 UDID**」的链接
2. 用 iPhone 的 **Safari** 打开 → 允许下载描述文件 → 设置里安装 → 页面会显示你这台设备的 UDID
3. 把 UDID 发给卖家，付款
4. 你把 `AstralPanel-unsigned.ipa` 发给卖家（或上传到他的面板）
5. 卖家签名后给你一个安装链接（`itms-services://...`）
6. iPhone 用 **Safari** 打开该链接 → 安装 → 回桌面看到「星骇面板」

装机后第一次打开，若提示「未受信任的开发者」：
设置 → 通用 → VPN 与设备管理 → 选择对应描述文件 → **信任**

---

## 四、两种签名的区别

| 类型 | 价格 | 稳定性 | 说明 |
|---|---|---|---|
| **超级签名** | ¥10~50/台/月 | 较稳 | 按设备 UDID 注册，个人开发者证书，一般能用几个月到一年 |
| 企业签名 | ¥50~300/月 | 不稳 | 共享证书，被苹果批量吊销是常态，一吊销 App 直接打不开 |

**推荐超级签名**（你只在自己手机上用，一台设备很便宜）。

---

## 五、App 里能做什么

App 本质就是一个全屏 WebView，加载线上面板，所以：

- ✅ 全部功能与网页版一致（启停、控制台、日志、玩家、定时任务）
- ✅ 独立图标、全屏、没有 Safari 地址栏
- ❌ 推送通知（要另外做 Web Push）
- ❌ 离线访问

如果只是想「有个图标、全屏打开」，其实 **Safari 添加到主屏幕（PWA）** 效果几乎一样，而且完全免费、不会掉签。这个 App 方案的价值主要在：能自定义 App 名称/图标/启动图，以及将来接原生能力（推送、后台保活）。

---

## 六、常见问题

**Q：构建失败提示 code signing？**
A：workflow 里已经加了 `CODE_SIGNING_ALLOWED=NO`，若仍失败，检查 `ios/App/App.xcodeproj` 是否生成成功（`npx cap add ios` 那一步）。

**Q：卖家要签名的 ipa 有大小限制吗？**
A：一般 100MB 以内都行，这个壳 App 只有几 MB。

**Q：证书掉了怎么办？**
A：重新找卖家签一次即可，App 数据（登录态）会丢，重新登录就行。
