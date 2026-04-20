import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, CheckCircle } from '@phosphor-icons/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationBell = () => {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/notifications`, { withCredentials: true });
      setItems(data.notifications);
      setUnread(data.unread);
    } catch (e) {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const markAll = async () => {
    try {
      await axios.post(`${API_URL}/api/notifications/read-all`, {}, { withCredentials: true });
      load();
    } catch (e) {}
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative text-white hover:bg-white/15 rounded-full w-10 h-10 p-0"
          data-testid="notification-bell"
        >
          <Bell size={22} weight="duotone" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-white border border-slate-200 shadow-xl rounded-2xl" data-testid="notifications-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Notifications</div>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1" data-testid="mark-all-read">
              <CheckCircle size={14} weight="fill" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {items.length === 0 && <div className="p-6 text-center text-slate-500 text-sm">You're all caught up</div>}
          {items.map((n) => (
            <div key={n._id} className={`px-4 py-3 ${!n.read ? 'bg-emerald-50/50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${!n.read ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">{n.title}</div>
                  <div className="text-slate-600 text-xs mt-0.5">{n.message}</div>
                  <div className="text-slate-400 text-[10px] mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
