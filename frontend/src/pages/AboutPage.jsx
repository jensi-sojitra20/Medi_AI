import { useNavigate } from 'react-router-dom';
import { CheckCircle, Brain, Lock, Stethoscope, Globe, ArrowRight, Target } from 'lucide-react';
import MediAiLogo from '../components/MediAiLogo';
import SiteFooter from "../components/SiteFooter";

const AboutPage = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Brain,
      title: 'AI as a Support Tool',
      points: [
        'MediAI uses AI to assist patients in understanding their symptoms — not to replace doctors.',
        'Every result comes with a clear disclaimer to consult a licensed physician.',
      ],
    },
    {
      icon: Lock,
      title: 'Patient Data Privacy',
      points: [
        'Your health data is encrypted and never shared or sold to anyone.',
        'We use secure token-based authentication to protect your account.',
      ],
    },
    {
      icon: Stethoscope,
      title: 'Built for Patients',
      points: [
        'The platform is designed to be simple enough for anyone to use — no medical knowledge needed.',
        'Plain language results, clear warnings, and easy navigation.',
      ],
    },
    {
      icon: Globe,
      title: 'Accessible & Affordable',
      points: [
        'MediAI starts at just ₹299/month so that quality AI health tools are available to everyone.',
        'No expensive clinic visits needed for basic health guidance.',
      ],
    },
  ];

  const team = [
    { name: 'Jensi Sojitra',     role: 'Full Stack Developer'  },
    { name: 'Krishna Gohel',     role: 'AI & Backend Developer' },
    { name: 'Dhaniya Chudavat',  role: 'UI/UX & Frontend'      },
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
              <button onClick={() => navigate('/pricing')} className="text-gray-300 hover:text-white font-medium transition">Pricing</button>
              <button onClick={() => navigate('/about')} className="text-brand-cyan font-medium transition">About</button>
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
            ABOUT US
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">What is MediAI</span><br />
            <span className="text-white">and Why We Built It</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            MediAI is an AI-powered health platform built to help everyday patients understand their symptoms,
            analyse medical reports, and get medicine suggestions — quickly and affordably.
          </p>
        </div>
      </div>

      {/* What MediAI is */}
      <section className="py-20 px-6 bg-dark-secondary/50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-card rounded-3xl p-10 border border-dark-border">
            <div className="flex items-center space-x-3 mb-6">
              <Target className="w-9 h-9 text-brand-cyan" />
              <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            </div>
            <p className="text-brand-cyan text-xl font-semibold mb-8">
              Make basic health guidance available to everyone — simply and affordably.
            </p>
            <div className="space-y-5 text-gray-300">
              {[
                'Help patients describe symptoms and get an instant AI analysis with possible conditions.',
                'Allow users to upload blood tests and lab reports and understand what the results mean.',
                'Suggest common medications and precautions for detected conditions.',
                'Provide all of this without requiring a clinic visit or medical background.',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-1" />
                  <p className="text-lg">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it was built */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">How MediAI Was Built</h2>
            <p className="text-gray-400 text-lg">A college project turned into a real product</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'AI & Machine Learning',
                desc: 'The disease prediction model is trained on thousands of real medical cases covering 151+ conditions. It maps symptoms to diseases with a confidence score.',
              },
              {
                title: 'Medical Report OCR',
                desc: 'We use Tesseract OCR and PDF.js to extract text from uploaded reports, then score and validate them to ensure only real medical documents are processed.',
              },
              {
                title: 'Secure Backend',
                desc: 'Built with FastAPI and a relational database. Patient data is protected with JWT token authentication and role-based access control.',
              },
              {
                title: 'React Frontend',
                desc: 'The interface is built in React with a clean dark theme designed for ease of use — accessible on both mobile and desktop.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-dark-card border border-dark-border rounded-2xl p-7 hover:border-brand-blue transition-all duration-300">
                <h3 className="text-white font-bold text-lg mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-dark-secondary/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-gray-400 text-lg">What we believe in and how we build</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-dark-card border border-dark-border rounded-xl p-8 hover:border-brand-cyan transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-4 mb-5">
                    <div className="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-brand-cyan" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{value.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {value.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-1" />
                        <p className="text-gray-400 text-sm leading-relaxed">{point}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Meet the Team</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="bg-dark-card border border-dark-border rounded-xl p-7 text-center hover:border-brand-blue transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-blue to-brand-cyan rounded-full mx-auto mb-4 flex items-center justify-center text-2xl text-white font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
               
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="py-8 px-6 bg-dark-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500 text-sm leading-relaxed">
            ⚠ MediAI is an informational tool built to assist — not replace — licensed medical professionals.
            Always consult a qualified doctor before making any health decisions.
          </p>
        </div>
      </div>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Try MediAI Today</h2>
          <p className="text-gray-400 text-lg mb-8">Start free — no credit card required</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-brand-blue/40 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/features')}
              className="px-8 py-4 bg-dark-card border-2 border-dark-border text-white rounded-xl font-semibold text-lg hover:border-brand-blue transition-all duration-300"
            >
              Explore Features
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default AboutPage;