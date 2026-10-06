# Allurx Web Foundation

这个项目集中维护 Web 工程常用的工具版本，以及 ESLint、TypeScript、Prettier 和 Vite 配置，也提供将静态网站部署到 Cloudflare Workers Static Assets 的 GitHub Actions 工作流。新建网站时，可以从附带的模板开始，默认支持桌面与移动设备浏览器。

你的网站仍然是独立工程，页面、业务代码、额外的构建设置和域名都放在自己的仓库中。共享包和部署工作流固定到同一个不可变发布的版本标签，更新引用后才会采用新的工具版本和配置。Node.js 运行时仍由网站自己的 `.node-version` 和 `engines` 指定。

## 开始使用

**新建网站**：按[模板说明](templates/static-site/README.md)复制文件，填写项目名称和部署目标，然后安装依赖、启动开发。模板中的具体标签随基础库发布同步更新；复制后的工程由消费者按需升级。

**给已有网站使用共享工具**：先准备 Git、npm，以及 [package.json](package.json) 中 `engines` 要求的 Node.js 版本。

如果网站已单独声明共享工具，先对照[基础包的 `peerDependencies`](package.json)，从网站的 `package.json` 中移除重复的工具依赖，保留业务依赖，避免旧版本与基础包要求冲突。

从 [Releases](https://github.com/allurx/web-foundation/releases) 选择标为 Immutable 的已验证版本，把 `<RELEASE_TAG>` 换成具体的 `vX.Y.Z` 标签，然后在网站目录执行。占位符本身不是已发布版本，标签必须能从本机和 CI 访问：

```sh
npm install --save-dev --save-exact "git+https://github.com/allurx/web-foundation.git#<RELEASE_TAG>"
```

npm 会同时安装共享包指定的检查、构建和部署工具，无需在网站里再写一遍工具版本。安装后按[检查与构建配置](docs/configuration.md)修改配置文件，并保存 `package.json` 和锁文件。以后使用 `npm ci` 安装同一批依赖。

这个包直接从 Git 安装，不需要发布到 npm registry。网站需要自动部署时，再按[部署说明](docs/deployment.md)添加工作流，填写与包依赖相同的版本标签。

## 文档

| 文档                                       | 你可以在这里找到什么                                       |
| ------------------------------------------ | ---------------------------------------------------------- |
| [检查与构建配置](docs/configuration.md)    | 怎样使用共享配置，以及不同空间和输入方式下需要检查什么     |
| [部署静态网站](docs/deployment.md)         | 怎样准备构建命令、配置部署凭据、调用工作流和查看结果       |
| [依赖与更新](docs/dependencies.md)         | 工具版本来源、Dependabot 的更新范围及 PR 处理方式          |
| [维护 Web Foundation](docs/development.md) | 共享配置应该改在哪里，修改后怎样检查，以及怎样升级工具版本 |

## 许可证

[Apache-2.0](LICENSE.txt)。第三方依赖遵循各自许可证。
