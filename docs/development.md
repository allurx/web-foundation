# 维护 Web Foundation

本文说明怎样修改 Web Foundation 本身。给网站配置工具见[检查与构建配置](configuration.md)，发布网站见[部署说明](deployment.md)。

## 准备环境

安装 [.node-version](../.node-version) 指定的完整 Node.js LTS 版本，再在仓库根目录执行：

```sh
npm ci
```

安装结束时，npm 的 `prepare` 会调用现有 TypeScript 编译器，把 `configs/*.ts` 生成为 `dist/` 中的 ESM JavaScript 和类型声明。配置源码和自用配置都用 TypeScript；`dist/` 不提交，也不手工修改。这样可以直接使用类型语法，又能让安装后的工具加载标准 JavaScript。

[package.json](../package.json) 的 `engines` 要求相同版本。模板中的[版本文件](../templates/static-site/.node-version)和 [package.json](../templates/static-site/package.json)也使用这个版本，这样本地和 CI 不会因自动跟随新版本而改变检查结果。

## 改哪个文件

| 要修改的内容                         | 文件位置                                                |
| ------------------------------------ | ------------------------------------------------------- |
| ESLint、Prettier 和 Vite 的共同配置  | [configs/](../configs/)                                 |
| TypeScript 的共同规则和环境配置      | [tsconfig/](../tsconfig/)                               |
| 网站的自动部署步骤                   | [static-site.yml](../.github/workflows/static-site.yml) |
| 新建网站时要复制的文件               | [templates/static-site/](../templates/static-site/)     |
| 包的导出、依赖和打包文件清单         | [package.json](../package.json)                         |
| 本仓库在 GitHub Actions 中执行的检查 | [ci.yml](../.github/workflows/ci.yml)                   |
| 依赖更新与 PR 处理                   | [依赖与更新](dependencies.md)                           |

多个网站都要遵守的规则放在共享配置或工作流中，模板直接引用它们。只影响某个网站的设置留在那个网站。新增忽略项时，先确认当前工具确实会生成该目录，或里面有明确不应检查的内容。

## 检查修改

在根目录运行：

```sh
npm run verify
```

`verify` 先重新生成共享配置，再检查格式、ESLint 和 TypeScript。格式命令直接加载 TypeScript 源码配置，其他检查通过包的公开入口使用生成结果。

构建设置在 [tsconfig.build.json](../tsconfig.build.json)。从 Git 安装时，npm 会先安装配置包的开发依赖并执行 `prepare`，再打包供网站使用；普通 `npm pack` 也会执行它。包中只带生成结果和共享 tsconfig，不要求网站直接运行 `node_modules` 中的 TypeScript，也不需要人工维护 `.d.ts`。生命周期说明见 [npm prepare](https://docs.npmjs.com/cli/v11/using-npm/scripts/#life-cycle-scripts)。

修改工作流时，由 Agent 按改动风险核对语法、表达式、job 依赖及调用参数，按需使用 [actionlint](https://github.com/rhysd/actionlint) 等工具。静态检查不能验证 GitHub 上的凭据、环境设置和实际执行结果，相关行为变化仍需在目标环境中验证。

修改共享配置或模板后，还要确认新网站能真正使用它们：把模板复制到仓库外，用 `npm pack` 生成的包替换模板里的 Git 占位依赖，安装后运行 `npm run verify` 和 `npm run deploy -- --dry-run`。检查所需工具是否随基础包一起安装，不要借用本仓库的 `node_modules`，否则可能漏掉包中缺文件或缺依赖的问题。这套操作已写在 [CI 的 template job](../.github/workflows/ci.yml) 中。

发布或修改打包范围时，再核对实际安装包中的导出文件、类型声明和许可证是否完整。

改到模板页面时，检查不同可用空间下的基本显示、语义 HTML 和缩放。业务网站根据实际功能和风险验证空间变化及输入方式，见[桌面与移动设备](configuration.md#桌面与移动设备)；设备模拟结果不能写成真机结果。

CI 会运行 Linux、Windows 检查和上述模板检查，最后由 `CI required` 汇总结果。任何一项失败、取消或跳过，汇总检查都不会通过。检查通过后，远端 Git 安装、网站调用共享工作流以及实际部署仍需分别验证。

发布仓库后，让 CI 至少运行一次，再在 GitHub 为 `main` 配置分支保护：要求 PR、要求分支为最新、将 GitHub Actions 的 `CI required` 设为必需检查，并将规则应用于管理员。在仓库设置中允许 squash merge，用于依赖更新等短期分支。写在本地配置或文档中不会使这些仓库设置自动生效。

## 升级工具和共享配置

工具使用相互兼容的最新稳定版，并固定完整版本号。工具版本声明、Dependabot 的更新范围、PR 处理方式，以及 Node.js 和 TypeScript 的升级限制，统一见[依赖与更新](dependencies.md)。升级后运行根目录检查和独立模板验证。

TypeScript 的 `target`、`lib` 决定检查时采用的语言和 API 类型；Vite 的 `build.target` 决定浏览器文件的语法转换，两者分别维护。升级 Vite 时核对 `baseline-widely-available` 对应的浏览器范围，并重新构建和检查模板。

正式发布时，为已经完成集成和验证的提交创建与 `package.json` 版本一致的 `vX.Y.Z` 标签，并记录对应的完整提交 SHA。发布前另行取得推送、标签和发布授权；已有正式标签不能移动或复用。其他网站更新包标签、工作流 SHA 及锁文件后，再运行自己的检查和构建，不需要发布到 npm registry。模板只在新建网站时复制，后续更新无需重新复制整个目录。
