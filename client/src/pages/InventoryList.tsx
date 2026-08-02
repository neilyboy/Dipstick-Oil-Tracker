import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HiPlus, HiSearch, HiCube } from 'react-icons/hi';
import { api } from '../lib/api';
import type { InventoryItem } from '../lib/types';

const categoryLabels: Record<string, string> = {
  oil: 'Oil',
  filter: 'Filters',
  washer: 'Washers',
  gasket: 'Gaskets',
  tool: 'Tools',
  supply: 'Supplies',
  other: 'Other',
};

const categoryIcons: Record<string, string> = {
  oil: '🛢️',
  filter: '🔧',
  washer: '⚙️',
  gasket: '🔩',
  tool: '🔨',
  supply: '🧤',
  other: '📦',
};

export function InventoryList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', search, category, showLowStock],
    queryFn: () => api.inventory.list({
      search,
      category,
      lowStock: showLowStock ? 'true' : 'false',
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => api.inventory.stats(),
  });

  const categories = ['all', 'oil', 'filter', 'washer', 'gasket', 'tool', 'supply', 'other'];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-surface-400 text-sm mt-0.5">Parts & Supplies</p>
        </div>
        <Link to="/inventory/new" className="btn-primary btn-sm">
          <HiPlus className="w-4 h-4" />
          Add Item
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-surface-400">Total Items</div>
          </div>
          <div className={`card p-3 text-center ${stats.lowStockCount > 0 ? 'border-yellow-500/30' : ''}`}>
            <div className={`text-xl font-bold ${stats.lowStockCount > 0 ? 'text-yellow-400' : 'text-white'}`}>
              {stats.lowStockCount}
            </div>
            <div className="text-xs text-surface-400">Low Stock</div>
          </div>
        </div>
      )}

      {/* Search & filters */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`btn btn-sm ${showLowStock ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'btn-secondary'}`}
        >
          Low Stock
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === cat
                ? 'bg-oil-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:text-surface-200'
            }`}
          >
            {cat === 'all' ? 'All' : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 h-16 bg-surface-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <HiCube className="w-12 h-12 mb-3 opacity-30" />
          <h3 className="text-lg font-medium text-surface-300 mb-1">No items found</h3>
          <p className="text-sm text-surface-500 mb-4">
            {search || category !== 'all' ? 'Try adjusting your filters' : 'Add your first inventory item'}
          </p>
          {!search && category === 'all' && (
            <Link to="/inventory/new" className="btn-primary">
              <HiPlus className="w-4 h-4" />
              Add Item
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: InventoryItem) => {
            const isLowStock = item.lowStockThreshold !== null && Number(item.quantity) <= Number(item.lowStockThreshold);
            return (
              <Link
                key={item.id}
                to={`/inventory/${item.id}`}
                className="card-interactive p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center text-lg flex-shrink-0">
                  {item.photoFilename ? (
                    <img
                      src={`/uploads/${item.photoFilename}`}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    categoryIcons[item.category] || '📦'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white truncate">{item.name}</span>
                    {isLowStock && <span className="badge-red text-[10px]">Low</span>}
                  </div>
                  <p className="text-xs text-surface-400 truncate">
                    {[item.brand, item.partNumber].filter(Boolean).join(' · ') || categoryLabels[item.category] || 'Other'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-semibold ${isLowStock ? 'text-yellow-400' : 'text-white'}`}>
                    {Number(item.quantity)} {item.unitType}
                  </div>
                  {item.storageLocation && (
                    <div className="text-[10px] text-surface-500">{item.storageLocation}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
