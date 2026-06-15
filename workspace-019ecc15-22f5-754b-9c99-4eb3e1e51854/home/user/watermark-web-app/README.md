# 水印边框大师 - Web版

一个纯前端实现的照片水印添加工具，功能类似「边框水印大师」App，支持 GitHub Pages 免费部署。

## ✨ 功能特性

- **品牌水印**：Sony、Leica、Hasselblad、Canon、Nikon、Fujifilm、Panasonic、Olympus 等 12 种品牌一键添加
- **自定义文字水印**：文字、字体大小、颜色、透明度
- **图片水印**：支持上传自己的 logo / 签名图片作为水印
- **EXIF 智能识别**：自动读取相机品牌信息
- **实时预览**：可调节位置、大小、旋转角度、透明度
- **批量处理**：支持多张图片同时添加水印
- **边框功能**：可添加自定义宽度和颜色的边框
- **模板保存**：保存常用水印配置（浏览器本地存储）
- **ZIP 导出**：一键打包下载所有处理后的图片
- **PWA 支持**：可安装为手机 App（添加到主屏幕）
- **纯前端**：无需后端，数据不上传服务器，隐私安全
- **手机端深度优化**：大按钮、触控友好、响应式布局

## 🚀 在线演示

部署到 GitHub Pages 后即可访问（部署后把链接贴这里）

## 🛠️ 本地运行

1. 克隆仓库
```bash
git clone https://github.com/你的用户名/watermark-web-app.git
cd watermark-web-app
```

2. 直接用浏览器打开 `index.html`

或者使用任意静态服务器：
```bash
npx serve .
```

## 📱 手机端使用建议

- 首次访问后，浏览器会提示「添加到主屏幕」
- 添加后可像原生 App 一样使用（全屏、无地址栏）
- 支持 iOS Safari 和 Android Chrome

## 🔄 更新日志（本次优化）

- 新增 **图片水印** 功能（可上传 logo/签名）
- 扩展品牌水印至 12 种
- 手机端布局深度优化（更大按钮、触控友好）
- 修复手机端点击上传无反应问题
- 新增 PWA 支持（可安装为 App）
- 添加 Service Worker 缓存（离线可用）

## 📦 部署到 GitHub Pages（推荐）

### 方法一：GitHub Actions 自动部署（最简单）

1. 把项目推送到 GitHub
2. 进入仓库 → **Settings** → **Pages**
3. Source 选择 **GitHub Actions**
4. 推送代码后会自动部署

### 方法二：手动部署

```bash
# 安装 gh-pages（可选）
npm install -g gh-pages

# 部署
gh-pages -d .
```

或者直接在 GitHub 仓库设置中选择分支部署。

## 🧩 技术栈

- 纯 HTML + CSS + JavaScript
- **exifr**（CDN）：读取图片 EXIF 信息
- **JSZip**（CDN）：打包下载 ZIP
- Canvas API：实时水印渲染

## 📝 后续可扩展功能（欢迎贡献）

- [ ] 支持上传图片水印
- [ ] 更多品牌水印模板（自动从 EXIF 匹配）
- [ ] 水印位置智能避让
- [ ] 滤镜效果
- [ ] PWA 支持（可安装为 App）
- [ ] 导出不同格式（PNG/WebP）

## 📄 License

MIT

---

**注意**：本项目仅供学习和个人使用，商业用途请参考原 App 开发者。