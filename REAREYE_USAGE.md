# REAREye 使用说明：从卡片制作器到背屏显示

## 前提条件

- 小米 17 Pro / Pro Max（带背屏）
- 已安装 LSPosed 并启用 REAREye 模块
- REAREye 作用域包含 `com.xiaomi.subscreencenter`

## 整体流程

```
卡片制作器（网页） → 导出 ZIP → 导入 REAREye → 背屏显示
```

## 第一步：制作并导出卡片

1. 打开 [rear-eye-card-maker](https://guocheng1378.github.io/rear-eye-card-maker/) 在线工具
2. 选择一个模板（时钟、天气、音乐等），或从「自定义」开始
3. 在编辑器中拖拽元素、调整样式、选择字体等
4. 点击 **📦 导出 ZIP** 按钮，下载一个 `{卡片名}.zip`

ZIP 包内结构：

```
卡片名.zip
├── manifest.xml       ← MAML 模板（核心文件）
├── var_config.xml     ← 变量配置（非自定义模板才有）
├── images/            ← 图片资源
│   └── xxx.png
└── videos/            ← 视频资源（如果有）
    └── xxx.mp4
```

> 也可以点「📋 复制 XML」直接复制 MAML 代码，后面手动粘贴导入。

## 第二步：在 REAREye 中导入模板

打开 REAREye 模块应用，进入 **组件模板管理器**：

1. 点击「导入模板」
2. 选择刚才导出的 ZIP 文件（或直接粘贴 XML 内容）
3. 为模板指定一个 **business 名称**（例如 `my_clock`、`my_weather`）
   - business 是模板的唯一标识符，后面绑定卡片要用
4. 确认导入，模板会被部署到系统路径：
   ```
   /data/system/theme_magic/users/{用户ID}/subscreencenter/smart_assistant/{business}/
   ```

## 第三步：绑定卡片到背屏

仍在 REAREye 中，进入 **卡片管理器**：

1. 添加新卡片
2. 填写：
   - **标题**：随便起，比如「我的时钟」
   - **目标包名**：`com.xiaomi.subscreencenter`（默认）
   - **business**：填第二步中设置的 business 名称（如 `my_clock`）
   - **优先级**：数字越大越靠前，默认 500
   - **启用**：打开
   - **常驻**：勾选后卡片会一直显示在背屏
3. 保存

## 第四步：生效

- 修改配置后，建议在 REAREye 的首页点「重启背屏中心」，或直接重启 `com.xiaomi.subscreencenter`
- 系统框架类修改需要重启系统才稳定

## 数据绑定说明

卡片制作器中有两种模板类型在真机上有区别：

| 模板类型 | 浏览器预览 | 背屏真机 |
|---------|-----------|---------|
| 普通模板（时钟、名言等） | 可正常预览 | 正常显示 |
| 真实设备模板（天气/音乐） | 显示占位数据 | 绑定系统 ContentProvider / MusicControl，显示真实数据 |

如果你用了天气或音乐的真实模板，确保 REAREye 的相关 hook 功能已启用。

## 导出格式建议

- 选择 **通用卡片导出**（一份 MAML 自动适配 机型），省事
- 按机型分别导出适合需要精确适配不同分辨率的场景

## 设备分辨率参考

| 设备 | 分辨率 | 摄像头区域 |
|------|--------|-----------|
| Pro Max | 976×596 | 30% |
| Pro | 904×572 | 30% |
| Ultra | 1020×620 | 32% |

## 常见问题

**Q：导入后背屏没显示？**

- 检查卡片管理器中 business 名称是否和模板管理器中一致
- 重启背屏中心或重启系统
- 确认 REAREye 模块已正确启用且作用域包含 `com.xiaomi.subscreencenter`

**Q：想修改已导入的模板？**

- 在卡片制作器中重新编辑 → 重新导出 ZIP → 在模板管理器中重新导入同一个 business 名称覆盖

**Q：多个卡片怎么做？**

- 每个模板用不同的 business 名称导入，然后在卡片管理器中分别创建卡片绑定即可

## 相关链接

- 卡片制作器：<https://guocheng1378.github.io/rear-eye-card-maker/>
- REAREye：<https://github.com/killerprojecte/REAREye>
