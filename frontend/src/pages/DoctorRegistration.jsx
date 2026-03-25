import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, User, Mail, Phone, Lock, Stethoscope,
  ClipboardList, Clock, CheckCircle, AlertCircle, Activity, Info, Upload, X, FileText, ChevronDown
} from 'lucide-react';
import MediAiLogo from "../components/MediAiLogo";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Dermatology', 'Gynecology', 'Oncology',
  'Psychiatry', 'Radiology', 'Surgery', 'ENT', 'Ophthalmology',
  'Urology', 'Nephrology', 'Endocrinology', 'Pulmonology',
  'Gastroenterology', 'Rheumatology', 'Hematology'
];

const QUALIFICATIONS = [
  'MBBS', 'MD', 'MS', 'DM', 'MCh', 'DNB', 'AFIH', 'PGDM',
  'BDS', 'MDS', 'BAMS', 'BHMS', 'B.Sc Nursing', 'M.Sc Nursing'
];

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const idProofRef = useRef();

  const [form, setForm] = useState({
    full_name: '', 
    email: '', 
    password: '', 
    confirm_password: '',
    phone: '', 
    license_number: '', 
    specialization: '',      // ← KEEP THIS
    qualification: '',       // ← ALSO NEED THIS
    experience_years: '',    // ← Correct name
    hospital: ''             // ← Optional but good to have
  });
  const [idProof, setIdProof] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [specOpen, setSpecOpen] = useState(false);
  const [qualOpen, setQualOpen] = useState(false);

  const validate = () => {
    const e = {};
    
    if (!form.full_name.trim())
      e.full_name = 'Full name is required';
    else if (!/^[A-Za-z\s]{3,100}$/.test(form.full_name))
      e.full_name = 'Only alphabets & spaces allowed, minimum 3 characters';
    
    if (!form.email.trim())
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address';
    
    if (!form.phone.trim())
      e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Phone must be exactly 10 digits';
    
    if (!form.license_number.trim())
      e.license_number = 'Medical license number is required';
    else if (form.license_number.length < 5 || !/^[A-Za-z0-9]+$/.test(form.license_number))
      e.license_number = 'Min 5 alphanumeric characters (e.g., MCI20231234)';
    
    if (!form.specialization)
      e.specialization = 'Please select a specialization';
    
    if (!form.qualification)
      e.qualification = 'Please select your qualification';
    
    if (form.experience_years === '' || form.experience_years === undefined)
      e.experience_years = 'Experience is required';
    else {
      const exp = Number(form.experience_years);
      if (isNaN(exp) || exp < 0 || exp > 50)
        e.experience_years = 'Experience must be between 0 and 50 years';
    }
    
    if (idProof) {
      const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowed.includes(idProof.type))
        e.id_proof = 'Only PDF, JPG, PNG files allowed';
      else if (idProof.size > 5 * 1024 * 1024)
        e.id_proof = 'File size must be less than 5 MB';
    }
    
    if (!form.password)
      e.password = 'Password is required';
    else if (form.password.length < 8 ||
      !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) ||
      !/\d/.test(form.password) || !/[!@#$%^&*(),.?":{}|<>_\-]/.test(form.password))
      e.password = 'Min 8 chars with uppercase, lowercase, number & special character';
    
    if (!form.confirm_password)
      e.confirm_password = 'Please confirm your password';
    else if (form.password !== form.confirm_password)
      e.confirm_password = 'Passwords do not match';
    
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleIdProof = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdProof(file);
    setErrors(prev => ({ ...prev, id_proof: '' }));
  };

  const removeIdProof = () => {
    setIdProof(null);
    if (idProofRef.current) idProofRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      console.error('Validation errors:', validationErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const formData = new FormData();
      
      // Add form fields with CORRECT BACKEND FIELD NAMES
      formData.append('full_name', form.full_name.trim());
      formData.append('email', form.email.trim().toLowerCase());
      formData.append('password', form.password);
      formData.append('confirm_password', form.confirm_password);
      formData.append('phone', form.phone.replace(/\D/g, ''));
      formData.append('license_number', form.license_number.trim().toUpperCase());
      formData.append('specialization', form.specialization);  // ← BOTH needed!
      formData.append('qualification', form.qualification);    // ← BOTH needed!
      formData.append('experience_years', parseInt(form.experience_years, 10));
      
      if (form.hospital && form.hospital.trim()) {
        formData.append('hospital', form.hospital.trim());
      }
      
      if (idProof) {
        formData.append('id_proof', idProof);
      }

      console.log('=== SUBMITTING TO BACKEND ===');
      console.log('Sending fields:');
      console.log('  full_name:', form.full_name.trim());
      console.log('  email:', form.email.trim().toLowerCase());
      console.log('  password: ****');
      console.log('  confirm_password: ****');
      console.log('  phone:', form.phone.replace(/\D/g, ''));
      console.log('  license_number:', form.license_number.trim().toUpperCase());
      console.log('  specialization:', form.specialization);  // ← Required!
      console.log('  qualification:', form.qualification);    // ← Required!
      console.log('  experience_years:', parseInt(form.experience_years, 10));
      console.log('  hospital:', form.hospital || 'not provided');
      console.log('  id_proof:', idProof ? `${idProof.name}` : 'none');

      const res = await fetch(`${API_URL}/register/doctor`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      console.log('Response status:', res.status);
      console.log('Response:', data);

      if (!res.ok) {
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            const fieldErrors = {};
            const messages = [];
            data.detail.forEach(err => {
              const field = err.loc?.[1] || 'general';
              const message = err.msg || 'Validation error';
              fieldErrors[field] = message;
              messages.push(`${field}: ${message}`);
            });
            setErrors(fieldErrors);
            setApiError(`Fix errors: ${messages.join(' | ')}`);
          } else {
            setApiError(data.detail);
          }
        } else if (data.message) {
          setApiError(data.message);
        } else {
          setApiError('Registration failed. Please check your information.');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      console.error('Error:', err);
      setApiError(err.message || 'Network error occurred');
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
      <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', border: '1px solid rgba(0,153,204,0.3)', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,153,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle size={42} color="#0099cc" />
        </div>
        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: '0.75rem' }}>Application Submitted!</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Your doctor account has been created with <strong style={{ color: '#f59e0b' }}>Provisional</strong> status.</p>
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
          <p style={{ color: '#f59e0b', fontSize: '0.875rem', margin: 0 }}>
            ⚠️ Your account requires admin verification before you can access patient records. This usually takes 1–2 business days.
          </p>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      {/* Animated background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,153,204,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 660, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem 1.25rem', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99 }}>
            <MediAiLogo size={28} showText={false} />
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Medi<span style={{ color: '#0099cc' }}>AI</span>
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>
            Doctor Registration
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Join the MediAI medical professional network
          </p>
        </div>

        {/* Notice banner */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.875rem', marginBottom: '1.5rem' }}>
          <Info size={17} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: '#f59e0b', fontSize: '0.85rem', margin: 0 }}>
            Doctor accounts require admin verification. Your account will be <strong>Provisional</strong> until approved (1–2 business days).
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

              {/* Section: Personal Info */}
              <SectionLabel icon={<User size={13} />} text="Personal Information" color="#0099cc" />

              <Field label="Full Name" icon={<User size={15} />} error={errors.full_name} required>
                <input 
                  type="text" 
                  placeholder="Dr. John Smith" 
                  value={form.full_name}
                  onChange={e => handleChange('full_name', e.target.value)} 
                  style={inputStyle(errors.full_name)} 
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Email Address" icon={<Mail size={15} />} error={errors.email} required>
                  <input 
                    type="email" 
                    placeholder="doctor@hospital.com" 
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)} 
                    style={inputStyle(errors.email)} 
                  />
                </Field>
                <Field label="Phone Number" icon={<Phone size={15} />} error={errors.phone} required>
                  <input 
                    type="tel" 
                    placeholder="9876543210" 
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    style={inputStyle(errors.phone)} 
                  />
                </Field>
              </div>

              {/* Hospital (Optional) */}
              <Field label="Hospital / Clinic" icon={<Info size={15} />} error={errors.hospital} hint="Optional">
                <input 
                  type="text" 
                  placeholder="Your hospital or clinic name" 
                  value={form.hospital}
                  onChange={e => handleChange('hospital', e.target.value)} 
                  style={inputStyle(errors.hospital)} 
                />
              </Field>

              {/* Section: Professional Info */}
              <SectionLabel icon={<Stethoscope size={13} />} text="Professional Details" color="#0099cc" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Medical License No." icon={<ClipboardList size={15} />} error={errors.license_number} required>
                  <input 
                    type="text" 
                    placeholder="MCI20231234" 
                    value={form.license_number}
                    onChange={e => handleChange('license_number', e.target.value.toUpperCase())} 
                    style={inputStyle(errors.license_number)} 
                  />
                </Field>
                <Field label="Experience (years)" icon={<Clock size={15} />} error={errors.experience_years} required>
                  <input 
                    type="number" 
                    placeholder="5" 
                    min="0" 
                    max="50" 
                    value={form.experience_years}
                    onChange={e => handleChange('experience_years', e.target.value)} 
                    style={inputStyle(errors.experience_years)} 
                  />
                </Field>
              </div>

              {/* Specialization Dropdown */}
              <Field label="Specialization" icon={<Stethoscope size={15} />} error={errors.specialization} required>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setSpecOpen(o => !o)}
                    style={{
                      ...inputStyle(errors.specialization),
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', textAlign: 'left',
                      color: form.specialization ? '#fff' : '#64748b',
                    }}
                  >
                    <span>{form.specialization || 'Select specialization'}</span>
                    <ChevronDown size={16} color="#64748b"
                      style={{ flexShrink: 0, transform: specOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {specOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                      background: '#1a2035', border: '1px solid rgba(0,153,204,0.3)',
                      borderRadius: '0.75rem', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      maxHeight: 240, overflowY: 'auto',
                    }}>
                      {SPECIALIZATIONS.map(s => (
                        <button
                          key={s} type="button"
                          onClick={() => { handleChange('specialization', s); setSpecOpen(false); }}
                          style={{
                            width: '100%', padding: '0.65rem 1rem', textAlign: 'left',
                            background: form.specialization === s ? 'rgba(0,153,204,0.15)' : 'transparent',
                            color: form.specialization === s ? '#22d3ee' : '#cbd5e1',
                            fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { if (form.specialization !== s) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { if (form.specialization !== s) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; } }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              {/* Qualification Dropdown - NEW! */}
              <Field label="Medical Qualification" icon={<ClipboardList size={15} />} error={errors.qualification} required>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setQualOpen(o => !o)}
                    style={{
                      ...inputStyle(errors.qualification),
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', textAlign: 'left',
                      color: form.qualification ? '#fff' : '#64748b',
                    }}
                  >
                    <span>{form.qualification || 'Select qualification'}</span>
                    <ChevronDown size={16} color="#64748b"
                      style={{ flexShrink: 0, transform: qualOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {qualOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                      background: '#1a2035', border: '1px solid rgba(0,153,204,0.3)',
                      borderRadius: '0.75rem', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      maxHeight: 240, overflowY: 'auto',
                    }}>
                      {QUALIFICATIONS.map(q => (
                        <button
                          key={q} type="button"
                          onClick={() => { handleChange('qualification', q); setQualOpen(false); }}
                          style={{
                            width: '100%', padding: '0.65rem 1rem', textAlign: 'left',
                            background: form.qualification === q ? 'rgba(0,153,204,0.15)' : 'transparent',
                            color: form.qualification === q ? '#22d3ee' : '#cbd5e1',
                            fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { if (form.qualification !== q) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { if (form.qualification !== q) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; } }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              {/* ID Proof */}
              <Field label="ID Proof Upload" icon={<FileText size={15} />} error={errors.id_proof} hint="Optional">
                {idProof ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(0,153,204,0.08)', border: '1px solid rgba(0,153,204,0.25)', borderRadius: '0.625rem' }}>
                    <FileText size={16} color="#0099cc" />
                    <span style={{ color: '#cbd5e1', fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idProof.name}</span>
                    <button type="button" onClick={removeIdProof} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={12} color="#ef4444" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => idProofRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(0,153,204,0.3)', borderRadius: '0.625rem', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}>
                    <Upload size={15} color="#0099cc" />
                    <span>Upload PDF, JPG or PNG <span style={{ color: '#475569' }}>· Max 5 MB</span></span>
                  </button>
                )}
                <input ref={idProofRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleIdProof} style={{ display: 'none' }} />
              </Field>

              {/* Section: Security */}
              <SectionLabel icon={<Lock size={13} />} text="Account Security" color="#22c55e" />

              <Field label="Password" icon={<Lock size={15} />} error={errors.password} required>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Min 8 chars with special character"
                    value={form.password} 
                    onChange={e => handleChange('password', e.target.value)}
                    style={{ ...inputStyle(errors.password), paddingRight: '3rem' }} 
                  />
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
                  <input 
                    type={showConfirm ? 'text' : 'password'} 
                    placeholder="Repeat your password"
                    value={form.confirm_password} 
                    onChange={e => handleChange('confirm_password', e.target.value)}
                    style={{ ...inputStyle(errors.confirm_password), paddingRight: '3rem' }} 
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>
                    {showConfirm ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                  </button>
                </div>
              </Field>

              {/* Submit */}
              <button type="submit" disabled={loading} style={submitBtn(loading)}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Activity size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting Application...</span>
                  : 'Submit Doctor Application'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#0099cc', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
            </p>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.4rem' }}>
              Are you a patient?{' '}
              <Link to="/register/patient" style={{ color: '#0099cc', textDecoration: 'none', fontWeight: 600 }}>Patient Registration</Link>
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
  background: 'linear-gradient(135deg, #080c1a 0%, #0f1428 40%, #0a0e1f 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '2rem 1rem', position: 'relative',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '1.5rem',
  border: '1px solid rgba(124,58,237,0.18)',
  padding: '2rem',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.45rem'
};

const errStyle = { 
  color: '#ef4444', 
  fontSize: '0.78rem', 
  marginTop: '0.3rem' 
};

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
  background: loading ? 'rgba(0,153,204,0.35)' : 'linear-gradient(135deg, #0099cc, #0066aa)',
  color: '#fff', border: 'none', borderRadius: '0.75rem',
  fontSize: '1rem', fontWeight: 700,
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s', marginTop: '0.25rem',
  boxShadow: loading ? 'none' : '0 4px 20px rgba(0,153,204,0.35)',
  letterSpacing: '0.02em',
});

function inputStyle(error) {
  return {
    width: '100%', padding: '0.7rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(124,58,237,0.2)'}`,
    borderRadius: '0.625rem', color: '#fff', fontSize: '0.925rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    WebkitAppearance: 'none', fontFamily: 'inherit'
  };
}
