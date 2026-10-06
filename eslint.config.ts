/*
 * Copyright 2026 allurx
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig, globalIgnores } from "eslint/config";
import base, { node, typeChecked } from "@allurx/web-foundation/eslint";

// 本仓库也通过包名加载配置，避免包的导出路径出错却未被发现。
export default defineConfig(
    // 模板会在单独的目录安装依赖并检查，这里只检查基础库。
    globalIgnores(["dist/", "templates/"]),
    base,
    {
        // 工具配置由 jiti 加载，共享配置源码由 TypeScript 编译。
        files: ["*.ts", "configs/**/*.ts"],
        extends: [typeChecked, node],
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
    }
);
