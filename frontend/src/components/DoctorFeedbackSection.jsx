/**
 * DROP THIS ENTIRE FILE into your DoctorDashboard.jsx
 * Find your existing feedback form and REPLACE it with this component.
 *
 * Usage inside DoctorDashboard.jsx:
 *   <DoctorFeedbackForm token={localStorage.getItem('token')} />
 */
import { useState } from 'react';
import { Star, Send, CheckCircle, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];

export default function DoctorFeedbackForm({ token }) {
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!rating)         { setError('Please select a star rating.'); return; }
    if (!message.trim()) { setError('Please write a message.');       return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/doctor/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: message.trim(), rating }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center">
      <CheckCircle className="w-12 h-12 text-brand-cyan mx-auto mb-3" />
      <h3 className="text-white font-bold text-lg mb-1">Thank you for your review!</h3>
      <p className="text-gray-400 text-sm">Your feedback has been submitted and will appear on our homepage.</p>
    </div>
  );

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
      <h3 className="text-white font-bold text-lg mb-1">Share your feedback</h3>
      <p className="text-gray-400 text-sm mb-6">Your review helps patients trust MediAI and helps us improve.</p>

      <form onSubmit={submit} className="space-y-5">

        {/* Star rating */}
        <div>
          <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Overall rating</label>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(i => (
              <button key={i} type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                className="p-0 border-none bg-transparent cursor-pointer"
                style={{ transform: (hover||rating) >= i ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }}>
                <Star size={28}
                  fill={(hover||rating) >= i ? '#f59e0b' : 'none'}
                  stroke={(hover||rating) >= i ? '#f59e0b' : '#4b5563'}
                  strokeWidth={1.5} />
              </button>
            ))}
            {(hover||rating) > 0 && (
              <span className="text-yellow-400 font-semibold text-sm ml-1">{LABELS[(hover||rating)-1]}</span>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Your review</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="How has MediAI helped your practice? What do your patients say?"
            rows={4}
            className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white text-sm resize-none outline-none focus:border-brand-blue transition-colors"
          />
          <div className="flex justify-between mt-1">
            {error ? <span className="text-red-400 text-xs">{error}</span> : <span />}
            <span className="text-gray-600 text-xs">{message.length}/500</span>
          </div>
        </div>

        <button type="submit" disabled={loading || message.length > 500}
          className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
            : <><Send size={16} /> Submit Review</>}
        </button>
      </form>
    </div>
  );
}