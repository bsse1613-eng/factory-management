import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile, TruckDriverPayment } from '../types';
import { Plus, Trash2, Eye, Search, Edit2, X, DollarSign } from 'lucide-react';
import { mockTrucks, mockTruckDriverPayments } from '../services/mockData';

interface Truck {
  id: string;
  truck_number: string;
  driver_name: string;
  driver_license: string;
  driver_mobile: string;
  vehicle_type: string;
  capacity: number;
  notes?: string;
  created_at: string;
}

interface Props {
  userProfile: Profile;
}

const Trucks: React.FC<Props> = ({ userProfile }) => {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDemurrageModal, setShowDemurrageModal] = useState(false);
  const [selectedTruckForDemurrage, setSelectedTruckForDemurrage] = useState<Truck | null>(null);
  const [demurrageForm, setDemurrageForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [formData, setFormData] = useState({
    truck_number: '',
    driver_name: '',
    driver_license: '',
    driver_mobile: '',
    vehicle_type: 'Truck',
    capacity: '',
    notes: ''
  });

  useEffect(() => {
    fetchTrucks();
  }, [userProfile]);

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      if (userProfile.id === 'demo') {
        setTrucks(mockTrucks);
      } else {
        const { data, error } = await supabase
          .from('trucks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setTrucks(data as unknown as Truck[]);
        }
      }
    } catch (error) {
      console.error('Error fetching trucks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userProfile.id === 'demo') {
        if (editingTruck) {
          // Update demo truck
          const updated = trucks.map(t =>
            t.id === editingTruck.id
              ? { ...t, ...formData }
              : t
          );
          setTrucks(updated);
        } else {
          // Add new demo truck
          const newTruck: Truck = {
            id: `truck-${Date.now()}`,
            ...formData,
            capacity: Number(formData.capacity),
            created_at: new Date().toISOString()
          };
          setTrucks([newTruck, ...trucks]);
        }
      } else {
        if (editingTruck) {
          // Update existing truck
          const { data, error } = await supabase
            .from('trucks')
            .update({
              truck_number: formData.truck_number,
              driver_name: formData.driver_name,
              driver_license: formData.driver_license,
              driver_mobile: formData.driver_mobile,
              vehicle_type: formData.vehicle_type,
              capacity: Number(formData.capacity),
              notes: formData.notes
            })
            .eq('id', editingTruck.id)
            .select()
            .single();

          if (!error && data) {
            setTrucks(trucks.map(t => t.id === editingTruck.id ? (data as unknown as Truck) : t));
          } else {
            alert('Error updating truck: ' + error?.message);
          }
        } else {
          // Add new truck
          const { data, error } = await supabase
            .from('trucks')
            .insert([{
              truck_number: formData.truck_number,
              driver_name: formData.driver_name,
              driver_license: formData.driver_license,
              driver_mobile: formData.driver_mobile,
              vehicle_type: formData.vehicle_type,
              capacity: Number(formData.capacity),
              notes: formData.notes
            }])
            .select()
            .single();

          if (!error && data) {
            setTrucks([data as unknown as Truck, ...trucks]);
          } else {
            alert('Error adding truck: ' + error?.message);
          }
        }
      }

      // Reset form
      setFormData({
        truck_number: '',
        driver_name: '',
        driver_license: '',
        driver_mobile: '',
        vehicle_type: 'Truck',
        capacity: '',
        notes: ''
      });
      setEditingTruck(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({
      truck_number: truck.truck_number,
      driver_name: truck.driver_name,
      driver_license: truck.driver_license,
      driver_mobile: truck.driver_mobile,
      vehicle_type: truck.vehicle_type,
      capacity: truck.capacity.toString(),
      notes: truck.notes || ''
    });
    setShowModal(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this truck?')) return;

    try {
      if (userProfile.id === 'demo') {
        setTrucks(trucks.filter(t => t.id !== id));
      } else {
        const { error } = await supabase
          .from('trucks')
          .delete()
          .eq('id', id);

        if (!error) {
          setTrucks(trucks.filter(t => t.id !== id));
        } else {
          alert('Error deleting truck: ' + error.message);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddDemurrage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckForDemurrage || !demurrageForm.amount) return;

    try {
      if (userProfile.id === 'demo') {
        const newPayment: TruckDriverPayment = {
          id: `dpay-${Date.now()}`,
          truck_id: selectedTruckForDemurrage.id,
          driver_name: selectedTruckForDemurrage.driver_name,
          driver_mobile: selectedTruckForDemurrage.driver_mobile,
          payment_date: demurrageForm.payment_date,
          amount: Number(demurrageForm.amount),
          payment_type: 'demurrage',
          notes: demurrageForm.notes,
          created_at: new Date().toISOString()
        };
        // In demo mode, we just show success
        alert('Truck Demurrage Cost added successfully!');
      } else {
        const { error } = await supabase
          .from('truck_driver_payments')
          .insert([{
            truck_id: selectedTruckForDemurrage.id,
            driver_name: selectedTruckForDemurrage.driver_name,
            driver_mobile: selectedTruckForDemurrage.driver_mobile,
            payment_date: demurrageForm.payment_date,
            amount: Number(demurrageForm.amount),
            payment_type: 'demurrage',
            notes: demurrageForm.notes
          }])
          .select()
          .single();

        if (!error) {
          alert('Truck Demurrage Cost added successfully!');
        } else {
          alert('Error adding demurrage cost: ' + error?.message);
        }
      }

      setDemurrageForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setSelectedTruckForDemurrage(null);
      setShowDemurrageModal(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTruck(null);
    setFormData({
      truck_number: '',
      driver_name: '',
      driver_license: '',
      driver_mobile: '',
      vehicle_type: 'Truck',
      capacity: '',
      notes: ''
    });
  };

  const filteredTrucks = trucks.filter(truck =>
    truck.truck_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.driver_license.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.driver_mobile.includes(searchTerm)
  );

  if (loading && trucks.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trucks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fleet Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Add Truck
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search by truck number, driver name, license, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Trucks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrucks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              {trucks.length === 0 ? 'No trucks added yet' : 'No trucks match your search'}
            </p>
            {trucks.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={18} /> Add Your First Truck
              </button>
            )}
          </div>
        ) : (
          filteredTrucks.map((truck) => (
            <div key={truck.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border border-gray-200">
              {/* Truck Number Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{truck.truck_number}</h3>
                    <p className="text-blue-100 text-sm mt-1">{truck.vehicle_type}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="bg-blue-800 px-3 py-1 rounded-full">
                      {truck.capacity} Bags
                    </span>
                  </div>
                </div>
              </div>

              {/* Truck Details */}
              <div className="px-6 py-4 space-y-3">
                {/* Driver Name */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Driver</p>
                  <p className="text-gray-900 font-medium">{truck.driver_name}</p>
                </div>

                {/* Driver License */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">License No.</p>
                  <p className="text-gray-900 font-mono text-sm">{truck.driver_license}</p>
                </div>

                {/* Driver Mobile */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Mobile</p>
                  <a
                    href={`tel:${truck.driver_mobile}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {truck.driver_mobile}
                  </a>
                </div>

                {/* Notes */}
                {truck.notes && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Notes</p>
                    <p className="text-gray-600 text-sm">{truck.notes}</p>
                  </div>
                )}
              </div>              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 flex-wrap">
                <button
                  onClick={() => navigate(`/trucks/${truck.id}`)}
                  className="flex-1 min-w-fit flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  <Eye size={16} /> View Details
                </button>
                {userProfile.role === 'owner' && (
                  <button
                    onClick={() => {
                      setSelectedTruckForDemurrage(truck);
                      setShowDemurrageModal(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition"
                    title="Add Truck Demurrage Cost"
                  >
                    <DollarSign size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(truck)}
                  className="flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg hover:bg-yellow-200 transition"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                {userProfile.role === 'owner' && (
                  <button
                    onClick={() => handleDelete(truck.id)}
                    className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Truck Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {editingTruck ? 'Edit Truck' : 'Add New Truck'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white hover:bg-blue-800 p-2 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Truck Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Truck Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.truck_number}
                  onChange={(e) => setFormData({ ...formData, truck_number: e.target.value })}
                  placeholder="e.g., DH-12-A-1234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Driver Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  placeholder="e.g., Mohammed Rahman"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Driver License */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.driver_license}
                  onChange={(e) => setFormData({ ...formData, driver_license: e.target.value })}
                  placeholder="e.g., LIC-123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Driver Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.driver_mobile}
                  onChange={(e) => setFormData({ ...formData, driver_mobile: e.target.value })}
                  placeholder="e.g., 01712345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type
                </label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option>Truck</option>
                  <option>Van</option>
                  <option>Pickup</option>
                  <option>Lorry</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (Bags) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Good condition, AC working..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                >
                  {loading ? 'Saving...' : editingTruck ? 'Update Truck' : 'Add Truck'}
                </button>
              </div>            </form>
          </div>
        </div>
      )}

      {/* Truck Demurrage Cost Modal */}
      {showDemurrageModal && selectedTruckForDemurrage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Truck Demurrage Cost</h2>
              <button
                onClick={() => setShowDemurrageModal(false)}
                className="text-white hover:bg-orange-800 p-2 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddDemurrage} className="p-6 space-y-4">
              {/* Truck Info */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                <p className="text-sm text-gray-600 font-semibold uppercase mb-1">Truck</p>
                <p className="text-lg font-bold text-gray-900">{selectedTruckForDemurrage.truck_number}</p>
                <p className="text-sm text-gray-700 mt-1">Driver: {selectedTruckForDemurrage.driver_name}</p>
                <p className="text-sm text-gray-700">Phone: {selectedTruckForDemurrage.driver_mobile}</p>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={demurrageForm.payment_date}
                  onChange={(e) => setDemurrageForm({ ...demurrageForm, payment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Demurrage Amount (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={demurrageForm.amount}
                  onChange={(e) => setDemurrageForm({ ...demurrageForm, amount: e.target.value })}
                  placeholder="e.g., 500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={demurrageForm.notes}
                  onChange={(e) => setDemurrageForm({ ...demurrageForm, notes: e.target.value })}
                  placeholder="e.g., Unloading delay at warehouse, 2 hours waiting charge"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowDemurrageModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition"
                >
                  Add Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trucks;
