import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiArrowLeft } from 'react-icons/hi';
import { api } from '../lib/api';

const categories = ['oil', 'filter', 'washer', 'gasket', 'tool', 'supply', 'other'];
const unitTypes = ['each', 'quart', 'jug', 'box', 'pair', 'set', 'pack', 'gallon', 'liter', 'case'];

export function InventoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => api.inventory.get(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState({
    name: '',
    category: 'other',
    brand: '',
    partNumber: '',
    sku: '',
    barcode: '',
    quantity: '0',
    unitType: 'each',
    packageSize: '',
    compatibleVehicleIds: '',
    preferredVendor: '',
    costPerUnit: '',
    purchaseCost: '',
    lowStockThreshold: '',
    storageLocation: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        category: existing.category || 'other',
        brand: existing.brand || '',
        partNumber: existing.partNumber || '',
        sku: existing.sku || '',
        barcode: existing.barcode || '',
        quantity: String(existing.quantity ?? 0),
        unitType: existing.unitType || 'each',
        packageSize: existing.packageSize || '',
        compatibleVehicleIds: existing.compatibleVehicleIds || '',
        preferredVendor: existing.preferredVendor || '',
        costPerUnit: existing.costPerUnit != null ? String(existing.costPerUnit) : '',
        purchaseCost: existing.purchaseCost != null ? String(existing.purchaseCost) : '',
        lowStockThreshold: existing.lowStockThreshold != null ? String(existing.lowStockThreshold) : '',
        storageLocation: existing.storageLocation || '',
        notes: existing.notes || '',
      });
    }
  }, [existing]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }

    setSaving(true);
    try {
      const data = {
        ...form,
        quantity: Number(form.quantity) || 0,
        costPerUnit: form.costPerUnit ? Number(form.costPerUnit) : null,
        purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : null,
        lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : null,
      };

      if (isEdit) {
        await api.inventory.update(id!, data);
        toast.success('Item updated');
        navigate(`/inventory/${id}`);
      } else {
        const result = await api.inventory.create(data);
        toast.success('Item added');
        navigate(`/inventory/${result.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={form[key as keyof typeof form]}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-icon text-surface-400 hover:text-white">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{isEdit ? 'Edit Item' : 'Add Inventory Item'}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {field('Name *', 'name', 'text', 'e.g. Mobil 1 0W-20 5qt')}

      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Unit Type</label>
          <select value={form.unitType} onChange={(e) => update('unitType', e.target.value)}>
            {unitTypes.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        {field('Brand', 'brand')}
        {field('Part Number / SKU', 'partNumber')}
      </div>
      <div className="form-row">
        {field('SKU', 'sku')}
        {field('Barcode', 'barcode')}
      </div>
      <div className="form-row">
        {field('Quantity', 'quantity', 'number')}
        {field('Package Size', 'packageSize')}
      </div>
      <div className="form-row">
        {field('Cost Per Unit ($)', 'costPerUnit', 'number')}
        {field('Purchase Cost ($)', 'purchaseCost', 'number')}
      </div>
      {field('Low Stock Threshold', 'lowStockThreshold', 'number', 'Alert when quantity falls below this')}
      {field('Storage Location', 'storageLocation', 'text', 'e.g. Garage shelf A')}
      {field('Preferred Vendor', 'preferredVendor')}
      {field('Compatible Vehicle IDs', 'compatibleVehicleIds', 'text', 'Comma-separated vehicle IDs (optional)')}

      <div className="form-group">
        <label>Notes</label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Any additional notes..."
        />
      </div>

      <div className="mt-8 pb-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-base">
          {saving ? 'Saving...' : isEdit ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </div>
  );
}
