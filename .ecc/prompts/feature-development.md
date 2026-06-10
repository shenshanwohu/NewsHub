# Feature Development Prompt

## 功能描述

{{feature_description}}

## 参考文档

- PRD: {{prd_section}}
- Architecture: {{arch_section}}
- Database: {{db_section}}
- ADR: {{adr_refs}}

## 实施前检查

- [ ] 需求在 PRD.md 中有定义（优先级 P0/P1/P2）
- [ ] 数据库变更已反映在 Database.md 中
- [ ] 需要新的 ADR 记录
- [ ] 需要修改 project-context.md

## 实施步骤

1. 确认数据库迁移（如有）
2. 实现 Server Actions（lib/actions/）
3. 实现 UI 组件（components/）
4. 集成到路由页面（app/）
5. 验证：build + lint 通过

## 验收标准

- [ ] 功能符合 PRD 描述
- [ ] 无 TypeScript 错误
- [ ] RLS 策略更新（如有）
- [ ] 提交信息符合 conventional commits
