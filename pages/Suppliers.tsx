import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile, Supplier, Purchase, PurchasePayment } from '../types';
import { Plus, X, ChevronDown, ChevronUp, Phone, MapPin, Mail, Edit2, Trash2, Search } from 'lucide-react';
import { mockSuppliers, mockPurchases, mockPurchasePayments } from '../services/mockData';

// Branch color scheme
const getBranchColor = (branch?: string) => {
  if (branch === 'Bogura') return { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' };
  if (branch === 'Santahar') return { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700' };
  return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700' };
};

const BranchBadge = ({ branch }: { branch?: string }) => {
  const colors = getBranchColor(branch);
  const dotColor = branch === 'Bogura' ? 'bg-blue-500' : branch === 'Santahar' ? 'bg-purple-500' : 'bg-gray-400';
  return (
    <span className={colors.badge}>
      <span className={`w-2 h-2 rounded-full mr-1.5 ${dotColor}`}></span>
      {branch || 'Unknown'}
    </span>
  );
};

interface Props {
  userProfile: Profile;
}

interface ExpandedSupplier {
  supplierId: string;
  purchases: (Purchase & { payments?: PurchasePayment[] })[];
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
}

const Suppliers: React.FC<Props> = ({ userProfile }) => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Expandable row state
  const [expandedSuppliers, setExpandedSuppliers] = useState<Map<string, ExpandedSupplier>>(new Map());
  const [loadingExpanded, setLoadingExpanded] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person: '',
    source_location: '',
    mobile_number: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, [userProfile]);
  const fetchSuppliers = async () => {
    if (userProfile.id === 'demo') {
      setSuppliers(mockSuppliers);
      return;
    }

    // All users (both owners and employees) see ALL suppliers from all branches
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setSuppliers(data as unknown as Supplier[]);
  };

  const toggleExpandRow = async (supplierId: string) => {
    if (expandedSuppliers.has(supplierId)) {
      setExpandedSuppliers(prev => {
        const newMap = new Map(prev);
        newMap.delete(supplierId);
        return newMap;
      });
      return;
    }

    setLoadingExpanded(supplierId);

    let purchases: Purchase[] = [];
    if (userProfile.id === 'demo') {
      purchases = mockPurchases.filter(p => p.supplier_name === suppliers.find(s => s.id === supplierId)?.supplier_name);
    } else {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier) {
        const { data } = await supabase
          .from('purchases')
          .select('*')
          .eq('supplier_name', supplier.supplier_name)
          .order('date', { ascending: false });
        purchases = (data as unknown as Purchase[]) || [];
      }
    }

    // Get payments for each purchase
    const purchasesWithPayments = await Promise.all(
      purchases.map(async (purchase) => {
        let payments: PurchasePayment[] = [];
        if (userProfile.id === 'demo') {
          payments = mockPurchasePayments.filter(p => p.purchase_id === purchase.id);
        } else {
          const { data } = await supabase
            .from('purchase_payments')
            .select('*')
            .eq('purchase_id', purchase.id)
            .order('date', { ascending: true });
          payments = (data as unknown as PurchasePayment[]) || [];
        }
        return { ...purchase, payments };
      })
    );

    const totalPurchases = purchasesWithPayments.reduce((sum, p) => sum + p.total_price, 0);
    const totalPaid = purchasesWithPayments.reduce((sum, p) => sum + p.paid_amount, 0);
    const totalDue = purchasesWithPayments.reduce((sum, p) => sum + p.due_amount, 0);

    setExpandedSuppliers(prev => new Map(prev).set(supplierId, {
      supplierId,
      purchases: purchasesWithPayments,
      totalPurchases,
      totalPaid,
      totalDue
    }));

    setLoadingExpanded(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (userProfile.id === 'demo') {
      if (editingId) {
        setSuppliers(suppliers.map(s => s.id === editingId ? {
          ...s,
          ...formData
        } : s));
      } else {
        const newSupplier: Supplier = {
          id: `supp-${Date.now()}`,
          created_at: new Date().toISOString(),
          branch: userProfile.branch || 'Bogura',
          ...formData
        };
        setSuppliers([newSupplier, ...suppliers]);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        supplier_name: '',
        contact_person: '',
        source_location: '',
        mobile_number: '',
        email: '',
        notes: ''
      });
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', editingId);

        if (!error) {
          setSuppliers(suppliers.map(s => s.id === editingId ? { ...s, ...formData } : s));
        }
      } else {
        const { data, error } = await supabase
          .from('suppliers')
          .insert([{
            ...formData,
            branch: userProfile.branch || 'Bogura'
          }])
          .select()
          .single();

        if (!error && data) {
          setSuppliers([data as unknown as Supplier, ...suppliers]);
        }
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        supplier_name: '',
        contact_person: '',
        source_location: '',
        mobile_number: '',
        email: '',
        notes: ''
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      supplier_name: supplier.supplier_name,
      contact_person: supplier.contact_person || '',
      source_location: supplier.source_location,
      mobile_number: supplier.mobile_number,
      email: supplier.email || '',
      notes: supplier.notes || ''
    });
    setEditingId(supplier.id);
    setShowModal(true);
  };
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      if (userProfile.id === 'demo') {
        setSuppliers(suppliers.filter(s => s.id !== id));
      } else {
        await supabase.from('suppliers').delete().eq('id', id);
        setSuppliers(suppliers.filter(s => s.id !== id));
      }
    }
  };

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.source_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.mobile_number?.includes(searchTerm) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers Master</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              supplier_name: '',
              contact_person: '',
              source_location: '',
              mobile_number: '',
              email: '',
              notes: ''
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by supplier name, contact person, location, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-2 py-1 outline-none text-gray-700"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Rahim Traders"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Rahim Ahmed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location/City *</label>
                <input
                  type="text"
                  required
                  value={formData.source_location}
                  onChange={(e) => setFormData({ ...formData, source_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Dhaka"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 01711234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., rahim@traders.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Supplier Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Mobile</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers added yet.'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <React.Fragment key={supplier.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/suppliers/${supplier.id}`)}>
                        <div className="font-medium text-gray-900 hover:text-blue-600">{supplier.supplier_name}</div>
                        {supplier.contact_person && (
                          <div className="text-xs text-gray-400">{supplier.contact_person}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {supplier.email ? (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail size={14} />
                            {supplier.email}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin size={14} />
                          {supplier.source_location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone size={14} />
                          {supplier.mobile_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <BranchBadge branch={supplier.branch} />
                      </td>                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleExpandRow(supplier.id)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="View transaction history"
                          >
                            {expandedSuppliers.has(supplier.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-gray-600 hover:text-gray-800 transition"
                          >
                            <Edit2 size={16} />
                          </button>
                          {userProfile.role === 'owner' && (
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedSuppliers.has(supplier.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          {loadingExpanded === supplier.id ? (
                            <div className="text-center py-4 text-gray-500">Loading transaction history...</div>
                          ) : (
                            <div className="space-y-6">
                              {/* Summary Cards */}
                              <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
                                  <p className="text-2xl font-bold text-gray-900">
                                    ৳ {expandedSuppliers.get(supplier.id)?.totalPurchases.toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                                  <p className="text-2xl font-bold text-emerald-600">
                                    ৳ {expandedSuppliers.get(supplier.id)?.totalPaid.toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-1">Outstanding Due</p>
                                  <p className={`text-2xl font-bold ${expandedSuppliers.get(supplier.id)?.totalDue === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    ৳ {expandedSuppliers.get(supplier.id)?.totalDue.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Transactions Table */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Purchase Transactions</h4>
                                {expandedSuppliers.get(supplier.id)?.purchases.length === 0 ? (
                                  <div className="text-center py-4 text-gray-500">No transactions with this supplier</div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left">Date</th>
                                          <th className="px-4 py-2 text-left">Product</th>
                                          <th className="px-4 py-2 text-center">Bags</th>
                                          <th className="px-4 py-2 text-right">Total</th>
                                          <th className="px-4 py-2 text-right">Paid</th>
                                          <th className="px-4 py-2 text-right">Due</th>
                                          <th className="px-4 py-2 text-center">Payments</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {expandedSuppliers.get(supplier.id)?.purchases.map((purchase) => (
                                          <tr key={purchase.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">{purchase.date}</td>
                                            <td className="px-4 py-2">{purchase.product_name || 'N/A'}</td>
                                            <td className="px-4 py-2 text-center">{purchase.number_of_bags}</td>
                                            <td className="px-4 py-2 text-right font-medium">৳ {purchase.total_price.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-emerald-600">৳ {purchase.paid_amount.toLocaleString()}</td>
                                            <td className={`px-4 py-2 text-right font-medium ${purchase.due_amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                              ৳ {purchase.due_amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                              {purchase.payments && purchase.payments.length > 0 ? (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                  {purchase.payments.length} payments
                                                </span>
                                              ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
