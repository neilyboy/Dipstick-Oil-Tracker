import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiDownload, HiCloudUpload } from 'react-icons/hi';
import { api } from '../lib/api';
import type { Settings, BackupConfig } from '../lib/types';

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  });

  const { data: backupConfigs = [] } = useQuery({
    queryKey: ['backup-configs'],
    queryFn: () => api.backups.configs(),
  });

  const [form, setForm] = useState({
    defaultIntervalMiles: '',
    defaultIntervalMonths: '',
    defaultReminderLeadMiles: '',
    defaultReminderLeadDays: '',
    notificationsEnabled: true,
    lowStockEnabled: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        defaultIntervalMiles: settings.defaultIntervalMiles?.toString() || '',
        defaultIntervalMonths: settings.defaultIntervalMonths?.toString() || '',
        defaultReminderLeadMiles: settings.defaultReminderLeadMiles?.toString() || '',
        defaultReminderLeadDays: settings.defaultReminderLeadDays?.toString() || '',
        notificationsEnabled: settings.notificationsEnabled ?? true,
        lowStockEnabled: settings.lowStockEnabled ?? true,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.settings.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      defaultIntervalMiles: form.defaultIntervalMiles ? Number(form.defaultIntervalMiles) : null,
      defaultIntervalMonths: form.defaultIntervalMonths ? Number(form.defaultIntervalMonths) : null,
      defaultReminderLeadMiles: form.defaultReminderLeadMiles ? Number(form.defaultReminderLeadMiles) : null,
      defaultReminderLeadDays: form.defaultReminderLeadDays ? Number(form.defaultReminderLeadDays) : null,
      notificationsEnabled: form.notificationsEnabled,
      lowStockEnabled: form.lowStockEnabled,
    });
  };

  const handleExport = async () => {
    try {
      const blob = await api.backups.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dipstick-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await api.backups.create();
      toast.success('Backup created');
    } catch {
      toast.error('Backup failed');
    }
  };

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Defaults */}
      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-surface-300 mb-4">Default Intervals</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Default Miles</label>
            <input
              type="number"
              value={form.defaultIntervalMiles}
              onChange={(e) => setForm((f) => ({ ...f, defaultIntervalMiles: e.target.value }))}
              placeholder="5000"
            />
          </div>
          <div className="form-group">
            <label>Default Months</label>
            <input
              type="number"
              value={form.defaultIntervalMonths}
              onChange={(e) => setForm((f) => ({ ...f, defaultIntervalMonths: e.target.value }))}
              placeholder="6"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Reminder Lead (miles)</label>
            <input
              type="number"
              value={form.defaultReminderLeadMiles}
              onChange={(e) => setForm((f) => ({ ...f, defaultReminderLeadMiles: e.target.value }))}
              placeholder="500"
            />
          </div>
          <div className="form-group">
            <label>Reminder Lead (days)</label>
            <input
              type="number"
              value={form.defaultReminderLeadDays}
              onChange={(e) => setForm((f) => ({ ...f, defaultReminderLeadDays: e.target.value }))}
              placeholder="30"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-surface-300 mb-3">Notifications</h2>
        <label className="flex items-center justify-between cursor-pointer mb-3">
          <span className="text-sm text-surface-300">Enable notifications</span>
          <input
            type="checkbox"
            checked={form.notificationsEnabled}
            onChange={(e) => setForm((f) => ({ ...f, notificationsEnabled: e.target.checked }))}
            className="w-5 h-5"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-surface-300">Low stock alerts</span>
          <input
            type="checkbox"
            checked={form.lowStockEnabled}
            onChange={(e) => setForm((f) => ({ ...f, lowStockEnabled: e.target.checked }))}
            className="w-5 h-5"
          />
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="btn-primary w-full mb-6"
      >
        {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Backup & Export */}
      <h2 className="section-title">Backup & Export</h2>

      <div className="space-y-3 mb-4">
        <button onClick={handleExport} className="card-interactive p-4 flex items-center gap-3 w-full text-left">
          <HiDownload className="w-6 h-6 text-oil-400 flex-shrink-0" />
          <div>
            <div className="font-medium text-white text-sm">Export All Data</div>
            <div className="text-xs text-surface-400">Download a complete JSON backup of all vehicles, services, and inventory</div>
          </div>
        </button>

        <button onClick={handleCreateBackup} className="card-interactive p-4 flex items-center gap-3 w-full text-left">
          <HiCloudUpload className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <div className="font-medium text-white text-sm">Create Server Backup</div>
            <div className="text-xs text-surface-400">Create a backup on the server</div>
          </div>
        </button>
      </div>

      {/* Cloud backup configs */}
      {backupConfigs.length > 0 && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-3">Cloud Backup Configs</h3>
          {backupConfigs.map((config: BackupConfig) => (
            <div key={config.id} className="flex items-center justify-between py-2 border-b border-surface-700 last:border-0">
              <div>
                <p className="text-sm text-white">{config.name}</p>
                <p className="text-xs text-surface-500">
                  {config.type.toUpperCase()} {config.bucket && `| ${config.bucket}`}
                  {config.enabled ? ' (enabled)' : ' (disabled)'}
                </p>
              </div>
              {config.lastBackupAt && (
                <span className="text-xs text-surface-500">
                  Last: {new Date(config.lastBackupAt).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* App info */}
      <div className="text-center text-xs text-surface-600 mt-8 pb-4">
        <p>Dipstick Oil Tracker v1.0.0</p>
        <p className="mt-1">Self-hosted vehicle maintenance tracking</p>
      </div>
    </div>
  );
}
