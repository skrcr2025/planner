"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart2,
  Wallet,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart2 },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="px-5 py-6 flex items-center gap-2 border-b border-slate-700">
        <Wallet className="w-7 h-7 text-indigo-400" />
        <span className="text-xl font-bold tracking-tight">Planner</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-700 text-xs text-slate-500">
        Personal Finance Tracker
      </div>
    </aside>
  );
}
