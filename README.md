# Subhan Care HMS

A modern **Hospital Management System (HMS)** built with React, Vite, and Supabase — designed to streamline hospital operations across multiple roles including Admin, Doctor, Receptionist, Pharmacist, and Billing staff.

---

## ✨ Features

- **Role-based dashboards** for Admin, Doctor, Receptionist, Pharmacist, and Billing
- **Secure authentication** with OTP email verification (Supabase + Resend SMTP)
- **Patient management** — add, view, and search patient records
- **Vitals tracking** for patients
- **Appointments** scheduling and tracking
- **Pharmacy & Inventory** management
- **Billing** and invoicing
- **Staff management** (Admin-only staff creation)
- **Doctor & Bed management**
- Clean, responsive UI with a consistent design system

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Backend / Auth:** Supabase (Authentication, Database, RLS policies)
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Styling:** Custom CSS with a shared design system (Poppins font, brand colors)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A Supabase project (URL + Anon Key)

### Installation

```bash
# Clone the repository
git clone https://github.com/zareenazi/Subhan-Care-HMS.git

# Navigate into the project
cd Subhan-Care-HMS

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run the app

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

### Build for production

```bash
npm run build
```

---

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── constants/       # App-wide constants
├── context/         # React context providers
├── hooks/            # Custom hooks
├── layouts/         # Layout components (Sidebar, DashboardLayout)
├── pages/
│   ├── auth/          # Login, Register, OTP, Password reset
│   └── dashboard/    # Role-specific dashboards
├── routes/          # App routing
├── services/         # Supabase & auth logic
├── styles/            # Global styles
└── utils/            # Utility functions
```

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access, staff management |
| **Doctor** | Patient records, appointments, prescriptions |
| **Receptionist** | Patient registration, appointments |
| **Pharmacist** | Pharmacy & inventory management |
| **Billing** | Invoices and billing management |

---

## 📌 Project Status

This project is under active development. Core authentication and dashboard UI are complete; patient, appointment, billing, and inventory modules are in progress.

---

## 📄 License

This project is developed for a client and is not currently open for public use or distribution.
