import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { dbPatients, dbDoctors, dbAppointments } from '../services/db';
import { Search as SearchIcon, Users, Stethoscope, Calendar, ArrowRight } from 'lucide-react';

const SearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse query param
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('q') || '';

    const [loading, setLoading] = useState(false);
    const [patientResults, setPatientResults] = useState([]);
    const [doctorResults, setDoctorResults] = useState([]);
    const [appointmentResults, setAppointmentResults] = useState([]);

    const executeSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            // Fetch filtered records
            const [pData, dData, aData] = await Promise.all([
                dbPatients.getPatients({ search: query, limit: 20 }),
                dbDoctors.getDoctors({ search: query }),
                dbAppointments.getAppointments()
            ]);

            setPatientResults(pData.patients || []);
            setDoctorResults(dData || []);

            // Filter appointments locally based on patient or doctor name or reason
            const filteredAppts = aData.filter(app => {
                const patName = app.patient?.name || '';
                const docName = app.doctor?.name || '';
                const reason = app.reason || '';
                return patName.toLowerCase().includes(query.toLowerCase()) ||
                       docName.toLowerCase().includes(query.toLowerCase()) ||
                       reason.toLowerCase().includes(query.toLowerCase());
            });
            setAppointmentResults(filteredAppts);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        executeSearch();
    }, [query]);

    const totalResults = patientResults.length + doctorResults.length + appointmentResults.length;

    return (
        <DashboardLayout active="" title="Global Search Results" showSearch={true}>
            <div style={{ animation: 'slideUp 0.3s ease-out' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Search Results for "{query}"
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Found {totalResults} matches across the database.
                    </p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Searching database...</div>
                ) : totalResults === 0 ? (
                    <div className="auth-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '100%', animation: 'none' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>No matches found</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            We couldn't find any patient record, doctor specialization, or appointment matching that keyword. Try another search.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* PATIENT RESULTS */}
                        {patientResults.length > 0 && (
                            <div className="auth-card" style={{ padding: '20px', maxWidth: '100%', animation: 'none' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--primary-color)' }}>
                                    <Users size={18} /> Patients ({patientResults.length})
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {patientResults.map(p => (
                                        <div key={p.id} onClick={() => navigate('/patients')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{p.name}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone: {p.phone} | Blood: {p.blood_group || 'N/A'}</span>
                                            </div>
                                            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* DOCTOR RESULTS */}
                        {doctorResults.length > 0 && (
                            <div className="auth-card" style={{ padding: '20px', maxWidth: '100%', animation: 'none' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#10B981' }}>
                                    <Stethoscope size={18} /> Doctors ({doctorResults.length})
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {doctorResults.map(d => (
                                        <div key={d.id} onClick={() => navigate('/doctors')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{d.name}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Specialization: {d.specialization} | Availability: {d.availability}</span>
                                            </div>
                                            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* APPOINTMENT RESULTS */}
                        {appointmentResults.length > 0 && (
                            <div className="auth-card" style={{ padding: '20px', maxWidth: '100%', animation: 'none' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#F59E0B' }}>
                                    <Calendar size={18} /> Appointments ({appointmentResults.length})
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {appointmentResults.map(app => (
                                        <div key={app.id} onClick={() => navigate('/appointments')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Patient: {app.patient?.name} | Doctor: {app.doctor?.name}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date: {new Date(app.appointment_date).toLocaleDateString()} | Slot: {app.time_slot} | Status: {app.status}</span>
                                            </div>
                                            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SearchResults;
