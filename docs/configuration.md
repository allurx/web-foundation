# 使用共享检查与构建配置

先按 [README](../README.md#开始使用)安装 `@allurx/web-foundation`。npm 会一起安装它指定版本的 ESLint、Prettier、TypeScript、Vite、Wrangler 和 Node.js 类型声明。网站只需声明基础包和业务另外需要的依赖，不再重复维护这些工具版本。Node.js 运行时仍需按网站的 `.node-version` 安装。

新建网站可以直接复制[模板](../templates/static-site/README.md)；已有工程按下面的说明修改配置文件。

## 配置 Vite

[模板的 vite.config.ts](../templates/static-site/vite.config.ts)直接导出 `@allurx/web-foundation/vite`。共享配置按静态网站处理路径，构建目标使用 `baseline-widely-available`，具体设置见 [configs/vite.ts](../configs/vite.ts)。需要插件、别名或其他项目设置时，用 Vite 的 [mergeConfig](https://vite.dev/guide/api-javascript#mergeconfig) 将项目配置合并到共享对象上。

`baseline-widely-available` 按当前固定 Vite 版本对应的浏览器范围转换语法，而不是只面向最新的桌面浏览器。版本升级时要重新核对这个范围，含义见 [Vite build.target](https://vite.dev/config/build-options#build-target)。构建目标不会自动补齐浏览器缺少的 API。

模板默认按普通静态页面处理路径。采用 SPA 前端路由时，要同时调整 Vite 的 `appType` 和 Wrangler 的页面回退设置；这与网站运行在桌面还是移动设备上无关。

## 配置 TypeScript

把需要的共享配置填入 `tsconfig` 的 `extends`。浏览器代码和 Node.js 代码分别检查，避免浏览器代码误用 Node.js 的全局变量，或构建脚本误用页面 API。

| 共享配置                                  | 用于检查什么代码                         | 你需要填写什么                                       |
| ----------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `@allurx/web-foundation/tsconfig/browser` | 交给 Vite 等工具打包的浏览器代码         | `include`、Vite 或框架的类型；有路径别名时再填写映射 |
| `@allurx/web-foundation/tsconfig/node`    | Node.js 脚本及 ESLint、Vite 等工具配置   | `include`，模板检查根目录的 `*.ts`                   |
| `@allurx/web-foundation/tsconfig/base`    | 需要自己选择模块加载方式或运行环境的代码 | 在公共检查规则上补充所需的模块设置和环境类型         |

共享配置文件按 `tsconfig.*.json` 命名，TypeScript 允许其中保留注释；使用时将表中的无后缀入口填入 `extends`。

可以照着模板的 [tsconfig.app.json](../templates/static-site/tsconfig.app.json) 和 [tsconfig.node.json](../templates/static-site/tsconfig.node.json)填写文件范围，再用[根 tsconfig.json](../templates/static-site/tsconfig.json) 的 `references` 关联它们。这些文件直接继承共享配置，不需要再建一个只转发相同选项的本地 base 文件。

### `target`、`lib` 和模块选项有什么区别

它们决定的事情不同，所以值也不同：

| 选项               | 它决定什么                                                    | 这里怎样设置                                    |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------- |
| `target`           | TypeScript 输出 JavaScript 时，哪些语法可以保留，哪些需要转换 | `ES2025`                                        |
| `lib`              | TypeScript 认识哪些内置 API，例如数组方法和 DOM API           | 使用 `ES2025`；浏览器另加 `DOM`、`DOM.Iterable` |
| `module`           | TypeScript 怎样处理 `import`、`export`，以及 ESM 和 CommonJS  | 浏览器用 `ESNext`，Node.js 用 `NodeNext`        |
| `moduleResolution` | TypeScript 怎样根据导入路径查找文件和包                       | 浏览器用 `bundler`，Node.js 用 `NodeNext`       |

网站的 `tsc` 开启了 `noEmit`，只检查代码，不输出 JavaScript。TypeScript 的 `target`、`lib` 使用 ES2025；真正生成浏览器文件的是 Vite，它按前面的浏览器范围转换语法。两处负责的事情不同，不需要设置为同一个值。

浏览器代码交给打包器处理，所以 `module: ESNext` 保留 `import`、`export`，`moduleResolution: bundler` 按打包器的方式查找导入。Node.js 直接加载文件，所以使用 `NodeNext`，让 TypeScript 按 Node.js 的规则判断 ESM、CommonJS 和导入路径。`ESNext`、`NodeNext` 在这里说的是模块处理方式，不能因为 `target` 是 ES2025 就把它们改成相同的值。

`lib` 只提供类型声明，不会向浏览器或 Node.js 安装这些 API。类型检查通过后，仍要在网站支持的运行环境中验证实际行为。更多选项说明见 TypeScript 的 [target](https://www.typescriptlang.org/tsconfig/target.html)、[lib](https://www.typescriptlang.org/tsconfig/lib.html)、[module](https://www.typescriptlang.org/tsconfig/module.html) 和 [moduleResolution](https://www.typescriptlang.org/tsconfig/moduleResolution.html)。

### Node.js 直接执行 TypeScript 时要注意什么

Node.js 直接运行 `.ts` 时，默认只删除类型标注，不会把 `enum` 等语法转换成 JavaScript。因此共享的 `node` 配置开启 `erasableSyntaxOnly`，让类型检查提前报告这些不能直接运行的写法。具体支持范围见 [Node.js 的 TypeScript 说明](https://nodejs.org/docs/latest-v24.x/api/typescript.html#type-stripping)。

这些检查不能保证脚本可直接运行。例如，标准装饰器可能通过类型检查，但当前 Node.js 不支持原生执行；`@types/node` 也包含 ESM 中不存在的 `__dirname` 等 CommonJS 变量。直接执行 TypeScript 时，仍需按实际 Node.js 版本验证运行结果。

模板在 `package.json` 中设置了 `"type": "module"`，所以工具配置直接使用 `.ts`。若代码由其他工具加载，应根据那个工具的实际行为选择模块设置；需要自行配置时，可以继承表中的 `base` 配置。配置继承和相对路径的处理见 [TypeScript extends](https://www.typescriptlang.org/tsconfig/extends.html)。

检查 TypeScript 文件不需要开启 `allowJs`、`checkJs`。浏览器配置通过 `compilerOptions.types` 中的 `"vite/client"` 识别 Vite 类型；`"node"` 留在 Node.js 配置中，不要加到浏览器配置里。

## 配置 ESLint

参考[模板的 eslint.config.ts](../templates/static-site/eslint.config.ts)，从 `@allurx/web-foundation/eslint` 导入需要的配置：

| 导出            | 它会检查什么                                                                  |
| --------------- | ----------------------------------------------------------------------------- |
| 默认导出 `base` | JavaScript 的常见错误                                                         |
| `typeChecked`   | 结合 TypeScript 类型信息，检查 TS 和开启 `checkJs` 的 JavaScript              |
| `browser`       | 声明浏览器全局变量，并报告浏览器代码中误用的 Node.js 全局变量和内置模块       |
| `node`          | 声明 Node.js 全局变量，并报告构建脚本中误用的 `window`、`document` 等页面 API |

在 `files` 中写明各组配置要检查哪些文件，用 `extends` 组合它们。需要排除目录时写入 `globalIgnores`，只添加这个工程确实会生成或需要跳过的目录。额外规则和框架插件仍按 [ESLint 的配置组合方式](https://eslint.org/docs/latest/use/configure/combine-configs)添加。

`typeChecked` 通过 TypeScript Project Service 获取类型信息。因此，ESLint 要检查的文件也必须出现在本工程的 `tsconfig.json` 或它引用的配置中。将 `tsconfigRootDir` 设为工程目录；模板使用 `import.meta.dirname`，表示 `eslint.config.ts` 所在的目录。

基础包提供 `jiti`，让 ESLint 按[官方支持的方式](https://eslint.org/docs/latest/use/configure/configuration-files#typescript-configuration-files)加载 `.ts` 配置。加载不等于检查类型，仍需运行 `tsc`。遇到文件不在项目中的错误时，先核对 ESLint 的 `files` 与 TypeScript 的 `include`，其他排查方式见 [typed linting](https://typescript-eslint.io/getting-started/typed-linting/)。

已有 JavaScript 需要一起检查时，再把文件加入这两处范围，并在 TypeScript 配置中开启 `allowJs`、`checkJs`。

## 配置 Prettier

在 `package.json` 中添加下面的字段，其他内容保持不变：

```json
{
    "prettier": "@allurx/web-foundation/prettier"
}
```

把不应格式化的文件写进 `.prettierignore`，尤其是必须保留原始字节的正文或附件。命令可以参考[模板的 package.json](../templates/static-site/package.json)，排除项参考[模板的 .prettierignore](../templates/static-site/.prettierignore)。需要覆盖某项格式设置时，按 [Prettier 的共享配置说明](https://prettier.io/docs/sharing-configurations)处理。

## 检查配置是否生效

配置完成后，依次运行格式、ESLint、TypeScript 检查和工程构建。模板的 `npm run verify` 已经包含这些步骤。新加目录或 JavaScript 文件时，确认它们也会被检查，避免命令通过了却漏掉文件。

### 桌面与移动设备

模板默认面向桌面与移动设备上的浏览器，手机、平板和折叠屏都是例子。保留 viewport、语义 HTML 和缩放，用同一份页面代码按实际可用空间布局；交互按触摸、鼠标或触控板、键盘及其组合处理，不从设备名称或页面宽窄推断输入能力。

基础库检查模板的安装、构建、基本显示和缩放。业务网站按实际功能和风险验证横竖屏、分屏或窗口调整、折叠展开时的空间变化，以及实际交互；浏览器模拟不能当作真机验证。安全区、软键盘和 PWA 按需处理，基础库不预建设备层、独立移动工程、UI 或手势框架，也不预加 polyfill。

### 升级共享包

以后升级 Web Foundation，先查看两个发布版本之间改了哪些工具和配置，再将包和部署工作流更新到同一个不可变发布的版本标签，更新锁文件并重新检查和构建网站。涉及运行行为的变化还要在实际环境中验证。Dependabot 对两处分别检查，不能保证自动成套更新。更新范围和处理方式见[依赖与更新](dependencies.md)。
