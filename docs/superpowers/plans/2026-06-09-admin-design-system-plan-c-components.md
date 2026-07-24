# Admin Design System — Plan C: Component Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A small, reusable admin component library — flash Toaster, semantic Badge variants, PageHeader, EmptyState, FormLayout/FormField, ConfirmDialog, SearchInput, RowActionMenu — used to standardize the module pages in Plan D.

**Architecture:** Pure frontend components in `resources/js/components/`, built on the existing shadcn primitives. Flash uses `sonner` (the shadcn-standard toast) wired to the Inertia `flash` shared prop (added in Plan A). These are verified by `npm run build` + `npx eslint`; there is no Pest impact.

**Tech Stack:** React 19 + TS, Tailwind v4, shadcn/ui, Inertia, sonner.

---

## Task 1: Flash toasts (sonner) + `useFlash` + wire into the layout

**Files:** `package.json` (sonner); Create `resources/js/components/toaster.tsx`, `resources/js/hooks/use-flash.ts`; Modify `resources/js/layouts/app-layout.tsx`

- [ ] **Step 1: Install sonner**

```bash
npm install sonner
```

- [ ] **Step 2: Create the Toaster wrapper**

Create `resources/js/components/toaster.tsx`:

```tsx
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
    const { appearance } = useAppearance();
    return <Sonner theme={appearance} position="top-right" richColors closeButton />;
}
```

> `useAppearance()` returns `{ appearance: 'light' | 'dark' | 'system' }` — sonner's `theme` accepts the same union.

- [ ] **Step 3: Create the useFlash hook**

Create `resources/js/hooks/use-flash.ts`:

```typescript
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useFlash() {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash.success, flash.error]);
}
```

- [ ] **Step 4: Wire into the app layout**

Read `resources/js/layouts/app-layout.tsx`. It wraps pages (likely delegates to `app/app-sidebar-layout.tsx`). In `app-layout.tsx`, call `useFlash()` and render `<Toaster />` once. Concretely, convert it to call the hook and render the toaster alongside `children`:

```tsx
import { Toaster } from '@/components/toaster';
import { useFlash } from '@/hooks/use-flash';
// ...inside the component body, before returning:
useFlash();
// ...and render <Toaster /> next to the existing layout output, e.g.:
return (
    <>
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
        <Toaster />
    </>
);
```
Adapt to the file's actual structure (it currently returns `<AppLayoutTemplate …>{children}</AppLayoutTemplate>`). Keep the existing props/imports; only add the hook call + `<Toaster />` + the fragment wrapper.

- [ ] **Step 5: Lint, format, build, commit**

```bash
npx prettier --write resources/js/components/toaster.tsx resources/js/hooks/use-flash.ts resources/js/layouts/app-layout.tsx
npx eslint resources/js/components/toaster.tsx resources/js/hooks/use-flash.ts resources/js/layouts/app-layout.tsx
npm run build
git add package.json package-lock.json resources/js/components/toaster.tsx resources/js/hooks/use-flash.ts resources/js/layouts/app-layout.tsx
git commit -m "feat(ui): add flash toasts (sonner) wired to Inertia flash"
```

---

## Task 2: Semantic Badge variants

**Files:** Modify `resources/js/components/ui/badge.tsx`

- [ ] **Step 1: Add success/warning/info variants**

Read `resources/js/components/ui/badge.tsx`. In the `cva(..., { variants: { variant: { … } } })` block, add three semantic variants alongside the existing ones (keep the existing default/secondary/destructive/outline):

```tsx
                success: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
                warning: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                info: 'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
```

- [ ] **Step 2: Lint, build, commit**

```bash
npx prettier --write resources/js/components/ui/badge.tsx
npx eslint resources/js/components/ui/badge.tsx
npm run build
git add resources/js/components/ui/badge.tsx
git commit -m "feat(ui): add semantic badge variants (success/warning/info)"
```

---

## Task 3: PageHeader + EmptyState

**Files:** Create `resources/js/components/page-header.tsx`, `resources/js/components/empty-state.tsx`

- [ ] **Step 1: PageHeader**

Create `resources/js/components/page-header.tsx`:

```tsx
import { type ReactNode } from 'react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-semibold">{title}</h1>
                {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
```

- [ ] **Step 2: EmptyState**

Create `resources/js/components/empty-state.tsx`:

```tsx
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

export function EmptyState({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-10 text-center">
            {Icon && <Icon className="text-muted-foreground size-8" />}
            <h3 className="font-medium">{title}</h3>
            {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
```

- [ ] **Step 3: Lint, build, commit**

```bash
npx prettier --write resources/js/components/page-header.tsx resources/js/components/empty-state.tsx
npx eslint resources/js/components/page-header.tsx resources/js/components/empty-state.tsx
npm run build
git add resources/js/components/page-header.tsx resources/js/components/empty-state.tsx
git commit -m "feat(ui): add PageHeader and EmptyState components"
```

---

## Task 4: FormLayout + FormField

**Files:** Create `resources/js/components/form/form-layout.tsx`, `resources/js/components/form/form-field.tsx`

- [ ] **Step 1: FormField**

First confirm `resources/js/components/input-error.tsx` is a default export taking a `message?: string` prop (it is in the starter kit). Create `resources/js/components/form/form-field.tsx`:

```tsx
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { type ReactNode } from 'react';

export function FormField({ label, htmlFor, error, hint, children }: { label: string; htmlFor?: string; error?: string; hint?: string; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}
```

