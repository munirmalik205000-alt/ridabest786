import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { House, Receipt, Wallet, UsersThree, User } from '@phosphor-icons/react';

const tabs = [
  { path: '/dashboard', label: 'Home', icon: House, testId: 'bn-home' },
  { path: '/recharge', label: 'Recharge', icon: Receipt, testId: 'bn-recharge' },
  { path: '/wallet', label: 'Wallet', icon: Wallet, testId: 'bn-wallet' },
  { path: '/referrals', label: 'Refer', icon: UsersThree, testId: 'bn-refer' },
  { path: '/profile', label: 'Profile', icon: User, testId: 'bn-profile' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 surface-glass border-t border-border shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      data-testid="bottom-nav"
    >
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {tabs.map((t) => {
          const active = activePath.startsWith(t.path);
          const Icon = t.icon;
          return (
            <button
              key={t.path}
              onClick={() => navigate(t.path)}
              className="relative py-2 flex flex-col items-center justify-center gap-0.5 group"
              data-testid={t.testId}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-brand-gradient rounded-b-full" />
              )}
              <Icon
                size={22}
                weight={active ? 'fill' : 'duotone'}
                className={active ? 'text-primary' : 'text-muted-foreground group-active:scale-90 transition'}
              />
              <span className={`text-[10px] font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
