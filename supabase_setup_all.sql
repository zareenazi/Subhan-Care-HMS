-- ============================================================
-- SUBHAN CARE HMS – COMPLETE SCHEMA SETUP
-- Run this script in your Supabase SQL Editor to set up all tables.
-- ============================================================

-- 1. Create Profiles Table (if not already created)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT,
  email      TEXT,
  role       TEXT CHECK (role IN ('Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Billing Staff')),
  status     TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles if not enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- ============================================
-- 2. Create Patients Table (FIXED: dob → date_of_birth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT NOT NULL,
  date_of_birth   DATE,  -- ← FIXED: Changed from 'dob' to 'date_of_birth'
  gender          TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group     TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  address         TEXT,
  medical_history TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all operations on patients
DROP POLICY IF EXISTS "Allow authenticated read patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated write patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated update patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated delete patients" ON public.patients;

CREATE POLICY "Allow authenticated read patients" ON public.patients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update patients" ON public.patients
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete patients" ON public.patients
  FOR DELETE TO authenticated USING (true);


-- 3. Create Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT NOT NULL,
  specialization  TEXT NOT NULL,
  availability    TEXT DEFAULT 'Available' CHECK (availability IN ('Available', 'Unavailable', 'On Leave')),
  weekly_schedule JSONB DEFAULT '{"Monday": ["09:00 AM - 05:00 PM"], "Tuesday": ["09:00 AM - 05:00 PM"], "Wednesday": ["09:00 AM - 05:00 PM"], "Thursday": ["09:00 AM - 05:00 PM"], "Friday": ["09:00 AM - 05:00 PM"], "Saturday": [], "Sunday": []}'::jsonb,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on doctors
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all operations on doctors
DROP POLICY IF EXISTS "Allow authenticated read doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow authenticated write doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow authenticated update doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow authenticated delete doctors" ON public.doctors;

CREATE POLICY "Allow authenticated read doctors" ON public.doctors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write doctors" ON public.doctors
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update doctors" ON public.doctors
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete doctors" ON public.doctors
  FOR DELETE TO authenticated USING (true);


-- 4. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  time_slot        TEXT NOT NULL,
  status           TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
  reason           TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all operations on appointments
DROP POLICY IF EXISTS "Allow authenticated read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated write appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated delete appointments" ON public.appointments;

CREATE POLICY "Allow authenticated read appointments" ON public.appointments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete appointments" ON public.appointments
  FOR DELETE TO authenticated USING (true);


-- 5. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id     UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount         NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status         TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Pending')),
  payment_method TEXT DEFAULT 'Pending' CHECK (payment_method IN ('Cash', 'Card', 'Bank Transfer', 'Insurance', 'Pending')),
  due_date       DATE NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all operations on invoices
DROP POLICY IF EXISTS "Allow authenticated read invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated write invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated delete invoices" ON public.invoices;

CREATE POLICY "Allow authenticated read invoices" ON public.invoices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated write invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete invoices" ON public.invoices
  FOR DELETE TO authenticated USING (true);


-- 6. Trigger to automatically sync auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Receptionist'),
    'Active'
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ADDED TABLES FOR SIDEBAR COMPLETENESS
-- ============================================================

-- 7. Create Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id    UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  medications  TEXT NOT NULL,
  instructions TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete prescriptions" ON public.prescriptions FOR DELETE TO authenticated USING (true);


-- 8. Create Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name   TEXT NOT NULL,
  category    TEXT NOT NULL,
  quantity    INTEGER DEFAULT 0,
  price       NUMERIC(10,2) DEFAULT 0.00,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update inventory" ON public.inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete inventory" ON public.inventory FOR DELETE TO authenticated USING (true);


-- 9. Create Pharmacy Table
CREATE TABLE IF NOT EXISTS public.pharmacy (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name TEXT NOT NULL,
  stock         INTEGER DEFAULT 0,
  price         NUMERIC(10,2) DEFAULT 0.00,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.pharmacy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read pharmacy" ON public.pharmacy FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write pharmacy" ON public.pharmacy FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update pharmacy" ON public.pharmacy FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete pharmacy" ON public.pharmacy FOR DELETE TO authenticated USING (true);


-- ============================================================
-- 10. Create Beds Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.beds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  status      TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied')),
  patient_id  UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read beds" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write beds" ON public.beds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update beds" ON public.beds FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete beds" ON public.beds FOR DELETE TO authenticated USING (true);


-- ============================================================
-- 11. Create Staff Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE,
  role        TEXT CHECK (role IN ('Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Billing Staff')),
  department  TEXT,
  phone       TEXT,
  status      TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read staff" ON public.staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write staff" ON public.staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update staff" ON public.staff FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete staff" ON public.staff FOR DELETE TO authenticated USING (true);


-- ============================================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- ============================================================

-- Sample Patients
INSERT INTO public.patients (name, email, phone, date_of_birth, gender, blood_group, address)
VALUES 
('Ali Ahmed', 'ali@email.com', '03001234567', '1990-05-15', 'Male', 'A+', 'House 12, Street 5, Islamabad'),
('Fatima Riaz', 'fatima@email.com', '03007654321', '1985-08-20', 'Female', 'B+', 'House 45, Sector G-11, Islamabad'),
('Muhammad Usman', 'usman@email.com', '03009876543', '1995-03-10', 'Male', 'O+', 'House 78, Street 12, Rawalpindi')
ON CONFLICT (id) DO NOTHING;

-- Sample Doctors
INSERT INTO public.doctors (name, email, phone, specialization, availability)
VALUES 
('Dr. Hamza Iqbal', 'hamza@hospital.com', '03001112233', 'Cardiology', 'Available'),
('Dr. Ayesha Khan', 'ayesha@hospital.com', '03004445566', 'Neurology', 'Available'),
('Dr. Usman Malik', 'usman@hospital.com', '03007778899', 'Pediatrics', 'Available')
ON CONFLICT (id) DO NOTHING;

-- Sample Beds
INSERT INTO public.beds (room_number, status)
VALUES 
('101', 'available'),
('102', 'available'),
('103', 'occupied'),
('104', 'available'),
('105', 'occupied')
ON CONFLICT (id) DO NOTHING;

-- Sample Medicines
INSERT INTO public.pharmacy (medicine_name, stock, price)
VALUES 
('Paracetamol 500mg', 100, 15.00),
('Loratadine 10mg', 50, 25.00),
('Amoxicillin 250mg', 75, 45.00),
('Ibuprofen 400mg', 60, 20.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- VERIFY ALL TABLES CREATED
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;