- [ ] **Step 2: FormLayout**

Create `resources/js/components/form/form-layout.tsx`:

```tsx
import { type FormEvent, type ReactNode } from 'react';

export function FormLayout({ onSubmit, footer, children }: { onSubmit: (e: FormEvent) => void; footer?: ReactNode; children: ReactNode }) {
    return (
        <form onSubmit={onSubmit} className="max-w-xl space-y-5">
            {children}
            {footer && <div className="flex items-center gap-2 pt-2">{footer}</div>}
        </form>
    );
}
```

- [ ] **Step 3: Lint, build, commit**

```bash
npx prettier --write resources/js/components/form
npx eslint resources/js/components/form/form-layout.tsx resources/js/components/form/form-field.tsx
npm run build
git add resources/js/components/form
git commit -m "feat(ui): add FormLayout and FormField components"
```

---

## Task 5: ConfirmDialog

**Files:** Create `resources/js/components/confirm-dialog.tsx`

- [ ] **Step 1: Create the component**

First confirm `resources/js/components/ui/dialog.tsx` exports `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter` (shadcn standard — it does). Create `resources/js/components/confirm-dialog.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    destructive?: boolean;
}

export function ConfirmDialog({ open, onOpenChange, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Confirm', destructive = true }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant={destructive ? 'destructive' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Lint, build, commit**

```bash
npx prettier --write resources/js/components/confirm-dialog.tsx
npx eslint resources/js/components/confirm-dialog.tsx
npm run build
git add resources/js/components/confirm-dialog.tsx
git commit -m "feat(ui): add ConfirmDialog component"
```

---

## Task 6: SearchInput + RowActionMenu

**Files:** Create `resources/js/components/search-input.tsx`, `resources/js/components/row-action-menu.tsx`

- [ ] **Step 1: SearchInput**

Create `resources/js/components/search-input.tsx`:

```tsx
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRef } from 'react';

export function SearchInput({ defaultValue = '', onSearch, placeholder = 'Search…' }: { defaultValue?: string; onSearch: (value: string) => void; placeholder?: string }) {
    const timer = useRef<number | undefined>(undefined);

    return (
        <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="h-9 pl-8"
                onChange={(e) => {
                    const value = e.target.value;
                    window.clearTimeout(timer.current);
                    timer.current = window.setTimeout(() => onSearch(value), 300);
                }}
            />
        </div>
    );
}
```

- [ ] **Step 2: RowActionMenu**

First confirm `resources/js/components/ui/dropdown-menu.tsx` exports `DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem` (shadcn standard — it does). Create `resources/js/components/row-action-menu.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';

export interface RowAction {
    label: string;
    href?: string;
    onClick?: () => void;
    destructive?: boolean;
}

export function RowActionMenu({ actions }: { actions: RowAction[] }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {actions.map((action) => (
                    <DropdownMenuItem
                        key={action.label}
                        asChild={Boolean(action.href)}
                        onClick={action.onClick}
                        className={action.destructive ? 'text-destructive' : ''}
                    >
                        {action.href ? <Link href={action.href}>{action.label}</Link> : <span>{action.label}</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```

- [ ] **Step 3: Lint, build, commit**

```bash
npx prettier --write resources/js/components/search-input.tsx resources/js/components/row-action-menu.tsx
npx eslint resources/js/components/search-input.tsx resources/js/components/row-action-menu.tsx
npm run build
git add resources/js/components/search-input.tsx resources/js/components/row-action-menu.tsx
git commit -m "feat(ui): add SearchInput and RowActionMenu components"
```

---

## Task 7: Final verification

- [ ] **Step 1: Build + lint the whole new library**

Run:
```bash
npx eslint resources/js/components/toaster.tsx resources/js/components/page-header.tsx resources/js/components/empty-state.tsx resources/js/components/confirm-dialog.tsx resources/js/components/search-input.tsx resources/js/components/row-action-menu.tsx resources/js/components/form resources/js/hooks/use-flash.ts
npm run build
```
Expected: no eslint errors; build succeeds.

- [ ] **Step 2: PHP gate unaffected**

Run: `composer check`
Expected: green (no PHP changed).

- [ ] **Step 3: Confirm sonner is bundled (Toaster wired)**

Run: `grep -r "sonner" resources/js/components/toaster.tsx && grep -rl "Toaster" resources/js/layouts/`
Expected: toaster imports sonner; a layout references `Toaster` (wired in Task 1).

---

## Self-Review

**Spec coverage (Plan C):**
- Flash Toaster + useFlash (wired) → Task 1 ✅
- Semantic Badge variants → Task 2 ✅
- PageHeader, EmptyState → Task 3 ✅
- FormLayout, FormField → Task 4 ✅
- ConfirmDialog → Task 5 ✅
- SearchInput, RowActionMenu → Task 6 ✅

**Placeholder scan:** complete component code in every step. The two "confirm exports exist" checks (dialog, dropdown-menu, input-error) are verification, not placeholders — the components are standard shadcn and present.

**Type consistency:** each component's props are self-contained; `RowAction`/`Column` interfaces are exported where reused. `useFlash` reads `SharedData.flash` (defined in Plan A). `Toaster` uses `useAppearance().appearance` (`'light'|'dark'|'system'`).

**Usage note:** these components are exported for Plan D to consume (which wires Users/Rbac/Audit onto them). They are verified here by build + eslint; their real integration + any Pest prop-shape changes happen in Plan D.
