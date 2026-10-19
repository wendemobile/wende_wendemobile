# Web POS - Point of Sale System

A modern web-based Point of Sale and Inventory Management System built with Next.js 14, PostgreSQL, and Docker.

## Features

- **User Authentication** - Role-based access control (Admin, Cashier, Basement Manager, Salesman)
- **Inventory Management** - Multi-location stock tracking, barcode generation
- **Point of Sale** - Fast sales processing, split payments, receipt printing
- **Customer Management** - Customer profiles, credit limits, purchase history
- **Credit Management** - Credit sales, payment tracking, overdue alerts
- **Stock Transfers** - Transfer items between locations with tracking
- **Expense Tracking** - Record and categorize business expenses
- **Bank Accounts** - Track mobile money and bank transactions
- **Defect Management** - Track defective items through repair workflow
- **Vendor Management** - Supplier information and payment tracking
- **Reports** - Daily sales, profit analysis, inventory, reconciliation
- **Global Search** - Search across items, customers, sales, transfers

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Authentication**: NextAuth.js
- **Deployment**: Docker, Docker Compose, Cloudflare Tunnel

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 16 (or use Docker)

### Development Setup

1. Clone the repository and install dependencies:
```bash
cd web-pos
npm install
```

2. Start the database with Docker:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:3000

### Default Login Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Cashier**: username: `cashier`, password: `cashier123`

## Production Deployment

### Using Docker Compose

1. Build and start all services:
```bash
docker-compose up -d --build
```

2. Run database migrations:
```bash
docker-compose exec app npx prisma migrate deploy
```

### Cloudflare Tunnel Setup

1. Create a Cloudflare Tunnel in your Cloudflare dashboard
2. Get your tunnel token
3. Add to `.env`:
```
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
```

4. Start with production profile:
```bash
docker-compose --profile production up -d
```

## Project Structure

```
web-pos/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── api/             # API routes
│   │   └── login/           # Login page
│   ├── components/          # React components
│   │   ├── layout/          # Layout components
│   │   └── ui/              # UI components (shadcn)
│   ├── lib/                 # Utilities and configurations
│   ├── services/            # Business logic services
│   └── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data
├── docker-compose.yml       # Production Docker config
├── docker-compose.dev.yml   # Development Docker config
└── Dockerfile               # Application Dockerfile
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Items
- `GET /api/items` - List items with search
- `POST /api/items` - Create item
- `GET /api/items/[id]` - Get item details
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Start new sale
- `GET /api/sales/[id]` - Get sale details
- `POST /api/sales/[id]/items` - Add item to sale
- `POST /api/sales/[id]/finalize` - Complete sale

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details

### Credits
- `GET /api/credits` - List credits
- `POST /api/credits/[id]/payment` - Record payment
- `GET /api/credits/overdue` - Get overdue credits

### Reports
- `GET /api/reports/daily-sales` - Daily sales report
- `GET /api/reports/profit-analysis` - Profit analysis
- `GET /api/reports/inventory` - Inventory report

## License

MIT
