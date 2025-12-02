import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile, Purchase, Delivery, PurchasePayment, DeliveryPayment, TruckDriverPayment } from '../types';
import { ArrowLeft, Phone, Truck, Calendar, DollarSign, Package, Plus, X } from 'lucide-react';
import { mockTrucks, mockPurchases, mockDeliveries, mockPurchasePayments, mockDeliveryPayments, mockTruckDriverPayments } from '../services/mockData';

interface TruckData {
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

interface TransportationRecord {
  id: string;
  type: 'purchase' | 'delivery';
  date: string;
  document: Purchase | Delivery;
  payments: PurchasePayment[] | DeliveryPayment[];
}

interface Props {
  userProfile: Profile;
}

const TruckDetail: React.FC<Props> = ({ userProfile }) => {
  const { truckId } = useParams<{ truckId: string }>();
  const navigate = useNavigate();
  const [truck, setTruck] = useState<TruckData | null>(null);
  const [transportations, setTransportations] = useState<TransportationRecord[]>([]);
  const [driverPayments, setDriverPayments] = useState<TruckDriverPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<'regular' | 'demurrage'>('regular');
  const [activeTab, setActiveTab] = useState<'payments' | 'history'>('payments');
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_type: 'regular' as 'regular' | 'demurrage' | 'advance',
    notes: ''
  });
  useEffect(() => {
    fetchTruckData();
    fetchDriverPayments();
  }, [truckId, userProfile]);

  const fetchDriverPayments = async () => {
    try {
      if (userProfile.id === 'demo') {
        const payments = mockTruckDriverPayments.filter(p => p.truck_id === truckId);
        setDriverPayments(payments);
      } else {
        const { data, error } = await supabase
          .from('truck_driver_payments')
          .select('*')
          .eq('truck_id', truckId)
          .order('payment_date', { ascending: false });

        if (!error && data) {
          setDriverPayments(data as unknown as TruckDriverPayment[]);
        }
      }
    } catch (error) {
      console.error('Error fetching driver payments:', error);
    }
  };

  const fetchTruckData = async () => {
    setLoading(true);
    try {
      let truckData: TruckData | null = null;

      // Fetch truck info
      if (userProfile.id === 'demo') {
        truckData = mockTrucks.find(t => t.id === truckId) || null;
      } else {
        const { data, error } = await supabase
          .from('trucks')
          .select('*')
          .eq('id', truckId)
          .single();

        if (!error && data) {
          truckData = data as unknown as TruckData;
        }
      }

      if (!truckData) {
        navigate('/trucks');
        return;
      }

      setTruck(truckData);

      // Fetch all purchases with this truck
      let purchasesWithPayments: TransportationRecord[] = [];
      let deliveriesWithPayments: TransportationRecord[] = [];

      if (userProfile.id === 'demo') {
        // Filter by driver name for demo
        const purchases = mockPurchases.filter(p => p.notes?.includes(truckData!.driver_name));
        const deliveries = mockDeliveries.filter(d => d.driver_name === truckData!.driver_name);

        purchasesWithPayments = await Promise.all(
          purchases.map(async (p) => {
            const payments = mockPurchasePayments.filter(pp => pp.purchase_id === p.id);
            return { id: p.id, type: 'purchase' as const, date: p.date, document: p, payments };
          })
        );

        deliveriesWithPayments = await Promise.all(
          deliveries.map(async (d) => {
            const payments = mockDeliveryPayments.filter(dp => dp.delivery_id === d.id);
            return { id: d.id, type: 'delivery' as const, date: d.delivery_date, document: d, payments };
          })
        );
      } else {
        // Query purchases by driver name
        const { data: purchasesData } = await supabase
          .from('purchases')
          .select('*')
          .ilike('driver_name', `%${truckData.driver_name}%`);

        if (purchasesData) {
          purchasesWithPayments = await Promise.all(
            (purchasesData as unknown as Purchase[]).map(async (p) => {
              const { data: paymentsData } = await supabase
                .from('purchase_payments')
                .select('*')
                .eq('purchase_id', p.id);
              return {
                id: p.id,
                type: 'purchase' as const,
                date: p.date,
                document: p,
                payments: (paymentsData as unknown as PurchasePayment[]) || []
              };
            })
          );
        }

        // Query deliveries by driver name
        const { data: deliveriesData } = await supabase
          .from('deliveries')
          .select('*')
          .ilike('driver_name', `%${truckData.driver_name}%`);

        if (deliveriesData) {
          deliveriesWithPayments = await Promise.all(
            (deliveriesData as unknown as Delivery[]).map(async (d) => {
              const { data: paymentsData } = await supabase
                .from('delivery_payments')
                .select('*')
                .eq('delivery_id', d.id);
              return {
                id: d.id,
                type: 'delivery' as const,
                date: d.delivery_date,
                document: d,
                payments: (paymentsData as unknown as DeliveryPayment[]) || []
              };
            })
          );
        }
      }

      // Combine and sort by date
      const allTransportations = [...purchasesWithPayments, ...deliveriesWithPayments];
      allTransportations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransportations(allTransportations);
    } catch (error) {
      console.error('Error fetching truck data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading truck details...</p>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Truck not found</p>
          <button
            onClick={() => navigate('/trucks')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Trucks
          </button>
        </div>
      </div>
    );
  }
  // Calculate statistics
  const totalTransportations = transportations.length;
  
  // Calculate total driver cost from deliveries
  const totalDriverCost = transportations.reduce((sum, t) => {
    if (t.type === 'delivery') {
      const delivery = t.document as Delivery;
      const driverPayment = (delivery.driver_payment_amount || 0) + (delivery.driver_extra_cost || 0);
      return sum + driverPayment;
    }
    return sum;
  }, 0);

  // Calculate demurrage charges (waiting/unloading delays)
  const totalDemurrageCharges = driverPayments.reduce((sum, p) => {
    return p.payment_type === 'demurrage' ? sum + p.amount : sum;
  }, 0);

  // Calculate total driver payable (regular costs + demurrage)
  const totalDriverPayable = totalDriverCost + totalDemurrageCharges;

  // Calculate total paid to driver (regular payments only, not demurrage)
  const totalPaidToDriver = driverPayments.reduce((sum, p) => {
    return p.payment_type !== 'demurrage' ? sum + p.amount : sum;
  }, 0);

  // Calculate due to driver
  const dueToDriver = totalDriverPayable - totalPaidToDriver;

  const totalAmount = transportations.reduce((sum, t) => {
    if (t.type === 'purchase') {
      return sum + (t.document as Purchase).total_price;
    } else {
      return sum + (t.document as Delivery).total_product_price;
    }
  }, 0);
  const totalPayments = transportations.reduce((sum, t) => {
    return sum + t.payments.reduce((ps, p) => ps + (p.amount || 0), 0);
  }, 0);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!truck || !paymentForm.amount) return;

    try {
      if (userProfile.id === 'demo') {
        const newPayment: TruckDriverPayment = {
          id: `dpay-${Date.now()}`,
          truck_id: truck.id,
          driver_name: truck.driver_name,
          driver_mobile: truck.driver_mobile,
          payment_date: paymentForm.payment_date,
          amount: Number(paymentForm.amount),
          payment_type: paymentModalType === 'demurrage' ? 'demurrage' : paymentForm.payment_type,
          notes: paymentForm.notes,
          created_at: new Date().toISOString()
        };
        setDriverPayments([newPayment, ...driverPayments]);
        alert(`${paymentModalType === 'demurrage' ? 'Demurrage Cost' : 'Payment'} added successfully!`);
      } else {
        const { data, error } = await supabase
          .from('truck_driver_payments')
          .insert([{
            truck_id: truck.id,
            driver_name: truck.driver_name,
            driver_mobile: truck.driver_mobile,
            payment_date: paymentForm.payment_date,
            amount: Number(paymentForm.amount),
            payment_type: paymentModalType === 'demurrage' ? 'demurrage' : paymentForm.payment_type,
            notes: paymentForm.notes
          }])
          .select()
          .single();

        if (!error && data) {
          setDriverPayments([data as unknown as TruckDriverPayment, ...driverPayments]);
          alert(`${paymentModalType === 'demurrage' ? 'Demurrage Cost' : 'Payment'} added successfully!`);
        } else {
          alert('Error adding payment: ' + error?.message);
        }
      }

      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_type: 'regular',
        notes: ''
      });
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/trucks')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Fleet
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{truck.truck_number}</h1>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {truck.vehicle_type}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Capacity: {truck.capacity} Bags
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Driver Information Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Driver Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Driver Details */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase mb-1">Driver Name</p>
                <p className="text-lg font-bold text-gray-900">{truck.driver_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase mb-1">License Number</p>
                <p className="text-lg font-mono text-gray-900">{truck.driver_license}</p>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase mb-1">Mobile Contact</p>
                <a
                  href={`tel:${truck.driver_mobile}`}
                  className="text-lg font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  <Phone size={20} />
                  {truck.driver_mobile}
                </a>
              </div>
              {truck.notes && (
                <div>
                  <p className="text-sm text-gray-600 font-semibold uppercase mb-1">Notes</p>
                  <p className="text-gray-700">{truck.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Total Transportations</p>
            <p className="text-3xl font-bold text-blue-600">{totalTransportations}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Driver Payable</p>
            <p className="text-3xl font-bold text-orange-600">৳ {totalDriverPayable.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Driver Paid</p>
            <p className="text-3xl font-bold text-green-600">৳ {totalPaidToDriver.toLocaleString()}</p>
          </div>

          <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${dueToDriver > 0 ? 'border-red-500' : 'border-gray-500'}`}>
            <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Driver Due</p>
            <p className={`text-3xl font-bold ${dueToDriver > 0 ? 'text-red-600' : 'text-gray-600'}`}>৳ {dueToDriver.toLocaleString()}</p>
          </div>
        </div>        {/* Tab Navigation */}
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
              Driver Payment Records
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Truck size={18} className="inline mr-2" />
              Transportation History
            </button>
          </div>
        </div>        {/* Two Column Layout */}
        {activeTab === 'payments' ? (
          // Payment Records Tab
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign size={20} />
                Payment Records
              </h2>
            </div>

            <div className="px-6 py-4 flex gap-2 border-b">
              {userProfile.role === 'owner' && (
                <button
                  onClick={() => {
                    setPaymentModalType('demurrage');
                    setPaymentForm({
                      payment_date: new Date().toISOString().split('T')[0],
                      amount: '',
                      payment_type: 'demurrage',
                      notes: ''
                    });
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm"
                  title="Add demurrage/waiting charges"
                >
                  <DollarSign size={16} /> Add Demurrage
                </button>
              )}
              <button
                onClick={() => {
                  setPaymentModalType('regular');
                  setPaymentForm({
                    payment_date: new Date().toISOString().split('T')[0],
                    amount: '',
                    payment_type: 'regular',
                    notes: ''
                  });
                  setShowPaymentModal(true);
                }}
                className={`${userProfile.role === 'owner' ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm`}
                title="Record driver payment"
              >
                <Plus size={16} /> Add Payment
              </button>
            </div>

            {driverPayments.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <DollarSign size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg">No payment records for this driver</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {driverPayments.map((payment) => (
                  <div key={payment.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={16} className={`${
                            payment.payment_type === 'demurrage' ? 'text-orange-600' : 'text-green-600'
                          }`} />
                          <span className="text-sm font-semibold text-gray-900">
                            {new Date(payment.payment_date).toLocaleDateString('en-BD', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            payment.payment_type === 'demurrage'
                              ? 'bg-orange-100 text-orange-800'
                              : payment.payment_type === 'advance'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {payment.payment_type === 'demurrage' ? '💲' : payment.payment_type === 'advance' ? '🔵' : '💰'}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-bold text-gray-900">৳ {payment.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>            )}
          </div>
        ) : (
          // Transportation History Tab
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Truck size={20} />
                Transportation History
              </h2>
            </div>

            {transportations.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Truck size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg">No transportation records found</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {transportations.map((transport) => {
                  const isDelivery = transport.type === 'delivery';
                  const doc = transport.document;
                  const amount = isDelivery
                    ? (doc as Delivery).total_product_price
                    : (doc as Purchase).total_price;
                  const paid = isDelivery
                    ? (doc as Delivery).product_paid_amount
                    : (doc as Purchase).paid_amount;
                  const due = isDelivery
                    ? (doc as Delivery).product_due_amount
                    : (doc as Purchase).due_amount;

                  return (
                    <div key={transport.id} className="p-4 hover:bg-gray-50 transition border-b last:border-b-0">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={14} className={isDelivery ? 'text-green-600' : 'text-blue-600'} />
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date(transport.date).toLocaleDateString('en-BD', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isDelivery
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isDelivery ? 'Delivery' : 'Purchase'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {isDelivery ? 'Customer' : 'Supplier'}: <span className="font-medium">{isDelivery ? (doc as Delivery).customer_name : (doc as Purchase).supplier_name}</span>
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-gray-900">৳ {amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="bg-gray-50 p-2 rounded text-xs space-y-1 mb-2">
                        <p><span className="text-gray-600">Product:</span> <span className="font-medium">{isDelivery ? (doc as Delivery).product_name : (doc as Purchase).product_name}</span></p>
                        <p><span className="text-gray-600">Qty:</span> <span className="font-medium">{isDelivery ? (doc as Delivery).number_of_bags : (doc as Purchase).number_of_bags} bags</span></p>
                        <div className="flex gap-4">
                          <span className="text-green-600">Paid: ৳ {paid.toLocaleString()}</span>
                          <span className="text-red-600">Due: ৳ {due.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Payment Records Count */}
                      {transport.payments.length > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          {transport.payments.length} payment{transport.payments.length !== 1 ? 's' : ''} recorded
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className={`bg-gradient-to-r px-6 py-6 flex justify-between items-center ${
                paymentModalType === 'demurrage' 
                  ? 'from-orange-600 to-orange-700' 
                  : 'from-green-600 to-green-700'
              }`}>
                <h2 className="text-2xl font-bold text-white">
                  {paymentModalType === 'demurrage' ? 'Add Demurrage Cost' : 'Add Driver Payment'}
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className={`text-white p-2 rounded-lg transition ${
                    paymentModalType === 'demurrage' 
                      ? 'hover:bg-orange-800' 
                      : 'hover:bg-green-800'
                  }`}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                {/* Payment Type Info */}
                <div className={`p-3 rounded-lg text-sm ${
                  paymentModalType === 'demurrage' 
                    ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {paymentModalType === 'demurrage' 
                    ? '💲 Demurrage Cost - Add waiting charges or unloading delays' 
                    : '💰 Regular Payment - Record money paid to driver'
                  }
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none ${
                      paymentModalType === 'demurrage' 
                        ? 'focus:ring-orange-500' 
                        : 'focus:ring-green-500'
                    }`}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {paymentModalType === 'demurrage' ? 'Demurrage Amount (৳) *' : 'Payment Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none ${
                      paymentModalType === 'demurrage' 
                        ? 'focus:ring-orange-500' 
                        : 'focus:ring-green-500'
                    }`}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder={paymentModalType === 'demurrage' 
                      ? "e.g., Waiting charge, unloading delay at warehouse" 
                      : "e.g., Payment for delivery to Sirajganj"}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className={`flex-1 px-4 py-2 border-2 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition ${
                      paymentModalType === 'demurrage' 
                        ? 'border-orange-300' 
                        : 'border-green-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition ${
                      paymentModalType === 'demurrage' 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {paymentModalType === 'demurrage' ? 'Add Demurrage' : 'Add Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckDetail;
