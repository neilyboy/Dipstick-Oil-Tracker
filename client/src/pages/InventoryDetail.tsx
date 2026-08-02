import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiPencil, HiTrash, HiPlus, HiMinus, HiCamera } from 'react-icons/hi';
import { api } from '../lib/api';
import type { InventoryItem } from '../lib/types';
import { Modal } from '../components/Modal';
import { PhotoUpload } from '../components/PhotoUpload';

export function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAdjust, setShowAdjust] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [adjType, setAdjType] = useState<'add' | 'remove'>('add');
  const [adjQty, setAdjQty] = useState('1');
  const [adjNotes, setAdjNotes] = useState('');

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => api.inventory.get(id!),
    enabled: !!id,
  });

  const adjustMutation = useMutation({
    mutationFn: (data: { quantity: number; type: string; notes?: string }) =>
      api.inventory.adjust(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-item', id] });
      toast.success('Quantity adjusted');
      setShowAdjust(false);
      setAdjQty('1');
      setAdjNotes('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.inventory.delete(id!),
    onSuccess: () => {
      toast.success('Item archived');
      navigate('/inventory');
    },
  });

  const handlePhotoUpload = async (file: File) => {
    await api.inventory.uploadPhoto(id!, file);
    queryClient.invalidateQueries({ queryKey: ['inventory-item', id] });
    toast.success('Photo uploaded');
  };

  if (isLoading) {
    return <div className="page-container"><div className="animate-pulse h-32 bg-surface-800 rounded" /></div>;
  }

  if (!item) {
    return <div className="page-container empty-state"><p>Item not found</p></div>;
  }

  const i = item as InventoryItem;
  const isLowStock = i.lowStockThreshold !== null && Number(i.quantity) <= Number(i.lowStockThreshold);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/inventory')} className="btn-icon text-surface-400 hover:text-white">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{i.name}</h1>
        </div>
        <button onClick={() => handlePhotoUpload} className="btn-icon text-surface-400 hover:text-white">
          <HiCamera className="w-5 h-5" />
        </button>
        <Link to={`/inventory/${id}/edit`} className="btn-icon text-surface-400 hover:text-white">
          <HiPencil className="w-5 h-5" />
        </Link>
      </div>

      {/* Photo */}
      {i.photoFilename && (
        <div className="mb-4">
          <img src={`/uploads/${i.photoFilename}`} alt="" className="w-full h-48 object-cover rounded-xl" />
        </div>
      )}

      {/* Quantity */}
      <div className={`card p-4 mb-4 ${isLowStock ? 'border-yellow-500/30' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-3xl font-bold ${isLowStock ? 'text-yellow-400' : 'text-white'}`}>
              {Number(i.quantity)} <span className="text-lg text-surface-400">{i.unitType}</span>
            </div>
            {isLowStock && <p className="text-xs text-yellow-400 mt-1">Low stock (threshold: {i.lowStockThreshold})</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setAdjType('remove'); setShowAdjust(true); }} className="btn-icon bg-red-500/10 text-red-400 hover:bg-red-500/20">
              <HiMinus className="w-5 h-5" />
            </button>
            <button onClick={() => { setAdjType('add'); setShowAdjust(true); }} className="btn-icon bg-oil-500/10 text-oil-400 hover:bg-oil-500/20">
              <HiPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-surface-300 mb-3">Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-surface-500">Category:</span> <span className="text-white capitalize">{i.category}</span></div>
          {i.brand && <div><span className="text-surface-500">Brand:</span> <span className="text-white">{i.brand}</span></div>}
          {i.partNumber && <div><span className="text-surface-500">Part #:</span> <span className="text-white font-mono">{i.partNumber}</span></div>}
          {i.sku && <div><span className="text-surface-500">SKU:</span> <span className="text-white font-mono">{i.sku}</span></div>}
          {i.barcode && <div><span className="text-surface-500">Barcode:</span> <span className="text-white font-mono">{i.barcode}</span></div>}
          {i.packageSize && <div><span className="text-surface-500">Package:</span> <span className="text-white">{i.packageSize}</span></div>}
          {i.storageLocation && <div><span className="text-surface-500">Location:</span> <span className="text-white">{i.storageLocation}</span></div>}
          {i.preferredVendor && <div><span className="text-surface-500">Vendor:</span> <span className="text-white">{i.preferredVendor}</span></div>}
          {i.costPerUnit && <div><span className="text-surface-500">Cost/Unit:</span> <span className="text-white">${Number(i.costPerUnit).toFixed(2)}</span></div>}
        </div>
      </div>

      {/* Notes */}
      {i.notes && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-2">Notes</h3>
          <p className="text-sm text-surface-400">{i.notes}</p>
        </div>
      )}

      {/* Transaction History */}
      {i.transactions && i.transactions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-2">History</h3>
          <div className="space-y-1">
            {i.transactions.slice(0, 20).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={t.type === 'add' ? 'text-oil-400' : t.type === 'remove' ? 'text-red-400' : 'text-surface-400'}>
                    {t.type === 'add' ? '+' : t.type === 'remove' ? '−' : '~'} {Number(t.quantity)}
                  </span>
                  <span className="text-surface-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="text-surface-500">{Number(t.previousQuantity)} → {Number(t.newQuantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="mt-8 pb-4">
        <button onClick={() => setShowDelete(true)} className="btn-danger w-full">
          <HiTrash className="w-4 h-4" />
          Archive Item
        </button>
      </div>

      {/* Adjust Modal */}
      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title={`${adjType === 'add' ? 'Add' : 'Remove'} Stock`}>
        <div className="space-y-4">
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={adjQty}
              onChange={(e) => setAdjQty(e.target.value)}
              className="text-lg text-center"
            />
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <input
              type="text"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              placeholder="Reason for adjustment..."
            />
          </div>
          <button
            onClick={() => adjustMutation.mutate({ quantity: Number(adjQty), type: adjType, notes: adjNotes })}
            disabled={adjustMutation.isPending || !adjQty || Number(adjQty) <= 0}
            className={`w-full btn ${adjType === 'add' ? 'btn-primary' : 'bg-red-500/20 text-red-400'} py-3`}
          >
            {adjustMutation.isPending ? 'Updating...' : `${adjType === 'add' ? 'Add' : 'Remove'} ${adjQty} ${i.unitType}`}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Archive Item">
        <p className="text-surface-300 mb-4">Archive &quot;{i.name}&quot;? It will be hidden from the active inventory.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => deleteMutation.mutate()} className="btn-danger flex-1">Archive</button>
        </div>
      </Modal>
    </div>
  );
}
