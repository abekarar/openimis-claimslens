"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, FileText, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/documents", label: "Documents", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <LayoutDashboard className="h-6 w-6 text-blue-600" />
        <span className="text-lg font-semibold text-gray-900">ClaimLens</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
