import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiArrowLeft, HiPencil, HiPlus, HiTrash, HiDownload, HiPhotograph,
  HiCamera, HiReceiptRefund, HiChevronRight,
} from 'react-icons/hi';
import { api } from '../lib/api';
import type { Vehicle } from '../lib/types';
import { Modal } from '../components/Modal';
import { PhotoUpload, MultiPhotoUpload } from '../components/PhotoUpload';

const statusColors: Record<string, string> = {
  up_to_date: 'badge-green',
  due_soon: 'badge-yellow',
  overdue: 'badge-red',
  unknown: 'badge-gray',
};

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api.vehicles.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.vehicles.delete(id!),
    onSuccess: () => {
      toast.success('Vehicle deleted');
      navigate('/');
    },
  });

  const handlePhotoUpload = async (file: File) => {
    await api.vehicles.uploadPhoto(id!, file);
    queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
    toast.success('Photo uploaded');
  };

  const handleDeletePhoto = async (photoId: string) => {
    await api.vehicles.deletePhoto(id!, photoId);
    queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
    toast.success('Photo removed');
  };

  const handleSetCover = async (photoId: string) => {
    await api.vehicles.setCoverPhoto(id!, photoId);
    queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
    toast.success('Cover photo updated');
  };

  const handleExportPdf = async () => {
    try {
      const blob = await api.exports.pdf(id!);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vehicle?.displayName || 'vehicle'}-service-history.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-surface-800 rounded-xl" />
          <div className="h-8 bg-surface-800 rounded w-1/2" />
          <div className="h-4 bg-surface-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Vehicle not found</p>
          <Link to="/" className="btn-secondary mt-4">Back to Garage</Link>
        </div>
      </div>
    );
  }

  const v = vehicle as Vehicle;
  const coverPhoto = v.photos?.find((p) => p.isCover) || v.photos?.[0];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="btn-icon text-surface-400 hover:text-white">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => setShowPhotoUpload(true)} className="btn-icon text-surface-400 hover:text-white">
          <HiCamera className="w-5 h-5" />
        </button>
        <Link to={`/vehicles/${id}/edit`} className="btn-icon text-surface-400 hover:text-white">
          <HiPencil className="w-5 h-5" />
        </Link>
        <button onClick={handleExportPdf} className="btn-icon text-surface-400 hover:text-white">
          <HiDownload className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Image */}
      <div className="relative rounded-xl overflow-hidden mb-4 bg-surface-800 h-48 sm:h-64">
        {coverPhoto ? (
          <img
            src={`/uploads/${coverPhoto.filename}`}
            alt={v.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-600 text-6xl">
            🚗
          </div>
        )}
      </div>

      {/* Title & Status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{v.displayName}</h1>
          <p className="text-surface-400 text-sm">
            {[v.year, v.make, v.model, v.trim].filter(Boolean).join(' ') || 'No vehicle details'}
          </p>
          {v.vin && <p className="text-xs text-surface-500 mt-0.5 font-mono">VIN: {v.vin}</p>}
        </div>
        <span className={statusColors[v.dueStatus?.status] || 'badge-gray'}>
          {v.dueStatus?.statusLabel || 'Unknown'}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-3 text-center">
          <div className="text-lg font-bold">{v.currentMileage?.toLocaleString() || '—'}</div>
          <div className="text-xs text-surface-400">Current Miles</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold">{v.dueStatus?.nextDueMileage?.toLocaleString() || '—'}</div>
          <div className="text-xs text-surface-400">Next Due Miles</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold">{v.dueStatus?.nextDueDate ? new Date(v.dueStatus.nextDueDate).toLocaleDateString() : '—'}</div>
          <div className="text-xs text-surface-400">Next Due Date</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-lg font-bold">{v.serviceCount}</div>
          <div className="text-xs text-surface-400">Services</div>
        </div>
      </div>

      {/* Oil Specs */}
      {(v.oilType || v.oilViscosity || v.oilCapacity) && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-3">Oil Specifications</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {v.oilType && <div><span className="text-surface-500">Type:</span> <span className="text-white">{v.oilType}</span></div>}
            {v.oilViscosity && <div><span className="text-surface-500">Viscosity:</span> <span className="text-white">{v.oilViscosity}</span></div>}
            {v.oilBrandPref && <div><span className="text-surface-500">Brand:</span> <span className="text-white">{v.oilBrandPref}</span></div>}
            {v.oilCapacity && <div><span className="text-surface-500">Capacity:</span> <span className="text-white">{v.oilCapacity} qt</span></div>}
            {v.filterPartNumber && <div><span className="text-surface-500">Filter:</span> <span className="text-white">{v.filterPartNumber}</span></div>}
            {v.intervalMiles && <div><span className="text-surface-500">Interval:</span> <span className="text-white">{v.intervalMiles.toLocaleString()} mi</span></div>}
          </div>
        </div>
      )}

      {/* Tools/Procedures */}
      {(v.toolsRequired || v.torqueSpecs || v.drainPlugSocketSize) && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-2">Tools & Procedures</h3>
          {v.drainPlugSocketSize && <p className="text-sm text-surface-400">Socket: {v.drainPlugSocketSize}</p>}
          {v.torqueSpecs && <p className="text-sm text-surface-400 mt-1">{v.torqueSpecs}</p>}
          {v.toolsRequired && <p className="text-sm text-surface-500 mt-1">{v.toolsRequired}</p>}
        </div>
      )}

      {/* Notes */}
      {v.notes && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-semibold text-surface-300 mb-2">Notes</h3>
          <p className="text-sm text-surface-400 whitespace-pre-wrap">{v.notes}</p>
        </div>
      )}

      {/* Photo Gallery */}
      {v.photos?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-surface-300 mb-2">
            Photos ({v.photos.length})
          </h3>
          <div className="photo-grid">
            {v.photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={`/uploads/${photo.filename}`}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg border border-surface-700"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {!photo.isCover && (
                    <button
                      onClick={() => handleSetCover(photo.id)}
                      className="btn-sm bg-surface-800 text-white text-xs"
                    >
                      Cover
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="btn-sm bg-red-600 text-white text-xs"
                  >
                    <HiTrash className="w-3 h-3" />
                  </button>
                </div>
                {photo.isCover && (
                  <span className="absolute bottom-1 left-1 badge-green text-[10px]">Cover</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service History */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title mb-0">Service History</h2>
        <Link to={`/vehicles/${id}/services/new`} className="btn-primary btn-sm">
          <HiPlus className="w-4 h-4" />
          Log Service
        </Link>
      </div>

      {v.serviceRecords?.length === 0 ? (
        <div className="card p-8 text-center text-surface-500">
          <p className="mb-2">No service records yet</p>
          <Link to={`/vehicles/${id}/services/new`} className="text-oil-400 text-sm">
            Log your first oil change
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {v.serviceRecords.map((record) => (
            <Link
              key={record.id}
              to={`/services/${record.id}`}
              className="card-interactive p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-oil-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-oil-400 text-xs font-bold">OC</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white">
                    {new Date(record.serviceDate).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-surface-500">
                    {record.mileage.toLocaleString()} mi
                  </span>
                </div>
                <p className="text-xs text-surface-400 truncate">
                  {record.oilBrand && `${record.oilBrand} `}
                  {record.oilViscosity && `${record.oilViscosity} `}
                  {record.filterBrand && `| ${record.filterBrand} ${record.filterModel || ''}`}
                  {!record.oilBrand && !record.filterBrand && 'No details'}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {record.receipts?.length > 0 && (
                  <HiReceiptRefund className="w-4 h-4 text-surface-500" />
                )}
                {record.photos?.length > 0 && (
                  <HiPhotograph className="w-4 h-4 text-surface-500" />
                )}
                <HiChevronRight className="w-4 h-4 text-surface-600" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Delete */}
      <div className="mt-8 pb-4">
        <button onClick={() => setShowDelete(true)} className="btn-danger w-full">
          <HiTrash className="w-4 h-4" />
          Delete Vehicle
        </button>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Vehicle">
        <p className="text-surface-300 mb-4">
          Are you sure you want to delete <strong>{v.displayName}</strong>? This will remove all service records, photos, and receipts permanently.
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
      <Modal isOpen={showPhotoUpload} onClose={() => setShowPhotoUpload(false)} title="Upload Photos">
        <PhotoUpload onUpload={handlePhotoUpload} label="Take or Select Photo" />
      </Modal>
    </div>
  );
}
