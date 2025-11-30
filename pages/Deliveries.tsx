import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Profile, Delivery, DeliveryPayment, Customer } from '../types';
import { Plus, Printer, Wallet, X, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { generateDeliveryPDF, printDeliveryPDF } from '../services/pdfService';
import { mockDeliveries, mockDeliveryPayments, mockCustomers, mockTrucks } from '../services/mockData';

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

const Deliveries: React.FC<Props> = ({ userProfile }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [truckDropdownOpen, setTruckDropdownOpen] = useState(false);

  // Expandable Row State
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedPayments, setExpandedPayments] = useState<DeliveryPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Payment Modal State
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<DeliveryPayment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State
  const [formData, setFormData] = useState({
    delivery_date: new Date().toISOString().split('T')[0],
    branch: userProfile.branch || 'Bogura',
    customer_name: '',
    customer_address: '',
    customer_mobile: '',
    driver_name: '',
    truck_number: '',
    product_name: '',
    number_of_bags: '',
    price_per_bag: '',
    product_paid_amount: '',
    driver_payment_amount: '',
    driver_extra_cost: '',
    driver_notes: ''
  });

  useEffect(() => {
    fetchDeliveries();
    fetchCustomers();
    fetchTrucks();
  }, [userProfile]);

  const fetchCustomers = async () => {
    if (userProfile.id === 'demo') {
      setCustomers(mockCustomers);
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('customer_name', { ascending: true });

    if (!error && data) setCustomers(data as unknown as Customer[]);
  };

  const fetchTrucks = async () => {
    if (userProfile.id === 'demo') {
      setTrucks(mockTrucks);
      return;
    }

    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .order('truck_number', { ascending: true });

    if (!error && data) setTrucks(data as unknown as Truck[]);
  };

  const fetchDeliveries = async () => {
    if (userProfile.id === 'demo') {
        setDeliveries(mockDeliveries);
        return;
    }

    let query = supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    // Filter by branch for employees
    if (userProfile.role === 'employee' && userProfile.branch) {
        query = query.eq('branch', userProfile.branch);
    }
    
    const { data, error } = await query;
    if (!error && data) setDeliveries(data as unknown as Delivery[]);
  };

  const toggleRow = async (id: string) => {
    if (expandedRow === id) {
        setExpandedRow(null);
        setExpandedPayments([]);
        return;
    }
    
    setExpandedRow(id);
    setLoadingPayments(true);

    if (userProfile.id === 'demo') {
        const demoPayments = mockDeliveryPayments.filter(p => p.delivery_id === id);
        setExpandedPayments(demoPayments);
        setLoadingPayments(false);
        return;
    }

    const { data } = await supabase
        .from('delivery_payments')
        .select('*')
        .eq('delivery_id', id)
        .order('date', { ascending: true });
    
    setExpandedPayments(data as unknown as DeliveryPayment[] || []);
    setLoadingPayments(false);
  };

  const handlePrint = async (delivery: Delivery) => {
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
    
    generateDeliveryPDF(delivery, payments);
  };

  const handleDirectPrint = async (delivery: Delivery) => {
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
    
    printDeliveryPDF(delivery, payments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const productPaid = Number(formData.product_paid_amount);
    const bags = Number(formData.number_of_bags);
    const price = Number(formData.price_per_bag);
    const total = bags * price;
    const due = total - productPaid;
    const driverTotal = Number(formData.driver_payment_amount) + Number(formData.driver_extra_cost);

    if (userProfile.id === 'demo') {
        // Simulation
        const newDelivery: Delivery = {
            id: `demo-d-${Date.now()}`,
            created_at: new Date().toISOString(),
            delivery_date: formData.delivery_date,
            branch: formData.branch,
            customer_name: formData.customer_name,
            customer_address: formData.customer_address,
            customer_mobile: formData.customer_mobile,
            driver_name: formData.driver_name,
            truck_number: formData.truck_number,
            product_name: formData.product_name,
            number_of_bags: bags,
            price_per_bag: price,
            total_product_price: total,
            product_paid_amount: productPaid,
            product_due_amount: due,
            driver_payment_amount: Number(formData.driver_payment_amount),
            driver_extra_cost: Number(formData.driver_extra_cost),
            driver_total_cost: driverTotal,
            driver_notes: formData.driver_notes
        };
        setDeliveries([newDelivery, ...deliveries]);
        setShowModal(false);
        setFormData({
            delivery_date: new Date().toISOString().split('T')[0],
            branch: userProfile.branch || 'Bogura',
            customer_name: '',
            customer_address: '',
            customer_mobile: '',
            driver_name: '',
            truck_number: '',
            product_name: '',
            number_of_bags: '',
            price_per_bag: '',
            product_paid_amount: '',
            driver_payment_amount: '',
            driver_extra_cost: '',
            driver_notes: ''
        });
        setLoading(false);
        return;
    }

    const { data, error } = await supabase.from('deliveries').insert([{
        delivery_date: formData.delivery_date,
        branch: formData.branch,
        customer_name: formData.customer_name,
        customer_address: formData.customer_address,
        customer_mobile: formData.customer_mobile,
        driver_name: formData.driver_name,
        truck_number: formData.truck_number,
        product_name: formData.product_name,
        number_of_bags: bags,
        price_per_bag: price,
        total_product_price: total,
        product_paid_amount: productPaid,
        driver_payment_amount: Number(formData.driver_payment_amount),
        driver_extra_cost: Number(formData.driver_extra_cost),
        driver_notes: formData.driver_notes
    }]).select().single();

    if (!error && data) {
        if (productPaid > 0) {
            await supabase.from('delivery_payments').insert([{
                delivery_id: data.id,
                date: formData.delivery_date,
                amount: productPaid,
                notes: 'Initial Payment'
            }]);
        }

        setDeliveries([data as unknown as Delivery, ...deliveries]);
        setShowModal(false);
        setFormData({
            delivery_date: new Date().toISOString().split('T')[0],
            customer_name: '',
            customer_address: '',
            customer_mobile: '',
            driver_name: '',
            truck_number: '',
            number_of_bags: '',
            price_per_bag: '',
            product_paid_amount: '',
            driver_payment_amount: '',
            driver_extra_cost: '',
            driver_notes: ''
        });
    } else {
        alert('Error: ' + error?.message);
    }
    setLoading(false);
  };

  const openPaymentModal = async (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowPaymentModal(true);
    setNewPaymentAmount('');
    setNewPaymentNotes('');
    
    if (userProfile.id === 'demo') {
        const demoHistory = mockDeliveryPayments.filter(p => p.delivery_id === delivery.id);
        setPaymentHistory(demoHistory);
        return;
    }

    const { data } = await supabase
        .from('delivery_payments')
        .select('*')
        .eq('delivery_id', delivery.id)
        .order('date', { ascending: true });
        
    setPaymentHistory(data as unknown as DeliveryPayment[] || []);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const amount = Number(newPaymentAmount);
    if (amount <= 0) return;

    setLoading(true);

    if (userProfile.id === 'demo') {
        // Simulation
        const newTotalPaid = selectedDelivery.product_paid_amount + amount;
        const newDue = selectedDelivery.total_product_price - newTotalPaid;

        const updatedDelivery = { ...selectedDelivery, product_paid_amount: newTotalPaid, product_due_amount: newDue };
        const updatedList = deliveries.map(d => d.id === selectedDelivery.id ? updatedDelivery : d);
        
        setDeliveries(updatedList);
        setSelectedDelivery(updatedDelivery);
        
        const newHistoryItem: any = { 
            id: `dpay-${Date.now()}`, 
            delivery_id: selectedDelivery.id, 
            date: newPaymentDate, 
            amount: amount, 
            notes: newPaymentNotes || 'Customer Partial Payment' 
        };
        setPaymentHistory([...paymentHistory, newHistoryItem]);
        setNewPaymentAmount('');
        setNewPaymentNotes('');

         // Also update expanded view if it's open
        if (expandedRow === selectedDelivery.id) {
            setExpandedPayments([...expandedPayments, newHistoryItem]);
        }
        setLoading(false);
        return;
    }

    const { error: payError } = await supabase.from('delivery_payments').insert([{
        delivery_id: selectedDelivery.id,
        date: newPaymentDate,
        amount: amount,
        notes: newPaymentNotes || 'Customer Partial Payment'
    }]);

    if (!payError) {
        const newTotalPaid = selectedDelivery.product_paid_amount + amount;
        
        const { data: updatedDelivery, error: updateError } = await supabase
            .from('deliveries')
            .update({ product_paid_amount: newTotalPaid })
            .eq('id', selectedDelivery.id)
            .select()
            .single();

        if (!updateError && updatedDelivery) {
            const updatedList = deliveries.map(d => d.id === selectedDelivery.id ? (updatedDelivery as unknown as Delivery) : d);
            setDeliveries(updatedList);
            setSelectedDelivery(updatedDelivery as unknown as Delivery);
            
            const newHistoryItem: any = { 
                id: 'temp', 
                delivery_id: selectedDelivery.id, 
                date: newPaymentDate, 
                amount: amount, 
                notes: newPaymentNotes || 'Customer Partial Payment' 
            };
            setPaymentHistory([...paymentHistory, newHistoryItem]);
            setNewPaymentAmount('');
            setNewPaymentNotes('');

             // Also update expanded view if it's open
            if (expandedRow === selectedDelivery.id) {
                setExpandedPayments([...expandedPayments, newHistoryItem]);
            }
        }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Sales & Delivery</h1>
        <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
            <Plus size={18} /> New Delivery
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 w-10"></th>
                        <th className="px-6 py-4">Branch</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Goods</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Cust. Due</th>
                        <th className="px-6 py-4">Driver Cost</th>
                        <th className="px-6 py-4">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {deliveries.map((item) => (
                        <React.Fragment key={item.id}>
                            <tr className={`hover:bg-gray-50 transition-colors ${expandedRow === item.id ? getBranchColor(item.branch).bg : ''}`}>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => toggleRow(item.id)}
                                        className="text-gray-400 hover:text-green-600 focus:outline-none"
                                    >
                                        {expandedRow === item.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <BranchBadge branch={item.branch} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.delivery_date}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{item.customer_name}</div>
                                    <div className="text-xs text-gray-400">{item.customer_mobile}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {item.number_of_bags} Bags <br/>
                                    <span className="text-xs text-gray-400">@{item.price_per_bag}</span>
                                </td>
                                <td className="px-6 py-4">৳ {item.total_product_price.toLocaleString()}</td>
                                <td className="px-6 py-4 text-red-500 font-semibold">৳ {item.product_due_amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-900">৳ {item.driver_total_cost.toLocaleString()}</div>
                                    <div className="text-xs text-gray-400">{item.truck_number}</div>
                                </td>
                                <td className="px-6 py-4 flex items-center space-x-3">
                                    <button 
                                        onClick={() => openPaymentModal(item)}
                                        className="text-green-600 hover:text-green-800 transition flex items-center gap-1 bg-green-50 px-2 py-1 rounded"
                                        title="Receive Payment"
                                    >
                                        <Wallet size={16} /> Pay
                                    </button>
                                    <button 
                                        onClick={() => handlePrint(item)}
                                        className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs font-medium"
                                        title="Download PDF"
                                    >
                                        <Download size={16} /> Download
                                    </button>
                                    <button 
                                        onClick={() => handleDirectPrint(item)}
                                        className="text-gray-700 hover:text-gray-900 transition flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-medium"
                                        title="Direct Print"
                                    >
                                        <Printer size={16} /> Print
                                    </button>
                                </td>
                            </tr>
                            {/* Expanded Row for History */}
                            {expandedRow === item.id && (
                                <tr className="bg-gray-50">
                                    <td colSpan={8} className="px-6 py-4">
                                        <div className="ml-8 border-l-2 border-green-200 pl-4">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Transaction History</h4>
                                            {loadingPayments ? (
                                                <div className="text-sm text-gray-400">Loading details...</div>
                                            ) : expandedPayments.length === 0 ? (
                                                <div className="text-sm text-gray-400">No payment history found.</div>
                                            ) : (
                                                <table className="min-w-full text-xs">
                                                    <thead>
                                                        <tr className="text-gray-400 border-b border-gray-200">
                                                            <th className="py-2 text-left font-medium">Date</th>
                                                            <th className="py-2 text-left font-medium">Notes</th>
                                                            <th className="py-2 text-right font-medium">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {expandedPayments.map((p, idx) => (
                                                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                                <td className="py-2 text-gray-600">{p.date}</td>
                                                                <td className="py-2 text-gray-500 italic">{p.notes || '-'}</td>
                                                                <td className="py-2 text-right font-semibold text-gray-700">৳ {p.amount.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    {deliveries.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-8 text-gray-400">No deliveries found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* New Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">New Delivery Entry</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 0: Branch Selection */}
                    <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase">Branch Selection</h3>
                        <select 
                            required
                            value={formData.branch}
                            onChange={e => setFormData({...formData, branch: e.target.value})}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                        >
                            <option value="">-- Select Branch --</option>
                            <option value="Bogura">🔵 Bogura Branch</option>
                            <option value="Santahar">🟣 Santahar Branch</option>
                        </select>
                    </div>

                    {/* Section 1: Customer */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Customer Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                                <div className="relative mt-1">
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Search or select customer..."
                                        value={formData.customer_name}
                                        onChange={(e) => {
                                            setFormData({...formData, customer_name: e.target.value});
                                            setCustomerDropdownOpen(true);
                                        }}
                                        onFocus={() => setCustomerDropdownOpen(true)}
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                    {customerDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                            {customers
                                                .filter(c => c.customer_name.toLowerCase().includes(formData.customer_name.toLowerCase()))
                                                .map(customer => (
                                                    <div
                                                        key={customer.id}
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                customer_name: customer.customer_name,
                                                                customer_address: customer.customer_address,
                                                                customer_mobile: customer.customer_mobile
                                                            });
                                                            setCustomerDropdownOpen(false);
                                                        }}
                                                        className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                                                    >
                                                        <div className="font-medium text-gray-900">{customer.customer_name}</div>
                                                        <div className="text-xs text-gray-500">{customer.customer_address} • {customer.customer_mobile}</div>
                                                    </div>
                                                ))}
                                            {customers.filter(c => c.customer_name.toLowerCase().includes(formData.customer_name.toLowerCase())).length === 0 && (
                                                <div className="px-4 py-2 text-gray-500 text-sm">No customers found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                                <input type="text"
                                    value={formData.customer_mobile} onChange={e => setFormData({...formData, customer_mobile: e.target.value})}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Address</label>
                             <input type="text"
                                value={formData.customer_address} onChange={e => setFormData({...formData, customer_address: e.target.value})}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                             />
                        </div>
                    </div>

                    {/* Section 2: Product */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Product Details</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bags</label>
                                <input type="number" required
                                    value={formData.number_of_bags} onChange={e => setFormData({...formData, number_of_bags: e.target.value})}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price/Bag</label>
                                <input type="number" required
                                    value={formData.price_per_bag} onChange={e => setFormData({...formData, price_per_bag: e.target.value})}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Customer Paid (Initial)</label>
                                <input type="number" required
                                    value={formData.product_paid_amount} onChange={e => setFormData({...formData, product_paid_amount: e.target.value})}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                        </div>
                        <div className="bg-green-50 p-2 rounded text-center text-sm">
                            Total: ৳ {(Number(formData.number_of_bags) * Number(formData.price_per_bag)).toLocaleString()} | 
                            Due: <span className="text-red-500">৳ {((Number(formData.number_of_bags) * Number(formData.price_per_bag)) - Number(formData.product_paid_amount)).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Section 3: Driver */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Transport / Driver</h3>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Truck / Driver *</label>
                                <div className="relative mt-1">
                                    <input 
                                        type="text"
                                        placeholder="Search truck or driver..."
                                        value={formData.truck_number}
                                        onChange={(e) => {
                                            setFormData({...formData, truck_number: e.target.value});
                                            setTruckDropdownOpen(true);
                                        }}
                                        onFocus={() => setTruckDropdownOpen(true)}
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                    {truckDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                            {trucks
                                                .filter(t => 
                                                    t.truck_number.toLowerCase().includes(formData.truck_number.toLowerCase()) ||
                                                    t.driver_name.toLowerCase().includes(formData.truck_number.toLowerCase())
                                                )
                                                .map(truck => (
                                                    <div
                                                        key={truck.id}
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                truck_number: truck.truck_number,
                                                                driver_name: truck.driver_name
                                                            });
                                                            setTruckDropdownOpen(false);
                                                        }}
                                                        className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                                                    >
                                                        <div className="font-medium text-gray-900">{truck.truck_number}</div>
                                                        <div className="text-xs text-gray-500">Driver: {truck.driver_name} • {truck.driver_mobile}</div>
                                                    </div>
                                                ))}
                                            {trucks.filter(t => 
                                                t.truck_number.toLowerCase().includes(formData.truck_number.toLowerCase()) ||
                                                t.driver_name.toLowerCase().includes(formData.truck_number.toLowerCase())
                                            ).length === 0 && (
                                                <div className="px-4 py-2 text-gray-500 text-sm">
                                                    {trucks.length === 0 ? 'No trucks registered' : 'No matching trucks found'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Driver Name (Auto-filled)</label>
                                <input type="text"
                                    value={formData.driver_name} 
                                    readOnly
                                    placeholder="Select truck above"
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-600"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Product Name</label>
                            <input type="text"
                                value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                placeholder="e.g., Rice, Wheat, etc."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Driver Payment</label>
                                <input type="number"
                                    value={formData.driver_payment_amount} onChange={e => setFormData({...formData, driver_payment_amount: e.target.value})}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Extra Cost</label>
                                <input type="number"
                                    value={formData.driver_extra_cost} onChange={e => setFormData({...formData, driver_extra_cost: e.target.value})}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                        {loading ? 'Processing...' : 'Complete Delivery Entry'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Payment Modal - Clean & User-Friendly */}
      {showPaymentModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-2xl font-bold">Payment Management</h2>
                <p className="text-green-100 text-sm mt-1">Customer: {selectedDelivery.customer_name}</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-white hover:bg-green-800 p-2 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-700">৳ {selectedDelivery.total_product_price.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-semibold uppercase mb-1">Received</p>
                  <p className="text-2xl font-bold text-green-700">৳ {selectedDelivery.product_paid_amount.toLocaleString()}</p>
                </div>
                <div className={`${selectedDelivery.product_due_amount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'} p-4 rounded-lg border`}>
                  <p className={`text-xs font-semibold uppercase mb-1 ${selectedDelivery.product_due_amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedDelivery.product_due_amount > 0 ? 'Remaining Due' : 'Fully Paid'}
                  </p>
                  <p className={`text-2xl font-bold ${selectedDelivery.product_due_amount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    ৳ {selectedDelivery.product_due_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Payment History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto border border-gray-200">
                    {paymentHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-sm">No payments recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentHistory.map((p, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 font-medium">{p.date}</p>
                                <p className="text-sm text-gray-700 mt-1">{p.notes || '(No notes)'}</p>
                              </div>
                              <p className="text-lg font-bold text-green-600 ml-4">৳ {p.amount.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Add New Payment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Receive Payment</h3>
                  <form onSubmit={handleAddPayment} className="space-y-4">
                    {/* Payment Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                      <input 
                        type="date" 
                        required
                        value={newPaymentDate}
                        onChange={(e) => setNewPaymentDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount (৳) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500 font-medium">৳</span>
                        <input 
                          type="number" 
                          required 
                          min="1"
                          value={newPaymentAmount}
                          onChange={(e) => setNewPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                        />
                      </div>
                      {newPaymentAmount && parseInt(newPaymentAmount) > selectedDelivery.product_due_amount && (
                        <p className="text-xs text-amber-600 mt-2">⚠ Amount exceeds due amount by ৳ {(parseInt(newPaymentAmount) - selectedDelivery.product_due_amount).toLocaleString()}</p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method / Notes</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Bank Transfer, Cash, Cheque"
                        value={newPaymentNotes}
                        onChange={(e) => setNewPaymentNotes(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit"
                      disabled={loading || selectedDelivery.product_due_amount <= 0 || !newPaymentAmount}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition mt-6"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        'Record Payment'
                      )}
                    </button>

                    {selectedDelivery.product_due_amount <= 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                        <p className="text-sm text-emerald-700 font-medium">✓ This delivery is fully paid!</p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deliveries;