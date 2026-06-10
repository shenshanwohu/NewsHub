# 组件模式规范

## 组件分类

| 分类 | 目录 | 特点 |
|------|------|------|
| 访客端组件 | `src/components/public/` | 侧重静态渲染，多服务端组件 |
| 管理端组件 | `src/components/admin/` | 侧重交互，多客户端组件 |
| 通用 UI 组件 | `src/components/ui/` | 纯展示，不包含业务逻辑 |

## 服务端组件 vs 客户端组件

### 服务端组件（默认）

- 数据获取在组件内直接执行（Server Action / RSC）
- 逻辑写在 async 函数中
- 状态管理仅通过 URL params / searchParams
- 适用于：List、Detail、Layout、Static Pages

```typescript
// ✅ 服务端组件模式
export default async function NewsList({ categoryId }: { categoryId?: string }) {
  const news = await getNews({ categoryId, status: 'published' });
  return <div>{news.map(n => <NewsCard key={n.id} item={n} />)}</div>;
}
```

### 客户端组件（'use client'）

- 需要交互状态（useState / useReducer）
- 需要副作用（useEffect）
- 需要浏览器 API
- 需要事件处理（onClick / onChange）
- 适用于：Form、Editor、Toggle、Picker、SearchBar

```typescript
// ✅ 客户端组件模式
'use client';
export default function CategoryMultiSelect({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  // ...
}
```

### 混合策略

将客户端组件包裹在服务端组件中，数据逻辑在服务端处理，交互逻辑下沉到客户端组件：

```typescript
// server component
export default async function NewsFormPage() {
  const categories = await getAllCategories();
  const news = await getNewsById(params.id); // if editing
  return <NewsFormClient categories={categories} initialData={news} />;
}
```

## 状态管理

- 使用 React Context + useState 管理 Auth 状态
- 表单状态使用受控组件（useState 或 react-hook-form）
- 不引入 Redux / Zustand 等外部状态管理库（第一版不需要）

## 加载状态

所有列表和详情组件必须处理以下三种状态：

| 状态 | 展示 |
|------|------|
| Loading | Skeleton 占位图（组件内联样式，无额外请求） |
| Empty | EmptyState 组件 + 引导文字 |
| Error | error.tsx 全局错误边界 |

## 表单组件模式

```typescript
// Server Action + Client Form 协作模式
'use client';
export default function NewsForm({ categories, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createNews({ title, /* ... */ });
    if (result.success) router.push('/admin/news');
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 通用 UI 组件接口约定

| 组件 | Props | 说明 |
|------|-------|------|
| `Button` | `variant: 'primary' \| 'secondary' \| 'danger' \| 'ghost'`, `size: 'sm' \| 'md' \| 'lg'`, `loading?: boolean` | 统一按钮 |
| `Input` | `label?: string`, `error?: string`, 扩展自原生 input props | 带 label 和错误提示 |
| `Modal` | `open: boolean`, `onClose: () => void`, `title: string` | 通用模态框 |
| `Badge` | `variant: 'default' \| 'success' \| 'warning' \| 'error'` | 状态标签 |
| `Skeleton` | `width?: string`, `height?: string`, `rounded?: boolean` | 加载占位 |
| `EmptyState` | `icon?: ReactNode`, `title: string`, `description?: string`, `action?: { label: string; onClick: () => void }` | 空状态 |
| `Card` | `children`, `className?: string` | 卡片容器 |
