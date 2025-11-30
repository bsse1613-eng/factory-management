import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile, Supplier, Purchase, PurchasePayment } from '../types';
import { ArrowLeft, Phone, MapPin, Mail, Calendar, DollarSign, Package, Plus, X } from 'lucide-react';
import { mockSuppliers, mockPurchases, mockPurchasePayments } from '../services/mockData';

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

interface TransactionWithPayments extends Purchase {
  payments?: PurchasePayment[];
}

interface SupplierPayment {
  id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  added_by_name: string;
  added_by_role: string;
  created_at: string;
}

const SupplierProfile: React.FC<Props> = ({ userProfile }) => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<TransactionWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'history'>('payments');

  // Check if user is owner (only owners can view profiles)
  useEffect(() => {
    if (userProfile.role !== 'owner') {
      navigate('/suppliers');
    }
  }, [userProfile.role, navigate]);

  useEffect(() => {
    fetchSupplierData();
  }, [supplierId, userProfile]);

  const fetchSupplierData = async () => {
    setLoading(true);
    try {
      let supplierData: Supplier | null = null;

      if (userProfile.id === 'demo') {
        supplierData = mockSuppliers.find(s => s.id === supplierId) || null;
      } else {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', supplierId)
          .single();

        if (!error && data) {
          supplierData = data as unknown as Supplier;
        }
      }

      if (!supplierData) {
        navigate('/suppliers');
        return;
      }

      setSupplier(supplierData);

      // Fetch purchases for this supplier
      let purchasesData: Purchase[] = [];
      if (userProfile.id === 'demo') {
        purchasesData = mockPurchases.filter(
          p => p.supplier_name === supplierData?.supplier_name
        );
      } else {
        const { data } = await supabase
          .from('purchases')
          .select('*')
          .eq('supplier_name', supplierData.supplier_name)
          .order('date', { ascending: false });

        if (data) purchasesData = data as unknown as Purchase[];
      }

      // Fetch payments for each purchase
      const purchasesWithPayments: TransactionWithPayments[] = await Promise.all(
        purchasesData.map(async (purchase) => {
          let paymentData: PurchasePayment[] = [];

          if (userProfile.id === 'demo') {
            paymentData = mockPurchasePayments.filter(p => p.purchase_id === purchase.id);
          } else {
            const { data } = await supabase
              .from('purchase_payments')
              .select('*')
              .eq('purchase_id', purchase.id)
              .order('date', { ascending: false });

            if (data) paymentData = data as unknown as PurchasePayment[];
          }

          return {
            ...purchase,
            payments: paymentData
          };
        })
      );

      setPurchases(purchasesWithPayments);

      // Fetch supplier payments (money given to supplier by owner)
      if (userProfile.id === 'demo') {
        setSupplierPayments([]);
      } else {
        const { data: paymentData } = await supabase
          .from('supplier_payments')
          .select('*')
          .eq('supplier_name', supplierData.supplier_name)
          .order('payment_date', { ascending: false });

        if (paymentData) {
          setSupplierPayments(paymentData as unknown as SupplierPayment[]);
        }
      }
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);

    try {
      if (!paymentForm.amount || isNaN(parseFloat(paymentForm.amount))) {
        alert('Please enter a valid amount');
        setPaymentLoading(false);
        return;
      }

      const amount = parseFloat(paymentForm.amount);
      const paymentDate = new Date().toISOString().split('T')[0];

      if (userProfile.id === 'demo') {
        // In demo mode, add to local state
        const newPayment: SupplierPayment = {
          id: `demo-${Date.now()}`,
          amount: amount,
          payment_date: paymentDate,
          notes: paymentForm.notes,
          added_by_name: userProfile.name || 'Demo User',
          added_by_role: userProfile.role,
          created_at: new Date().toISOString()
        };
        setSupplierPayments([newPayment, ...supplierPayments]);
        alert(`Payment of ৳${amount.toLocaleString()} added successfully!`);
      } else {
        // In production, save to database
        const { data, error } = await supabase
          .from('supplier_payments')
          .insert([{
            supplier_name: supplier?.supplier_name,
            amount: amount,
            payment_date: paymentDate,
            notes: paymentForm.notes,
            added_by_name: userProfile.name || userProfile.id,
            added_by_role: userProfile.role,
            reference_number: `SP-${Date.now()}`
          }])
          .select();

        if (error) {
          alert('Error adding payment: ' + error.message);
          setPaymentLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setSupplierPayments([data[0] as unknown as SupplierPayment, ...supplierPayments]);
          alert(`Payment of ৳${amount.toLocaleString()} added successfully!`);
        }
      }

      setPaymentForm({ amount: '', notes: '' });
      setShowPaymentModal(false);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supplier profile...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Supplier not found</p>
          <button
            onClick={() => navigate('/suppliers')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total_price, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.paid_amount, 0);
  const totalDue = purchases.reduce((sum, p) => sum + p.due_amount, 0);
  const totalPayments = purchases.reduce(
    (sum, p) => sum + (p.payments?.reduce((psum, payment) => psum + payment.amount, 0) || 0),
    0
  );
  
  // Calculate owner-added payments total
  const totalOwnerPayments = supplierPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Outstanding due should account for owner-added payments
  const adjustedTotalDue = Math.max(0, totalDue - totalOwnerPayments);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/suppliers')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Suppliers
          </button>          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{supplier.supplier_name}</h1>
              <div className="flex items-center gap-2">
                <BranchBadge branch={supplier.branch} />
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Add Payment
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {supplier.contact_person && (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="font-medium min-w-32">Contact Person:</span>
                  <span>{supplier.contact_person}</span>
                </div>
              )}
              {supplier.source_location && (
                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin size={18} className="mt-0.5 flex-shrink-0 text-gray-500" />
                  <div>
                    <span className="font-medium">Location:</span>
                    <p>{supplier.source_location}</p>
                  </div>
                </div>
              )}
              {supplier.mobile_number && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={18} className="text-gray-500" />
                  <div>
                    <span className="font-medium">Mobile:</span>
                    <p>{supplier.mobile_number}</p>
                  </div>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail size={18} className="text-gray-500" />
                  <div>
                    <span className="font-medium">Email:</span>
                    <p>{supplier.email}</p>
                  </div>
                </div>
              )}
              {supplier.notes && (
                <div className="text-gray-700">
                  <span className="font-medium">Notes:</span>
                  <p className="text-sm mt-1 text-gray-600">{supplier.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-blue-600">৳ {totalPurchases.toLocaleString()}</p>
              </div>              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">৳ {totalPaid.toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <p className="text-sm text-gray-600">Payments Added by Owner</p>
                <p className="text-2xl font-bold text-orange-600">৳ {totalOwnerPayments.toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-sm text-gray-600">Outstanding Due (After Owner Payments)</p>
                <p className="text-2xl font-bold text-red-600">৳ {adjustedTotalDue.toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4 pt-2 border-t">
                <p className="text-sm text-gray-600">Verified Payments</p>
                <p className="text-xl font-bold text-purple-600">৳ {totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8 border-b">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'payments'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <DollarSign size={18} className="inline mr-2" />
              Payments Added by Owner
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Package size={18} className="inline mr-2" />
              Purchase History
            </button>
          </div>
        </div>

        {/* Payments Tab Content */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign size={20} />
                Payments Added by Owner
              </h2>
            </div>

            {supplierPayments.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <p>No payments recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Added By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {supplierPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">{payment.payment_date}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-green-600">৳ {payment.amount.toLocaleString()}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            payment.added_by_role === 'owner' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {payment.added_by_name}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}        {/* Purchase History Tab Content */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package size={20} />
                Purchase History
              </h2>
            </div>

            {purchases.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Package size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg">No purchases found for this supplier</p>
              </div>
            ) : (
              <div className="divide-y">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="p-6 hover:bg-gray-50 transition">
                    {/* Purchase Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar size={18} className="text-blue-600" />
                          <span className="text-lg font-semibold text-gray-900">
                            {new Date(purchase.date).toLocaleDateString('en-BD', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        {purchase.product_name && (
                          <p className="text-sm text-gray-600 ml-7">Product: <span className="font-medium text-gray-900">{purchase.product_name}</span></p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">৳ {purchase.total_price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Purchase</p>
                      </div>
                    </div>

                    {/* Purchase Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Quantity</p>
                        <p className="text-xl font-bold text-gray-900">{purchase.number_of_bags}</p>
                        <p className="text-xs text-gray-500 mt-1">Bags</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Price/Bag</p>
                        <p className="text-xl font-bold text-gray-900">৳ {purchase.price_per_bag.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200 border-l-4 border-l-green-600">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Paid</p>
                        <p className="text-xl font-bold text-green-600">৳ {purchase.paid_amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-red-200 border-l-4 border-l-red-600">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Due</p>
                        <p className="text-xl font-bold text-red-600">৳ {purchase.due_amount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {purchase.payments && purchase.payments.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign size={16} className="text-green-600" />
                          <p className="font-semibold text-gray-900">Payment Records ({purchase.payments.length})</p>
                        </div>
                        <div className="space-y-2">
                          {purchase.payments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-3 flex-1">
                                <Calendar size={14} className="text-green-600 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {new Date(payment.date).toLocaleDateString('en-BD')}
                                  </p>
                                  {payment.notes && (
                                    <p className="text-xs text-gray-600">{payment.notes}</p>
                                  )}
                                </div>
                              </div>
                              <p className="font-bold text-green-600 text-right min-w-fit">৳ {payment.amount.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}</div>

      {/* Add Payment Modal - Improved Modern UI */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-2xl font-bold">Add Payment</h2>
                <p className="text-blue-100 text-sm mt-1">{supplier?.supplier_name}</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-white hover:bg-blue-800 p-2 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Added By Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Payment Added By</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{userProfile.name || userProfile.id}</span>
                  {userProfile.role === 'owner' ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">Owner</span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">Employee</span>
                  )}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAddPayment} className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Payment Amount (৳) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-bold text-lg">৳</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Payment Method / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="e.g., Bank Transfer, Cash, Cheque"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading || !paymentForm.amount}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                  >
                    {paymentLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : (
                      'Record Payment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProfile;
