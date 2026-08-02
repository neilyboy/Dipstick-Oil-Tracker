import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiCheck, HiX, HiBell, HiRefresh } from 'react-icons/hi';
import { api } from '../lib/api';
import type { Reminder } from '../lib/types';

const typeIcons: Record<string, string> = {
  oil_change_due: '⚠️',
  oil_change_overdue: '🚨',
  low_stock: '📦',
  custom: '📋',
};

const typeColors: Record<string, string> = {
  oil_change_due: 'border-yellow-500/20 bg-yellow-500/5',
  oil_change_overdue: 'border-red-500/20 bg-red-500/5',
  low_stock: 'border-blue-500/20 bg-blue-500/5',
  custom: 'border-surface-600 bg-surface-800/50',
};

export function RemindersPage() {
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.reminders.list({ unreadOnly: 'false' }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.reminders.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.reminders.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('All marked as read');
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => api.reminders.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Dismissed');
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => api.reminders.generate(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success(`Generated ${data.generated} reminders`);
    },
  });

  const unreadCount = reminders.filter((r: Reminder) => !r.isRead && !r.isDismissed).length;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-surface-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={() => markAllReadMutation.mutate()} className="btn-ghost btn-sm">
              <HiCheck className="w-4 h-4" />
              Read All
            </button>
          )}
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn-secondary btn-sm"
          >
            <HiRefresh className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 h-16 bg-surface-800 animate-pulse" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <HiBell className="w-12 h-12 mb-3 opacity-30" />
          <h3 className="text-lg font-medium text-surface-300 mb-1">No alerts</h3>
          <p className="text-sm text-surface-500">Everything is up to date</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder: Reminder) => (
            <div
              key={reminder.id}
              className={`card p-4 border ${typeColors[reminder.type] || typeColors.custom} ${
                !reminder.isRead ? 'ring-1 ring-oil-500/20' : 'opacity-70'
              } ${reminder.isDismissed ? 'opacity-40' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{typeIcons[reminder.type] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-white">{reminder.title}</h3>
                    {!reminder.isRead && (
                      <span className="w-2 h-2 rounded-full bg-oil-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">{reminder.message}</p>
                  <p className="text-[10px] text-surface-600 mt-1">
                    {new Date(reminder.createdAt).toLocaleDateString()} {new Date(reminder.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {reminder.vehicleId && (
                    <Link
                      to={`/vehicles/${reminder.vehicleId}`}
                      className="btn-ghost btn-sm text-xs"
                    >
                      View
                    </Link>
                  )}
                  {!reminder.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate(reminder.id)}
                      className="btn-ghost btn-sm text-oil-400"
                    >
                      <HiCheck className="w-4 h-4" />
                    </button>
                  )}
                  {!reminder.isDismissed && (
                    <button
                      onClick={() => dismissMutation.mutate(reminder.id)}
                      className="btn-ghost btn-sm text-surface-500"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
