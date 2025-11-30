# 🏭 Factory Management System

## Project Overview

**Alangkar Agro Factory Management System** is a comprehensive web-based platform designed for managing agricultural factory operations. It provides real-time analytics, inventory tracking, expense management, and financial reporting capabilities.

---

## 🎯 Purpose

This application helps agricultural factories and processing units efficiently manage:
- **Multi-branch operations** across different locations
- **Purchase tracking** with product details and costs
- **Delivery management** with logistics oversight
- **Expense tracking** and budget monitoring
- **Financial analytics** and profit/loss calculations
- **Role-based access control** for different user levels

---

## ✨ Key Features

### 📊 Dashboard & Analytics
- Real-time financial summaries (purchases, sales, expenses)
- Interactive charts and visual data representation
- Daily transaction reports with filtering
- Branch-wise performance metrics
- Net profit calculations and trend analysis

### 🛒 Inventory Management
- **Purchases Module** - Track raw material purchases with product names and costs
- **Deliveries Module** - Manage outbound deliveries with destination tracking
- **Product Tracking** - Detailed product information for all transactions
- **Date-based Filtering** - Easy access to historical data

### 💰 Financial Management
- Expense tracking and categorization
- Outstanding receivables and payables calculation
- PDF export with detailed financial reports
- Print functionality for all transactions
- Profit and loss analysis

### 👥 User Management
- Role-based access (Admin, Manager, Employee)
- Branch-specific views for employees
- Demo mode for testing without Supabase credentials
- Secure authentication with Supabase

### 📱 User Experience
- Modern, responsive UI design
- Intuitive navigation with Tailwind CSS styling
- Error handling and helpful error messages
- Dark/Light theme ready
- Mobile-friendly interface

### 📄 Reporting
- PDF export for purchases, deliveries, and expenses
- Customizable report generation
- Print-friendly formats
- Dashboard summaries and detailed breakdowns

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript |
| **Build Tool** | Vite 6.2 |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Charts** | Recharts 3.5 |
| **PDF Export** | jsPDF, jsPDF-autotable, html2canvas |
| **Icons** | Lucide React |
| **Routing** | React Router v7 |
| **Date Handling** | date-fns |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/bsse1613-eng/factory-management.git
cd factory-management

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

### Demo Mode
Click **"Demo Login"** to explore the application with mock data - no Supabase setup required!

---

## 📂 Project Structure

```
factory-management/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── Auth.tsx         # Authentication component
│   │   └── Layout.tsx       # Main layout wrapper
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Analytics & overview
│   │   ├── Purchases.tsx    # Purchase management
│   │   ├── Deliveries.tsx   # Delivery tracking
│   │   └── Expenses.tsx     # Expense management
│   ├── services/            # Business logic & APIs
│   │   ├── supabaseClient.ts    # Supabase configuration
│   │   ├── mockData.ts          # Demo data
│   │   └── pdfService.ts        # PDF generation
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # Main app component
│   └── index.tsx            # Entry point
├── docs/                    # GitHub Pages deployment
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies & scripts
```

---

## 🗄️ Database Schema

### Key Tables
- **profiles** - User information and roles
- **branches** - Multi-branch configuration
- **purchases** - Purchase transactions with product details
- **deliveries** - Delivery records with tracking
- **expenses** - Expense entries with categorization

### Features
- Foreign key relationships for data integrity
- Role-based access control
- Soft deletes for data preservation
- Audit timestamps (created_at, updated_at)

---

## 🔐 Security Features

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row-level security (RLS) policies
- **Error Handling**: Comprehensive error boundaries and logging
- **Data Validation**: TypeScript type safety throughout
- **Secure API Calls**: Environment variable-based configuration

---

## 📊 Dashboard Capabilities

### Financial Metrics
- Total purchases amount
- Total sales revenue
- Delivery costs
- Operating expenses
- Net profit calculation
- Outstanding receivables/payables

### Visualizations
- Bar charts for transaction trends
- Pie charts for expense distribution
- Time-series analysis
- Branch-wise comparisons

### Filters
- Date range selection
- Branch filtering
- Transaction type filtering
- Custom report generation

---

## 🌐 Live Demo

**URL**: https://bsse1613-eng.github.io/factory-management/

**Features to Try**:
1. Click "Demo Login" button
2. Explore Dashboard with sample data
3. Navigate through Purchases, Deliveries, and Expenses
4. Generate PDF reports
5. Filter data by date and branch

---

## 📝 Deployment

### Deployed On
- **Platform**: GitHub Pages
- **Branch**: `main`
- **Build Output**: `/docs` folder
- **Build Process**: 
  ```bash
  npm run build
  Copy-Item -Path dist -Destination docs -Recurse
  git push origin main
  ```

---

## 🧪 Testing

### Features to Verify
- ✅ App loads without blank page
- ✅ Login screen displays correctly
- ✅ Demo Login functionality works
- ✅ Dashboard shows sample data
- ✅ Navigation between pages works
- ✅ PDF export generates correctly
- ✅ Date filtering functions properly
- ✅ Branch filtering works for employees
- ✅ No console errors
- ✅ Responsive on mobile devices

---

## 📚 Documentation

The project includes comprehensive documentation:
- `README.md` - Project overview
- `QUICK_REFERENCE.md` - Deployment quick reference
- `GITHUB_PAGES_FIX.md` - GitHub Pages setup
- `TEST_YOUR_APP_NOW.md` - Testing guide
- `DATABASE_SETUP_SQL.md` - Database initialization
- `PRODUCT_NAME_IMPLEMENTATION_SUMMARY.md` - Feature details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📋 Roadmap

Future enhancements:
- [ ] Advanced analytics and forecasting
- [ ] SMS/Email notifications for transactions
- [ ] Mobile native app
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Advanced user roles and permissions
- [ ] Inventory level tracking
- [ ] Supplier management
- [ ] Customer database integration
- [ ] Multi-language support
- [ ] Dark mode UI theme

---

## 🐛 Troubleshooting

### Blank Page on GitHub Pages?
```
1. Hard refresh: Ctrl+F5
2. Clear cache: Ctrl+Shift+Delete
3. Wait 2-3 minutes for GitHub Pages to update
4. Check browser console (F12) for errors
```

### Supabase Connection Issues?
```
1. Verify .env credentials
2. Check Supabase project is active
3. Review RLS policies in database
4. Use Demo Login as fallback
```

---

## 📞 Support

If you encounter any issues:
1. Check the documentation files
2. Review browser console errors (F12)
3. Try the Demo Login feature
4. Create an issue on GitHub

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Author

**Alangkar Agro Development Team**

GitHub: [@bsse1613-eng](https://github.com/bsse1613-eng)

---

## 🎉 Summary

**Alangkar Agro Factory Management System** is a production-ready solution for agricultural factory operations management. With its comprehensive feature set, modern technology stack, and user-friendly interface, it enables efficient business operations and data-driven decision making.

**Status**: ✅ Active & Maintained  
**Version**: 1.0.0  
**Last Updated**: November 2025

---

**Try it now**: [Live Demo →](https://bsse1613-eng.github.io/factory-management/)
