import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FALLBACK = [
  { id: 1,  name: 'Priya Sharma',    role: 'patient', rating: 5, spec: '',                message: 'MediAI detected my iron deficiency from symptoms alone. The AI recommendation was exactly what my doctor later confirmed.' },
  { id: 2,  name: 'Dr. Arjun Mehta', role: 'doctor',  rating: 5, spec: 'General Physician', message: 'As a doctor, I was skeptical. But the accuracy of symptom mapping is genuinely impressive. My patients come better prepared now.' },
  { id: 3,  name: 'Rahul Patel',     role: 'patient', rating: 5, spec: '',                message: 'I typed "fever and joint pain" and got a Dengue warning with exact medicines. Visited the clinic — confirmed. Incredible tool.' },
  { id: 4,  name: 'Dr. Sneha Joshi', role: 'doctor',  rating: 4, spec: 'Endocrinologist',  message: 'The diabetes prediction is remarkably consistent with clinical findings. I recommend patients use this before appointments.' },
  { id: 5,  name: 'Meera Nair',      role: 'patient', rating: 5, spec: '',                message: 'The medical report upload feature read my blood test and matched it to hypothyroidism. My doctor was amazed at how prepared I was.' },
  { id: 6,  name: 'Vikram Desai',    role: 'patient', rating: 4, spec: '',                message: 'Quick, accurate, and the prescription details are genuinely useful. Clean interface, easy even for elderly family members.' },
  { id: 7,  name: 'Dr. Kavitha Rao', role: 'doctor',  rating: 5, spec: 'Cardiologist',    message: 'Chest pain triage is handled well. It correctly flags high-risk combinations and recommends urgent care. Great screening tool.' },
  { id: 8,  name: 'Anjali Singh',    role: 'patient', rating: 5, spec: '',                message: 'I was panicking at midnight. MediAI gave me a clear analysis and told me to go to the ER. That decision was life-saving.' },
  { id: 9,  name: 'Dr. Ravi Kumar',  role: 'doctor',  rating: 5, spec: 'Neurologist',     message: 'Patients using MediAI before consultations are noticeably better informed. It has improved the quality of my patient interactions significantly.' },
  { id: 10, name: 'Sunita Reddy',    role: 'patient', rating: 5, spec: '',                message: 'The symptom checker found my vitamin D deficiency when I had been struggling for months. Now I feel so much better!' },
];

// ─── Inline SVG star (no lucide) ─────────────────────────────────────────────
const StarIcon = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <polygon
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#374151'}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const Stars = ({ count }) => (
  <div style={{ display: 'flex', gap: 3 }}>
    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= count} />)}
  </div>
);

// ─── Inline SVG quote mark (no lucide) ───────────────────────────────────────
const QuoteMark = () => (
  <svg
    width="34" height="26"
    viewBox="0 0 34 26"
    fill="rgba(0,153,204,0.07)"
    style={{ position: 'absolute', top: 13, right: 14 }}
  >
    <path d="M0 26V15.8C0 11.4 1.13 7.87 3.4 5.2C5.67 2.53 8.77 0.747 12.73 0L14.07 2.6C11.8 3.27 9.97 4.48 8.58 6.24C7.19 7.99 6.5 10.06 6.5 12.4H12.73V26H0ZM20.27 26V15.8C20.27 11.4 21.4 7.87 23.67 5.2C25.93 2.53 29.03 0.747 32.99 0L34 2.6C31.73 3.27 29.9 4.48 28.51 6.24C27.12 7.99 26.43 10.06 26.43 12.4H32.99V26H20.27Z" />
  </svg>
);

