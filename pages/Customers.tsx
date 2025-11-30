import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Profile, Customer, Delivery, DeliveryPayment } from '../types';
import { Plus, X, ChevronDown, ChevronUp, Phone, MapPin, Mail, Edit2, Trash2, Search } from 'lucide-react';
import { mockCustomers, mockDeliveries, mockDeliveryPayments } from '../services/mockData';

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

interface ExpandedCustomer {
  customerId: string;
  deliveries: (Delivery & { payments?: DeliveryPayment[] })[];
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  totalDeliveryCost: number;
}

const Customers: React.FC<Props> = ({ userProfile }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Expandable row state
  const [expandedCustomers, setExpandedCustomers] = useState<Map<string, ExpandedCustomer>>(new Map());
  const [loadingExpanded, setLoadingExpanded] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    contact_person: '',
    customer_address: '',
    customer_mobile: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [userProfile]);
  const fetchCustomers = async () => {
    if (userProfile.id === 'demo') {
      setCustomers(mockCustomers);
      return;
    }

    // All users (both owners and employees) see ALL customers from all branches
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setCustomers(data as unknown as Customer[]);
  };

  const toggleExpandRow = async (customerId: string) => {
    if (expandedCustomers.has(customerId)) {
      setExpandedCustomers(prev => {
        const newMap = new Map(prev);
        newMap.delete(customerId);
        return newMap;
      });
      return;
    }

    setLoadingExpanded(customerId);

    let deliveries: Delivery[] = [];
    if (userProfile.id === 'demo') {
      deliveries = mockDeliveries.filter(d => d.customer_name === customers.find(c => c.id === customerId)?.customer_name);
    } else {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const { data } = await supabase
          .from('deliveries')
          .select('*')
          .eq('customer_name', customer.customer_name)
          .order('delivery_date', { ascending: false });
        deliveries = (data as unknown as Delivery[]) || [];
      }
    }

    // Get payments for each delivery
    const deliveriesWithPayments = await Promise.all(
      deliveries.map(async (delivery) => {
        let payments: DeliveryPayment[] = [];
        if (userProfile.id === 'demo') {
          payments = mockDeliveryPayments.filter(p => p.delivery_id === delivery.id);
        } else {
          const { data } = await supabase
            .from('delivery_payments')
            .select('*')
            .eq('delivery_id', delivery.id)
            .order('date', { ascending: true });
          payments = (data as unknown as DeliveryPayment[]) || [];
        }
        return { ...delivery, payments };
      })
    );

    const totalSales = deliveriesWithPayments.reduce((sum, d) => sum + d.total_product_price, 0);
    const totalPaid = deliveriesWithPayments.reduce((sum, d) => sum + d.product_paid_amount, 0);
    const totalDue = deliveriesWithPayments.reduce((sum, d) => sum + d.product_due_amount, 0);
    const totalDeliveryCost = deliveriesWithPayments.reduce((sum, d) => sum + d.driver_total_cost, 0);

    setExpandedCustomers(prev => new Map(prev).set(customerId, {
      customerId,
      deliveries: deliveriesWithPayments,
      totalSales,
      totalPaid,
      totalDue,
      totalDeliveryCost
    }));

    setLoadingExpanded(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (userProfile.id === 'demo') {
      if (editingId) {
        setCustomers(customers.map(c => c.id === editingId ? {
          ...c,
          ...formData
        } : c));
      } else {
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          created_at: new Date().toISOString(),
          branch: userProfile.branch || 'Bogura',
          ...formData
        };
        setCustomers([newCustomer, ...customers]);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        customer_name: '',
        contact_person: '',
        customer_address: '',
        customer_mobile: '',
        email: '',
        notes: ''
      });
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingId);

        if (!error) {
          setCustomers(customers.map(c => c.id === editingId ? { ...c, ...formData } : c));
        }
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            ...formData,
            branch: userProfile.branch || 'Bogura'
          }])
          .select()
          .single();

        if (!error && data) {
          setCustomers([data as unknown as Customer, ...customers]);
        }
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        customer_name: '',
        contact_person: '',
        customer_address: '',
        customer_mobile: '',
        email: '',
        notes: ''
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      customer_name: customer.customer_name,
      contact_person: customer.contact_person || '',
      customer_address: customer.customer_address,
      customer_mobile: customer.customer_mobile,
      email: customer.email || '',
      notes: customer.notes || ''
    });
    setEditingId(customer.id);
    setShowModal(true);
  };  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      if (userProfile.id === 'demo') {
        setCustomers(customers.filter(c => c.id !== id));
      } else {
        await supabase.from('customers').delete().eq('id', id);
        setCustomers(customers.filter(c => c.id !== id));
      }
    }
  };
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_mobile?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Customers Master</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              customer_name: '',
              contact_person: '',
              customer_address: '',
              customer_mobile: '',
              email: '',
              notes: ''
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer name, contact person, address, phone, or email..."
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
              <h2 className="text-xl font-bold">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g., Jamuna Mills"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g., Jamuna Roy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_address}
                  onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g., Sirajganj"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.customer_mobile}
                  onChange={(e) => setFormData({ ...formData, customer_mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g., 01711000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g., jamuna@mills.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Mobile</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {searchTerm ? 'No customers found matching your search.' : 'No customers added yet.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <React.Fragment key={customer.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                        <div className="font-medium text-gray-900 hover:text-blue-600">{customer.customer_name}</div>
                        {customer.contact_person && (
                          <div className="text-xs text-gray-400">{customer.contact_person}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.email ? (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail size={14} />
                            {customer.email}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin size={14} />
                          {customer.customer_address}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone size={14} />
                          {customer.customer_mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <BranchBadge branch={customer.branch} />
                      </td>                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleExpandRow(customer.id)}
                            className="text-green-600 hover:text-green-800 transition"
                            title="View transaction history"
                          >
                            {expandedCustomers.has(customer.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-gray-600 hover:text-gray-800 transition"
                          >
                            <Edit2 size={16} />
                          </button>
                          {userProfile.role === 'owner' && (
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedCustomers.has(customer.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          {loadingExpanded === customer.id ? (
                            <div className="text-center py-4 text-gray-500">Loading transaction history...</div>
                          ) : (
                            <div className="space-y-6">
                              {/* Summary Cards */}
                              <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                                  <p className="text-2xl font-bold text-gray-900">
                                    ৳ {expandedCustomers.get(customer.id)?.totalSales.toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                                  <p className="text-2xl font-bold text-emerald-600">
                                    ৳ {expandedCustomers.get(customer.id)?.totalPaid.toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-1">Outstanding Due</p>
                                  <p className={`text-2xl font-bold ${expandedCustomers.get(customer.id)?.totalDue === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    ৳ {expandedCustomers.get(customer.id)?.totalDue.toLocaleString()}
                                  </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600 mb-1">Delivery Cost</p>
                                  <p className="text-2xl font-bold text-amber-600">
                                    ৳ {expandedCustomers.get(customer.id)?.totalDeliveryCost.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Transactions Table */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Delivery Transactions</h4>
                                {expandedCustomers.get(customer.id)?.deliveries.length === 0 ? (
                                  <div className="text-center py-4 text-gray-500">No transactions with this customer</div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-4 py-2 text-left">Date</th>
                                          <th className="px-4 py-2 text-left">Driver</th>
                                          <th className="px-4 py-2 text-center">Bags</th>
                                          <th className="px-4 py-2 text-right">Sale Amount</th>
                                          <th className="px-4 py-2 text-right">Paid</th>
                                          <th className="px-4 py-2 text-right">Due</th>
                                          <th className="px-4 py-2 text-right">Driver Cost</th>
                                          <th className="px-4 py-2 text-center">Payments</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {expandedCustomers.get(customer.id)?.deliveries.map((delivery) => (
                                          <tr key={delivery.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">{delivery.delivery_date}</td>
                                            <td className="px-4 py-2">{delivery.driver_name}</td>
                                            <td className="px-4 py-2 text-center">{delivery.number_of_bags}</td>
                                            <td className="px-4 py-2 text-right font-medium">৳ {delivery.total_product_price.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right text-emerald-600">৳ {delivery.product_paid_amount.toLocaleString()}</td>
                                            <td className={`px-4 py-2 text-right font-medium ${delivery.product_due_amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                              ৳ {delivery.product_due_amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-right text-amber-600">৳ {delivery.driver_total_cost.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-center">
                                              {delivery.payments && delivery.payments.length > 0 ? (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                  {delivery.payments.length} payments
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

export default Customers;
