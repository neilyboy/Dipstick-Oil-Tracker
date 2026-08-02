import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineHome, HiOutlineCube, HiOutlineCog, HiOutlineBell } from 'react-icons/hi';
import { api } from '../lib/api';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Garage' },
  { to: '/inventory', icon: HiOutlineCube, label: 'Inventory' },
  { to: '/reminders', icon: HiOutlineBell, label: 'Alerts' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    api.reminders.count().then((r) => setReminderCount(r.count)).catch(() => {});
    const interval = setInterval(() => {
      api.reminders.count().then((r) => setReminderCount(r.count)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>

      <nav className="bottom-nav safe-area-inset-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center py-2 px-3 min-w-[64px] transition-colors ${
                  isActive ? 'text-oil-400' : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {item.to === '/reminders' && reminderCount > 0 && (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 text-white text-[10px] 
                                   rounded-full flex items-center justify-center font-bold">
                    {reminderCount > 9 ? '9+' : reminderCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
