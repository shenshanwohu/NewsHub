# Bug Fix Prompt

## Bug 描述

{{bug_description}}

## 复现步骤

{{reproduction_steps}}

## 根因分析

- [ ] 数据库查询错误？
- [ ] 权限/RLS 问题？
- [ ] 前端状态管理问题？
- [ ] 类型错误？
- [ ] 缓存问题？

## 修复步骤

1. 创建修复分支: `fix/{{short_description}}`
2. 编写测试用例（如适用）
3. 修复代码
4. 验证：复现步骤不再触发
5. 无回归：build + lint 通过

## 修复后

- [ ] 更新 project-context.md（如涉及架构变更）
- [ ] 需要新的 ADR（如涉及架构决策变更）
