# 依赖与更新

本页说明 Web Foundation 怎样维护工具版本，以及怎样处理依赖更新。网站只声明基础包和自己的业务依赖；工具升级先在这里验证，再由网站更新基础包引用。

## 工具版本放在哪里

根 [package.json](../package.json) 保存准确版本。配置模块直接使用的依赖放在 `dependencies`；ESLint、Prettier、TypeScript、Vite、Wrangler、Node.js 类型声明，以及 ESLint 加载 TypeScript 配置所需的 jiti，同时放在 `peerDependencies`、`devDependencies`，两处使用相同版本。

这两种声明各有用途：peer 约束网站使用相同版本，dev 供本库开发和 Dependabot 发现更新。只有 peer 声明时，npm 虽然会安装工具，Dependabot 的常规版本更新却不会覆盖它。把工具全改成普通依赖也不合适：业务插件可能让 npm 在网站顶层安装另一版本，导致网站命令和基础包使用不同工具。

Dependabot 支持在更新开发依赖时同步相同版本的 peer 声明。升级时由 Agent 核对两处版本一致并更新锁文件，不在模板或另一份清单里再维护这些版本。

## 哪些更新会收到 PR

[Dependabot 配置](../.github/dependabot.yml)每周检查本库并提出更新 PR。合并前仍需审查变化并通过 CI。

| 内容                                   | 谁提出更新            | 需要注意什么                                   |
| -------------------------------------- | --------------------- | ---------------------------------------------- |
| 本库的直接 npm 依赖和开发工具          | 本库的 Dependabot     | 固定完整版本；配套的 peer 声明必须同步         |
| 本库 `.github/workflows/` 中的 Actions | 本库的 Dependabot     | 完整 SHA 旁保留对应版本注释                    |
| 网站的基础包版本标签、锁文件和业务依赖 | 网站自己的 Dependabot | 模板配置复制到独立仓库后才生效                 |
| 网站使用的共享工作流版本标签           | 网站自己的 Dependabot | 与包更新属于不同的更新路径，标签须保持一致     |
| Node.js 运行时                         | 维护者                | 当前 Dependabot 配置不检查版本文件和 `engines` |
| 模板目录中的示例和复制到网站后的文件   | 维护者                | 本库的更新不会自动改写已有网站的这些文件       |

传递依赖由锁文件记录，可能随直接依赖更新；不要把这理解成每个传递依赖都会收到常规升级 PR。Dependabot 的安全更新另受 GitHub 仓库设置和已知漏洞数据影响。

Node.js 升级时选定一个完整 LTS 版本，同步根目录和模板的 `.node-version`、`package.json` 中的 `engines`，再更新同一大版本的 `@types/node` 和锁文件。已有网站也要同步自己的运行时声明。

TypeScript 必须处于 [typescript-eslint 的支持范围](https://typescript-eslint.io/users/dependency-versions/)内。当前有意保留 TypeScript 6.0.3，并在 Dependabot 中忽略 `>=6.1.0`；确认支持情况后再解除限制。`@types/node` 的跨大版本更新也被忽略，随 Node.js 一起升级。其他依赖的大版本更新仍可以收到 PR，由维护者处理。

## 基础包和工作流怎样升级

配置包和本库共享工作流统一固定同一个不可变发布的具体 Git 标签，例如 `vX.Y.Z`。模板使用的是待替换占位符，不能直接当作已发布版本安装。第三方 Actions 仍固定完整 SHA，并保留对应版本注释。

Dependabot 能识别看起来像版本号的 Git 标签，并提出包标签、锁文件和工作流标签的更新。两处应对应同一次验证过的发布；当前配置不保证它们在同一个 PR 中更新，合并前要核对。[GitHub 多生态更新分组](https://docs.github.com/en/code-security/concepts/supply-chain-security/multi-ecosystem-updates)可以合并 PR，但也不能保证两个解析器选中同一次发布。

正式标签不得移动或复用。采用标签前，须确认对应的 [GitHub Release](https://github.com/allurx/web-foundation/releases) 标为 Immutable；单独的 Git 标签不具备这项保护。发布步骤见[维护说明](development.md#升级工具和共享配置)。npm 锁文件仍记录标签解析出的 commit SHA，`npm ci` 安装其中记录的版本，不会自动升级。

Git URL 中的 `#latest` 和工作流中的 `@latest` 只是名为 `latest` 的 Git 引用，不代表 GitHub 最新发布；npm registry 的 `@latest` 则是 registry 的 dist-tag。本工程直接从 Git 安装，不使用这些浮动引用。

## 依赖 PR 怎样处理

Dependabot 负责提出更新 PR，Agent 在获得相应授权后审查、验证和合并。当前未配置自动唤起 Agent 的机制，需要发起任务处理；Dependabot 创建 PR 不会自行启动 Agent。

小版本更新也可能改变行为。合并前核对实际依赖差异和兼容性，完成[维护说明](development.md#检查修改)中的相关检查，并满足 GitHub 上的分支保护与 review 要求。确认合并结果后，再查看主分支 CI；网站更新还需验证自己的实际部署链路。

## 为什么保留这些工具

除了 ESLint、TypeScript、Prettier、Vite、Wrangler 和 GitHub 官方 Actions，还直接使用以下社区维护的工具：

| 工具                | 来源                                                                                         | 在这里承担的作用                                                                |
| ------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `globals`           | [sindresorhus/globals](https://github.com/sindresorhus/globals)                              | 提供浏览器和 Node.js 的全局名称及只读属性，避免手写清单，并检查对只读全局的赋值 |
| `typescript-eslint` | [typescript-eslint](https://typescript-eslint.io/)                                           | 解析 TypeScript，并让 ESLint 使用类型信息检查代码                               |
| `@types/node`       | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node) | 为 Node.js API 提供类型声明，不是 Node.js 运行时本身                            |
| `jiti`              | [unjs/jiti](https://github.com/unjs/jiti)                                                    | 按 ESLint 官方支持的方式加载 TypeScript 配置，避免依赖实验性加载标志            |
