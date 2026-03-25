import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, User, Mail, Phone, Calendar, Droplet,
  Lock, CheckCircle, AlertCircle, Activity, MapPin, Upload, X, ImageIcon, Heart
} from 'lucide-react';
import MediAiLogo from "../components/MediAiLogo";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function PatientRegistration() {
  const navigate = useNavigate();
  const imageRef = useRef();

  const [form, setForm] = useState({
    full_name: '', age: '', gender: '', email: '',
    phone: '', blood_group: '', address: '', password: '', confirm_password: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [genderOpen, setGenderOpen] = useState(false);
  const [bloodOpen, setBloodOpen] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())
      e.full_name = 'Full name is required';
    else if (!/^[A-Za-z\s]{1,100}$/.test(form.full_name))
      e.full_name = 'Name must be 1-100 characters, alphabets and spaces only';
    if (form.age === '')
      e.age = 'Age is required';
    else if (isNaN(form.age) || Number(form.age) < 0 || Number(form.age) > 120)
      e.age = 'Age must be between 0 and 120';
    if (!form.gender)
      e.gender = 'Please select a gender';
    if (!form.email.trim())
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address';
    if (!form.phone.trim())
      e.phone = 'Phone number is required';
    else if (!/^\d{10,15}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Phone must contain only digits, 10-15 characters';
    if (profileImage) {
      const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowed.includes(profileImage.type))
        e.profile_image = 'Only JPG, JPEG, PNG formats allowed';
      else if (profileImage.size > 2 * 1024 * 1024)
        e.profile_image = 'Image size must be less than 2 MB';
    }
    if (!form.password)
      e.password = 'Password is required';
    else if (form.password.length < 8 ||
      !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) ||
      !/\d/.test(form.password) || !/[!@#$%^&*(),.?":{}|<>_\-]/.test(form.password))
      e.password = 'Min 8 chars with uppercase, lowercase, number & special character';
    if (form.password !== form.confirm_password)
      e.confirm_password = 'Passwords do not match';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setErrors(prev => ({ ...prev, profile_image: '' }));
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (imageRef.current) imageRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      formData.set('age', parseInt(form.age));
      if (profileImage) formData.append('profile_image', profileImage);
      const res = await fetch(`${API_URL}/register/patient`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStrength = () => {
    const p = form.password;
    if (!p) return { score: 0, label: '', color: '' };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[!@#$%^&*(),.?":{}|<>_\-]/.test(p)) s++;
    const map = {
      0: { label: '', color: '' },
      1: { label: 'Very Weak', color: '#ef4444' },
      2: { label: 'Weak', color: '#f97316' },
      3: { label: 'Fair', color: '#eab308' },
      4: { label: 'Good', color: '#22c55e' },
      5: { label: 'Strong', color: '#0099cc' },
    };
    return { score: s, ...map[s] };
  };
  const strength = getStrength();

  if (success) return (
    <div style={pageStyle}>
      <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', border: '1px solid rgba(0,153,204,0.3)', maxWidth: 440, margin: '0 auto' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,153,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle size={42} color="#0099cc" />
        </div>
        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Registration Successful!</h2>
        <p style={{ color: '#94a3b8' }}>Your patient account has been created. Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      {/* Animated background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '8%', right: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,153,204,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '45%', left: '45%', width: 350, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,119,170,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 620, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem 1.25rem', background: 'rgba(0,153,204,0.1)', border: '1px solid rgba(0,153,204,0.2)', borderRadius: 99 }}>
            <MediAiLogo size={28} showText={false} />
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Medi<span style={{ color: '#0099cc' }}>AI</span>
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>
            Patient Registration
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Create your account to access AI-powered healthcare services
          </p>
        </div>

        {/* Card */}
        <div style={cardStyle}>
          {apiError && (
            <div style={errorBannerStyle}>
              <AlertCircle size={18} color="#ef4444" />
              <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>

              {/* Profile photo */}
              <SectionLabel icon={<User size={13} />} text="Profile Photo" color="#0099cc" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0099cc', display: 'block' }} />
                      <button type="button" onClick={removeImage} style={{ position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: '2px solid #0d1628', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={11} color="#fff" />
                      </button>
                    </>
                  ) : (
                    <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(0,153,204,0.08)', border: '2px dashed rgba(0,153,204,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={28} color="rgba(0,153,204,0.45)" />
                    </div>
                  )}
                </div>
                <div>
                  <button type="button" onClick={() => imageRef.current.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', background: 'rgba(0,153,204,0.1)', border: '1px solid rgba(0,153,204,0.3)', borderRadius: '0.625rem', color: '#22d3ee', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
                    <Upload size={14} /> Upload Photo
                  </button>
                  <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.35rem' }}>JPG, PNG · Max 2 MB · Optional</p>
                </div>
                <input ref={imageRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleImageChange} style={{ display: 'none' }} />
              </div>
              {errors.profile_image && <p style={errStyle}>{errors.profile_image}</p>}

              {/* Personal info */}
              <SectionLabel icon={<User size={13} />} text="Personal Information" color="#0099cc" />

              <Field label="Full Name" icon={<User size={15} />} error={errors.full_name} required>
                <input type="text" placeholder="John Doe" value={form.full_name}
                  onChange={e => handleChange('full_name', e.target.value)} style={inputStyle(errors.full_name)} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Age" icon={<Calendar size={15} />} error={errors.age} required>
                  <input type="number" placeholder="25" min="0" max="120" value={form.age}
                    onChange={e => handleChange('age', e.target.value)} style={inputStyle(errors.age)} />
                </Field>

                {/* Custom Gender Dropdown */}
                <Field label="Gender" error={errors.gender} required>
                  <CustomDropdown
                    value={form.gender}
                    placeholder="Select gender"
                    options={GENDERS}
                    open={genderOpen}
                    onToggle={() => setGenderOpen(o => !o)}
                    onSelect={v => { handleChange('gender', v); setGenderOpen(false); }}
                    error={errors.gender}
                    color="#0099cc"
                  />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Email Address" icon={<Mail size={15} />} error={errors.email} required>
                  <input type="email" placeholder="john@example.com" value={form.email}
                    onChange={e => handleChange('email', e.target.value)} style={inputStyle(errors.email)} />
                </Field>
                <Field label="Phone Number" icon={<Phone size={15} />} error={errors.phone} required>
                  <input type="tel" placeholder="9876543210" value={form.phone}
                    onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))} style={inputStyle(errors.phone)} />
                </Field>
              </div>

              {/* Medical info */}
              <SectionLabel icon={<Heart size={13} />} text="Medical Details" color="#22d3ee" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Custom Blood Group Dropdown */}
                <Field label="Blood Group" icon={<Droplet size={15} />} hint="Optional">
                  <CustomDropdown
                    value={form.blood_group}
                    placeholder="Select"
                    options={BLOOD_GROUPS}
                    open={bloodOpen}
                    onToggle={() => setBloodOpen(o => !o)}
                    onSelect={v => { handleChange('blood_group', v); setBloodOpen(false); }}
                    color="#22d3ee"
                  />
                </Field>

                <Field label="Address" icon={<MapPin size={15} />} hint="Optional">
                  <input type="text" placeholder="City, State" value={form.address}
                    onChange={e => handleChange('address', e.target.value)} style={inputStyle()} />
                </Field>
              </div>

              {/* Security */}
              <SectionLabel icon={<Lock size={13} />} text="Account Security" color="#22c55e" />

              <Field label="Password" icon={<Lock size={15} />} error={errors.password} required>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars with special character"
                    value={form.password} onChange={e => handleChange('password', e.target.value)}
                    style={{ ...inputStyle(errors.password), paddingRight: '3rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                    {showPassword ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(strength.score / 5) * 100}%`, background: strength.color, borderRadius: 999, transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: strength.color, marginTop: '0.2rem', display: 'block' }}>{strength.label}</span>
                  </div>
                )}
              </Field>

              <Field label="Confirm Password" icon={<Lock size={15} />} error={errors.confirm_password} required>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password"
                    value={form.confirm_password} onChange={e => handleChange('confirm_password', e.target.value)}
                    style={{ ...inputStyle(errors.confirm_password), paddingRight: '3rem' }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>
                    {showConfirm ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                  </button>
                </div>
              </Field>

              {/* Submit */}
              <button type="submit" disabled={loading} style={submitBtn(loading)}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Activity size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating Account...</span>
                  : 'Create Patient Account'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#0099cc', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
            </p>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.4rem' }}>
              Are you a doctor?{' '}
              <Link to="/register/doctor" style={{ color: '#0099cc', textDecoration: 'none', fontWeight: 600 }}>Doctor Registration</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #1a2035 inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>
    </div>
  );
}

function CustomDropdown({ value, placeholder, options, open, onToggle, onSelect, error, color = '#0099cc' }) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          ...inputStyle(error),
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', color: value ? '#fff' : '#64748b',
        }}
      >
        <span>{value || placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
          background: '#1a2035', border: `1px solid ${color}44`,
          borderRadius: '0.75rem', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          maxHeight: 200, overflowY: 'auto',
        }}>
          {options.map(opt => (
            <button
              key={opt} type="button"
              onClick={() => onSelect(opt)}
              style={{
                width: '100%', padding: '0.65rem 1rem', textAlign: 'left',
                background: value === opt ? `${color}22` : 'transparent',
                color: value === opt ? color : '#cbd5e1',
                fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (value !== opt) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { if (value !== opt) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; } }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ icon, text, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', marginBottom: '-0.25rem' }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

function Field({ label, icon, error, hint, required, children }) {
  return (
    <div>
      <label style={labelStyle}>
        {icon && <span style={{ color: '#0099cc' }}>{icon}</span>}
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        {hint && <span style={{ color: '#475569', fontWeight: 400, marginLeft: 4 }}>({hint})</span>}
      </label>
      {children}
      {error && <p style={errStyle}>{error}</p>}
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #080c1a 0%, #0d1628 40%, #080c1a 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '2rem 1rem', position: 'relative',
};
const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '1.5rem',
  border: '1px solid rgba(0,153,204,0.18)',
  padding: '2rem',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};
const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.45rem'
};
const errStyle = { color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem' };
const errorBannerStyle = {
  display: 'flex', alignItems: 'center', gap: '0.75rem',
  padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', marginBottom: '1.25rem'
};
const eyeBtn = {
  position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex'
};
const submitBtn = (loading) => ({
  width: '100%', padding: '0.9rem',
  background: loading ? 'rgba(0,153,204,0.35)' : 'linear-gradient(135deg, #0099cc, #0077aa)',
  color: '#fff', border: 'none', borderRadius: '0.75rem',
  fontSize: '1rem', fontWeight: 700,
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s', marginTop: '0.25rem',
  boxShadow: loading ? 'none' : '0 4px 20px rgba(0,153,204,0.3)',
  letterSpacing: '0.02em',
});
function inputStyle(error) {
  return {
    width: '100%', padding: '0.7rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(0,153,204,0.2)'}`,
    borderRadius: '0.625rem', color: '#fff', fontSize: '0.925rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    WebkitAppearance: 'none', fontFamily: 'inherit'
  };
}
