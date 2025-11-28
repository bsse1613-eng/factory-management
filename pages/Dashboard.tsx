import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { DashboardSummary, Profile, Branch, Purchase, Delivery, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, Truck, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { mockPurchases, mockDeliveries, mockExpenses } from '../services/mockData';

interface DashboardProps {
  userProfile: Profile;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [stats, setStats] = useState<DashboardSummary>({
    totalPurchase: 0,
    totalSales: 0,
    totalDeliveryCost: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalDueReceivable: 0,
    totalDuePayable: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | 'All'>('All');
  
  // Detailed data for daily report
  const [dailyPurchases, setDailyPurchases] = useState<Purchase[]>([]);
  const [dailyDeliveries, setDailyDeliveries] = useState<Delivery[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<Expense[]>([]);
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  // Set initial branch based on user role
  useEffect(() => {
    if (userProfile.role === 'employee' && userProfile.branch) {
      setSelectedBranch(userProfile.branch);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchStats();
  }, [filterDate, selectedBranch]);

  const fetchStats = async () => {
    setLoading(true);

    if (userProfile.id === 'demo') {
        // Mock Data Logic
        let pData = mockPurchases.filter(p => p.date === filterDate);
        let dData = mockDeliveries.filter(d => d.delivery_date === filterDate);
        let eData = mockExpenses.filter(e => e.date === filterDate);

        if (selectedBranch !== 'All') {
            pData = pData.filter(p => p.branch === selectedBranch);
            dData = dData.filter(d => d.branch === selectedBranch);
            eData = eData.filter(e => e.branch === selectedBranch);
        }

        const totalPurchase = pData.reduce((sum, item) => sum + item.total_price, 0);
        const totalSales = dData.reduce((sum, item) => sum + item.total_product_price, 0);
        const totalDeliveryCost = dData.reduce((sum, item) => sum + item.driver_total_cost, 0);
        const totalExpenses = eData.reduce((sum, item) => sum + item.total_cost, 0);
        const netProfit = totalSales - (totalPurchase + totalDeliveryCost + totalExpenses);

        // For dues, we typically want total outstanding across ALL time, not just today
        // But for dashboard simplicity matching the prompt, we can calculate today or all.
        // Let's do ALL time dues for better utility, but the original code did 'filterDate'.
        // We will stick to the filtered logic for consistency.
        const totalDuePayable = pData.reduce((sum, item) => sum + item.due_amount, 0);
        const totalDueReceivable = dData.reduce((sum, item) => sum + item.product_due_amount, 0);

        setStats({
            totalPurchase,
            totalSales,
            totalDeliveryCost,
            totalExpenses,
            netProfit,
            totalDuePayable,
            totalDueReceivable
        });
        
        // Store detailed data
        setDailyPurchases(pData);
        setDailyDeliveries(dData);
        setDailyExpenses(eData);
        
        setLoading(false);
        return;
    }

    // Real Supabase Logic
    let purchaseQuery = supabase.from('purchases').select('*');
    let deliveryQuery = supabase.from('deliveries').select('*');
    let expenseQuery = supabase.from('expenses').select('*');

    // Date Filter
    purchaseQuery = purchaseQuery.eq('date', filterDate);
    deliveryQuery = deliveryQuery.eq('delivery_date', filterDate);
    expenseQuery = expenseQuery.eq('date', filterDate);

    // Branch Filter (If Owner selects specific or if User is Employee)
    if (userProfile.role === 'employee' && userProfile.branch) {
        purchaseQuery = purchaseQuery.eq('branch', userProfile.branch);
        deliveryQuery = deliveryQuery.eq('branch', userProfile.branch);
        expenseQuery = expenseQuery.eq('branch', userProfile.branch);
    } else if (selectedBranch !== 'All') {
        purchaseQuery = purchaseQuery.eq('branch', selectedBranch);
        deliveryQuery = deliveryQuery.eq('branch', selectedBranch);
        expenseQuery = expenseQuery.eq('branch', selectedBranch);
    }

    const [purchases, deliveries, expenses] = await Promise.all([
        purchaseQuery,
        deliveryQuery,
        expenseQuery
    ]);

    const pData = purchases.data || [];
    const dData = deliveries.data || [];
    const eData = expenses.data || [];

    const totalPurchase = pData.reduce((sum, item) => sum + item.total_price, 0);
    const totalSales = dData.reduce((sum, item) => sum + item.total_product_price, 0);
    const totalDeliveryCost = dData.reduce((sum, item) => sum + item.driver_total_cost, 0);
    const totalExpenses = eData.reduce((sum, item) => sum + item.total_cost, 0);
    
    // Profit Calculation: Sales - (Purchase + Delivery + Expenses)
    const netProfit = totalSales - (totalPurchase + totalDeliveryCost + totalExpenses);

    // Calculate Dues (Outstanding)
    const totalDuePayable = pData.reduce((sum, item) => sum + item.due_amount, 0);
    const totalDueReceivable = dData.reduce((sum, item) => sum + item.product_due_amount, 0);

    setStats({
        totalPurchase,
        totalSales,
        totalDeliveryCost,
        totalExpenses,
        netProfit,
        totalDuePayable,
        totalDueReceivable
    });
    
    // Store detailed data
    setDailyPurchases(pData as unknown as Purchase[]);
    setDailyDeliveries(dData as unknown as Delivery[]);
    setDailyExpenses(eData as unknown as Expense[]);
    
    setLoading(false);
  };

  const generateDailyReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Daily Business Summary', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Date: ${filterDate}`, 14, 30);
    doc.text(`Branch: ${userProfile.role === 'owner' ? selectedBranch : userProfile.branch}`, 14, 36);

    // Summary Section
    const summaryData = [
        ['Metric', 'Amount (BDT)'],
        ['Total Sales/Income', stats.totalSales.toLocaleString()],
        ['Total Purchase', stats.totalPurchase.toLocaleString()],
        ['Total Driver Costs', stats.totalDeliveryCost.toLocaleString()],
        ['Factory Expenses', stats.totalExpenses.toLocaleString()],
        ['NET PROFIT/LOSS', stats.netProfit.toLocaleString()],
    ];

    autoTable(doc, {
        startY: 45,
        head: [['Summary', 'Amount']],
        body: summaryData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Deliveries Section
    if (dailyDeliveries.length > 0) {
        doc.setFontSize(12);
        doc.text('Detailed Deliveries (Sales Income)', 14, currentY);
        
        const deliveryData = [
            ['Customer', 'Driver', 'Bags', 'Rate', 'Total', 'Paid', 'Due'],
            ...dailyDeliveries.map(d => [
                d.customer_name,
                d.driver_name,
                d.number_of_bags.toString(),
                `${d.price_per_bag}`,
                d.total_product_price.toLocaleString(),
                d.product_paid_amount.toLocaleString(),
                d.product_due_amount.toLocaleString()
            ])
        ];

        autoTable(doc, {
            startY: currentY + 5,
            head: [deliveryData[0]],
            body: deliveryData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [34, 139, 34] },
            columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Detailed Purchases Section
    if (dailyPurchases.length > 0) {
        doc.setFontSize(12);
        doc.text('Detailed Purchases', 14, currentY);
        
        const purchaseData = [
            ['Supplier', 'Location', 'Bags', 'Rate', 'Total', 'Paid', 'Due'],
            ...dailyPurchases.map(p => [
                p.supplier_name,
                p.source_location,
                p.number_of_bags.toString(),
                `${p.price_per_bag}`,
                p.total_price.toLocaleString(),
                p.paid_amount.toLocaleString(),
                p.due_amount.toLocaleString()
            ])
        ];

        autoTable(doc, {
            startY: currentY + 5,
            head: [purchaseData[0]],
            body: purchaseData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 139] },
            columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Outstanding Balances Section
    doc.setFontSize(12);
    doc.text('Outstanding Balances (Today)', 14, currentY);
    autoTable(doc, {
        startY: currentY + 5,
        body: [
            ['Receivable from Customers (Due)', stats.totalDueReceivable.toLocaleString()],
            ['Payable to Suppliers (Due)', stats.totalDuePayable.toLocaleString()]
        ],
        theme: 'striped'
    });

    // Signature Area
    doc.text('__________________', 150, 270);
    doc.text('Owner Signature', 150, 275);

    doc.save(`Daily_Report_${filterDate}.pdf`);
  };

  // Branch color scheme
  const getBranchColor = (branch: Branch | 'All') => {
    if (branch === 'Bogura') return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' };
    if (branch === 'Santahar') return { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' };
    return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' };
  };

  const BranchBadge = ({ branch }: { branch: Branch | 'All' }) => {
    const colors = getBranchColor(branch);
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
        <span className={`w-2 h-2 rounded-full mr-1.5 ${colors.border.replace('border-', 'bg-')}`}></span>
        {branch}
      </span>
    );
  };

  const StatCard = ({ title, value, color, icon: Icon, subValue }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            ৳ {value.toLocaleString()}
          </h3>
          {subValue && (
             <p className="text-xs text-red-500 mt-1 font-medium">{subValue}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color.replace('border-', 'bg-').replace('500', '100')}`}>
          <Icon className={`h-6 w-6 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>
              {userProfile.role === 'owner' ? (
                <BranchBadge branch={selectedBranch} />
              ) : (
                <BranchBadge branch={userProfile.branch || 'All'} />
              )}
            </div>
            <p className="text-sm text-gray-500">Welcome back, {userProfile.full_name || 'User'} {userProfile.id === 'demo' && <span className="text-orange-500 font-bold">(Demo Mode)</span>}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
             <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {userProfile.role === 'owner' && (
                <select 
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="All">All Branches</option>
                    <option value="Bogura">Bogura</option>
                    <option value="Santahar">Santahar</option>
                </select>
            )}
            <button 
                onClick={generateDailyReport}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
                Download Daily PDF
            </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading statistics...</div>
      ) : (
        <>
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Sales" 
                    value={stats.totalSales} 
                    color="border-green-500" 
                    icon={TrendingUp} 
                    subValue={`Due: ৳ ${stats.totalDueReceivable.toLocaleString()}`}
                />
                <StatCard 
                    title="Total Purchase" 
                    value={stats.totalPurchase} 
                    color="border-blue-500" 
                    icon={ShoppingCart} 
                    subValue={`Due: ৳ ${stats.totalDuePayable.toLocaleString()}`}
                />
                <StatCard 
                    title="Driver/Delivery Cost" 
                    value={stats.totalDeliveryCost} 
                    color="border-orange-500" 
                    icon={Truck} 
                />
                <StatCard 
                    title="Factory Expenses" 
                    value={stats.totalExpenses} 
                    color="border-red-500" 
                    icon={DollarSign} 
                />
            </div>

            {/* Detailed Transactions Section */}
            <div className={`${getBranchColor(selectedBranch === 'All' ? 'All' : selectedBranch).bg} rounded-xl shadow-sm p-6 border-l-4 ${getBranchColor(selectedBranch === 'All' ? 'All' : selectedBranch).border}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Daily Transactions Detail</h2>
                    <button 
                        onClick={() => setShowDetailedReport(!showDetailedReport)}
                        className="text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
                    >
                        {showDetailedReport ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        {showDetailedReport ? 'Hide Details' : 'Show Details'}
                    </button>
                </div>

                {showDetailedReport && (
                    <div className="space-y-8">
                        {/* Deliveries Section */}
                        <div>
                            <h3 className="text-md font-semibold text-gray-700 mb-4 text-green-600">Sales/Deliveries ({dailyDeliveries.length})</h3>
                            {dailyDeliveries.length === 0 ? (
                                <p className="text-gray-400 text-sm">No deliveries recorded for this date.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-gray-600">
                                        <thead className="bg-green-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                                                <th className="px-4 py-3 text-left font-semibold">Driver</th>
                                                <th className="px-4 py-3 text-center font-semibold">Bags</th>
                                                <th className="px-4 py-3 text-right font-semibold">Rate</th>
                                                <th className="px-4 py-3 text-right font-semibold">Total Price</th>
                                                <th className="px-4 py-3 text-right font-semibold">Paid</th>
                                                <th className="px-4 py-3 text-right font-semibold">Due</th>
                                                <th className="px-4 py-3 text-right font-semibold">Driver Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {dailyDeliveries.map((delivery) => (
                                                <tr key={delivery.id} className="hover:bg-green-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900">{delivery.customer_name}</div>
                                                        <div className="text-xs text-gray-400">{delivery.customer_address}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">{delivery.driver_name}</td>
                                                    <td className="px-4 py-3 text-center">{delivery.number_of_bags}</td>
                                                    <td className="px-4 py-3 text-right">৳ {delivery.price_per_bag}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">৳ {delivery.total_product_price.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-medium">৳ {delivery.product_paid_amount.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-medium">৳ {delivery.product_due_amount.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-orange-600">৳ {delivery.driver_total_cost.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-green-100 font-bold">
                                                <td colSpan={4} className="px-4 py-3 text-right">TOTAL:</td>
                                                <td className="px-4 py-3 text-right text-gray-900">৳ {dailyDeliveries.reduce((sum, d) => sum + d.total_product_price, 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-green-600">৳ {dailyDeliveries.reduce((sum, d) => sum + d.product_paid_amount, 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-red-600">৳ {dailyDeliveries.reduce((sum, d) => sum + d.product_due_amount, 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-orange-600">৳ {dailyDeliveries.reduce((sum, d) => sum + d.driver_total_cost, 0).toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Purchases Section */}
                        <div>
                            <h3 className="text-md font-semibold text-gray-700 mb-4 text-blue-600">Purchases ({dailyPurchases.length})</h3>
                            {dailyPurchases.length === 0 ? (
                                <p className="text-gray-400 text-sm">No purchases recorded for this date.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-gray-600">
                                        <thead className="bg-blue-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">Supplier</th>
                                                <th className="px-4 py-3 text-left font-semibold">Location</th>
                                                <th className="px-4 py-3 text-center font-semibold">Bags</th>
                                                <th className="px-4 py-3 text-right font-semibold">Rate</th>
                                                <th className="px-4 py-3 text-right font-semibold">Total Price</th>
                                                <th className="px-4 py-3 text-right font-semibold">Paid</th>
                                                <th className="px-4 py-3 text-right font-semibold">Due</th>
                                                <th className="px-4 py-3 text-left font-semibold">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {dailyPurchases.map((purchase) => (
                                                <tr key={purchase.id} className="hover:bg-blue-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{purchase.supplier_name}</td>
                                                    <td className="px-4 py-3 text-gray-700">{purchase.source_location}</td>
                                                    <td className="px-4 py-3 text-center">{purchase.number_of_bags}</td>
                                                    <td className="px-4 py-3 text-right">৳ {purchase.price_per_bag}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">৳ {purchase.total_price.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-medium">৳ {purchase.paid_amount.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-medium">৳ {purchase.due_amount.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">{purchase.notes || '-'}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-blue-100 font-bold">
                                                <td colSpan={4} className="px-4 py-3 text-right">TOTAL:</td>
                                                <td className="px-4 py-3 text-right text-gray-900">৳ {dailyPurchases.reduce((sum, p) => sum + p.total_price, 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-green-600">৳ {dailyPurchases.reduce((sum, p) => sum + p.paid_amount, 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-red-600">৳ {dailyPurchases.reduce((sum, p) => sum + p.due_amount, 0).toLocaleString()}</td>
                                                <td className="px-4 py-3"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Expenses Section */}
                        {dailyExpenses.length > 0 && (
                            <div>
                                <h3 className="text-md font-semibold text-gray-700 mb-4 text-red-600">Expenses ({dailyExpenses.length})</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-gray-600">
                                        <thead className="bg-red-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">Category</th>
                                                <th className="px-4 py-3 text-left font-semibold">Item</th>
                                                <th className="px-4 py-3 text-center font-semibold">Quantity</th>
                                                <th className="px-4 py-3 text-right font-semibold">Cost</th>
                                                <th className="px-4 py-3 text-left font-semibold">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {dailyExpenses.map((expense) => (
                                                <tr key={expense.id} className="hover:bg-red-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{expense.category}</td>
                                                    <td className="px-4 py-3 text-gray-700">{expense.item_name || '-'}</td>
                                                    <td className="px-4 py-3 text-center">{expense.quantity || '-'}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">৳ {expense.total_cost.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">{expense.notes || '-'}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-red-100 font-bold">
                                                <td colSpan={3} className="px-4 py-3 text-right">TOTAL:</td>
                                                <td className="px-4 py-3 text-right text-gray-900">৳ {dailyExpenses.reduce((sum, e) => sum + e.total_cost, 0).toLocaleString()}</td>
                                                <td className="px-4 py-3"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Income & Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-24 h-24 ${getBranchColor(selectedBranch === 'All' ? 'All' : selectedBranch).bg} rounded-bl-full opacity-50`}></div>
                    <h3 className="text-sm font-semibold text-green-700 mb-2 relative z-10">Total Income (Sales)</h3>
                    <p className="text-3xl font-bold text-green-600 relative z-10">৳ {stats.totalSales.toLocaleString()}</p>
                    <p className="text-xs text-green-600 mt-2 relative z-10">Received: ৳ {dailyDeliveries.reduce((sum, d) => sum + d.product_paid_amount, 0).toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border border-orange-200 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-24 h-24 ${getBranchColor(selectedBranch === 'All' ? 'All' : selectedBranch).bg} rounded-bl-full opacity-50`}></div>
                    <h3 className="text-sm font-semibold text-orange-700 mb-2 relative z-10">Total Outgoing</h3>
                    <p className="text-3xl font-bold text-orange-600 relative z-10">৳ {(stats.totalPurchase + stats.totalDeliveryCost + stats.totalExpenses).toLocaleString()}</p>
                    <p className="text-xs text-orange-600 mt-2 relative z-10">Purchase + Delivery + Ops</p>
                </div>
                <div className={`bg-gradient-to-br ${stats.netProfit >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'} p-6 rounded-xl shadow-sm ${stats.netProfit >= 0 ? 'border border-green-200' : 'border border-red-200'} relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 ${getBranchColor(selectedBranch === 'All' ? 'All' : selectedBranch).bg} rounded-bl-full opacity-50`}></div>
                    <h3 className={`text-sm font-semibold ${stats.netProfit >= 0 ? 'text-green-700' : 'text-red-700'} mb-2 relative z-10`}>Net Profit/Loss</h3>
                    <p className={`text-3xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} relative z-10`}>৳ {stats.netProfit.toLocaleString()}</p>
                    <p className={`text-xs ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} mt-2 relative z-10`}>{stats.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Net Profit Big Card */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border-l-4" style={{borderLeftColor: selectedBranch === 'Bogura' ? '#3b82f6' : selectedBranch === 'Santahar' ? '#a855f7' : '#6b7280'}}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Financial Health (Today)</h3>
                      <BranchBadge branch={userProfile.role === 'owner' ? selectedBranch : userProfile.branch || 'All'} />
                    </div>
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Net Profit / Loss</p>
                            <h2 className={`text-4xl font-bold mt-2 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ৳ {stats.netProfit.toLocaleString()}
                            </h2>
                            <p className="text-xs text-gray-400 mt-2">Calculated as Sales - (Purchase + Delivery + Expenses)</p>
                        </div>
                        <div className={`p-4 rounded-full ${stats.netProfit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <TrendingUp size={32} />
                        </div>
                    </div>
                    
                    <div className="h-64 w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Purchase', amount: stats.totalPurchase },
                                    { name: 'Sales', amount: stats.totalSales },
                                    { name: 'Expenses', amount: stats.totalExpenses + stats.totalDeliveryCost },
                                ]}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4" style={{borderLeftColor: selectedBranch === 'Bogura' ? '#3b82f6' : selectedBranch === 'Santahar' ? '#a855f7' : '#6b7280'}}>
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-semibold text-gray-800">Cost Breakdown</h3>
                     </div>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Raw Material', value: stats.totalPurchase },
                                        { name: 'Delivery', value: stats.totalDeliveryCost },
                                        { name: 'Ops/Labor', value: stats.totalExpenses },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#f97316" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip formatter={(value: number) => `৳ ${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="text-sm text-gray-500 text-center mt-4">
                        Distribution of outgoing money today.
                     </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;