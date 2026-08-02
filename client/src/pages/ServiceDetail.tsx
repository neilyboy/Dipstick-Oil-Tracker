import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiArrowLeft, HiPencil, HiTrash, HiCamera, HiReceiptRefund,
} from 'react-icons/hi';
import { api } from '../lib/api';
import type { ServiceRecord } from '../lib/types';
import { Modal } from '../components/Modal';
import { MultiPhotoUpload } from '../components/PhotoUpload';

export function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const { data: record, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.services.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.services.delete(id!),
    onSuccess: () => {
      toast.success('Service record deleted');
      navigate(-1);
    },
  });

  const handlePhotoUpload = async (file: File) => {
    await api.services.uploadPhoto(id!, file);
    queryClient.invalidateQueries({ queryKey: ['service', id] });
    toast.success('Photo uploaded');
  };

  const handleDeletePhoto = async (photoId: string) => {
    await api.services.deletePhoto(id!, photoId);
    queryClient.invalidateQueries({ queryKey: ['service', id] });
    toast.success('Photo removed');
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile) return;
    try {
      await api.receipts.upload(receiptFile, id!);
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      toast.success('Receipt uploaded. OCR processing...');
      setReceiptFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-800 rounded w-1/2" />
          <div className="h-32 bg-surface-800 rounded" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Service record not found</p>
        </div>
      </div>
    );
  }

  const s = record as ServiceRecord;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-icon text-surface-400 hover:text-white">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Oil Change</h1>
          {s.vehicle && (
            <Link to={`/vehicles/${s.vehicleId}`} className="text-sm text-surface-400 hover:text-oil-400">
              {s.vehicle.displayName}
            </Link>
          )}
        </div>
        <Link to={`/vehicles/${s.vehicleId}/services/${id}/edit`} className="btn-icon text-surface-400 hover:text-white">
          <HiPencil className="w-5 h-5" />
        </Link>
        <button onClick={() => setShowDelete(true)} className="btn-icon text-red-400 hover:text-red-300">
          <HiTrash className="w-5 h-5" />
        </button>
      </div>

      {/* Key details */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-surface-500">Date</span>
            <p className="text-white font-medium">{new Date(s.serviceDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-surface-500">Mileage</span>
            <p className="text-white font-medium">{s.mileage.toLocaleString()} mi</p>
          </div>
          {s.nextDueMileage && (
            <div>
              <span className="text-surface-500">Next Due Mileage</span>
              <p className="text-white">{s.nextDueMileage.toLocaleString()} mi</p>
            </div>
          )}
          {s.nextDueDate && (
            <div>
              <span className="text-surface-500">Next Due Date</span>
              <p className="text-white">{new Date(s.nextDueDate).toLocaleDateString()}</p>
            </div>
          )}
          {s.cost && (
            <div>
              <span className="text-surface-500">Cost</span>
              <p className="text-white">${Number(s.cost).toFixed(2)}</p>
            </div>
          )}
          {s.performedBy && (
            <div>
              <span className="text-surface-500">Performed By</span>
              <p className="text-white capitalize">{s.performedBy}</p>
            </div>
          )}
        </div>
      </div>

      {/* Oil & Filter */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-surface-300 mb-3">Oil & Filter</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {s.oilBrand && <div><span className="text-surface-500">Oil Brand:</span> <span className="text-white">{s.oilBrand}</span></div>}
          {s.oilProduct && <div><span className="text-surface-500">Product:</span> <span className="text-white">{s.oilProduct}</span></div>}
          {s.oilViscosity && <div><span className="text-surface-500">Viscosity:</span> <span className="text-white">{s.oilViscosity}</span></div>}
          {s.oilQuantity && <div><span className="text-surface-500">Quantity:</span> <span className="text-white">{s.oilQuantity} qt</span></div>}
          {s.filterBrand && <div><span className="text-surface-500">Filter Brand:</span> <span className="text-white">{s.filterBrand}</span></div>}
          {s.filterModel && <div><span className="text-surface-500">Filter Model:</span> <span className="text-white">{s.filterModel}</span></div>}
        </div>
      </div>

      {/* Service Checks */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-surface-300 mb-2">Service Checks</h3>
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${s.drainPlugReplaced ? 'badge-green' : 'badge-gray'}`}>
            Plug: {s.drainPlugReplaced ? 'Replaced' : 'Reused'}
          </span>
          <span className={`badge ${s.washerReplaced ? 'badge-green' : 'badge-gray'}`}>
            Washer: {s.washerReplaced ? 'Replaced' : 'Reused'}
          </span>
          <span className={`badge ${s.oilLifeReset ? 'badge-green' : 'badge-gray'}`}>
            Oil Life: {s.oilLifeReset ? 'Reset' : 'Not Reset'}
          </span>
        </div>
      </div>

      {/* Notes */}
      {(s.notes || s.issuesObserved) && (
        <div className="card p-4 mb-4">
          {s.notes && (
            <>
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Notes</h3>
              <p className="text-sm text-surface-400 whitespace-pre-wrap">{s.notes}</p>
            </>
          )}
          {s.issuesObserved && (
            <div className={s.notes ? 'mt-3' : ''}>
              <h3 className="text-sm font-semibold text-yellow-400 mb-1">Issues Observed</h3>
              <p className="text-sm text-surface-400">{s.issuesObserved}</p>
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-surface-300">
            Photos ({s.photos?.length || 0})
          </h3>
          <button onClick={() => setShowPhotoUpload(true)} className="btn-ghost btn-sm">
            <HiCamera className="w-4 h-4" />
            Add
          </button>
        </div>
        {s.photos?.length > 0 ? (
          <MultiPhotoUpload
            photos={s.photos.map((p) => ({ id: p.id, filename: p.filename, photoType: p.photoType }))}
            onUpload={handlePhotoUpload}
            onDelete={handleDeletePhoto}
          />
        ) : (
          <p className="text-xs text-surface-500">No photos yet</p>
        )}
      </div>

      {/* Receipts */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-surface-300 mb-2">
          Receipts ({s.receipts?.length || 0})
        </h3>
        {s.receipts?.map((receipt) => (
          <Link
            key={receipt.id}
            to={`/receipts/${receipt.id}`}
            className="card-interactive p-3 flex items-center gap-3 mb-2"
          >
            <HiReceiptRefund className="w-5 h-5 text-surface-400" />
            <div className="flex-1">
              <p className="text-sm text-white">{receipt.originalName}</p>
              <p className="text-xs text-surface-500">
                {receipt.ocrProcessed ? (receipt.ocrConfirmed ? 'OCR Confirmed' : 'OCR Pending Review') : 'Processing...'}
              </p>
            </div>
          </Link>
        ))}
        <div className="flex gap-2 mt-2">
          <label className="btn-ghost btn-sm cursor-pointer flex-1 text-center">
            <HiReceiptRefund className="w-4 h-4" />
            <input
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
            Select Receipt
          </label>
          {receiptFile && (
            <button onClick={handleReceiptUpload} className="btn-primary btn-sm">
              Upload
            </button>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Service Record">
        <p className="text-surface-300 mb-4">
          Are you sure you want to delete this service record? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="btn-danger flex-1"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal isOpen={showPhotoUpload} onClose={() => setShowPhotoUpload(false)} title="Upload Service Photos">
        <div className="space-y-3">
          <p className="text-sm text-surface-400">Take or select photos of your service.</p>
          <label className="btn-secondary w-full text-center cursor-pointer">
            <HiCamera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files) return;
                for (const file of Array.from(files)) {
                  await handlePhotoUpload(file);
                }
                setShowPhotoUpload(false);
              }}
            />
            Take Photos
          </label>
        </div>
      </Modal>
    </div>
  );
}
