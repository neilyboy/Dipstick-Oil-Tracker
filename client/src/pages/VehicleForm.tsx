import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { api } from '../lib/api';
import { PhotoUpload } from '../components/PhotoUpload';

const emptyVehicle = {
  displayName: '',
  vin: '',
  year: null as number | null,
  make: '',
  model: '',
  trim: '',
  engine: '',
  currentMileage: null as number | null,
  licensePlate: '',
  color: '',
  notes: '',
  oilType: '',
  oilViscosity: '',
  oilBrandPref: '',
  oilCapacity: null as number | null,
  filterPartNumber: '',
  filterBrandPref: '',
  crushWasherDetails: '',
  gasketDetails: '',
  intervalMiles: null as number | null,
  intervalMonths: null as number | null,
  reminderLeadMiles: null as number | null,
  reminderLeadDays: null as number | null,
  toolsRequired: '',
  torqueSpecs: '',
  jackPoints: '',
  drainPlugSocketSize: '',
  filterWrenchType: '',
  specialProcedures: '',
  tags: '',
};

export function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api.vehicles.get(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState(emptyVehicle);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setForm({
        displayName: vehicle.displayName || '',
        vin: vehicle.vin || '',
        year: vehicle.year,
        make: vehicle.make || '',
        model: vehicle.model || '',
        trim: vehicle.trim || '',
        engine: vehicle.engine || '',
        currentMileage: vehicle.currentMileage,
        licensePlate: vehicle.licensePlate || '',
        color: vehicle.color || '',
        notes: vehicle.notes || '',
        oilType: vehicle.oilType || '',
        oilViscosity: vehicle.oilViscosity || '',
        oilBrandPref: vehicle.oilBrandPref || '',
        oilCapacity: vehicle.oilCapacity,
        filterPartNumber: vehicle.filterPartNumber || '',
        filterBrandPref: vehicle.filterBrandPref || '',
        crushWasherDetails: vehicle.crushWasherDetails || '',
        gasketDetails: vehicle.gasketDetails || '',
        intervalMiles: vehicle.intervalMiles,
        intervalMonths: vehicle.intervalMonths,
        reminderLeadMiles: vehicle.reminderLeadMiles,
        reminderLeadDays: vehicle.reminderLeadDays,
        toolsRequired: vehicle.toolsRequired || '',
        torqueSpecs: vehicle.torqueSpecs || '',
        jackPoints: vehicle.jackPoints || '',
        drainPlugSocketSize: vehicle.drainPlugSocketSize || '',
        filterWrenchType: vehicle.filterWrenchType || '',
        specialProcedures: vehicle.specialProcedures || '',
        tags: vehicle.tags || '',
      });
      if (vehicle.photos?.[0]) {
        setCoverPhoto(vehicle.photos[0].filename);
      }
    }
  }, [vehicle]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...form,
        tags: form.tags ? form.tags : null,
        year: form.year ? Number(form.year) : null,
        currentMileage: form.currentMileage ? Number(form.currentMileage) : null,
        oilCapacity: form.oilCapacity ? Number(form.oilCapacity) : null,
        intervalMiles: form.intervalMiles ? Number(form.intervalMiles) : null,
        intervalMonths: form.intervalMonths ? Number(form.intervalMonths) : null,
        reminderLeadMiles: form.reminderLeadMiles ? Number(form.reminderLeadMiles) : null,
        reminderLeadDays: form.reminderLeadDays ? Number(form.reminderLeadDays) : null,
      };

      let result;
      if (isEdit) {
        result = await api.vehicles.update(id!, data);
      } else {
        result = await api.vehicles.create(data);
        // Upload the pending photo if one was selected during creation
        if (pendingPhoto) {
          try {
            await api.vehicles.uploadPhoto(result.id, pendingPhoto, true);
          } catch {
            // Photo upload failed, but vehicle was created — don't block
            console.warn('Photo upload failed after vehicle creation');
          }
        }
      }

      toast.success(isEdit ? 'Vehicle updated' : 'Vehicle created');
      navigate(`/vehicles/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (isEdit) {
      // Edit mode: upload immediately since vehicle exists
      const photo = await api.vehicles.uploadPhoto(id!, file, !coverPhoto);
      if (!coverPhoto) setCoverPhoto(photo.filename);
    } else {
      // Create mode: store file locally, upload after vehicle is saved
      setPendingPhoto(file);
      setCoverPhoto(URL.createObjectURL(file));
    }
  };

  const input = (label: string, key: string, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={form[key as keyof typeof form] ?? ''}
        onChange={(e) => update(key, type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-icon text-surface-400 hover:text-white">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Cover Photo */}
      <div className="mb-6">
        <label>Cover Photo</label>
        <PhotoUpload
          onUpload={handlePhotoUpload}
          preview={coverPhoto || undefined}
          label={isEdit ? 'Change Cover Photo' : 'Take or Select Cover Photo'}
        />
        {!isEdit && pendingPhoto && (
          <p className="text-xs text-surface-500 mt-1">Photo will be uploaded when you save the vehicle.</p>
        )}
      </div>

      {/* Basic Info */}
      <h2 className="section-title">Basic Information</h2>
      {input('Display Name *', 'displayName', 'text', 'e.g. My Toyota Tacoma')}
      <div className="form-row-3">
        {input('Year', 'year', 'number')}
        {input('Make', 'make', 'text', 'Toyota')}
        {input('Model', 'model', 'text', 'Tacoma')}
      </div>
      <div className="form-row">
        {input('Trim', 'trim')}
        {input('Engine', 'engine', 'text', '3.5L V6')}
      </div>
      <div className="form-row">
        {input('VIN', 'vin', 'text', '17-character VIN')}
        {input('License Plate', 'licensePlate')}
      </div>
      <div className="form-row">
        {input('Current Mileage', 'currentMileage', 'number')}
        {input('Color', 'color')}
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Any notes about this vehicle..."
        />
      </div>
      <div className="form-group">
        <label>Tags (comma separated)</label>
        <input
          type="text"
          value={typeof form.tags === 'string' ? form.tags : ''}
          onChange={(e) => update('tags', e.target.value)}
          placeholder="e.g. daily, truck, off-road"
        />
      </div>

      {/* Oil & Maintenance Config */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <h2 className="section-title mb-0">Oil & Maintenance Configuration</h2>
        {showAdvanced ? <HiChevronUp className="w-5 h-5 text-surface-400" /> : <HiChevronDown className="w-5 h-5 text-surface-400" />}
      </button>

      {showAdvanced && (
        <div className="animate-slide-up">
          <div className="form-row">
            {input('Oil Type', 'oilType', 'text', 'Full Synthetic')}
            {input('Oil Viscosity', 'oilViscosity', 'text', '0W-20')}
          </div>
          <div className="form-row">
            {input('Preferred Oil Brand', 'oilBrandPref', 'text', 'Mobil 1')}
            {input('Oil Capacity (qt)', 'oilCapacity', 'number')}
          </div>
          <div className="form-row">
            {input('Filter Part Number', 'filterPartNumber')}
            {input('Filter Brand', 'filterBrandPref')}
          </div>
          <div className="form-row">
            {input('Crush Washer Details', 'crushWasherDetails')}
            {input('Gasket Details', 'gasketDetails')}
          </div>
          <div className="divider" />
          <div className="form-row">
            {input('Interval (miles)', 'intervalMiles', 'number', '5000')}
            {input('Interval (months)', 'intervalMonths', 'number', '6')}
          </div>
          <div className="form-row">
            {input('Reminder Lead (miles)', 'reminderLeadMiles', 'number', '500')}
            {input('Reminder Lead (days)', 'reminderLeadDays', 'number', '30')}
          </div>
        </div>
      )}

      {/* Tools & Procedures */}
      <button
        onClick={() => setShowTools(!showTools)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <h2 className="section-title mb-0">Tools & Procedures</h2>
        {showTools ? <HiChevronUp className="w-5 h-5 text-surface-400" /> : <HiChevronDown className="w-5 h-5 text-surface-400" />}
      </button>

      {showTools && (
        <div className="animate-slide-up">
          {input('Drain Plug Socket Size', 'drainPlugSocketSize', 'text', '14mm')}
          {input('Filter Wrench Type', 'filterWrenchType')}
          <div className="form-group">
            <label>Torque Specs</label>
            <textarea
              rows={2}
              value={form.torqueSpecs}
              onChange={(e) => update('torqueSpecs', e.target.value)}
              placeholder="Oil drain plug: 30 ft-lbs"
            />
          </div>
          <div className="form-group">
            <label>Tools Required</label>
            <textarea
              rows={2}
              value={form.toolsRequired}
              onChange={(e) => update('toolsRequired', e.target.value)}
              placeholder="14mm socket, torque wrench, filter wrench, drain pan..."
            />
          </div>
          <div className="form-group">
            <label>Jack Points / Lift Notes</label>
            <textarea
              rows={2}
              value={form.jackPoints}
              onChange={(e) => update('jackPoints', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Special Procedures</label>
            <textarea
              rows={2}
              value={form.specialProcedures}
              onChange={(e) => update('specialProcedures', e.target.value)}
              placeholder="Remove skid plate first. Access filter from wheel well..."
            />
          </div>
        </div>
      )}

      {/* Save button at bottom */}
      <div className="mt-8 pb-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-base">
          {saving ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Create Vehicle'}
        </button>
      </div>
    </div>
  );
}
