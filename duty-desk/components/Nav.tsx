"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "看板", icon: "◫" },
  { href: "/pomodoro", label: "番茄", icon: "◷" },
  { href: "/notes", label: "记录", icon: "▤" },
  { href: "/fitness", label: "健身", icon: "✓" },
  { href: "/stats", label: "统计", icon: "▥" },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <>
      {/* 桌面端：顶部导航（md+） */}
      <header
        className="fixed inset-x-0 top-0 z-50 hidden border-b md:block"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-6 py-2">
          <span className="mr-3 text-sm font-extrabold tracking-wide">◷ 考研工作台</span>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
              style={
                isActive(it.href)
                  ? { color: "var(--accent)", background: "var(--accent-soft)" }
                  : { color: "var(--muted)" }
              }
            >
              {it.icon} {it.label}
            </Link>
          ))}
          <span className="flex-1" />
          <Link href="/chat" className="btn btn-sm btn-ghost">AI助手</Link>
          <Link href="/settings" className="btn btn-sm btn-ghost">设置</Link>
        </div>
      </header>

      {/* 移动端：底部导航（<md） */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t md:hidden"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div
          className="mx-auto grid w-full max-w-xl grid-cols-5"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-col items-center gap-0.5 py-2.5 text-[0.68rem] font-semibold"
              style={isActive(it.href) ? { color: "var(--accent)" } : { color: "var(--muted)" }}
            >
              <span className="text-lg leading-none">{it.icon}</span>
              {it.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
