import { supabase } from './supabaseClient';

/**
 * ==========================================
 * PATIENT OPERATIONS
 * ==========================================
 */
export const dbPatients = {
    async getPatients({ search = '', gender = '', bloodGroup = '', page = 1, limit = 10 }) {
        try {
            let query = supabase.from('patients').select('*', { count: 'exact' });

            if (search) {
                query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
            }
            if (gender) {
                query = query.eq('gender', gender);
            }
            if (bloodGroup) {
                query = query.eq('blood_group', bloodGroup);
            }

            // Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, count, error } = await query;
            if (error) throw error;

            return { patients: data || [], total: count || 0 };
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw error;
        }
    },

    async getPatientById(id) {
        const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async createPatient(patient) {
        const { data, error } = await supabase.from('patients').insert([patient]).select().single();
        if (error) throw error;
        return data;
    },

    async updatePatient(id, updates) {
        const { data, error } = await supabase.from('patients').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deletePatient(id) {
        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

/**
 * ==========================================
 * DOCTOR OPERATIONS
 * ==========================================
 */
export const dbDoctors = {
    async getDoctors({ search = '' } = {}) {
        try {
            let query = supabase.from('doctors').select('*');

            if (search) {
                query = query.or(`name.ilike.%${search}%,specialization.ilike.%${search}%`);
            }

            query = query.order('name', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching doctors:', error);
            throw error;
        }
    },

    async getDoctorById(id) {
        const { data, error } = await supabase.from('doctors').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async createDoctor(doctor) {
        const { data, error } = await supabase.from('doctors').insert([doctor]).select().single();
        if (error) throw error;
        return data;
    },

    async updateDoctor(id, updates) {
        const { data, error } = await supabase.from('doctors').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteDoctor(id) {
        const { error } = await supabase.from('doctors').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    async toggleAvailability(id, availability) {
        const { data, error } = await supabase
            .from('doctors')
            .update({ availability })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

/**
 * ==========================================
 * APPOINTMENT OPERATIONS
 * ==========================================
 */
export const dbAppointments = {
    async getAppointments() {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patient:patients(id, name, phone, email),
                    doctor:doctors(id, name, specialization)
                `)
                .order('appointment_date', { ascending: false })
                .order('time_slot', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw error;
        }
    },

    async checkDoubleBooking(doctorId, appointmentDate, timeSlot, excludeId = null) {
        try {
            let query = supabase
                .from('appointments')
                .select('id')
                .eq('doctor_id', doctorId)
                .eq('appointment_date', appointmentDate)
                .eq('time_slot', timeSlot)
                .not('status', 'eq', 'Cancelled');

            if (excludeId) {
                query = query.ne('id', excludeId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data && data.length > 0;
        } catch (error) {
            console.error('Error checking double booking:', error);
            return false;
        }
    },

    async createAppointment(appointment) {
        const { data, error } = await supabase.from('appointments').insert([appointment]).select().single();
        if (error) throw error;
        return data;
    },

    async updateAppointment(id, updates) {
        const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteAppointment(id) {
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

/**
 * ==========================================
 * BILLING & INVOICE OPERATIONS
 * ==========================================
 */
export const dbInvoices = {
    async getInvoices() {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    patient:patients(id, name, phone)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching invoices:', error);
            throw error;
        }
    },

    async createInvoice(invoice) {
        // Auto-generate invoice number if not provided
        const invoiceNum = invoice.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
        const { data, error } = await supabase
            .from('invoices')
            .insert([{ ...invoice, invoice_number: invoiceNum }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateInvoice(id, updates) {
        const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
};

/**
 * ==========================================
 * DASHBOARD STATS OPERATIONS
 * ==========================================
 */
export const dbDashboard = {
    async getStats() {
        try {
            // Run parallel queries to fetch counts
            const [
                { count: patientsCount },
                { count: doctorsCount },
                { count: staffCount },
                { count: appointmentsCount },
                { data: invoicesData }
            ] = await Promise.all([
                supabase.from('patients').select('*', { count: 'exact', head: true }),
                supabase.from('doctors').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }), // Profiles tracks staff
                supabase.from('appointments').select('*', { count: 'exact', head: true }),
                supabase.from('invoices').select('amount, status')
            ]);

            // Calculate Revenue and Outstanding
            let revenue = 0;
            let pendingPayments = 0;

            if (invoicesData) {
                invoicesData.forEach(inv => {
                    const amt = parseFloat(inv.amount) || 0;
                    if (inv.status === 'Paid') {
                        revenue += amt;
                    } else {
                        pendingPayments += amt;
                    }
                });
            }

            // Fetch Recent Patients (limit 5)
            const { data: recentPatients } = await supabase
                .from('patients')
                .select('id, name, email, phone, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            // Fetch Recent Appointments (limit 5)
            const { data: recentAppointments } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    time_slot,
                    status,
                    patient:patients(name),
                    doctor:doctors(name)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            return {
                totalPatients: patientsCount || 0,
                totalDoctors: doctorsCount || 0,
                totalStaff: staffCount || 0,
                totalAppointments: appointmentsCount || 0,
                revenue,
                pendingPayments,
                recentPatients: recentPatients || [],
                recentAppointments: recentAppointments || [],
                invoices: invoicesData || []
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Return safe fallback values
            return {
                totalPatients: 0,
                totalDoctors: 0,
                totalStaff: 0,
                totalAppointments: 0,
                revenue: 0,
                pendingPayments: 0,
                recentPatients: [],
                recentAppointments: [],
                invoices: []
            };
        }
    }
};

/**
 * ==========================================
 * PRESCRIPTION OPERATIONS
 * ==========================================
 */
export const dbPrescriptions = {
    async getPrescriptions() {
        const { data, error } = await supabase
            .from('prescriptions')
            .select(`
                *,
                patient:patients(id, name),
                doctor:doctors(id, name)
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    async createPrescription(prescription) {
        const { data, error } = await supabase.from('prescriptions').insert([prescription]).select().single();
        if (error) throw error;
        return data;
    }
};

/**
 * ==========================================
 * INVENTORY OPERATIONS
 * ==========================================
 */
export const dbInventory = {
    async getInventory() {
        const { data, error } = await supabase.from('inventory').select('*').order('item_name', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async createInventory(item) {
        const { data, error } = await supabase.from('inventory').insert([item]).select().single();
        if (error) throw error;
        return data;
    },
    async updateInventory(id, updates) {
        const { data, error } = await supabase.from('inventory').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
};

/**
 * ==========================================
 * PHARMACY OPERATIONS
 * ==========================================
 */
export const dbPharmacy = {
    async getPharmacy() {
        const { data, error } = await supabase.from('pharmacy').select('*').order('medicine_name', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async createPharmacy(medicine) {
        const { data, error } = await supabase.from('pharmacy').insert([medicine]).select().single();
        if (error) throw error;
        return data;
    },
    async updatePharmacy(id, updates) {
        const { data, error } = await supabase.from('pharmacy').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
};

/**
 * ==========================================
 * STAFF OPERATIONS
 * ==========================================
 */
export const dbStaff = {
    async getStaff() {
        const { data, error } = await supabase.from('profiles').select('*').order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async updateStaffRole(id, role) {
        const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
};