// ─── Initials Avatar (no lucide icons) ───────────────────────────────────────
const InitialsAvatar = ({ name }) => {
  const clean  = name.replace('Dr. ', '').replace('Dr.', '');
  const parts  = clean.trim().split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : clean.slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: 40, height: 40,
      borderRadius: '50%',
      flexShrink: 0,
      background: 'linear-gradient(135deg, #0099cc 0%, #005f8a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid rgba(0,153,204,0.30)',
      boxShadow: '0 0 10px rgba(0,153,204,0.15)',
      fontSize: 13,
      fontWeight: 800,
      color: '#fff',
      letterSpacing: '0.03em',
    }}>
      {initials}
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
const Card = ({ item }) => {
  const isDoc = item.role === 'doctor';

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        background: 'rgba(15,25,46,0.96)',
        border: '1px solid rgba(0,153,204,0.20)',
        borderRadius: 16,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,153,204,0.10)',
        transition: 'transform 0.28s ease, box-shadow 0.28s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,153,204,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,153,204,0.10)';
      }}
    >
      {/* Cyan top accent bar — same for both */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: 'linear-gradient(90deg, #0099cc 0%, #22d3ee 100%)',
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Subtle top glow */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(180deg, rgba(0,153,204,0.06) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <QuoteMark />
      <Stars count={item.rating} />

      <p style={{
        color: '#cbd5e1',
        fontSize: 13,
        lineHeight: 1.75,
        flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        position: 'relative',
      }}>
        "{item.message}"
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <InitialsAvatar name={item.name} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#f1f5f9',
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.name}
          </div>
          <div style={{ color: '#6b7280', fontSize: 11, marginTop: 1 }}>
            {isDoc ? (item.spec || 'General Physician') : 'Patient'}
          </div>
        </div>

        {/* Role badge */}
        <div style={{
          padding: '4px 10px',
          borderRadius: 99,
          fontSize: 10,
          fontWeight: 700,
          background: 'rgba(0,153,204,0.12)',
          color: '#22d3ee',
          border: '1px solid rgba(0,153,204,0.28)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}>
          {isDoc ? 'Doctor' : 'Patient'}
        </div>
      </div>
    </div>
  );
};

// ─── Carousel ─────────────────────────────────────────────────────────────────
const MixedCarousel = ({ items }) => {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  let list = [...shuffled];
  while (list.length < 8) list = [...list, ...shuffled];
  const doubled = [...list, ...list];
  const totalW  = list.length * (300 + 20);

  return (
    <div style={{ overflow: 'hidden', position: 'relative', marginBottom: 32 }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to right, #090d1c 0%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to left, #090d1c 0%, transparent 100%)',
      }} />
      <div
        className="marquee-mixed"
        style={{ display: 'flex', gap: 20, width: 'max-content', animationDuration: `${totalW / 30}s` }}
      >
        {doubled.map((item, i) => (
          <Card key={`${item.id}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
export default function TestimonialsMarquee() {
  const [items, setItems] = useState(FALLBACK);

  useEffect(() => {
    fetch(`${API}/public/testimonials`)
      .then(r => r.json())
      .then(data => { if (data?.testimonials?.length >= 1) setItems(data.testimonials); })
      .catch(() => {});
  }, []);

  return (
    <section
      className="py-20 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #090d1c 0%, #0b1020 50%, #090d1c 100%)' }}
    >
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-mixed { animation: marquee-left linear infinite; }
        .marquee-mixed:hover { animation-play-state: paused; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 52, padding: '0 20px' }}>

        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
          Trusted by Patients &amp; Doctors
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Real experiences from patients who got accurate diagnoses and doctors who trust our AI platform.
        </p>
      </div>

      <MixedCarousel items={items} />

      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 'clamp(24px, 4vw, 64px)',
        flexWrap: 'wrap',
        marginTop: 56,
        padding: '0 20px',
      }}>
        {[
          
          { v: '98.8%',   l: 'Prediction Accuracy' },
          { v: '151',     l: 'Diseases Covered' },
          
        ].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ color: '#22d3ee', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 900, letterSpacing: -1, marginBottom: 4 }}>
              {s.v}
            </div>
            <div className="text-gray-500 text-sm">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}