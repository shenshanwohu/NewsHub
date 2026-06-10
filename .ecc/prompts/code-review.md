# Code Review Prompt

## 待审查

- 分支: {{branch_name}}
- 改动范围: {{scope}}
- 关联 ADR: {{adr_refs}}

## 审查清单

### 正确性
- [ ] 逻辑正确，无边界情况遗漏
- [ ] 错误处理完整（数据库操作有 try-catch）
- [ ] Server Action 有权限检查
- [ ] 富文本内容入库前有 sanitize

### 架构一致性
- [ ] 符合 Architecture.md 的目录和组件规范
- [ ] 数据库操作符合 Database.md 的查询模式
- [ ] 与对应 ADR 的决策一致
- [ ] 遵循 .ecc/rules/ 中的开发规范

### 安全
- [ ] 没有在客户端暴露 service_role key
- [ ] RLS 策略未被绕过
- [ ] XSS 防护到位

### 代码质量
- [ ] TypeScript strict 模式下无类型错误
- [ ] 组件模式符合 component-patterns.md
- [ ] 提交信息符合 conventional commits
