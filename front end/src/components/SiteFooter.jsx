import { useNavigate } from 'react-router-dom';
import MediAiLogo from './MediAiLogo';

const C = {
  bg:     '#07090f',
  border: 'rgba(0,153,204,0.12)',
  cyan:   '#0099cc',
  text:   '#f1f5f9',
  muted:  '#64748b',
  sub:    '#94a3b8',
};

export default function SiteFooter() {
  const navigate = useNavigate();
  const nav = (path) => navigate(path);

  const cols = [
    {
      title: 'Platform',
      links: [
        { label: 'Features',         path: '/features' },
        { label: 'Pricing',          path: '/pricing' },
        { label: 'About Us',         path: '/about' },
      ],
    },
    {
      title: 'Register',
      links: [
        { label: 'Patient Registration', path: '/register/patient' },
        { label: 'Doctor Registration',  path: '/register/doctor' },
        { label: 'Sign In',              path: '/login' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy',   path: '/privacy-policy' },
        { label: 'Terms of Service', path: '/terms-of-service' },
      ],
    },
  ];

  return (
    <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}`, fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      
      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 60,
          marginBottom: 48,
          alignItems: 'start',
        }}>

          {/* Brand Section */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <MediAiLogo size={32} showText={false} />
              <span style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
                Medi<span style={{ color: C.cyan }}>AI</span>
              </span>
            </div>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, maxWidth: 280 }}>
              AI-powered healthcare for smarter diagnoses and better patient outcomes.
            </p>
          </div>

          {/* Navigation Columns */}
          {cols.map(col => (
            <div key={col.title}>
              <h4 style={{
                color: C.text, fontSize: 13, fontWeight: 700,
                marginBottom: 16, letterSpacing: '0.05em',
              }}>
                {col.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(link => (
                  <li key={link.label}>
                    <button onClick={() => nav(link.path)} style={{
                      background: 'none', border: 'none', color: C.muted,
                      fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      padding: 0, textAlign: 'left', lineHeight: 1.5,
                      transition: 'color 0.2s ease',
                    }}
                    onHover={() => { /* Optional: add hover effect */ }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          paddingTop: 20,
          borderTop: `1px solid ${C.border}`,
        }}>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
            © {new Date().getFullYear()} MediAI. All rights reserved.
          </p>
          <p style={{ color: C.muted, fontSize: 12, margin: 0, maxWidth: 500, textAlign: 'right' }}>
            ⚠ AI suggestions are for informational purposes only. Always consult a licensed doctor.
          </p>
        </div>
      </div>
    </footer>
  );
}