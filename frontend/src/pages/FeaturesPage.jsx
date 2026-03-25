import { useNavigate } from 'react-router-dom';
import { Heart, Brain, FileText, Pill, Bell, Activity, CheckCircle } from 'lucide-react';
import MediAiLogo from "../components/MediAiLogo";
import SiteFooter from "../components/SiteFooter";

const FeaturesPage = () => {
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: Heart,
      title: 'AI Symptom Checker',
      description: 'Describe your symptoms in simple words and get an instant AI analysis with possible conditions.',
      features: [
        'Type symptoms in plain language',
        'Get matched conditions instantly',
        'Understand severity level',
        'Know when to see a doctor',
      ],
    },
    {
      icon: Brain,
      title: 'AI Disease Prediction',
      description: 'Our AI is trained on thousands of medical cases to predict likely diseases based on your symptoms.',
      features: [
        '151+ diseases covered',
        '98.8% prediction accuracy',
        'Risk level assessment',
        'Confidence score shown',
      ],
    },
    {
      icon: Pill,
      title: 'Medicine Suggestions',
      description: 'Get common medication suggestions along with dosage and precautions for your condition.',
      features: [
        'Medicine name & dosage',
        'Precautions & warnings',
        'When to take & how often',
        'Always advises doctor consultation',
      ],
    },
    {
      icon: FileText,
      title: 'Medical Report Analysis',
      description: 'Upload your blood test, lab report, or prescription and let the AI read and explain it for you.',
      features: [
        'Supports PDF, JPG, PNG',
        'Reads test values & normal ranges',
        'Flags abnormal results',
        'Detects report type automatically',
      ],
    },
    {
      icon: Activity,
      title: 'Health Records',
      description: 'Store and manage all your medical records in one secure place and access them anytime.',
      features: [
        'Upload lab reports & prescriptions',
        'Organised by date & type',
        'Download or share anytime',
        'View records online',
      ],
    },
    {
      icon: Bell,
      title: 'Notifications & Updates',
      description: 'Stay informed with health alerts, prescription reminders, and important updates from your dashboard.',
      features: [
        'Health alerts & reminders',
        'Prescription notifications',
        'AI recommendation updates',
        'Read/unread management',
      ],
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
              <button onClick={() => navigate('/features')} className="text-brand-cyan font-medium transition">Features</button>
              <button onClick={() => navigate('/pricing')} className="text-gray-300 hover:text-white font-medium transition">Pricing</button>
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
          <div className="inline-block px-4 py-2 bg-brand-blue/10 border border-brand-blue/30 rounded-full text-brand-cyan font-semibold text-sm mb-6">
            FEATURES
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">What MediAI</span><br />
            <span className="text-white">Can Do For You</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Simple, useful tools to help you understand your health — no medical degree required.
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">All Features</h2>
            <p className="text-gray-400 text-lg">Everything available inside your MediAI dashboard</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {mainFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-dark-card border border-dark-border rounded-2xl p-7 hover:border-brand-blue transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-blue/20 to-brand-cyan/20 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-brand-cyan" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm mb-5 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2.5">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-start space-x-2 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-dark-secondary/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 text-xl">Get a health analysis in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Describe Symptoms', desc: 'Type your symptoms in simple words — like "fever and headache" — or upload a medical report.' },
              { step: '02', title: 'AI Analyses',       desc: 'Our AI checks your symptoms against 151+ diseases and returns the most likely condition with a confidence score.' },
              { step: '03', title: 'Get Your Report',   desc: 'See the predicted condition, recommended medicines, lifestyle tips, and warnings. Download or share anytime.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-blue/20 to-brand-cyan/20 border border-brand-blue/30 flex items-center justify-center">
                  <span className="text-brand-cyan font-black text-2xl">{s.step}</span>
                </div>
                <h3 className="text-white font-bold text-2xl mb-3">{s.title}</h3>
                <p className="text-gray-400 text-base leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="py-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500 text-sm leading-relaxed">
            ⚠ MediAI is an informational tool. It does not replace a licensed doctor.
            Always consult a qualified healthcare professional before taking any medical action.
          </p>
        </div>
      </div>

      {/* CTA */}
      <section className="py-16 px-6 bg-dark-secondary/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-brand-blue via-brand-blue to-brand-cyan rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Try MediAI?</h2>
              <p className="text-xl text-white/90 mb-8">Start free today — no credit card required</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-10 py-4 bg-white text-brand-blue rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 hover:scale-105"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300"
                >
                  View Pricing
                </button>
              </div>
              <p className="text-white/60 text-sm mt-4">Basic plan: ₹299/month · Premium: ₹999/month · 7–14 day free trial</p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default FeaturesPage;