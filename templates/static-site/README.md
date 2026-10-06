<!--
Copyright 2026 allurx
SPDX-License-Identifier: Apache-2.0
-->

# 静态站点模板

复制这个模板，就可以用 HTML、TypeScript 和 Vite 开始一个支持桌面与移动设备浏览器的独立网站。工具版本、检查和常用构建设置由 Web Foundation 统一维护，GitHub Actions 负责部署到 Cloudflare Workers Static Assets。

## 创建网站

把本目录全部复制到新工程，隐藏文件也要保留。安装 [.node-version](.node-version) 指定的完整 Node.js LTS 版本，然后修改三处：

1. 选择一个已发布并验证的 Web Foundation 版本。在 [package.json](package.json) 中把 `<RELEASE_TAG>` 换成具体的 `vX.Y.Z` 标签，在 [ci.yml](.github/workflows/ci.yml) 中填写该标签对应的 `<FULL_COMMIT_SHA>` 和同一行的版本注释。这里的占位符不是已发布版本，不能直接安装或运行；`latest` 也不表示自动选择 GitHub 的最新发布。
2. 在 `package.json` 填写工程名称，在 [wrangler.jsonc](wrangler.jsonc) 填写 Worker 名称，在 [index.html](index.html) 修改标题和页面内容。
3. 把 CI 的 `production-url` 换成网站地址。它只决定部署记录中的链接；Worker 实际使用哪个域名，要在 Wrangler 配置中设置。

然后安装依赖、启动开发服务器：

```sh
npm install
npm run dev
```

npm 会一起安装基础包指定的检查、构建和部署工具，不必在本项目重复写这些工具版本。保存生成的 `package-lock.json`，以后安装使用 `npm ci`。页面写在 `index.html`，浏览器交互写在 [src/main.ts](src/main.ts)，不需要处理、只需原样复制的文件放在 `public/`。

检查和构建工具已经配置好，工具配置也使用 TypeScript。[vite.config.ts](vite.config.ts)直接引用共享 Vite 配置，需要插件或项目设置时再用 Vite 的 `mergeConfig` 合并。其他设置在 [eslint.config.ts](eslint.config.ts)、[tsconfig.json](tsconfig.json)和 `package.json` 的 `prettier` 字段中，见 [Web Foundation 检查与构建配置](https://github.com/allurx/web-foundation/blob/main/docs/configuration.md)。

## 检查并预览网站

```sh
npm run verify
npm run preview
```

`verify` 先检查格式、ESLint 和类型，再将网站构建到 `dist/`。`preview` 用 Wrangler 预览这个目录里的文件，修改源码后要重新构建。其他命令见 [package.json](package.json)。

保留 viewport、语义 HTML 和缩放，布局按实际空间变化，交互按触摸、鼠标或触控板、键盘及其组合处理，不用设备名称或页面宽窄推断输入能力。加入业务内容后，按功能和风险检查横竖屏、分屏或窗口调整、折叠展开、缩放及实际操作；模拟不能代替真机验证。安全区、软键盘和 PWA 按需处理，不为不同设备另建工程或预加交互框架。

## 部署网站

首次推送 `main` 前，在 GitHub 仓库创建 `production` Environment，只允许 `main` 部署，并添加 Secret `CLOUDFLARE_API_TOKEN` 和 Variable `CLOUDFLARE_ACCOUNT_ID`。如何准备这些值和域名，见 [Web Foundation 部署说明](https://github.com/allurx/web-foundation/blob/main/docs/deployment.md)。

完成上面的构建后，检查 Wrangler 配置：

```sh
npm run deploy -- --dry-run
```

**推送 `main` 会部署到生产环境。** PR 只检查。部署使用这次检查和构建生成的同一批文件；在 Actions 中查看 `site / verify` 和 `site / deploy`，分支保护需要验证检查时选择 `site / verify`。部署后再核对 Cloudflare 版本和实际网页，步骤见部署说明。

## 更新依赖

工具版本由基础包统一指定。新增业务依赖时，[.npmrc](.npmrc) 会让 npm 保存精确版本；保留锁文件，让本地和 CI 安装相同的依赖。

[Dependabot](.github/dependabot.yml)分别检查包依赖和工作流，不能保证两处自动成套更新。升级时核对包的具体标签、工作流 SHA 和版本注释对应同一次已验证发布，更新锁文件并运行 `npm run verify`，不用重新复制模板。正式标签不移动、不复用；更多更新范围见 [Web Foundation 依赖与更新](https://github.com/allurx/web-foundation/blob/main/docs/dependencies.md)。

Node.js 运行时仍固定在本项目的 `.node-version` 和 `package.json` 的 `engines` 中。如果新版基础包要求升级 Node.js，一起修改这两个文件，通过检查后再采用。

## 许可证

模板采用 [Apache-2.0](public/LICENSE.txt)。构建时，`public/` 中的许可证会和网站文件一起复制到 `dist/`。
