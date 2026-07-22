# case3 · 公开开源仓库实测（trough / bail）

与 case1 / case2 不同，**case3 不内置任何被测代码**——被测对象是 GitHub 上**真实的公开开源库**。
目的是验证「AI 测试官」对**任意公开仓库**的通用性：给地址 + 分支就能跑，不需要为我们的示例专门改造。

## 被测对象

| 仓库 | 是什么 | 为什么选它 |
|---|---|---|
| [wooorm/trough](https://github.com/wooorm/trough) | 中间件链库（`trough()` 建链 → `wrap(fn)` 加中间件 → `run()` 执行） | 测试用 `node:test` 编写、零第三方依赖、release tags 完整 |
| [wooorm/bail](https://github.com/wooorm/bail) | 错误短路小工具（`bail(err)`：有错误立刻抛出） | 同上；且 1.x→2.x 有真实的 CJS→ESM 破坏性升级，适合演示变更理解 |

**tags 直接当分支用**：`--base 2.1.0 --target 2.2.0`，引擎把任何 git ref（分支 / tag / commit）都当作可对比对象。

## 五个场景的运行方法

### 方式一：Web 控制台（推荐）

打开 AI 测试官控制台，**仓库 URL 填** `https://github.com/wooorm/trough.git`（或 bail），各场景参数如下：

| 场景 | 参数 | 说明 |
|---|---|---|
| **A 代码改动** | base=`2.1.0` target=`2.2.0` | 对比两个 release 的 diff，精准选测 + 真实跑测 |
| **B 需求覆盖** | target=`main` + 需求文本（见下方示例） | AI 拆解测试点，核对实现与覆盖度 |
| **C 持续巡检** | target=`main` | 对主线全量回归，验证健康基线 |
| **D 修复验证** | base=`2.0.0` target=`2.2.0` + 验证单文本（见下方示例） | 先在老版本跑基线，再在新版本验证 |
| **E 合并检测** | base=`2.1.0` target=`2.2.0` merge=`2.0.2` | 模拟合并两个版本，检测文本/语义冲突 |

把仓库换成 `https://github.com/wooorm/bail.git` 时，建议参数：A 用 base=`1.0.5` target=`2.0.2`（跨 major 升级，能看到 AI 读懂 CJS→ESM 迁移），C 用 target=`main`。

### 方式二：命令行（引擎直跑）

```bash
# 场景 A：trough 两个 release 对比
node agent/run-test-officer.mjs --repo-url https://github.com/wooorm/trough.git \
  --base 2.1.0 --target 2.2.0 --scenario A --ui-off

# 场景 C：对 trough 主线全量巡检
node agent/run-test-officer.mjs --repo-url https://github.com/wooorm/trough.git \
  --base main --target main --scenario C --ui-off

# 场景 E：模拟合并
node agent/run-test-officer.mjs --repo-url https://github.com/wooorm/trough.git \
  --base 2.1.0 --target 2.2.0 --merge 2.0.2 --scenario E
```

### 场景 B 需求文本示例（粘贴到「需求文本」框）

```markdown
# 需求文档：trough 中间件链

需求ID: OSS-TROUGH-100

## 模块：index.js
### 测试点 P1：trough() 应返回一个可调用的中间件链实例
关联用例：trough

### 测试点 P2：wrap(fn) 应能把函数加入链中
关联用例：wrap

### 测试点 P3：链式执行应按顺序运行中间件并传递参数
关联用例：run
```

### 场景 D 验证单文本示例（粘贴到「需求文本」框）

```markdown
# 升级验证单：trough 2.0.0 → 2.2.0

需求ID: OSS-TROUGH-UPGRADE

## 模块：index.js
### 测试点 P1：trough() 应返回可调用的中间件链实例
关联用例：trough

### 测试点 P2：wrap 应能把函数加入链中并正确执行
关联用例：wrap
```

## 实测结果（2026-07-22，AnyDev 沙箱真实执行）

| 场景 | 仓库 / 参数 | 结果 | LLM |
|---|---|---|---|
| C 巡检 | trough@main | ✅ 1/1 通过（健康基线） | 1 次 |
| A 改动 | trough 2.1.0→2.2.0 | ✅ 1/1 通过（小版本安全） | 1 次 |
| A 改动 | bail 1.0.5→2.0.2 | 🐞 抓到 1 个失败 | 2 次 |
| B 需求 | trough + 上方需求文档 | ✅ 1/1 通过 | 2 次 |
| D 修复验证 | trough 2.0.0→2.2.0 | ✅ 修复就绪 | 2 次 |
| E 合并检测 | trough 2.2.0 + 2.0.2 | ⚠️ 正确拦截 | 1 次 |

亮点实录：

- **bail 的 AI 语义理解**：纯读 diff 即判断出「意图 = CJS → ESM 迁移 + CI 从 Travis 迁到 GitHub Actions，1.x→2.x 破坏性变更，风险 high」，与真实历史完全一致。
- **全量回退规则正确触发**：bail 的 diff 含 `.github/workflows/main.yml`、`tsconfig.json`，被识别为全局影响文件，自动放弃精准选测改全量。
- **AI 根因区分「代码错」与「环境缺依赖」**：bail-A 的失败被归因为「测试以 ESM 导入 `tape` 但未安装依赖 → `ERR_MODULE_NOT_FOUND`」，而不是误判为代码逻辑错误。
- **场景 E 正确拦截**：老版本 `2.0.2` 在 Node 18 下自身测试就失败，引擎没有误判为「合并安全」，AI 合并研判「先修各自分支失败再合并（风险 high）」。

## 什么样的公开仓库能跑（硬条件）

1. **Node.js 仓库**，测试用 `node:test` 编写（引擎用 `node --test` 执行；jest / ava / mocha 写的测试无法直接运行）；
2. 测试文件名符合 `*.test.js` / `test.js` / `test-*.js` 约定；
3. **零依赖或仅自引用**（引擎不执行 `npm install`；引用了第三方依赖的测试会因模块解析失败而表现为环境性失败——AI 根因会指出这一点）；
4. 公开可 clone（内网 / 私有仓库沙箱访问不到）。

没有 `smoke/api-smoke.mjs`、没有前端 UI 都不会报错，对应检查项会优雅跳过，只跑单测。

## 已知边界

- **不执行 `npm install`**：对带依赖的仓库，建议先在能装依赖的环境跑，或把「环境准备（可选 npm install）」作为后续增强项；
- 公开仓库的正式 release 大多是健康的，所以 A/C/D 多数得到「通过」结论——这本身是正确结果；要演示「抓到 bug」请用 case1 / case2 的内置缺陷分支。
