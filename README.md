# Restaurant Management System (RMS)

**Version:** 1.0  
**Target Market:** Ethiopian Restaurants  
**Status:** In Development  

---

## Project Overview

A comprehensive, modern restaurant management system designed for Ethiopian restaurants supporting:
- Single-branch and multi-branch operations
- Point of Sale (POS)
- Kitchen Display System (KDS)
- Inventory Management
- Reservations & Table Management
- Online Ordering & Delivery
- Reports & Analytics
- Ethiopian Payment Gateways (Telebirr, CBE Birr, M-Pesa)

---

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui + Tailwind CSS
- **Routing:** TanStack Router
- **State Management:** TanStack Query + Zustand
- **Charts:** Recharts

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL 15
- **Authentication:** JWT (jsonwebtoken + bcrypt)
- **Real-time:** Socket.IO

### Infrastructure
- **No Docker** - Direct installation
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt

---

## Project Structure

```
RMS/
├── frontend/              # React frontend application (to be built)
├── backend/               # Node.js + Express backend (to be built)
├── shared/                # Shared TypeScript types
├── lovable-ui-reference/  # Reference UI from Lovable (95% complete)
│   ├── components/        # Reusable UI components
│   ├── routes/            # Page components (24 modules)
│   └── lib/               # Utilities and mock data
├── docs/                  # Project documentation
│   ├── IMPLEMENTATION_TASKS.md    # 56 tasks over 10 months
│   └── QUICK_START_GUIDE.md       # Step-by-step setup guide
└── README.md              # This file
```

---

## Documentation

- **📋 IMPLEMENTATION_TASKS.md** - Complete task breakdown (56 tasks, 10 months)
- **🚀 QUICK_START_GUIDE.md** - Setup instructions and first implementation
- **🎨 lovable-ui-reference/** - Complete UI reference (all 24 modules)

---

## Features Overview

### Core Modules (24 Total)
1. ✅ Dashboard - KPIs, charts, real-time stats
2. ✅ POS - Order entry, payments, receipts
3. ✅ Kitchen Display System - Real-time order management
4. ✅ Menu Management - Items, categories, variants
5. ✅ Inventory - Stock tracking, alerts, movements
6. 🔄 Table Management - Floor plan, status tracking
7. 🔄 Reservations - Booking, walk-ins, waitlist
8. 🔄 Orders - Lifecycle management
9. 🔄 Customers - Profiles, history, loyalty
10. 🔄 Employees - Records, attendance, scheduling
11. 🔄 Reports - Sales, inventory, financial analytics
12. 🔄 Suppliers - Management, performance tracking
13. 🔄 Purchasing - POs, receiving, payments
14. 🔄 Recipes - Ingredients, costing
15. 🔄 Expenses - Tracking, approval workflow
16. 🔄 Accounting - Chart of accounts, journal entries
17. 🔄 Delivery - Order tracking, driver management
18. 🔄 Online Orders - Customer ordering system
19. 🔄 QR Menu - Contactless ordering
20. 🔄 Notifications - Multi-channel alerts
21. 🔄 Backup - Automated backups, export/import
22. 🔄 Settings - Restaurant, branch, tax configuration
23. 🔄 Profile - User management
24. ✅ Login - Role-based authentication

**Legend:** ✅ UI Complete | 🔄 UI Structure Ready

---

## Ethiopian Market Features

- **Currency:** Ethiopian Birr (ETB) - `Br 1,234.56`
- **Payments:** Telebirr, CBE Birr, M-Pesa, Cash, Card
- **Language:** English + Amharic (i18n ready)
- **Tax:** 15% VAT (configurable)
- **Menu:** Traditional Ethiopian categories (Wot, Tibs, Fasting foods)
- **Calendar:** Ethiopian calendar support (optional)

---

## Current Status

### ✅ Completed
- Complete SRS documentation
- 56 implementation tasks defined
- UI design (95% complete, 24 modules)
- Project structure organized
- Technology stack selected

### 🔄 In Progress
- Backend initialization
- Database schema implementation
- API development

### 📅 Next Steps
1. Initialize backend (Express + Prisma)
2. Setup PostgreSQL database
3. Implement authentication (TASK-003)
4. Implement RBAC (TASK-004)
5. Connect first module (Menu or POS)

---

## Quick Start

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 15
- Git

### Setup Instructions

See **docs/QUICK_START_GUIDE.md** for detailed setup instructions.

**Quick commands:**
```bash
# 1. Initialize backend
cd backend
npm init -y
npm install express @prisma/client prisma typescript

# 2. Setup database
psql -U postgres
CREATE DATABASE rms_dev;

# 3. Initialize Prisma
npx prisma init

# 4. Start development
npm run dev
```

---

## Implementation Timeline

**Total Duration:** 40 weeks (10 months)  
**Team Size:** 2-3 Full Stack Developers

### Phase 1: Foundation (Months 1-2)
- Authentication & RBAC
- User management
- Restaurant settings
- Menu management
- Basic POS

### Phase 2: Core Operations (Months 3-4)
- Kitchen Display System
- Table management
- Inventory
- Reservations
- Waiter module

### Phase 3: Advanced Features (Months 5-6)
- Recipe management
- Supplier & purchasing
- Advanced reporting
- Employee management

### Phase 4: Enhancement (Months 7-8)
- Loyalty program
- Accounting module
- Ethiopian payment integration
- Amharic localization

### Phase 5: Launch (Months 9-10)
- Testing & bug fixes
- Documentation
- Pilot deployment
- Production launch

---

## Development Workflow

1. **Follow IMPLEMENTATION_TASKS.md** - Tasks are ordered by priority
2. **Use lovable-ui-reference/** - UI components ready to integrate
3. **Build backend API** - Create Express endpoints
4. **Connect UI to API** - Replace mock data with real API calls
5. **Test thoroughly** - Each module before moving to next

---

## Support & Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **Express.js:** https://expressjs.com
- **TanStack Query:** https://tanstack.com/query
- **shadcn/ui:** https://ui.shadcn.com

---

## License

Proprietary - All rights reserved

---

**Last Updated:** July 29, 2026  
**Maintainer:** Development Team
