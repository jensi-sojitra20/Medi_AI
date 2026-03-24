import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Users, UserCog, Bot, CreditCard, Ban, AlertTriangle, XCircle } from 'lucide-react';
import MediAiLogo from "../components/MediAiLogo";

const sections = [
    {
        icon: <FileText size={20} />,
        title: '1. Acceptance of Terms',
        content: 'By using Medi AI, you agree to comply with these Terms of Service.'
    },
    {
        icon: <Users size={20} />,
        title: '2. User Roles',
        content: 'Medi AI provides access based on roles:',
        roleCards: [
            { emoji: '👤', role: 'Patient', desc: 'Can request AI recommendations (with active subscription).', color: '#22c55e' },
            { emoji: '👨‍⚕️', role: 'Doctor', desc: 'Can review AI suggestions and generate final prescriptions.', color: '#0099cc' },
            { emoji: '🛠', role: 'Admin', desc: 'Can verify doctors and monitor system activity.', color: '#a855f7' },
        ]
    },
    {
        icon: <UserCog size={20} />,
        title: '3. Account Responsibility',
        content: 'Users are responsible for:',
        list: [
            'Maintaining confidentiality of login credentials',
            'Providing accurate information',
            'Not misusing the platform'
        ]
    },
    {
        icon: <Bot size={20} />,
        title: '4. AI Recommendation Policy',
        list: [
            'AI-generated results are suggestions only.',
            'Doctors must review and approve before final prescription.',
            'Medi AI is not liable for misuse of recommendations.'
        ]
    },
    {
        icon: <CreditCard size={20} />,
        title: '5. Subscription Policy',
        list: [
            'AI recommendations are accessible only with an active subscription.',
            'Subscription fees (if applicable) are non-refundable.'
        ]
    },
    {
        icon: <Ban size={20} />,
        title: '6. Prohibited Activities',
        content: 'Users must not:',
        list: [
            'Upload false medical information',
            'Attempt to hack or damage the system',
            'Access unauthorized data',
            'Misuse patient medical records'
        ],
        highlight: 'danger'
    },
    {
        icon: <AlertTriangle size={20} />,
        title: '7. System Limitations & Scope',
        content: 'The AI system has the following limitations:',
        list: [
            'Provides recommendations only for common diseases based on symptoms',
            'Does not support complex organ-related diseases',
            'Does not support bone injuries or fractures',
            'Does not analyze medical imaging (X-rays, MRI, CT scans)',
            'Not suitable for emergency medical conditions',
            'Cannot replace professional medical diagnosis'
        ],
        highlight: 'warning'
    },
    {
        icon: <AlertTriangle size={20} />,
        title: '8. Limitation of Liability',
        content: 'Medi AI is an academic project and support tool for doctors. The platform is not responsible for any medical decision made without proper doctor approval.',
        highlight: 'warning'
    },
    {
        icon: <XCircle size={20} />,
        title: '9. Termination',
        content: 'Admin reserves the right to suspend or terminate accounts that violate system policies.',
        highlight: 'warning'
    }
];
export default function TermsOfService() {
    const navigate = useNavigate();

    const getColors = (highlight) => {
        if (highlight === 'danger') return { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', icon: 'rgba(239,68,68,0.15)', iconColor: '#ef4444', dot: '#ef4444' };
        if (highlight === 'warning') return { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', icon: 'rgba(245,158,11,0.15)', iconColor: '#f59e0b', dot: '#f59e0b' };
        return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(0,153,204,0.12)', icon: 'rgba(0,153,204,0.12)', iconColor: '#0099cc', dot: '#0099cc' };
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 60%, #0a0e27 100%)' }}>

            {/* Header */}
            <div style={{ borderBottom: '1px solid rgba(0,153,204,0.15)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, background: 'rgba(10,14,39,0.95)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                    <ArrowLeft size={17} /> Back
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
                        <FileText size={15} color="#0099cc" />
                        <span style={{ color: '#0099cc', fontSize: '0.85rem', fontWeight: 600 }}>Legal Document</span>
                    </div>
                    <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.75rem' }}>📜 Terms of Service</h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>For Medi AI – AI-Driven Treatment Recommendation System</p>
                    <p style={{ color: '#475569', fontSize: '0.82rem', marginTop: '0.5rem' }}>Last updated: 2025</p>
                </div>

                {/* Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {sections.map((section, i) => {
                        const c = getColors(section.highlight);
                        return (
                            <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '1rem', padding: '1.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ width: 38, height: 38, borderRadius: '0.625rem', background: c.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.iconColor, flexShrink: 0 }}>
                                        {section.icon}
                                    </div>
                                    <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{section.title}</h2>
                                </div>

                                {section.content && (
                                    <p style={{ color: '#94a3b8', lineHeight: 1.75, margin: section.list || section.roleCards ? '0 0 0.875rem' : 0 }}>
                                        {section.content}
                                    </p>
                                )}

                                {section.roleCards && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                                        {section.roleCards.map((card, j) => (
                                            <div key={j} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${card.color}30`, borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{card.emoji}</div>
                                                <div style={{ color: card.color, fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.375rem' }}>{card.role}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>{card.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {section.list && (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {section.list.map((item, j) => (
                                            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0, marginTop: 7 }} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Agreement notice */}
                <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', background: 'rgba(0,153,204,0.08)', border: '1px solid rgba(0,153,204,0.2)', borderRadius: '0.875rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>✅</span>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
                        By creating an account and using Medi AI, you confirm that you have read, understood, and agree to these Terms of Service and our{' '}
                        <button
                            onClick={() => navigate('/privacy-policy')}
                            style={{ background: 'none', border: 'none', color: '#0099cc', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, padding: 0 }}
                        >
                            Privacy Policy
                        </button>.
                    </p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #0099cc, #0077aa)', color: '#fff', border: 'none', borderRadius: '0.625rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
