import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HiPlus, HiSearch, HiFilter, HiChevronRight } from 'react-icons/hi';
import { api } from '../lib/api';
import type { Vehicle } from '../lib/types';

const statusColors: Record<string, string> = {
  up_to_date: 'badge-green',
  due_soon: 'badge-yellow',
  overdue: 'badge-red',
  unknown: 'badge-gray',
};

export function Dashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', search, statusFilter, sort],
    queryFn: () => api.vehicles.list({ search, status: statusFilter, sort }),
  });

  const stats = {
    total: vehicles.length,
    overdue: vehicles.filter((v: Vehicle) => v.dueStatus?.status === 'overdue').length,
    dueSoon: vehicles.filter((v: Vehicle) => v.dueStatus?.status === 'due_soon').length,
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 h-32 bg-surface-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dipstick</h1>
          <p className="text-surface-400 text-sm mt-0.5">Oil Change Tracker</p>
        </div>
        <Link to="/vehicles/new" className="btn-primary btn-sm">
          <HiPlus className="w-4 h-4" />
          Add Vehicle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-surface-400">Vehicles</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.dueSoon}</div>
          <div className="text-xs text-surface-400">Due Soon</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
          <div className="text-xs text-surface-400">Overdue</div>
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto"
        >
          <option value="all">All Status</option>
          <option value="up_to_date">Up to Date</option>
          <option value="due_soon">Due Soon</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-auto"
        >
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="mileage">Mileage</option>
        </select>
      </div>

      {/* Vehicle list */}
      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="text-5xl mb-4 opacity-30">🚗</div>
          <h3 className="text-lg font-medium text-surface-300 mb-1">No vehicles yet</h3>
          <p className="text-sm text-surface-500 mb-4">Add your first vehicle to start tracking oil changes</p>
          <Link to="/vehicles/new" className="btn-primary">
            <HiPlus className="w-4 h-4" />
            Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle: Vehicle) => (
            <Link
              key={vehicle.id}
              to={`/vehicles/${vehicle.id}`}
              className="card-interactive p-4 flex items-center gap-4"
            >
              {/* Vehicle photo */}
              <div className="w-16 h-16 rounded-lg bg-surface-700 overflow-hidden flex-shrink-0">
                {vehicle.photos?.[0] ? (
                  <img
                    src={`/uploads/${vehicle.photos[0].filename}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-500 text-2xl">
                    🚗
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-white truncate">{vehicle.displayName}</h3>
                  <span className={statusColors[vehicle.dueStatus?.status] || 'badge-gray'}>
                    {vehicle.dueStatus?.statusLabel || 'Unknown'}
                  </span>
                </div>
                <p className="text-sm text-surface-400 truncate">
                  {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'No details'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-500">
                  {vehicle.currentMileage && (
                    <span>{vehicle.currentMileage.toLocaleString()} mi</span>
                  )}
                  {vehicle.dueStatus?.nextDueMileage && (
                    <span>Next: {vehicle.dueStatus.nextDueMileage.toLocaleString()} mi</span>
                  )}
                  <span>{vehicle.serviceCount} services</span>
                </div>
              </div>

              <HiChevronRight className="w-5 h-5 text-surface-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
