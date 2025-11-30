import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile, Purchase, Delivery, PurchasePayment, DeliveryPayment } from '../types';
import { ArrowLeft, Phone, Truck, Calendar, DollarSign, Package } from 'lucide-react';
import { mockTrucks, mockPurchases, mockDeliveries, mockPurchasePayments, mockDeliveryPayments } from '../services/mockData';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTruckData();
  }, [truckId, userProfile]);

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
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Total Transportations</p>
            <p className="text-3xl font-bold text-blue-600">{totalTransportations}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Total Amount</p>
            <p className="text-3xl font-bold text-green-600">৳ {totalAmount.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 font-semibold uppercase mb-2">Total Payments</p>
            <p className="text-3xl font-bold text-purple-600">৳ {totalPayments.toLocaleString()}</p>
          </div>
        </div>

        {/* Transportation History */}
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
              <p className="text-lg">No transportation records found for this truck</p>
            </div>
          ) : (
            <div className="divide-y">
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
                  <div key={transport.id} className="p-6 hover:bg-gray-50 transition">
                    {/* Main Record */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar size={18} className={isDelivery ? 'text-green-600' : 'text-blue-600'} />
                          <span className="text-lg font-semibold text-gray-900">
                            {new Date(transport.date).toLocaleDateString('en-BD', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isDelivery
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isDelivery ? 'Delivery' : 'Purchase'}
                          </span>
                        </div>
                        {isDelivery && (
                          <p className="ml-6 text-sm text-gray-600">
                            Customer: <span className="font-medium">{(doc as Delivery).customer_name}</span>
                          </p>
                        )}
                        {!isDelivery && (
                          <p className="ml-6 text-sm text-gray-600">
                            Supplier: <span className="font-medium">{(doc as Purchase).supplier_name}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">৳ {amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Amount</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Product</p>
                        <p className="font-medium text-gray-900 text-sm">
                          {isDelivery ? (doc as Delivery).product_name : (doc as Purchase).product_name}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Quantity</p>
                        <p className="font-medium text-gray-900 text-sm">
                          {isDelivery ? (doc as Delivery).number_of_bags : (doc as Purchase).number_of_bags} Bags
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-green-200 border-l-4 border-l-green-600">
                        <p className="text-xs text-green-600 font-semibold uppercase mb-1">Paid</p>
                        <p className="font-medium text-green-600 text-sm">৳ {paid.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-red-200 border-l-4 border-l-red-600">
                        <p className="text-xs text-red-600 font-semibold uppercase mb-1">Due</p>
                        <p className="font-medium text-red-600 text-sm">৳ {due.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Payment History */}
                    {transport.payments.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign size={16} className="text-green-600" />
                          <p className="font-semibold text-gray-900">Payment Records ({transport.payments.length})</p>
                        </div>
                        <div className="space-y-2">
                          {transport.payments.map((payment, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
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
                              <p className="font-bold text-green-600 text-right min-w-fit">
                                ৳ {payment.amount.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TruckDetail;
