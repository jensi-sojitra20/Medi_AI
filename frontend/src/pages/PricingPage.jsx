import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, Star, Zap, Shield } from 'lucide-react';
import MediAiLogo from "../components/MediAiLogo";
import SiteFooter from "../components/SiteFooter";

const PricingPage = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Basic',
      price: '₹299',
      period: 'per month',
      trial: '7-day free trial',
      description: 'Perfect for everyday health monitoring',
      icon: Zap,
      color: 'from-brand-blue to-brand-cyan',
      features: [
        { included: true,  text: 'AI Symptom Checker (10 queries/month)' },
        { included: true,  text: 'AI-powered disease prediction' },
        { included: true,  text: 'Medication & prescription suggestions' },
        { included: true,  text: 'Basic health report analysis' },
        { included: true,  text: '151+ diseases covered' },
        { included: true,  text: '24/7 AI availability' },
        { included: false, text: 'Medical report uploads' },
        { included: false, text: 'Priority support' },
        { included: false, text: 'Detailed diagnosis history' },
        { included: false, text: 'Early access to new features' },
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Premium',
      price: '₹999',
      period: 'per month',
      trial: '14-day free trial',
      description: 'Full access for proactive patients',
      icon: Star,
      color: 'from-brand-blue to-brand-cyan',
      features: [
        { included: true, text: 'Unlimited symptom queries' },
        { included: true, text: 'AI-powered disease prediction' },
        { included: true, text: 'Medication & prescription suggestions' },
        { included: true, text: 'Advanced health report analysis' },
        { included: true, text: '151+ diseases covered' },
        { included: true, text: '24/7 AI availability' },
        { included: true, text: 'Medical report & blood test uploads' },
        { included: true, text: 'Full diagnosis history & health timeline' },
        { included: true, text: 'Priority support (response within 2 hrs)' },
        { included: true, text: 'Early access to new features' },
      ],
      cta: 'Go Premium',
      highlighted: true,
    },
  ];

  const faqs = [
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes — Basic includes a 7-day free trial and Premium includes a 14-day free trial. No credit card required.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and wallet payments via Razorpay.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely. Cancel anytime with no questions asked. You keep access until the end of your billing period.',
    },
    {
      question: 'Is my health data private?',
      answer: 'Yes. Your data is end-to-end encrypted and is never shared or sold to third parties.',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-dark-bg/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <MediAiLogo size={44} showText={false} />
                <div className="absolute inset-0 blur-lg bg-brand-cyan/30 group-hover:bg-brand-cyan/50 transition-all"></div>
              </div>
              <h1 className="text-2xl font-bold text-white">MediAI</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => navigate('/features')} className="text-gray-300 hover:text-white font-medium transition">Features</button>
              <button onClick={() => navigate('/pricing')} className="text-brand-cyan font-medium transition">Pricing</button>
              <button onClick={() => navigate('/about')} className="text-gray-300 hover:text-white font-medium transition">About</button>
              <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 rounded-full text-brand-cyan font-semibold text-sm mb-6">
            PRICING
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Simple, Transparent</span><br />
            <span className="text-white">Pricing for Every Patient</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            No hidden fees. No credit card required to start. Cancel anytime.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {plans.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <div
                  key={idx}
                  className={`relative rounded-2xl p-8 transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-gradient-to-br from-dark-card to-brand-blue/5 border-2 border-brand-blue shadow-xl shadow-brand-blue/20 transform scale-105'
                      : 'bg-dark-card border border-dark-border hover:border-brand-blue'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-blue to-brand-cyan text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                  <div className="mb-1">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400 ml-2">/mo</span>
                    </div>
                  </div>
                  <p className="text-xs text-brand-cyan font-semibold mb-8">✦ {plan.trial} included</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        {feature.included ? (
                          <CheckCircle className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white hover:shadow-lg hover:shadow-brand-blue/30'
                        : 'border-2 border-brand-blue text-white hover:bg-brand-blue'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          
         
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything you need to know about our pricing</p>
          </div>
          <div className="space-y-5">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-brand-blue transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-dark-secondary/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-brand-blue via-brand-blue to-brand-cyan rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-4">Still Have Questions?</h2>
              <p className="text-xl text-white/90 mb-8">Our team is here to help you choose the right plan</p>
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-4 bg-white text-brand-blue rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 hover:scale-105"
              >
                Contact Support
              </button>
              <p className="text-sm text-white/60 mt-4">support@mediAI.com · We reply within 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default PricingPage;