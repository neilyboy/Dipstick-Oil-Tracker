import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiCheck, HiRefresh, HiTrash } from 'react-icons/hi';
import { api } from '../lib/api';
import type { Receipt } from '../lib/types';
import { Modal } from '../components/Modal';

export function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    confirmedMerchant: '',
    confirmedDate: '',
    confirmedTotal: '',
    confirmedTax: '',
  });

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => api.receipts.get(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as Receipt | undefined;
      return data && !data.ocrProcessed ? 3000 : false;
    },
  });

  const runOcrMutation = useMutation({
    mutationFn: () => api.receipts.runOcr(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
      toast.success('OCR started');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.receipts.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt', id] });
      toast.success('Receipt updated');
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.receipts.delete(id!),
    onSuccess: () => {
      toast.success('Receipt deleted');
      navigate(-1);
    },
  });

  const startEditing = () => {
    if (!receipt) return;
    setEditForm({
      confirmedMerchant: receipt.confirmedMerchant || receipt.ocrMerchantName || '',
      confirmedDate: receipt.confirmedDate?.split('T')[0] || receipt.ocrDate?.split('T')[0] || '',
      confirmedTotal: receipt.confirmedTotal != null ? String(receipt.confirmedTotal) : receipt.ocrTotal != null ? String(receipt.ocrTotal) : '',
      confirmedTax: receipt.confirmedTax != null ? String(receipt.confirmedTax) : receipt.ocrTax != null ? String(receipt.ocrTax) : '',
    });
    setEditing(true);
  };

  if (isLoading) {
    return <div className="page-container"><div className="animate-pulse h-32 bg-surface-800 rounded" /></div>;
  }

  if (!receipt) {
    return <div className="page-container empty-state"><p>Receipt not found</p></div>;
  }

  const r = receipt as Receipt;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-icon text-surface-400 hover:text-white">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Receipt</h1>
          <p className="text-sm text-surface-400 truncate">{r.originalName}</p>
        </div>
        <button onClick={() => setShowDelete(true)} className="btn-icon text-red-400 hover:text-red-300">
          <HiTrash className="w-5 h-5" />
        </button>
      </div>

      {/* Receipt image */}
      <div className="mb-4 rounded-xl overflow-hidden bg-surface-800">
        {r.mimeType.startsWith('image/') ? (
          <img src={`/uploads/${r.filename}`} alt="Receipt" className="w-full" />
        ) : (
          <div className="p-8 text-center text-surface-400">
            <p>PDF Receipt</p>
            <a href={`/uploads/${r.filename}`} target="_blank" className="text-oil-400 text-sm mt-2 inline-block">
              Open PDF
            </a>
          </div>
        )}
      </div>

      {/* OCR Status */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-surface-300">OCR Results</h3>
          <div className="flex gap-2">
            {!r.ocrProcessed && (
              <button onClick={() => runOcrMutation.mutate()} disabled={runOcrMutation.isPending} className="btn-ghost btn-sm">
                <HiRefresh className={`w-4 h-4 ${runOcrMutation.isPending ? 'animate-spin' : ''}`} />
                Run OCR
              </button>
            )}
            {r.ocrProcessed && !editing && (
              <button onClick={startEditing} className="btn-ghost btn-sm">Edit</button>
            )}
            {!r.ocrConfirmed && r.ocrProcessed && (
              <button
                onClick={() => updateMutation.mutate({ ocrConfirmed: true })}
                className="btn-primary btn-sm"
              >
                <HiCheck className="w-4 h-4" />
                Confirm
              </button>
            )}
          </div>
        </div>

        {!r.ocrProcessed ? (
          <p className="text-sm text-surface-500">OCR processing... This may take a moment.</p>
        ) : editing ? (
          <div className="space-y-3">
            <div className="form-row">
              <div className="form-group">
                <label>Merchant</label>
                <input value={editForm.confirmedMerchant} onChange={(e) => setEditForm((f) => ({ ...f, confirmedMerchant: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editForm.confirmedDate} onChange={(e) => setEditForm((f) => ({ ...f, confirmedDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Total ($)</label>
                <input type="number" step="0.01" value={editForm.confirmedTotal} onChange={(e) => setEditForm((f) => ({ ...f, confirmedTotal: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Tax ($)</label>
                <input type="number" step="0.01" value={editForm.confirmedTax} onChange={(e) => setEditForm((f) => ({ ...f, confirmedTax: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => updateMutation.mutate({
                  confirmedMerchant: editForm.confirmedMerchant || null,
                  confirmedDate: editForm.confirmedDate || null,
                  confirmedTotal: editForm.confirmedTotal ? Number(editForm.confirmedTotal) : null,
                  confirmedTax: editForm.confirmedTax ? Number(editForm.confirmedTax) : null,
                })}
                className="btn-primary flex-1"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {(r.confirmedMerchant || r.ocrMerchantName) && (
              <div className="flex justify-between">
                <span className="text-surface-500">Merchant</span>
                <span className="text-white">{r.confirmedMerchant || r.ocrMerchantName}</span>
              </div>
            )}
            {(r.confirmedDate || r.ocrDate) && (
              <div className="flex justify-between">
                <span className="text-surface-500">Date</span>
                <span className="text-white">{new Date(r.confirmedDate || r.ocrDate!).toLocaleDateString()}</span>
              </div>
            )}
            {(r.confirmedTotal || r.ocrTotal) && (
              <div className="flex justify-between">
                <span className="text-surface-500">Total</span>
                <span className="text-white font-semibold">${Number(r.confirmedTotal || r.ocrTotal).toFixed(2)}</span>
              </div>
            )}
            {(r.confirmedTax || r.ocrTax) && (
              <div className="flex justify-between">
                <span className="text-surface-500">Tax</span>
                <span className="text-white">${Number(r.confirmedTax || r.ocrTax).toFixed(2)}</span>
              </div>
            )}
            {r.ocrLineItems && Array.isArray(r.ocrLineItems) && (r.ocrLineItems as any[]).length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-700">
                <span className="text-xs text-surface-500 block mb-2">Detected Line Items</span>
                {(r.ocrLineItems as any[]).map((li: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-surface-400">{li.name}</span>
                    <span className="text-surface-500">
                      {li.quantity && `x${li.quantity} `}
                      {li.price && `$${Number(li.price).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {r.ocrRawText && (
              <details className="mt-3">
                <summary className="text-xs text-surface-500 cursor-pointer">View raw OCR text</summary>
                <pre className="mt-2 text-xs text-surface-400 bg-surface-900 p-2 rounded overflow-auto max-h-40">
                  {r.ocrRawText}
                </pre>
              </details>
            )}
            {r.ocrConfirmed && (
              <div className="badge-green mt-2 text-[10px]">OCR Confirmed</div>
            )}
          </div>
        )}
      </div>

      {/* Service link */}
      {r.serviceRecord && (
        <Link to={`/services/${r.serviceRecord.id}`} className="card-interactive p-3 flex items-center gap-3">
          <span className="text-sm text-surface-400">Linked to service:</span>
          <span className="text-sm text-white">
            {new Date(r.serviceRecord.serviceDate).toLocaleDateString()} - {r.serviceRecord.mileage.toLocaleString()} mi
            {r.serviceRecord.vehicle && ` (${r.serviceRecord.vehicle.displayName})`}
          </span>
        </Link>
      )}

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Receipt">
        <p className="text-surface-300 mb-4">Delete this receipt? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => deleteMutation.mutate()} className="btn-danger flex-1">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
