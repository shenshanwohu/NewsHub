# 安全规范

## XSS 防护

- 所有富文本 HTML 内容**入库前**必须在 Server Action 中执行 `DOMPurify.sanitize()`
- 所有富文本 HTML 内容**展示前**必须在客户端再次执行 `DOMPurify.sanitize()`
- 文章内容中的图片仅允许来自 Supabase Storage 的 URL 和白名单域名
- 禁止在 HTML 内容中保留 `<script>`, `<iframe>`, `<object>`, `<embed>` 标签
- CSP Header 在生产环境必须启用
- 富文本编辑器输出的 HTML 需经过白名单标签过滤

## 认证

- 所有管理后台路由通过 `middleware.ts` 保护（检查 Supabase Auth session）
- Server Actions 中必须校验用户登录态：`const { data: { user } } = await supabase.auth.getUser()`
- 登录页面 `/admin/login` 仅在未登录时可访问
- Session 刷新由 `lib/supabase/middleware.ts` 自动处理

## 授权

- 数据库层面：RLS 策略——第一道防线
- 应用层面：Server Action 中的角色检查——第二道防线
- 双重保障原则：永不信任客户端传递的角色信息
- 角色检查函数统一使用 `requireRole('publisher')` 模式：

```typescript
async function requireRole(...roles: AdminRole[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthorizationError('未登录');

  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (!admin || !roles.includes(admin.role as AdminRole)) {
    throw new AuthorizationError('权限不足');
  }
  return admin;
}
```

## 数据安全

- 不在客户端暴露 Supabase service_role key（仅用 anon key）
- 所有敏感操作（删除新闻、管理管理员）必须有二次确认对话框
- 图片上传校验：服务端验证 MIME 类型 + 文件尺寸 + 图片实际尺寸
- `view_count` 计数 API 做好频率限制（单 IP 每分钟最多 60 次）
- 数据库密码、API keys 不硬编码在代码中

## 环境变量

必须保留在 `.env.local` 中的变量（已从 git 排除）：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端超级密钥（仅限 Server Actions） |

## 错误处理安全

- Server Action 错误信息不向客户端泄露数据库细节
- 生产环境隐藏堆栈跟踪
- 使用统一的 `ActionResponse` 错误返回结构

## 审计日志（第一版）

- 新闻创建/更新时间记录在 `news.created_at` / `news.updated_at`
- 新闻发布记录在 `news.published_at`
- 后续版本引入正式 audit_log 表
