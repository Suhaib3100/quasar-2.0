'use client'
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid,
  Shield,
  Users,
  Award,
  MessageSquare,
  Settings,
  LogOut
} from "lucide-react";

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive?: boolean;
}

const SidebarItem = ({ href, icon, label, isActive }: SidebarItemProps) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ease-in-out hover:scale-[1.02]",
      isActive
        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md dark:from-blue-500 dark:to-blue-600"
        : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/90 dark:hover:text-gray-100"
    )}
  >
    <div className={cn(
      "rounded-lg p-1",
      isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
    )}>
      {icon}
    </div>
    <span className="font-medium">{label}</span>
  </Link>
);

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    {
      href: "/dashboard",
      icon: <LayoutGrid className="h-5 w-5" />,
      label: "Overview"
    },
    {
      href: "/dashboard/moderation",
      icon: <Shield className="h-5 w-5" />,
      label: "Moderation"
    },
    {
      href: "/dashboard/members",
      icon: <Users className="h-5 w-5" />,
      label: "Members"
    },
    {
      href: "/dashboard/leveling",
      icon: <Award className="h-5 w-5" />,
      label: "Leveling"
    },
    {
      href: "/dashboard/welcome",
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Welcome"
    },
    {
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Settings"
    }
  ];

  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="flex w-72 flex-col border-r border-gray-200 bg-white/80 px-6 py-8 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="flex items-center gap-4 px-2">
          <div className="relative overflow-hidden rounded-full ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-blue-400 dark:ring-offset-gray-900">
            <img
              src={session.user?.image || "/default-avatar.png"}
              alt="User avatar"
              className="h-12 w-12 rounded-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {session.user?.name}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Admin
            </span>
          </div>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {navigation.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign out</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}