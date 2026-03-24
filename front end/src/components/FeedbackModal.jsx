import { useState } from 'react';
import { X, Send, Star, CheckCircle, Loader2 } from 'lucide-react';
import { submitPatientFeedback, submitDoctorFeedback } from '../services/api';

/**
 * FeedbackModal — used by both Patient and Doctor dashboards.
 * Props:
 *   isOpen   {bool}
 *   onClose  {fn}
 *   role     {'patient' | 'doctor'}  default: 'patient'
 */
const FeedbackModal = ({ isOpen, onClose, role = 'patient' }) => {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  const reset = () => {
    setRating(0); setHovered(0);
    setMessage(''); setDone(false); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please write a message before submitting.'); return; }
    if (rating === 0)    { setError('Please select a star rating.');              return; }
    setError('');
    setLoading(true);
    try {
      if (role === 'doctor') {
        await submitDoctorFeedback(message.trim(), rating);
      } else {
        await submitPatientFeedback(message.trim(), rating);
      }
      setDone(true);
      setTimeout(() => { handleClose(); }, 2800);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const roleLabel  = role === 'doctor' ? 'Doctor'  : 'Patient';
  const accentColor = role === 'doctor' ? '#7c3aed' : '#0099cc';
  const accentBg    = role === 'doctor' ? 'rgba(124,58,237,0.08)' : 'rgba(0,153,204,0.08)';

  const LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        <div style={{
          background: '#111827',
          border: `1px solid ${accentColor}35`,
          borderRadius: 20,
          width: '100%', maxWidth: 460,
          overflow: 'hidden',
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${accentColor}15`,
          animation: 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Header */}
          <div style={{
            padding: '20px 24px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: accentBg,
          }}>
            <div>
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 17, margin: 0 }}>
                Share your feedback
              </h2>
              <p style={{ color: '#64748b', fontSize: 12, margin: '3px 0 0' }}>
                Your review helps us improve MediAI for everyone
              </p>
            </div>
            <button onClick={handleClose} style={{
              background: 'rgba(255,255,255,0.06)', border: 'none',
              borderRadius: 8, cursor: 'pointer', padding: 7,
              display: 'flex', color: '#64748b',
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          {done ? (
            <div style={{
              padding: '48px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={30} color="#10b981" />
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
                  Thank you for your feedback!
                </div>
                <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7 }}>
                  Your review has been submitted and will appear<br />
                  on our homepage after moderation.
                </div>
              </div>
              <div style={{
                padding: '6px 16px', borderRadius: 99,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#10b981', fontSize: 12, fontWeight: 600,
              }}>
                {roleLabel} review · {LABELS[(rating || 1) - 1]}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Star rating */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: '0.04em' }}>
                  OVERALL RATING
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i} type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(0)}
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: 2,
                          transform: (hovered || rating) >= i ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s',
                        }}
                      >
                        <Star
                          size={30}
                          fill={(hovered || rating) >= i ? '#f59e0b' : 'none'}
                          stroke={(hovered || rating) >= i ? '#f59e0b' : '#374151'}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                  {(hovered || rating) > 0 && (
                    <span style={{
                      color: '#f59e0b', fontSize: 13, fontWeight: 700,
                      animation: 'fadeIn 0.15s ease',
                    }}>
                      {LABELS[(hovered || rating) - 1]}
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                  YOUR REVIEW
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={
                    role === 'doctor'
                      ? 'How has MediAI helped your practice? What works well for your patients?'
                      : 'How accurate was the prediction? What did you find most helpful?'
                  }
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '12px 14px',
                    background: '#0d1424',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    borderRadius: 10, color: '#f1f5f9',
                    fontSize: 14, lineHeight: 1.7,
                    outline: 'none', resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = accentColor + '60'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  {error
                    ? <span style={{ color: '#ef4444', fontSize: 11 }}>{error}</span>
                    : <span />
                  }
                  <span style={{ color: '#374151', fontSize: 11 }}>{message.length}/500</span>
                </div>
              </div>

              {/* Role badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                background: accentBg, borderRadius: 10,
                border: `1px solid ${accentColor}25`,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: accentColor,
                }} />
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  Submitting as <strong style={{ color: '#f1f5f9' }}>{roleLabel}</strong> · your name will be shown publicly
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || message.length > 500}
                style={{
                  padding: '12px 0',
                  background: loading
                    ? 'rgba(255,255,255,0.05)'
                    : `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Submitting…</>
                  : <><Send size={16} /> Submit Review</>
                }
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalPop {
          from { transform: scale(0.94) translateY(12px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);     opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default FeedbackModal;
