# 部署静态网站

把[共享工作流](../.github/workflows/static-site.yml)加到网站仓库后，GitHub Actions 会先检查和构建网站，再把生成的文件部署到 Cloudflare Workers Static Assets。网站使用哪个 Worker 和域名，仍由网站自己的 Wrangler 配置决定。

## 准备构建和部署命令

网站仓库需要 `.node-version`、`package-lock.json` 和 Wrangler 配置。可以参考模板的 [package.json](../templates/static-site/package.json) 和 [wrangler.jsonc](../templates/static-site/wrangler.jsonc)，保留下面两个命令：

| 命令             | 要做的事                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| `npm run verify` | 完成网站的检查和构建，把要发布的文件写入一个目录                                       |
| `npm run deploy` | 执行 `wrangler deploy`，接收工作流传入的 `--dry-run`、`--assets`、`--tag`、`--message` |

所有构建都放在 `verify` 中。`deploy`、`predeploy`、`postdeploy` 和 Wrangler 的自定义构建步骤不能再次生成或修改这些文件，否则部署的就不再是检查通过的那一批文件。参数说明见 [Wrangler deploy](https://developers.cloudflare.com/workers/wrangler/commands/workers/#deploy)。

先在本地运行：

```sh
npm run verify
npm run deploy -- --dry-run
```

`--dry-run` 检查本地文件和部署配置，不会上传网站。它不能确认账户权限或域名是否配置正确；这些要在实际部署后检查。Worker 和域名的设置见 [Workers 静态资源](https://developers.cloudflare.com/workers/static-assets/)和 [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)。

## 保存部署凭据

在网站的 GitHub 仓库创建名为 `production` 的 Environment，只允许生产分支使用它，并在里面添加：

| 类型     | 名称                    | 填写内容                                                     |
| -------- | ----------------------- | ------------------------------------------------------------ |
| Secret   | `CLOUDFLARE_API_TOKEN`  | 能部署目标 Worker、并完成所需域名操作的 Cloudflare API token |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | 目标 Cloudflare 账户 ID                                      |

如何取得这些值，见 [Cloudflare GitHub Actions 部署指南](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)。调用 job 按[模板](../templates/static-site/.github/workflows/ci.yml)设置 `secrets: inherit`；仅在共享工作流的部署 job 中声明 Environment 不足以取得环境 secret。token 仍保存在网站的 Environment 中，由部署 job 绑定环境后读取，检查 job 不使用生产凭据。

PR 和开发分支可以在没有生产凭据时只运行验证；实际部署前仍检查凭据是否为空。继承和环境 secret 的处理见 [GitHub 可复用工作流说明](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows#using-inputs-and-secrets-in-a-reusable-workflow)。

## 添加工作流

将[模板的 ci.yml](../templates/static-site/.github/workflows/ci.yml)复制到网站的 `.github/workflows/ci.yml`，与包依赖使用相同版本。模板标签随发布更新；已有消费者需要新版时，从[最新正式发布](https://github.com/allurx/web-foundation/releases/latest)选择版本并同步更新两处标签。保留 `secrets: inherit`，再填写站点信息：

| 字段                | 填写内容                                                       | 默认值       |
| ------------------- | -------------------------------------------------------------- | ------------ |
| `asset-directory`   | 构建生成的网站文件目录，例如 `dist/`                           | 必填         |
| `production-url`    | 网站地址，只用于 GitHub 部署记录中的链接，不会设置 Worker 域名 | 必填         |
| `production-branch` | 推送后要部署的分支                                             | `main`       |
| `environment`       | 上一步保存部署凭据的 Environment 名称                          | `production` |

触发分支和并发设置也在这个文件里。生产分支的 `push` 会部署，其他调用只检查。模板将调用 job 命名为 `site`，所以 Actions 中会出现 `site / verify` 和 `site / deploy`；设置分支保护时，选择实际出现的验证检查名称。

包与共享工作流的标签必须相同，对应的 GitHub Release 须标为 Immutable，并且能被本机和 CI 访问。正式版本标签发布后不移动、不复用。`uses` 中直接填写完整引用，不能用表达式拼接，也不要用 `@latest` 代替版本选择。更新时怎样核对两处引用，见[依赖与更新](dependencies.md)；调用语法见 [GitHub 可复用工作流](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)。

### 哪些文件会发布

`asset-directory` 只能填写仓库内一个真实存在的目录，不能是仓库根目录、外部路径或通配符，首尾也不能有空白。目录及其父路径不能经过符号链接。这个目录里的隐藏文件也会上传，因此不要混入不应公开的文件。

工作流会检查并上传这个目录，然后按 artifact ID 下载同一批文件交给 Wrangler。部署时用 `--assets` 指定下载目录，Wrangler 配置中的其他资源设置不变。

## 确认部署结果

1. 在网站仓库的 Actions 中找到目标 commit，确认 `site / verify` 通过，`site / deploy` 成功且没有跳过。部署前如果分支已有新提交，旧运行会跳过部署；此时查看包含这次改动的后续运行。
2. 到 GitHub Environment 和 Cloudflare Worker 的 Deployments 查看部署记录。Cloudflare 版本的 tag 应是该 commit SHA，message 应指向这次 Actions 运行。
3. 打开改动涉及的网页，确认显示的是这次发布的内容。CI 通过或旧网页仍能访问，都不能单独证明新版本已经上线。
