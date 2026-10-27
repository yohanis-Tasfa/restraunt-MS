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

### Core Modules (Version 1.0 vs Version 2.0)
1. ✅ Dashboard - Role-based KPIs, charts, real-time stats
2. ✅ POS - Order entry, table linking, payments, printed receipts
3. ✅ Kitchen Display System - Real-time Kanban with waiter ready notifications
4. ✅ Menu Management - Items, categories, variants, add-ons
5. ✅ Inventory - Stock tracking, movements (IN/OUT/ADJUSTMENT), alerts
6. ✅ Table Management - Floor plan, status tracking, QR code generation
7. ✅ Reservations - Table bookings, customer records
8. ✅ Orders - Real-time lifecycle management & status transitions
9. ✅ Bill Requests - Real-time queue, bill generator, printed bills
10. ✅ Waiter Calls - Instant table call alerts with sound & escalation
11. ✅ Tips Management - Waiter personal tips & branch tip management
12. ✅ Recipes - Ingredients, recipe costing
13. ✅ Expenses - Expense logging & category tracking
14. ✅ Employees - Staff records, attendance, payroll records
15. ✅ Reports - Sales analytics, inventory movements, staff performance
16. ✅ QR Menu - Contactless table ordering, waiter calls, bill requests
17. ✅ Public Landing Page - Restaurant website, story, menu preview, contact
18. ✅ Profile - User management & profile settings
19. ✅ Login - Role-based authentication (Owner, Manager, Cashier, Kitchen, Waiter)
20. ⏭️ Suppliers - *Deferred to v2.0 (Backend models ready; UI in next version)*
21. ⏭️ Purchasing - *Deferred to v2.0 (Backend models ready; UI in next version)*
22. ⏭️ Delivery - *Deferred to v2.0 (Driver dispatch & order tracking)*
23. ⏭️ Remote Online Orders - *Deferred to v2.0 (Home delivery customer portal)*
24. ⏭️ Accounting - *Deferred to v2.0 (Chart of accounts & journal entries)*
25. ⏭️ Backup - *Deferred to v2.0 (Automated backups & export/import UI)*

**Legend:** ✅ Implemented in v1.0 | ⏭️ Deferred to v2.0 (Next Version)

---

## Ethiopian Market Features

- **Currency:** Ethiopian Birr (ETB) - `Br 1,234.56`
- **Supported Payment Methods (v1.0):**
  - **Cash:** Physical cash accepted at POS counter or collected at table by waiter; automated change calculation in ETB (notes: 200, 100, 50, 10, 5, 1); no screenshot required
  - **Mobile Transfer (Telebirr, CBE Birr, M-Pesa, Bank Transfer):**
    - Provider brand logo/image and account name/number displayed on checkout dialog
    - Customer executes transfer via personal mobile phone app or USSD
    - Customer/staff captures and uploads screenshot of transaction confirmation screen or SMS
    - Cashier verifies screenshot proof before completing payment
    - *(Direct automated API integrations & webhooks deferred to v2.0)*
  - **Card:** POS terminal card transaction recording
- **Language:** English (Amharic i18n deferred to v2.0)
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
