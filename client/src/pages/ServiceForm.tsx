import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiArrowLeft } from 'react-icons/hi';
import { api } from '../lib/api';

const defaultForm = {
  vehicleId: '',
  serviceDate: new Date().toISOString().split('T')[0],
  mileage: '' as string | number,
  serviceType: 'oil_change',
  oilBrand: '',
  oilProduct: '',
  oilViscosity: '',
  oilQuantity: '' as string | number,
  filterBrand: '',
  filterModel: '',
  performedBy: 'self',
  cost: '' as string | number,
  receiptNumber: '',
  notes: '',
  drainPlugReplaced: false,
  washerReplaced: true,
  oilLifeReset: true,
  torqueUsed: '',
  serviceDuration: '' as string | number,
  issuesObserved: '',
  leaksObserved: '',
  followUpWork: '',
  nextDueMileageOverride: '' as string | number,
  nextDueDateOverride: '',
};

export function ServiceForm() {
  const { vehicleId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => api.vehicles.get(vehicleId!),
    enabled: !!vehicleId,
  });

  const { data: existingService } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.services.get(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  // Prefill from vehicle when available
  useEffect(() => {
    if (vehicle && !isEdit) {
      const lastService = vehicle.serviceRecords?.[0];
      setForm((f) => ({
        ...f,
        vehicleId: vehicle.id,
        mileage: vehicle.currentMileage ?? '',
        oilBrand: vehicle.oilBrandPref || lastService?.oilBrand || '',
        oilViscosity: vehicle.oilViscosity || lastService?.oilViscosity || '',
        oilProduct: lastService?.oilProduct || '',
        filterBrand: vehicle.filterBrandPref || lastService?.filterBrand || '',
        filterModel: vehicle.filterPartNumber || lastService?.filterModel || '',
        oilQuantity: vehicle.oilCapacity ?? '',
        nextDueMileageOverride: vehicle.intervalMiles && vehicle.currentMileage
          ? vehicle.currentMileage + vehicle.intervalMiles : '',
      }));
    }
  }, [vehicle, isEdit]);

  // Prefill from existing service when editing
  useEffect(() => {
    if (existingService && isEdit) {
      setForm({
        vehicleId: existingService.vehicleId,
        serviceDate: existingService.serviceDate?.split('T')[0] || '',
        mileage: existingService.mileage ?? '',
        serviceType: existingService.serviceType || 'oil_change',
        oilBrand: existingService.oilBrand || '',
        oilProduct: existingService.oilProduct || '',
        oilViscosity: existingService.oilViscosity || '',
        oilQuantity: existingService.oilQuantity ?? '',
        filterBrand: existingService.filterBrand || '',
        filterModel: existingService.filterModel || '',
        performedBy: existingService.performedBy || 'self',
        cost: existingService.cost ?? '',
        receiptNumber: existingService.receiptNumber || '',
        notes: existingService.notes || '',
        drainPlugReplaced: existingService.drainPlugReplaced || false,
        washerReplaced: existingService.washerReplaced ?? true,
        oilLifeReset: existingService.oilLifeReset ?? true,
        torqueUsed: existingService.torqueUsed || '',
        serviceDuration: existingService.serviceDuration ?? '',
        issuesObserved: existingService.issuesObserved || '',
        leaksObserved: existingService.leaksObserved || '',
        followUpWork: existingService.followUpWork || '',
        nextDueMileageOverride: existingService.nextDueMileageOverride ?? '',
        nextDueDateOverride: existingService.nextDueDateOverride?.split('T')[0] || '',
      });
    }
  }, [existingService, isEdit]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.mileage) {
      toast.error('Mileage is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...form,
        vehicleId: form.vehicleId || vehicleId,
        mileage: Number(form.mileage),
        oilQuantity: form.oilQuantity ? Number(form.oilQuantity) : null,
        cost: form.cost ? Number(form.cost) : null,
        serviceDuration: form.serviceDuration ? Number(form.serviceDuration) : null,
        nextDueMileageOverride: form.nextDueMileageOverride ? Number(form.nextDueMileageOverride) : null,
        nextDueDateOverride: form.nextDueDateOverride || null,
      };

      if (isEdit) {
        await api.services.update(id!, data);
        toast.success('Service record updated');
        navigate(`/services/${id}`);
      } else {
        const result = await api.services.create(data);
        toast.success('Service logged');
        navigate(`/services/${result.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: string, type = 'text', placeholder = '', half = false) => (
    <div className={half ? '' : 'form-group'}>
      <label>{label}</label>
      <input
        type={type}
        value={form[key as keyof typeof form] as string}
        onChange={(e) =>
          update(
            key,
            type === 'number' ? (e.target.value ? e.target.value : '') : e.target.value
          )
        }
        placeholder={placeholder}
      />
    </div>
  );

  const checkbox = (label: string, key: string) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={!!form[key as keyof typeof form]}
        onChange={(e) => update(key, e.target.checked)}
      />
      <span className="text-sm text-surface-300">{label}</span>
    </label>
  );

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-icon text-surface-400 hover:text-white">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{isEdit ? 'Edit Service' : 'Log Oil Change'}</h1>
          {vehicle && <p className="text-sm text-surface-400">{vehicle.displayName}</p>}
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Core fields */}
      <h2 className="section-title">Service Details</h2>
      <div className="form-row">
        {field('Date', 'serviceDate', 'date')}
        {field('Mileage *', 'mileage', 'number')}
      </div>

      {/* Oil details */}
      <h3 className="text-sm font-semibold text-surface-300 mb-3 mt-4">Oil</h3>
      <div className="form-row">
        {field('Brand', 'oilBrand', 'text', 'Mobil 1')}
        {field('Viscosity', 'oilViscosity', 'text', '0W-20')}
      </div>
      <div className="form-row">
        {field('Product Name', 'oilProduct', 'text', 'Extended Performance')}
        {field('Quantity (qt)', 'oilQuantity', 'number')}
      </div>

      {/* Filter details */}
      <h3 className="text-sm font-semibold text-surface-300 mb-3 mt-4">Filter</h3>
      <div className="form-row">
        {field('Filter Brand', 'filterBrand', 'text', 'Toyota OEM')}
        {field('Filter Model/Part #', 'filterModel')}
      </div>

      {/* Service checks */}
      <h3 className="text-sm font-semibold text-surface-300 mb-3 mt-4">Service Checks</h3>
      <div className="space-y-2 mb-4">
        {checkbox('Drain plug replaced', 'drainPlugReplaced')}
        {checkbox('Washer/gasket replaced', 'washerReplaced')}
        {checkbox('Oil life reset', 'oilLifeReset')}
      </div>

      {/* Additional details */}
      <h3 className="text-sm font-semibold text-surface-300 mb-3 mt-4">Additional Details</h3>
      <div className="form-row">
        {field('Performed By', 'performedBy', 'text', 'self')}
        {field('Cost ($)', 'cost', 'number')}
      </div>
      {field('Receipt Number', 'receiptNumber')}
      <div className="form-row">
        {field('Torque Used', 'torqueUsed', 'text', '30 ft-lbs')}
        {field('Duration (min)', 'serviceDuration', 'number')}
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Any observations during the service..."
        />
      </div>
      <div className="form-group">
        <label>Issues Observed</label>
        <textarea
          rows={2}
          value={form.issuesObserved}
          onChange={(e) => update('issuesObserved', e.target.value)}
          placeholder="Any leaks, unusual wear, concerns..."
        />
      </div>
      <div className="form-group">
        <label>Recommended Follow-up</label>
        <textarea
          rows={2}
          value={form.followUpWork}
          onChange={(e) => update('followUpWork', e.target.value)}
        />
      </div>

      {/* Next due overrides */}
      <h3 className="text-sm font-semibold text-surface-300 mb-3 mt-4">Next Due (Override)</h3>
      <p className="text-xs text-surface-500 mb-3">
        Leave blank to auto-calculate from vehicle intervals.
      </p>
      <div className="form-row">
        {field('Next Due Mileage', 'nextDueMileageOverride', 'number')}
        {field('Next Due Date', 'nextDueDateOverride', 'date')}
      </div>

      <div className="mt-8 pb-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-base">
          {saving ? 'Saving...' : isEdit ? 'Update Service' : 'Log Oil Change'}
        </button>
      </div>
    </div>
  );
}
