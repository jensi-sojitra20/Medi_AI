import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Lock, Users, UserCheck, AlertTriangle } from 'lucide-react';
import MediAiLogo from "../components/MediAiLogo";

const sections = [
    {
        icon: <Eye size={20} />,
        title: '1. Introduction',
        content: `Welcome to Medi AI. Medi AI is an AI-Driven Treatment Recommendation System designed to assist doctors by providing AI-based treatment suggestions based on patient data.\n\nWe respect your privacy and are committed to protecting your personal and medical information.`
    },
    {
        icon: <Database size={20} />,
        title: '2. Information We Collect',
        subsections: [
            {
                label: '👤 Patient Information',
                items: ['Name', 'Age', 'Gender', 'Contact details', 'Medical history', 'Symptoms', 'Uploaded reports (if any)']
            },
            {
                label: '👨‍⚕️ Doctor Information',
                items: ['Name', 'Email ID', 'Medical license details', 'Specialization']
            },
            {
                label: '🛠 System Information',
                items: ['Login credentials', 'Subscription details', 'Usage data for system improvement']
            }
        ]
    },
    {
        icon: <Users size={20} />,
        title: '3. How We Use the Information',
        list: [
            'Generate AI-based treatment recommendations',
            'Help doctors review and approve prescriptions',
            'Maintain patient medical records',
            'Improve system accuracy and performance',
            'Ensure platform security'
        ]
    },
    {
        icon: <Lock size={20} />,
        title: '4. Data Security',
        list: [
            'All user data is stored securely in the database.',
            'Role-based access control is implemented (Patient, Doctor, Admin).',
            'Only verified doctors can access patient medical data.',
            'Admin monitors system activity for safety and compliance.'
        ]
    },
    {
        icon: <Shield size={20} />,
        title: '5. Data Sharing',
        content: 'Medi AI does not sell or share personal or medical data with third parties. Data is only accessible within the platform by authorized users.'
    },
    {
        icon: <UserCheck size={20} />,
        title: '6. User Rights',
        content: 'Users have the right to:',
        list: ['Access their data', 'Update their information', 'Request deletion of their account']
    },
    {
        icon: <AlertTriangle size={20} />,
        title: '7. Disclaimer',
        content: 'Medi AI provides AI-generated recommendations. Final prescription approval is done by a licensed doctor. The system does not replace professional medical advice.',
        highlight: true
    }
];

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 60%, #0a0e27 100%)' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid rgba(0,153,204,0.15)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, background: 'rgba(10,14,39,0.95)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                    Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <MediAiLogo size={32} showText={false} />
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>MediAI</span>
                </div>

            </div>

            <div style={{ maxWidth: 820, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1.25rem', background: 'rgba(0,153,204,0.1)', border: '1px solid rgba(0,153,204,0.25)', borderRadius: 999, marginBottom: '1.25rem' }}>
                        <Shield size={15} color="#0099cc" />
                        <span style={{ color: '#0099cc', fontSize: '0.85rem', fontWeight: 600 }}>Legal Document</span>
                    </div>
                    <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.75rem' }}>🔐 Privacy Policy</h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>For Medi AI – AI-Driven Treatment Recommendation System</p>
                    <p style={{ color: '#475569', fontSize: '0.82rem', marginTop: '0.5rem' }}>Last updated: 2025</p>
                </div>

                {/* Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {sections.map((section, i) => (
                        <div key={i} style={{
                            background: section.highlight ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${section.highlight ? 'rgba(245,158,11,0.2)' : 'rgba(0,153,204,0.12)'}`,
                            borderRadius: '1rem', padding: '1.75rem',
                            transition: 'border-color 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: 38, height: 38, borderRadius: '0.625rem', background: section.highlight ? 'rgba(245,158,11,0.15)' : 'rgba(0,153,204,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.highlight ? '#f59e0b' : '#0099cc', flexShrink: 0 }}>
                                    {section.icon}
                                </div>
                                <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{section.title}</h2>
                            </div>

                            {section.content && (
                                <p style={{ color: '#94a3b8', lineHeight: 1.75, margin: '0 0 0.75rem', whiteSpace: 'pre-line' }}>{section.content}</p>
                            )}

                            {section.subsections && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {section.subsections.map((sub, j) => (
                                        <div key={j}>
                                            <p style={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>{sub.label}</p>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                                {sub.items.map((item, k) => (
                                                    <li key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0099cc', flexShrink: 0 }} />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {section.list && (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {section.list.map((item, j) => (
                                        <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: section.highlight ? '#f59e0b' : '#0099cc', flexShrink: 0, marginTop: 7 }} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(0,153,204,0.06)', border: '1px solid rgba(0,153,204,0.15)', borderRadius: '0.875rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                        If you have any questions about this Privacy Policy, please contact the system administrator.
                    </p>
                    <button onClick={() => navigate(-1)} style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #0099cc, #0077aa)', color: '#fff', border: 'none', borderRadius: '0.625rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        ← Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
