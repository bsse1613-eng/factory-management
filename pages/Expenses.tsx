import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Profile, Expense } from '../types';
import { Plus } from 'lucide-react';
import { mockExpenses } from '../services/mockData';

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

const Expenses: React.FC<Props> = ({ userProfile }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Material' as 'Material' | 'Labor',
    item_name: '',
    quantity: '',
    total_cost: '',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, [userProfile]);

  const fetchExpenses = async () => {
    if (userProfile.id === 'demo') {
        setExpenses(mockExpenses);
        return;
    }

    let query = supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    // Filter by branch for employees
    if (userProfile.role === 'employee' && userProfile.branch) {
        query = query.eq('branch', userProfile.branch);
    }
    
    const { data, error } = await query;
    if (!error && data) setExpenses(data as unknown as Expense[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (userProfile.id === 'demo') {
        const newExpense: Expense = {
            id: `exp-${Date.now()}`,
            created_at: new Date().toISOString(),
            date: formData.date,
            branch: userProfile.branch || 'Bogura',
            category: formData.category,
            item_name: formData.item_name,
            quantity: formData.quantity ? Number(formData.quantity) : undefined,
            total_cost: Number(formData.total_cost),
            notes: formData.notes
        };
        setExpenses([newExpense, ...expenses]);
        setShowModal(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            category: 'Material',
            item_name: '',
            quantity: '',
            total_cost: '',
            notes: ''
        });
        setLoading(false);
        return;
    }

    const { data, error } = await supabase.from('expenses').insert([{
        date: formData.date,
        branch: userProfile.branch || 'Bogura',
        category: formData.category,
        item_name: formData.item_name,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        total_cost: Number(formData.total_cost),
        notes: formData.notes
    }]).select().single();

    if (!error && data) {
        setExpenses([data as unknown as Expense, ...expenses]);
        setShowModal(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            category: 'Material',
            item_name: '',
            quantity: '',
            total_cost: '',
            notes: ''
        });
    } else {
        alert('Error: ' + error?.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Factory Expenses</h1>
        <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
            <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Branch</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Item/Description</th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Cost</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {expenses.map((item) => (
                        <tr key={item.id} className={`hover:bg-gray-50 ${getBranchColor(item.branch).bg}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <BranchBadge branch={item.branch} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.category === 'Labor' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                    {item.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">{item.item_name || '-'}</td>
                            <td className="px-6 py-4">{item.quantity || '-'}</td>
                            <td className="px-6 py-4 font-bold text-gray-700">৳ {item.total_cost.toLocaleString()}</td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">No expenses recorded.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Add Expense</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" required
                            value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                            className="mt-1 w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value as any})}
                            className="mt-1 w-full border border-gray-300 rounded-md p-2"
                        >
                            <option value="Material">Material (Rope, Poly, etc.)</option>
                            <option value="Labor">Daily Labor</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Item Name / Description</label>
                        <input type="text" required
                            placeholder={formData.category === 'Labor' ? 'e.g. 5 Laborers' : 'e.g. Plastic Rope'}
                            value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})}
                            className="mt-1 w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity (Optional)</label>
                            <input type="number"
                                value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                            <input type="number" required
                                value={formData.total_cost} onChange={e => setFormData({...formData, total_cost: e.target.value})}
                                className="mt-1 w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                    >
                        {loading ? 'Saving...' : 'Add Expense'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;