import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile, Customer, Delivery, DeliveryPayment } from '../types';
import { ArrowLeft, Phone, MapPin, Mail, Calendar, DollarSign, Truck, Plus, X } from 'lucide-react';
import { mockCustomers, mockDeliveries, mockDeliveryPayments } from '../services/mockData';

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

interface TransactionWithPayments extends Delivery {
  payments?: DeliveryPayment[];
}

interface CustomerPayment {
  id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  added_by_name: string;
  added_by_role: string;
  created_at: string;
}

const CustomerProfile: React.FC<Props> = ({ userProfile }) => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deliveries, setDeliveries] = useState<TransactionWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'history'>('payments');

  // Check if user is owner (only owners can view profiles)
  useEffect(() => {
    if (userProfile.role !== 'owner') {
      navigate('/customers');
    }
  }, [userProfile.role, navigate]);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId, userProfile]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      let customerData: Customer | null = null;

      if (userProfile.id === 'demo') {
        customerData = mockCustomers.find(c => c.id === customerId) || null;
      } else {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single();

        if (!error && data) {
          customerData = data as unknown as Customer;
        }
      }

      if (!customerData) {
        navigate('/customers');
        return;
      }

      setCustomer(customerData);

      // Fetch deliveries for this customer
      let deliveriesData: Delivery[] = [];
      if (userProfile.id === 'demo') {
        deliveriesData = mockDeliveries.filter(
          d => d.customer_name === customerData?.customer_name
        );
      } else {
        const { data } = await supabase
          .from('deliveries')
          .select('*')
          .eq('customer_name', customerData.customer_name)
          .order('delivery_date', { ascending: false });

        if (data) deliveriesData = data as unknown as Delivery[];
      }

      // Fetch payments for each delivery
      const deliveriesWithPayments: TransactionWithPayments[] = await Promise.all(
        deliveriesData.map(async (delivery) => {
          let paymentData: DeliveryPayment[] = [];

          if (userProfile.id === 'demo') {
            paymentData = mockDeliveryPayments.filter(p => p.delivery_id === delivery.id);
          } else {
            const { data } = await supabase
              .from('delivery_payments')
              .select('*')
              .eq('delivery_id', delivery.id)
              .order('date', { ascending: false });

            if (data) paymentData = data as unknown as DeliveryPayment[];
          }

          return {
            ...delivery,
            payments: paymentData
          };
        })
      );

      setDeliveries(deliveriesWithPayments);

      // Fetch customer payments (money received from customer by owner)
      if (userProfile.id === 'demo') {
        setCustomerPayments([]);
      } else {
        const { data: paymentData } = await supabase
          .from('customer_payments')
          .select('*')
          .eq('customer_name', customerData.customer_name)
          .order('payment_date', { ascending: false });

        if (paymentData) {
          setCustomerPayments(paymentData as unknown as CustomerPayment[]);
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
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
        const newPayment: CustomerPayment = {
          id: `demo-${Date.now()}`,
          amount: amount,
          payment_date: paymentDate,
          notes: paymentForm.notes,
          added_by_name: userProfile.name || 'Demo User',
          added_by_role: userProfile.role,
          created_at: new Date().toISOString()
        };
        setCustomerPayments([newPayment, ...customerPayments]);
        alert(`Payment of ৳${amount.toLocaleString()} added successfully!`);
      } else {
        // In production, save to database
        const { data, error } = await supabase
          .from('customer_payments')
          .insert([{
            customer_name: customer?.customer_name,
            amount: amount,
            payment_date: paymentDate,
            notes: paymentForm.notes,
            added_by_name: userProfile.name || userProfile.id,
            added_by_role: userProfile.role,
            reference_number: `CP-${Date.now()}`
          }])
          .select();

        if (error) {
          alert('Error adding payment: ' + error.message);
          setPaymentLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setCustomerPayments([data[0] as unknown as CustomerPayment, ...customerPayments]);
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
          <p className="text-gray-600">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Customer not found</p>
          <button
            onClick={() => navigate('/customers')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }
  const totalSales = deliveries.reduce((sum, d) => sum + d.total_product_price, 0);
  const totalPaid = deliveries.reduce((sum, d) => sum + d.product_paid_amount, 0);
  const totalDue = deliveries.reduce((sum, d) => sum + d.product_due_amount, 0);
  const totalDeliveryCost = deliveries.reduce((sum, d) => sum + d.driver_total_cost, 0);
  const totalPayments = deliveries.reduce(
    (sum, d) => sum + (d.payments?.reduce((psum, payment) => psum + payment.amount, 0) || 0),
    0
  );
  
  // Calculate owner-added payments total
  const totalOwnerPayments = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Outstanding due should account for owner-added payments
  const adjustedTotalDue = Math.max(0, totalDue - totalOwnerPayments);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Customers
          </button>          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{customer.customer_name}</h1>
              <div className="flex items-center gap-2">
                <BranchBadge branch={customer.branch} />
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
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
              {customer.contact_person && (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="font-medium min-w-32">Contact Person:</span>
                  <span>{customer.contact_person}</span>
                </div>
              )}
              {customer.customer_address && (
                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin size={18} className="mt-0.5 flex-shrink-0 text-gray-500" />
                  <div>
                    <span className="font-medium">Address:</span>
                    <p>{customer.customer_address}</p>
                  </div>
                </div>
              )}
              {customer.customer_mobile && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={18} className="text-gray-500" />
                  <div>
                    <span className="font-medium">Mobile:</span>
                    <p>{customer.customer_mobile}</p>
                  </div>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail size={18} className="text-gray-500" />
                  <div>
                    <span className="font-medium">Email:</span>
                    <p>{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.notes && (
                <div className="text-gray-700">
                  <span className="font-medium">Notes:</span>
                  <p className="text-sm mt-1 text-gray-600">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-blue-600">৳ {totalSales.toLocaleString()}</p>
              </div>              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">৳ {totalPaid.toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <p className="text-sm text-gray-600">Payments Collected by Owner</p>
                <p className="text-2xl font-bold text-orange-600">৳ {totalOwnerPayments.toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="text-sm text-gray-600">Outstanding Due (After Owner Payments)</p>
                <p className="text-2xl font-bold text-red-600">৳ {adjustedTotalDue.toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <p className="text-sm text-gray-600">Delivery Costs</p>
                <p className="text-xl font-bold text-yellow-600">৳ {totalDeliveryCost.toLocaleString()}</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4 pt-2 border-t">
                <p className="text-sm text-gray-600">Verified Payments</p>
                <p className="text-xl font-bold text-purple-600">৳ {totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>        
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8 border-b">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'payments'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
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
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Truck size={18} className="inline mr-2" />
              Delivery History
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

            {customerPayments.length === 0 ? (
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
                    {customerPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">{payment.payment_date}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-green-600">৳ {payment.amount.toLocaleString()}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            payment.added_by_role === 'owner' 
                              ? 'bg-green-100 text-green-800' 
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
        )}

        {/* Delivery History Tab Content */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Truck size={20} />
                Delivery History
              </h2>
            </div>            {deliveries.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Truck size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg">No deliveries found for this customer</p>
              </div>
            ) : (
              <div className="divide-y">
                {deliveries.map((delivery) => (
                  <div key={delivery.id} className="p-6 hover:bg-gray-50 transition">
                    {/* Delivery Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar size={18} className="text-green-600" />
                          <span className="text-lg font-semibold text-gray-900">
                            {new Date(delivery.delivery_date).toLocaleDateString('en-BD', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 ml-7 text-sm text-gray-600">
                          <span>Driver: <span className="font-medium text-gray-900">{delivery.driver_name}</span></span>
                          <span>Truck: <span className="font-medium text-gray-900">{delivery.truck_number}</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">৳ {delivery.total_product_price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Product Total</p>
                      </div>
                    </div>

                    {/* Delivery Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Quantity</p>
                        <p className="text-xl font-bold text-gray-900">{delivery.number_of_bags}</p>
                        <p className="text-xs text-gray-500 mt-1">Bags</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Price/Bag</p>
                        <p className="text-lg font-bold text-gray-900">৳ {delivery.price_per_bag.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200 border-l-4 border-l-green-600">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Paid</p>
                        <p className="text-lg font-bold text-green-600">৳ {delivery.product_paid_amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-red-200 border-l-4 border-l-red-600">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Due</p>
                        <p className="text-lg font-bold text-red-600">৳ {delivery.product_due_amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-orange-200 border-l-4 border-l-orange-600">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Delivery</p>
                        <p className="text-lg font-bold text-orange-600">৳ {delivery.driver_total_cost.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {delivery.payments && delivery.payments.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign size={16} className="text-green-600" />
                          <p className="font-semibold text-gray-900">Payment Records ({delivery.payments.length})</p>
                        </div>
                        <div className="space-y-2">
                          {delivery.payments.map((payment) => (
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
        )}
      </div>

      {/* Add Payment Modal - Improved Modern UI */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-2xl font-bold">Add Payment</h2>
                <p className="text-green-100 text-sm mt-1">{customer?.customer_name}</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-white hover:bg-green-800 p-2 rounded-lg transition"
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
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-lg font-semibold"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
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
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
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

export default CustomerProfile;
