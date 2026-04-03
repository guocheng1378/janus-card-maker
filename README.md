# Janus 卡片制作器 v3

为小米背屏（SubScreen）制作 MAML 卡片模板的工具。

> 🌐 **在线使用**：[https://guocheng1378.github.io/janus-card-maker/](https://guocheng1378.github.io/janus-card-maker/)

## v3 改动

- **零构建**：砍掉 TypeScript + esbuild，纯原生 JS，改代码刷新浏览器即生效
- **模块化**：9 个 JS 文件，每个 ≤ 200 行，职责单一
- **JSZip 本地化**：不再依赖 CDN，离线可用
- **事件委托**：干掉 `window.__app` 全局污染，用 data 属性 + 事件委托
- **Android 兼容**：`node build.js` 一键打包成单文件 HTML

## 项目结构

```
janus-card-maker/
├── index.html              ← 浏览器直接打开即可使用
├── css/style.css           ← 所有样式
├── js/
│   ├── store.js            ← 响应式状态（~15行）
│   ├── devices.js          ← 设备参数（~15行）
│   ├── maml.js             ← XML 生成 + 转义（~60行）
│   ├── templates.js        ← 模板定义（~200行）
│   ├── preview.js          ← 预览渲染（~160行）
│   ├── editor.js           ← 元素编辑（~130行）
│   ├── export.js           ← ZIP 打包（~50行）
│   ├── ui.js               ← 页面导航 + 配置（~260行）
│   └── app.js              ← 入口（~5行）
├── lib/jszip.min.js        ← JSZip（本地化）
└── app/                    ← Android 包装（Kotlin）
```

## 使用

### 浏览器调试
```bash
cd janus-card-maker
# 用任意 HTTP 服务器打开
npx serve .
# 或直接双击 index.html（Chrome 推荐）
```

### Android 打包
```bash
npm run build
# 输出 → app/src/main/assets/index.html
# 然后用 Android Studio 构建 APK
```

### Android CI/CD
仓库已配置 GitHub Actions，push tag 或手动触发即可自动构建 APK：
- `Build Android APK` — Release 发布时自动构建并上传
- `Deploy to GitHub Pages` — 推送到 main 自动部署在线版本

## 功能

- 🎨 **10 个预设模板**：时钟、名言、电池、状态、倒计时、音乐、渐变、天气、步数、日历
- 🛠️ **自定义模式**：自由添加文字、矩形、圆形、线条、图片、视频
- 📱 **双机型适配**：Pro (904×572) / Pro Max (976×596)
- 📷 **摄像头避让**：自动计算安全区
- 📦 **一键导出**：生成 MAML ZIP，导入 Janus
- 🖼️ **PNG 导出**：预览截图导出
- ↩️ **撤销/重做**：支持多步操作回退
- 🌗 **深色/浅色主题**

## License

[MIT](LICENSE)
