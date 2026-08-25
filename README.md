# Remote Kitchen

A restaurant management platform with a **Django REST API backend** and a **React + Tailwind CSS frontend**.

The site has two parts:

- **Public customer site** (`/`) — browse restaurants and menus without an account. Sign in is only required when placing an order.
- **Owner / admin panel** (`/app`) — manage restaurants, menus, employees, and orders.

The Django templates were converted to a modern React SPA, and the backend was reworked into a clean JSON API under `/api/`.

## Architecture

```
frontend/          React 18 + Vite + TypeScript + Tailwind CSS (port 5173)
remote_kitchen/    Django 5 + Django REST Framework (port 8000)
start.sh           Runs both services
```

The frontend dev server proxies `/api` requests to the backend, so a single port (5173) serves the whole app.

## Getting started

```bash
# 1. Backend
cd remote_kitchen
pip install -r requirements.txt
python manage.py migrate
python seed.py                    # optional sample data

# 2. Frontend
cd ../frontend
npm install

# 3. Run everything
cd .. && ./start.sh               # backend :8000 + frontend :5173
```

Open http://localhost:5173.

### Seed accounts

- Owner (admin panel): `owner` / `ownerpass123`
- Employee: `chef` / `chefpass123`

## Routes

| Path | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page with restaurants to browse |
| `/restaurants/:id` | Public | Browse a restaurant's menu, add to cart |
| `/cart` | Public* | Review cart; sign in required to place order |
| `/my-orders` | Signed in | Customer's orders + pay link |
| `/login` `/register` | Public | Sign in / sign up (owner via `?role=owner`) |
| `/payment/process` | Signed in | Pay for an order (Braintree sandbox) |
| `/app` | Owner/Employee | Admin dashboard |
| `/app/restaurants` | Owner/Employee | Manage restaurants |
| `/app/menus` | Owner/Employee | Manage menu items |
| `/app/employees` | Owner | Manage employees |
| `/app/orders` | Owner/Employee | View/delete orders |

## API overview

| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/auth/csrf/` | GET | Public | Returns a CSRF token (sets cookie) |
| `/api/auth/login/` | POST | Public | Session login (JSON) |
| `/api/auth/register/` | POST | Public | Customer, owner, or employee signup |
| `/api/auth/me/` | GET | Signed in | Current user |
| `/api/auth/logout/` | POST | Signed in | Session logout |
| `/api/public/restaurants/` | GET | Public | All restaurants with menu counts |
| `/api/public/restaurants/<id>/` | GET | Public | Restaurant detail |
| `/api/public/restaurants/<id>/menus/` | GET | Public | Available menu items |
| `/api/restaurants/` | GET/POST | Signed in | Owner's restaurants |
| `/api/restaurants/<id>/` | GET/PUT/DELETE | Signed in | Restaurant detail |
| `/api/menus/?restaurant=<id>` | GET/POST | Signed in | Menu items |
| `/api/menus/<id>/` | GET/PUT/DELETE | Signed in | Menu item detail |
| `/api/employees/?restaurant=<id>` | GET | Signed in | Employees |
| `/api/orders/` | GET | Owner | Orders for owner's restaurants |
| `/api/orders/` | POST | Signed in | Create a customer order (with items) |
| `/api/orders/mine/` | GET | Signed in | Customer's own orders |
| `/api/orders/<id>/` | GET/PATCH/PUT/DELETE | Signed in | Order detail; owners/employees can update status |
| `/api/dashboard/stats/` | GET | Signed in | Dashboard KPIs |
| `/api/payment/token/` | GET | Signed in | Braintree client token |
| `/api/payment/process/` | POST | Signed in | Process payment (sandbox) |

## Notable fixes during conversion

- Payment views referenced non-existent `Order` fields (`total_cost`, `paid`, `braintree_id`); now use `total_price` / `payment_status`.
- Added missing Braintree client-token endpoint and a working sandbox payment flow.
- Fixed payment authorization so the **customer who placed the order** can pay for it (previously only the restaurant owner could, breaking checkout).
- Added customer order creation with line items and a customer "my orders" endpoint.
- Fixed employee serializer field names and list view queryset.
- Employees can now view and manage orders at the restaurants they work for.
- Restructured template-rendering routes into pure JSON API endpoints.

## Order status tracking

Orders carry a lifecycle status (`pending` → `preparing` → `ready` → `delivered`, or `cancelled`):

- Owners and employees can change the status from the admin **Order details** page.
- Customers see the live status on their **My orders** page.
- The dashboard recent-orders table and admin orders list both show a status badge.
- Only the restaurant owner or an employee of that restaurant may update the status.
