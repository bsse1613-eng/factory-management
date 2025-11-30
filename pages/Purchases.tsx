import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Profile, Purchase, PurchasePayment, Supplier } from '../types';
import { Plus, Printer, Wallet, X, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { generatePurchasePDF, printPurchasePDF } from '../services/pdfService';
import { mockPurchases, mockPurchasePayments, mockSuppliers } from '../services/mockData';

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

const Purchases: React.FC<Props> = ({ userProfile }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);

  // Expandable Row State
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedPayments, setExpandedPayments] = useState<PurchasePayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Payment Modal State
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PurchasePayment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    branch: userProfile.branch || 'Bogura',
    supplier_name: '',
    source_location: '',
    product_name: '',
    number_of_bags: '',
    price_per_bag: '',
    paid_amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchPurchases();
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
      .order('supplier_name', { ascending: true });

    if (!error && data) setSuppliers(data as unknown as Supplier[]);
  };

  const fetchPurchases = async () => {
    if (userProfile.id === 'demo') {
        setPurchases(mockPurchases);
        return;
    }

    let query = supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    // Filter by branch for employees
    if (userProfile.role === 'employee' && userProfile.branch) {
        query = query.eq('branch', userProfile.branch);
    }
    
    const { data, error } = await query;
    if (!error && data) setPurchases(data as unknown as Purchase[]);
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
        const demoPayments = mockPurchasePayments.filter(p => p.purchase_id === id);
        setExpandedPayments(demoPayments);
        setLoadingPayments(false);
        return;
    }
    
    const { data } = await supabase
        .from('purchase_payments')
        .select('*')
        .eq('purchase_id', id)
        .order('date', { ascending: true });
    
    setExpandedPayments(data as unknown as PurchasePayment[] || []);
    setLoadingPayments(false);
  };

  const handlePrint = async (purchase: Purchase) => {
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
    
    generatePurchasePDF(purchase, payments);
  };

  const handleDirectPrint = async (purchase: Purchase) => {
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
    
    printPurchasePDF(purchase, payments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const bags = Number(formData.number_of_bags);
    const price = Number(formData.price_per_bag);
    const paid = Number(formData.paid_amount);
    const total = bags * price;
    const due = total - paid;

    if (userProfile.id === 'demo') {
        // Simulation for Demo
        const newPurchase: Purchase = {
            id: `demo-p-${Date.now()}`,
            created_at: new Date().toISOString(),
            date: formData.date,
            branch: formData.branch,
            supplier_name: formData.supplier_name,
            source_location: formData.source_location,
            product_name: formData.product_name,
            number_of_bags: bags,
            price_per_bag: price,
            total_price: total,
            paid_amount: paid,
            due_amount: due,
            notes: formData.notes
        };
        // Just fake update local state
        setPurchases([newPurchase, ...purchases]);
        setShowModal(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            branch: userProfile.branch || 'Bogura',
            supplier_name: '',
            source_location: '',
            product_name: '',
            number_of_bags: '',
            price_per_bag: '',
            paid_amount: '',
            notes: ''
        });
        setLoading(false);
        return;
    }

    const { data: purchaseData, error: purchaseError } = await supabase.from('purchases').insert([{
        date: formData.date,
        branch: formData.branch,
        supplier_name: formData.supplier_name,
        source_location: formData.source_location,
        product_name: formData.product_name,
        number_of_bags: bags,
        price_per_bag: price,
        total_price: total,
        paid_amount: paid,
        notes: formData.notes
    }]).select().single();

    if (!purchaseError && purchaseData) {
        if (paid > 0) {
            await supabase.from('purchase_payments').insert([{
                purchase_id: purchaseData.id,
                date: formData.date,
                amount: paid,
                notes: 'Initial Payment'
            }]);
        }

        setPurchases([purchaseData as unknown as Purchase, ...purchases]);
        setShowModal(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            branch: userProfile.branch || 'Bogura',
            supplier_name: '',
            source_location: '',
            product_name: '',
            number_of_bags: '',
            price_per_bag: '',
            paid_amount: '',
            notes: ''
        });
    } else {
        alert('Error adding purchase: ' + purchaseError?.message);
    }
    setLoading(false);
  };

  const openPaymentModal = async (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowPaymentModal(true);
    setNewPaymentAmount('');
    setNewPaymentNotes('');
    
    if (userProfile.id === 'demo') {
        const demoHistory = mockPurchasePayments.filter(p => p.purchase_id === purchase.id);
        setPaymentHistory(demoHistory);
        return;
    }

    const { data } = await supabase
        .from('purchase_payments')
        .select('*')
        .eq('purchase_id', purchase.id)
        .order('date', { ascending: true });
        
    setPaymentHistory(data as unknown as PurchasePayment[] || []);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    const amount = Number(newPaymentAmount);
    if (amount <= 0) return;

    setLoading(true);

    if (userProfile.id === 'demo') {
        // Simulation
        const newTotalPaid = selectedPurchase.paid_amount + amount;
        const newDue = selectedPurchase.total_price - newTotalPaid;
        
        const updatedPurchase = { ...selectedPurchase, paid_amount: newTotalPaid, due_amount: newDue };
        const updatedList = purchases.map(p => p.id === selectedPurchase.id ? updatedPurchase : p);
        
        setPurchases(updatedList);
        setSelectedPurchase(updatedPurchase);
        
        const newHistoryItem: any = { 
            id: `pay-${Date.now()}`, 
            purchase_id: selectedPurchase.id, 
            date: newPaymentDate, 
            amount: amount, 
            notes: newPaymentNotes || 'Partial Payment' 
        };
        setPaymentHistory([...paymentHistory, newHistoryItem]);
        setNewPaymentAmount('');
        setNewPaymentNotes('');
        
        // Also update expanded view if it's open
        if (expandedRow === selectedPurchase.id) {
            setExpandedPayments([...expandedPayments, newHistoryItem]);
        }
        setLoading(false);
        return;
    }

    const { error: payError } = await supabase.from('purchase_payments').insert([{
        purchase_id: selectedPurchase.id,
        date: newPaymentDate,
        amount: amount,
        notes: newPaymentNotes || 'Partial Payment'
    }]);

    if (!payError) {
        const newTotalPaid = selectedPurchase.paid_amount + amount;
        
        const { data: updatedPurchase, error: updateError } = await supabase
            .from('purchases')
            .update({ paid_amount: newTotalPaid })
            .eq('id', selectedPurchase.id)
            .select()
            .single();

        if (!updateError && updatedPurchase) {
            const updatedList = purchases.map(p => p.id === selectedPurchase.id ? (updatedPurchase as unknown as Purchase) : p);
            setPurchases(updatedList);
            setSelectedPurchase(updatedPurchase as unknown as Purchase);
            
            const newHistoryItem: any = { 
                id: 'temp', 
                purchase_id: selectedPurchase.id, 
                date: newPaymentDate, 
                amount: amount, 
                notes: newPaymentNotes || 'Partial Payment' 
            };
            setPaymentHistory([...paymentHistory, newHistoryItem]);
            setNewPaymentAmount('');
            setNewPaymentNotes('');
            
            // Also update expanded view if it's open
            if (expandedRow === selectedPurchase.id) {
                setExpandedPayments([...expandedPayments, newHistoryItem]);
            }
        }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Raw Material Purchases</h1>
        <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
            <Plus size={18} /> Add Entry
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 w-10"></th>
                        <th className="px-6 py-4">Branch</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Supplier</th>
                        <th className="px-6 py-4">Bags</th>
                        <th className="px-6 py-4">Rate</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Paid</th>
                        <th className="px-6 py-4">Due</th>
                        <th className="px-6 py-4">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {purchases.map((item) => (
                        <React.Fragment key={item.id}>
                            <tr className={`hover:bg-gray-50 transition-colors ${expandedRow === item.id ? getBranchColor(item.branch).bg : ''}`}>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => toggleRow(item.id)}
                                        className="text-gray-400 hover:text-blue-600 focus:outline-none"
                                    >
                                        {expandedRow === item.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <BranchBadge branch={item.branch} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{item.supplier_name}</div>
                                    <div className="text-xs text-gray-400">{item.source_location}</div>
                                </td>
                                <td className="px-6 py-4">{item.number_of_bags}</td>
                                <td className="px-6 py-4">৳ {item.price_per_bag}</td>
                                <td className="px-6 py-4 font-semibold">৳ {item.total_price.toLocaleString()}</td>
                                <td className="px-6 py-4 text-green-600">৳ {item.paid_amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-red-500 font-medium">৳ {item.due_amount.toLocaleString()}</td>
                                <td className="px-6 py-4 flex items-center space-x-3">
                                    <button 
                                        onClick={() => openPaymentModal(item)}
                                        className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1 bg-blue-50 px-2 py-1 rounded" 
                                        title="Manage Payments"
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
                                    <td colSpan={9} className="px-6 py-4">
                                        <div className="ml-8 border-l-2 border-blue-200 pl-4">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Transaction History</h4>
                                            {loadingPayments ? (
                                                <div className="text-sm text-gray-400">Loading details...</div>
                                            ) : expandedPayments.length === 0 ? (
                                                <div className="text-sm text-gray-400">No payment history found.</div>
                                            ) : (
                                                <table className="min-w-full text-xs">
                                                    <thead>
                                                        <tr className="text-gray-400 border-b border-gray-200">
                                                            <th className="py-2 text-left font-medium w-32">Date</th>
                                                            <th className="py-2 text-left font-medium">Notes</th>
                                                            <th className="py-2 text-right font-medium w-32">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {expandedPayments.map((p, idx) => (
                                                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                                <td className="py-2 text-gray-600 align-top">{p.date}</td>
                                                                <td className="py-2 text-gray-500 italic align-top whitespace-pre-wrap">{p.notes || '-'}</td>
                                                                <td className="py-2 text-right font-semibold text-gray-700 align-top">৳ {p.amount.toLocaleString()}</td>
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
                    {purchases.length === 0 && (
                        <tr><td colSpan={9} className="text-center py-8 text-gray-400">No records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">New Purchase</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input 
                                type="date" required
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Branch *</label>
                            <select 
                                required
                                value={formData.branch}
                                onChange={e => setFormData({...formData, branch: e.target.value})}
                                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Branch</option>
                                <option value="Bogura">Bogura</option>
                                <option value="Santahar">Santahar</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier Name *</label>
                        <div className="relative mt-1">
                            <input 
                                type="text"
                                required
                                placeholder="Search or select supplier..."
                                value={formData.supplier_name}
                                onChange={(e) => {
                                    setFormData({...formData, supplier_name: e.target.value});
                                    setSupplierDropdownOpen(true);
                                }}
                                onFocus={() => setSupplierDropdownOpen(true)}
                                className="w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {supplierDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                    {suppliers
                                        .filter(s => s.supplier_name.toLowerCase().includes(formData.supplier_name.toLowerCase()))
                                        .map(supplier => (
                                            <div
                                                key={supplier.id}
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        supplier_name: supplier.supplier_name,
                                                        source_location: supplier.source_location
                                                    });
                                                    setSupplierDropdownOpen(false);
                                                }}
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">{supplier.supplier_name}</div>
                                                <div className="text-xs text-gray-500">{supplier.source_location}</div>
                                            </div>
                                        ))}
                                    {suppliers.filter(s => s.supplier_name.toLowerCase().includes(formData.supplier_name.toLowerCase())).length === 0 && (
                                        <div className="px-4 py-2 text-gray-500 text-sm">No suppliers found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Source Location</label>
                        <input 
                            type="text"
                            value={formData.source_location}
                            onChange={e => setFormData({...formData, source_location: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input 
                            type="text"
                            value={formData.product_name}
                            onChange={e => setFormData({...formData, product_name: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Rice, Wheat, etc."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Number of Bags</label>
                            <input 
                                type="number" required min="1"
                                value={formData.number_of_bags}
                                onChange={e => setFormData({...formData, number_of_bags: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price Per Bag</label>
                            <input 
                                type="number" required min="0"
                                value={formData.price_per_bag}
                                onChange={e => setFormData({...formData, price_per_bag: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded text-center">
                        <span className="text-sm text-gray-500">Total: </span>
                        <span className="font-bold text-lg text-gray-800">
                            ৳ {(Number(formData.number_of_bags) * Number(formData.price_per_bag)).toLocaleString()}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Paid Amount (Initial)</label>
                        <input 
                            type="number" required min="0"
                            value={formData.paid_amount}
                            onChange={e => setFormData({...formData, paid_amount: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter amount paid to supplier"
                        />
                         <p className="text-xs text-red-500 mt-1">
                            Due: ৳ {((Number(formData.number_of_bags) * Number(formData.price_per_bag)) - Number(formData.paid_amount)).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            rows={2}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                        {loading ? 'Saving...' : 'Save Purchase Entry'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Payment Modal - Clean & User-Friendly */}
      {showPaymentModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-2xl font-bold">Payment Management</h2>
                <p className="text-blue-100 text-sm mt-1">Supplier: {selectedPurchase.supplier_name}</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-white hover:bg-blue-800 p-2 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-700">৳ {selectedPurchase.total_price.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-semibold uppercase mb-1">Paid So Far</p>
                  <p className="text-2xl font-bold text-green-700">৳ {selectedPurchase.paid_amount.toLocaleString()}</p>
                </div>
                <div className={`${selectedPurchase.due_amount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'} p-4 rounded-lg border`}>
                  <p className={`text-xs font-semibold uppercase mb-1 ${selectedPurchase.due_amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedPurchase.due_amount > 0 ? 'Remaining Due' : 'Fully Paid'}
                  </p>
                  <p className={`text-2xl font-bold ${selectedPurchase.due_amount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    ৳ {selectedPurchase.due_amount.toLocaleString()}
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment</h3>
                  <form onSubmit={handleAddPayment} className="space-y-4">
                    {/* Payment Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                      <input 
                        type="date" 
                        required
                        value={newPaymentDate}
                        onChange={(e) => setNewPaymentDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                      </div>
                      {newPaymentAmount && parseInt(newPaymentAmount) > selectedPurchase.due_amount && (
                        <p className="text-xs text-amber-600 mt-2">⚠ Amount exceeds due amount by ৳ {(parseInt(newPaymentAmount) - selectedPurchase.due_amount).toLocaleString()}</p>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit"
                      disabled={loading || selectedPurchase.due_amount <= 0 || !newPaymentAmount}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition mt-6"
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

                    {selectedPurchase.due_amount <= 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                        <p className="text-sm text-emerald-700 font-medium">✓ This purchase is fully paid!</p>
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

export default Purchases;