import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  CheckCircle, Calendar, Zap, Brain,
  Clock, TrendingUp, ChevronRight, Menu, X, Heart,
} from 'lucide-react';
import MediAiLogo from "../components/MediAiLogo";
import TestimonialsMarquee from '../components/TestimonialsMarquee';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Heart, title: 'Symptom Checker', description: 'Advanced AI-powered symptom analysis with 98.8% accuracy rate, helping you understand your health concerns instantly.' },
    { icon: CheckCircle, title: 'Doctor Verification', description: 'Comprehensive verification system ensuring you connect only with certified, licensed medical professionals.' },
    { icon: Calendar, title: 'AI Recommendations', description: 'Personalized treatment plans based on your symptoms, vitals, and latest clinical research across 151 diseases.' }
  ];

  const benefits = [
    { icon: Zap, title: 'Instant Results', description: 'Get AI-powered health insights in under 60 seconds with our advanced algorithms.' },
    { icon: Brain, title: 'Smart AI Engine', description: 'Trained on 5000 medical cases for accurate, evidence-based recommendations.' },
    { icon: Clock, title: '24/7 Available', description: 'Access healthcare guidance anytime, anywhere, from any device.' }
  ];

  return (
    <div className="min-h-screen w-full overflow-hidden bg-dark-bg">

      {/* NAV */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-dark-bg/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-dark-border' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <MediAiLogo size={44} showText={false} />
              <span className="text-2xl font-bold text-white">Medi<span className="text-brand-blue">AI</span></span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {['features','about','pricing'].map(p => (
                <button key={p} onClick={() => navigate(`/${p}`)} className="text-gray-300 hover:text-white font-medium transition-colors relative group capitalize">
                  {p}<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-cyan to-brand-blue transition-all group-hover:w-full"></span>
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button onClick={() => navigate('/login')} className="px-5 py-2.5 text-white font-semibold hover:text-brand-cyan transition-colors">Sign In</button>
              <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 hover:scale-105">Get Started</button>
            </div>
            <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-dark-border">
              <div className="flex flex-col space-y-4">
                {['features','about','pricing'].map(p => (
                  <button key={p} onClick={() => navigate(`/${p}`)} className="text-gray-300 hover:text-white font-medium transition-colors text-left capitalize">{p}</button>
                ))}
                <button onClick={() => navigate('/login')} className="w-full px-6 py-2.5 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold">Get Started</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen flex items-center bg-dark-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px]">
            <div className="absolute top-0 left-0 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl" style={{ animation: 'moveLeft 8s ease-in-out infinite' }}></div>
            <div className="absolute top-10 right-0 w-80 h-80 bg-brand-blue/20 rounded-full blur-3xl" style={{ animation: 'moveRight 8s ease-in-out infinite' }}></div>
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: Math.random() > 0.5 ? '3px' : '2px', height: Math.random() > 0.5 ? '3px' : '2px',
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              background: Math.random() > 0.5 ? 'rgba(34,211,238,0.6)' : 'rgba(59,130,246,0.6)',
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}></div>
          ))}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="1" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-dark-card/50 border border-dark-border rounded-full mb-8">
              <TrendingUp className="w-4 h-4 text-brand-cyan" />
              <span className="text-sm text-gray-300">Trusted by patients & doctors worldwide</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">AI-Powered Healthcare</span><br />
              <span className="text-white">for a Smarter Tomorrow</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Get instant health insights with our advanced AI, verified by licensed medical professionals. Your path to better health starts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button onClick={() => navigate('/login')} className="group px-8 py-4 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-brand-blue/40 transition-all duration-300 hover:scale-105 flex items-center space-x-2">
                <span>Start Free Trial</span><ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate('/features')} className="px-8 py-4 bg-dark-card border-2 border-dark-border text-white rounded-xl font-semibold text-lg hover:bg-dark-card-hover hover:border-brand-blue transition-all duration-300">Explore Features</button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-brand-blue/10 border border-brand-blue/30 rounded-full text-brand-cyan font-semibold text-sm mb-4">FEATURES</div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Powerful AI-Driven Healthcare Tools</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">Experience the future of healthcare with our comprehensive suite of AI-powered features</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="group bg-dark-card border border-dark-border rounded-2xl p-8 hover:bg-dark-card-hover hover:border-brand-blue transition-all duration-300 hover:-translate-y-2 card-glow">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-blue/20 to-brand-cyan/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-brand-cyan" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => navigate('/features')} className="px-8 py-4 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-brand-blue/40 transition-all duration-300 hover:scale-105">View All Features</button>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 rounded-full text-brand-cyan font-semibold text-sm mb-4">WHY CHOOSE US</div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Built for Your Peace of Mind</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">Security, speed, and accuracy at the core of everything we do</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="bg-gradient-to-br from-dark-card to-dark-card-hover border border-dark-border rounded-xl p-6 hover:border-brand-cyan transition-all duration-300">
                  <div className="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-cyan" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <TestimonialsMarquee />

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 rounded-full text-brand-cyan font-semibold text-sm mb-4">PRICING</div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">Simple, transparent pricing for every individual patient. No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

            {/* Basic — ₹299 */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-8 hover:border-brand-blue transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-1">Basic</h3>
              <div className="text-gray-400 mb-6 text-sm">Perfect for everyday health monitoring</div>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-white">₹299</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-xs text-gray-500 mb-8">7-day free trial included</p>
              <ul className="space-y-4 mb-8">
                {[
                  'AI Symptom Checker (10 queries/month)',
                  'AI-powered disease prediction',
                  'Medication & prescription suggestions',
                  'Basic health report analysis',
                  '151+ diseases covered',
                  '24/7 AI availability',
                ].map(f => (
                  <li key={f} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{f}</span>
                  </li>
                ))}
                {[
                  'Medical report uploads',
                  'Priority support',
                  'Detailed diagnosis history',
                ].map(f => (
                  <li key={f} className="flex items-start space-x-3 opacity-40">
                    <X className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login')} className="w-full px-6 py-3 border-2 border-brand-blue text-white rounded-lg hover:bg-brand-blue transition-all duration-300 font-semibold">
                Get Started
              </button>
            </div>

            {/* Premium — ₹999 */}
            <div className="bg-gradient-to-br from-dark-card to-brand-blue/5 border-2 border-brand-blue rounded-2xl p-8 relative transform hover:scale-105 transition-all duration-300 shadow-xl shadow-brand-blue/20">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-blue to-brand-cyan text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Premium</h3>
              <div className="text-gray-400 mb-6 text-sm">Full access for proactive patients</div>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-white">₹999</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-xs text-gray-500 mb-8">14-day free trial included</p>
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited symptom queries',
                  'AI-powered disease prediction',
                  'Medication & prescription suggestions',
                  'Advanced health report analysis',
                  '151+ diseases covered',
                  '24/7 AI availability',
                  'Medical report & blood test uploads',
                  'Full diagnosis history & health timeline',
                  'Priority support (response within 2 hrs)',
                  'Early access to new features',
                ].map(f => (
                  <li key={f} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login')} className="w-full px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 font-semibold">
                Go Premium
              </button>
            </div>

          </div>

         
          <div className="text-center mt-8">
            <button onClick={() => navigate('/pricing')} className="px-8 py-4 bg-dark-card border-2 border-dark-border text-white rounded-xl font-semibold text-lg hover:bg-dark-card-hover hover:border-brand-blue transition-all duration-300">
              View Detailed Pricing
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-secondary/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-brand-blue via-brand-blue to-brand-cyan rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Healthcare Experience?</h2>
              <p className="text-xl text-white/90 mb-8">Join thousands of satisfied users and experience the future of healthcare today</p>
              <button onClick={() => navigate('/login')} className="px-10 py-4 bg-white text-brand-blue rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 hover:scale-105">Start Your Free Trial</button>
              <p className="text-sm text-white/70 mt-4">No credit card required • 7-day free trial on Basic · 14-day on Premium</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-dark-border" style={{ background: '#0d1117' }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <MediAiLogo size={30} showText={false} />
                <span className="text-lg font-bold text-white">Medi<span className="text-brand-blue">AI</span></span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                AI-powered healthcare for smarter diagnoses and better patient outcomes.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', path: '/features' },
                  { label: 'Pricing', path: '/pricing' },
                  { label: 'About Us', path: '/about' },
                ].map(link => (
                  <li key={link.label}>
                    <button onClick={() => navigate(link.path)} className="text-gray-500 text-sm hover:text-gray-300 transition-colors text-left">{link.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Register</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Patient Registration', path: '/register/patient' },
                  { label: 'Doctor Registration', path: '/register/doctor' },
                  { label: 'Sign In', path: '/login' },
                ].map(link => (
                  <li key={link.label}>
                    <button onClick={() => navigate(link.path)} className="text-gray-500 text-sm hover:text-gray-300 transition-colors text-left">{link.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Privacy Policy', path: '/privacy-policy' },
                  { label: 'Terms of Service', path: '/terms-of-service' },
                ].map(link => (
                  <li key={link.label}>
                    <button onClick={() => navigate(link.path)} className="text-gray-500 text-sm hover:text-gray-300 transition-colors text-left">{link.label}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-600 text-xs">© {new Date().getFullYear()} MediAI. All rights reserved.</p>
            <p className="text-gray-600 text-xs">⚠ AI suggestions are for informational purposes only. Always consult a licensed doctor.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        @keyframes moveLeft {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-50px); }
        }
        @keyframes moveRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(50px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;