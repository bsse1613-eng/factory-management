import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { DashboardSummary, Profile, Branch, Purchase, Delivery, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, Truck, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Calendar, Filter, Download } from 'lucide-react';
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
    if (branch === 'Bogura') return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', ring: 'focus:ring-blue-500', badge: 'bg-blue-100 text-blue-800 border border-blue-200' };
    if (branch === 'Santahar') return { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', ring: 'focus:ring-purple-500', badge: 'bg-purple-100 text-purple-800 border border-purple-200' };
    return { bg: 'bg-gray-50', border: 'border-gray-500', text: 'text-gray-600', ring: 'focus:ring-gray-500', badge: 'bg-gray-100 text-gray-800 border border-gray-200' };
  };

  const BranchBadge = ({ branch }: { branch: Branch | 'All' }) => {
    const colors = getBranchColor(branch);
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.badge} shadow-sm`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${colors.border.replace('border-', 'bg-')}`}></div>
        {branch}
      </span>
    );
  };

  const StatCard = ({ title, value, color, icon: Icon, subValue, type }: any) => {
    // Generate nuanced styling based on color prop strings
    const baseColor = color.includes('green') ? 'green' 
      : color.includes('blue') ? 'blue' 
      : color.includes('orange') ? 'orange' 
      : 'red';
    
    const bgMap: Record<string, string> = {
      green: 'bg-green-50 text-green-600',
      blue: 'bg-blue-50 text-blue-600',
      orange: 'bg-orange-50 text-orange-600',
      red: 'bg-red-50 text-red-600'
    };

    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${bgMap[baseColor]}`}>
            <Icon size={24} />
          </div>
          {subValue && (
            <div className="text-right">
                <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Pending</span>
                <p className="text-sm font-medium text-red-500">{subValue.replace('Due:', '')}</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            ৳ {value.toLocaleString()}
          </h3>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans space-y-8">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
              {userProfile.role === 'owner' ? (
                <BranchBadge branch={selectedBranch} />
              ) : (
                <BranchBadge branch={userProfile.branch || 'All'} />
              )}
            </div>
            <p className="text-sm text-slate-500">
                Welcome back, <span className="font-medium text-slate-700">{userProfile.full_name || 'User'}</span>
                {userProfile.id === 'demo' && <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-md font-bold border border-orange-200">DEMO MODE</span>}
            </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
             <div className="relative w-full sm:w-auto">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all hover:bg-slate-100"
                />
            </div>
            
            {userProfile.role === 'owner' && (
                <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value as any)}
                        className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent cursor-pointer hover:bg-slate-100 transition-all"
                    >
                        <option value="All">All Branches</option>
                        <option value="Bogura">Bogura</option>
                        <option value="Santahar">Santahar</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            )}
            
            <button 
                onClick={generateDailyReport}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
            >
                <Download size={16} />
                <span>Report PDF</span>
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium">Crunching the numbers...</p>
        </div>
      ) : (
        <>
            {/* Key Metrics Grid */}
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
                    title="Logistics Cost" 
                    value={stats.totalDeliveryCost} 
                    color="border-orange-500" 
                    icon={Truck} 
                />
                <StatCard 
                    title="Operational Exp" 
                    value={stats.totalExpenses} 
                    color="border-red-500" 
                    icon={DollarSign} 
                />
            </div>

            {/* Income & Summary Section - Visual Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden transition-all hover:shadow-md">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl group-hover:bg-emerald-200/50 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-600"><TrendingUp size={16} /></div>
                            <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Gross Income</h3>
                        </div>
                        <p className="text-3xl font-bold text-emerald-700 tracking-tight">৳ {stats.totalSales.toLocaleString()}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-white/60 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <span>Cash Received: ৳ {dailyDeliveries.reduce((sum, d) => sum + d.product_paid_amount, 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="group bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-amber-100 relative overflow-hidden transition-all hover:shadow-md">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl group-hover:bg-amber-200/50 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-amber-100 rounded-md text-amber-600"><DollarSign size={16} /></div>
                            <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Total Outgoing</h3>
                        </div>
                        <p className="text-3xl font-bold text-amber-700 tracking-tight">৳ {(stats.totalPurchase + stats.totalDeliveryCost + stats.totalExpenses).toLocaleString()}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-600 bg-white/60 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <span>Purchases + Logistics + Ops</span>
                        </div>
                    </div>
                </div>

                <div className={`group bg-gradient-to-br ${stats.netProfit >= 0 ? 'from-sky-50 to-indigo-50 border-indigo-100' : 'from-rose-50 to-red-50 border-rose-100'} p-6 rounded-2xl shadow-sm border relative overflow-hidden transition-all hover:shadow-md`}>
                    <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl transition-colors ${stats.netProfit >= 0 ? 'bg-indigo-100/50 group-hover:bg-indigo-200/50' : 'bg-rose-100/50 group-hover:bg-rose-200/50'}`}></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-md ${stats.netProfit >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                {stats.netProfit >= 0 ? <TrendingUp size={16} /> : <AlertCircle size={16} />}
                            </div>
                            <h3 className={`text-sm font-semibold uppercase tracking-wide ${stats.netProfit >= 0 ? 'text-indigo-800' : 'text-rose-800'}`}>Net Profit</h3>
                        </div>
                        <p className={`text-3xl font-bold tracking-tight ${stats.netProfit >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>৳ {stats.netProfit.toLocaleString()}</p>
                        <div className={`mt-4 flex items-center gap-2 text-xs font-medium bg-white/60 w-fit px-3 py-1 rounded-full backdrop-blur-sm ${stats.netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            <span>{stats.netProfit >= 0 ? 'Profitable Day' : 'Loss Recorded'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                          <h3 className="text-lg font-bold text-slate-800">Financial Overview</h3>
                          <p className="text-sm text-slate-500">Comparative breakdown of today's flow</p>
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Purchase', amount: stats.totalPurchase, fill: '#3b82f6' },
                                    { name: 'Sales', amount: stats.totalSales, fill: '#10b981' },
                                    { name: 'Expenses', amount: stats.totalExpenses + stats.totalDeliveryCost, fill: '#f59e0b' },
                                ]}
                                barSize={60}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#64748b', fontSize: 12}} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#64748b', fontSize: 12}} 
                                    tickFormatter={(value) => `৳${value/1000}k`}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                    {
                                        [
                                            { name: 'Purchase', fill: '#60a5fa' },
                                            { name: 'Sales', fill: '#34d399' },
                                            { name: 'Expenses', fill: '#fbbf24' },
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                     <div className="mb-6">
                       <h3 className="text-lg font-bold text-slate-800">Cost Distribution</h3>
                       <p className="text-sm text-slate-500">Where the money went today</p>
                     </div>
                     <div className="h-[250px] w-full flex-grow">
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
                                    <Cell fill="#60a5fa" /> {/* Purchase - Blue */}
                                    <Cell fill="#fbbf24" /> {/* Delivery - Amber */}
                                    <Cell fill="#f87171" /> {/* Expenses - Red */}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => `৳ ${value.toLocaleString()}`} 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>

            {/* Detailed Transactions Accordion */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div 
                    className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setShowDetailedReport(!showDetailedReport)}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                            <Filter size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Daily Transaction Details</h2>
                            <p className="text-sm text-slate-500">View breakdown of Deliveries, Purchases, and Expenses</p>
                        </div>
                    </div>
                    <button className="text-slate-400 bg-white border border-slate-200 p-2 rounded-full shadow-sm">
                        {showDetailedReport ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                {showDetailedReport && (
                    <div className="p-6 border-t border-slate-100 space-y-10 bg-slate-50/30">
                        {/* Deliveries Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
                                <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                                    <Truck size={18} className="text-emerald-600" />
                                    Sales / Deliveries <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full ml-2">{dailyDeliveries.length}</span>
                                </h3>
                            </div>
                            
                            {dailyDeliveries.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No deliveries recorded for this date.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3">Customer</th>
                                                <th className="px-6 py-3">Driver</th>
                                                <th className="px-6 py-3 text-center">Bags</th>
                                                <th className="px-6 py-3 text-right">Rate</th>
                                                <th className="px-6 py-3 text-right">Total</th>
                                                <th className="px-6 py-3 text-right">Paid</th>
                                                <th className="px-6 py-3 text-right">Due</th>
                                                <th className="px-6 py-3 text-right">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {dailyDeliveries.map((delivery) => (
                                                <tr key={delivery.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900">{delivery.customer_name}</div>
                                                        <div className="text-xs text-slate-400">{delivery.customer_address}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{delivery.driver_name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">{delivery.number_of_bags}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500">৳ {delivery.price_per_bag}</td>
                                                    <td className="px-6 py-4 text-right font-semibold text-slate-800">৳ {delivery.total_product_price.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-emerald-600 font-medium bg-emerald-50/30">৳ {delivery.product_paid_amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {delivery.product_due_amount > 0 ? (
                                                            <span className="text-rose-600 font-medium">৳ {delivery.product_due_amount.toLocaleString()}</span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-amber-600">৳ {delivery.driver_total_cost.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-right text-xs uppercase tracking-wider text-slate-500">Totals</td>
                                                <td className="px-6 py-4 text-right">৳ {dailyDeliveries.reduce((sum, d) => sum + d.total_product_price, 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-emerald-600">৳ {dailyDeliveries.reduce((sum, d) => sum + d.product_paid_amount, 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-rose-600">৳ {dailyDeliveries.reduce((sum, d) => sum + d.product_due_amount, 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-amber-600">৳ {dailyDeliveries.reduce((sum, d) => sum + d.driver_total_cost, 0).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Purchases Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                                <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                    <ShoppingCart size={18} className="text-blue-600" />
                                    Purchases <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full ml-2">{dailyPurchases.length}</span>
                                </h3>
                            </div>

                            {dailyPurchases.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No purchases recorded for this date.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3">Supplier</th>
                                                <th className="px-6 py-3">Location</th>
                                                <th className="px-6 py-3 text-center">Bags</th>
                                                <th className="px-6 py-3 text-right">Rate</th>
                                                <th className="px-6 py-3 text-right">Total</th>
                                                <th className="px-6 py-3 text-right">Paid</th>
                                                <th className="px-6 py-3 text-right">Due</th>
                                                <th className="px-6 py-3">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {dailyPurchases.map((purchase) => (
                                                <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{purchase.supplier_name}</td>
                                                    <td className="px-6 py-4 text-slate-600">{purchase.source_location}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">{purchase.number_of_bags}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500">৳ {purchase.price_per_bag}</td>
                                                    <td className="px-6 py-4 text-right font-semibold text-slate-800">৳ {purchase.total_price.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-emerald-600 font-medium bg-emerald-50/30">৳ {purchase.paid_amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {purchase.due_amount > 0 ? (
                                                            <span className="text-rose-600 font-medium">৳ {purchase.due_amount.toLocaleString()}</span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-400 italic max-w-xs truncate">{purchase.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-right text-xs uppercase tracking-wider text-slate-500">Totals</td>
                                                <td className="px-6 py-4 text-right">৳ {dailyPurchases.reduce((sum, p) => sum + p.total_price, 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-emerald-600">৳ {dailyPurchases.reduce((sum, p) => sum + p.paid_amount, 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-rose-600">৳ {dailyPurchases.reduce((sum, p) => sum + p.due_amount, 0).toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Expenses Table */}
                        {dailyExpenses.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="bg-rose-50/50 px-6 py-4 border-b border-rose-100 flex justify-between items-center">
                                    <h3 className="font-semibold text-rose-800 flex items-center gap-2">
                                        <DollarSign size={18} className="text-rose-600" />
                                        Expenses <span className="text-xs bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full ml-2">{dailyExpenses.length}</span>
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3">Category</th>
                                                <th className="px-6 py-3">Item</th>
                                                <th className="px-6 py-3 text-center">Quantity</th>
                                                <th className="px-6 py-3 text-right">Cost</th>
                                                <th className="px-6 py-3">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {dailyExpenses.map((expense) => (
                                                <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{expense.category}</td>
                                                    <td className="px-6 py-4 text-slate-600">{expense.item_name || '-'}</td>
                                                    <td className="px-6 py-4 text-center">{expense.quantity || '-'}</td>
                                                    <td className="px-6 py-4 text-right font-semibold text-slate-800">৳ {expense.total_cost.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-xs text-slate-400 italic">{expense.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-right text-xs uppercase tracking-wider text-slate-500">Total Expenses</td>
                                                <td className="px-6 py-4 text-right text-rose-600">৳ {dailyExpenses.reduce((sum, e) => sum + e.total_cost, 0).toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;