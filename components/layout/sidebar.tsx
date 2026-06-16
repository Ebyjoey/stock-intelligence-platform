'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  Star, 
  BarChart4, 
  Bell, 
  LogOut, 
  User as UserIcon,
  TrendingUp
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { name: 'Terminal', href: '/', icon: LayoutDashboard },
    { name: 'Chat Intel', href: '/chat', icon: MessageSquareCode },
    { name: 'Watchlists', href: '/watchlists', icon: Star },
    { name: 'Power BI Reports', href: '/powerbi', icon: BarChart4 },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-2 font-mono">
        <TrendingUp className="w-6 h-6 text-primary" />
        <span className="text-sm font-bold tracking-wider text-foreground">
          STOCK_INTEL //
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5'
                  : 'text-neutral hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile Segment */}
      <div className="p-4 border-t border-border bg-background/50">
        {session ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase font-mono">
                {session.user?.name?.slice(0, 2) || 'TR'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold truncate max-w-[120px]">
                  {session.user?.name || 'Trader'}
                </span>
                <span className="text-[10px] text-neutral truncate max-w-[120px]">
                  {session.user?.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-1.5 rounded hover:bg-accent text-neutral hover:text-loser transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="w-full flex items-center justify-center gap-2 py-2 border border-border rounded text-xs hover:bg-accent transition"
          >
            <UserIcon className="w-4 h-4" />
            <span>Connect Terminal Account</span>
          </button>
        )}
      </div>
    </aside>
  );
}
