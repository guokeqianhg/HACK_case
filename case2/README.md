# case2：停车场计费与高峰放行系统

这是一个更容易讲清楚、也更适合做性能演示的 `AI 测试官` 示例。

## 这个案例讲什么

场景是一个小型停车场系统，核心规则非常直白：

- 前 15 分钟免费
- 小型车按每开始 1 小时 `¥6`
- 大型车按每开始 1 小时 `¥10`
- 会员在正常费用基础上打 `9` 折
- 挂失票走一口价
- 支持一次性模拟高峰出场车辆，估算总费用与接口耗时

## 为什么它适合五个场景

- **场景 A（理解变更）**：可以很自然地引入“免费时长”“会员折扣”“挂失票”这类规则 bug
- **场景 B（需求 → 验证）**：`docs/requirement.md` 已整理成可直接喂给测试官的 Markdown 格式
- **场景 C（巡检 / 监控）**：可以用 `smoke:api` 和 `smoke:perf` 做日常巡检，关注计费正确性和高峰估算接口
- **场景 D（修复验证）**：适合做“某类计费 bug 修复后，回归是否通过”的演示
- **场景 E（合并风险）**：计费规则是典型的多分支高冲突区域，适合演示 merge risk

## 目录说明

- `src/pricing.js`：停车费计算规则
- `src/lot.js`：场内车辆内存数据
- `src/ticket.js`：出场结算与高峰估算编排
- `src/server.js`：HTTP 服务与 API
- `public/`：简单前端页面
- `tests/`：单元测试
- `smoke/`：API / UI / 性能冒烟
- `docs/requirement.md`：需求文档输入样例

## 本地运行

```bash
npm install
npm start
```

默认打开后会看到 4 辆待出场车辆，以及一个“高峰放行估算”按钮。

## 测试命令

```bash
npm test
npm run smoke:api
npm run smoke:perf
npm run smoke:ui
```

## 演示建议

如果你后续要把它拿来做分支演示，我建议围绕以下几个点建分支：

- `feature/free-window-bug`：把“前 15 分钟免费”错误改成“前 5 分钟免费”
- `feature/member-discount-bug`：把会员 9 折错误改成 5 折
- `feature/lost-ticket-rule`：新增或修改挂失票规则
- `fix/parking-pricing`：修复上述 bug 并做回归验证

这个案例的优点是：**概念简单，人人都能看懂，但依然能讲“规则正确性 + 性能估算 + 回归验证 + 合并风险”。**
