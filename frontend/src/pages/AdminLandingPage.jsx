// import { useNavigate } from 'react-router-dom';
// import { useState } from 'react';
// import Navbar from '../components/Navbar';
// import FeedbackModal from '../components/FeedbackModal';
// import {
//   Leaf, ArrowRight, MessageCircle,
//   Stethoscope, Users, BarChart3, Shield, Heart,
//   Zap, CheckCircle, Lock
// } from 'lucide-react';

// const LandingPage = () => {
//   const navigate = useNavigate();
//   const [showFeedback, setShowFeedback] = useState(false);

//   const features = [
//     {
//       icon: Stethoscope,
//       title: 'AI-Assisted Treatment Insights',
//       description: 'Intelligent diagnosis support powered by advanced machine learning algorithms'
//     },
//     {
//       icon: Users,
//       title: 'Doctor-Verified',
//       description: 'All recommendations reviewed and verified by qualified medical professionals'
//     },
//     {
//       icon: BarChart3,
//       title: 'Report Analysis',
//       description: 'Comprehensive analysis of medical reports with detailed insights'
//     },
//     {
//       icon: Shield,
//       title: 'Secure Data',
//       description: 'Enterprise-grade encryption ensures your health data stays private'
//     },
//     {
//       icon: Heart,
//       title: 'Personalized Plans',
//       description: 'Customized treatment recommendations tailored to your health profile'
//     },
//     {
//       icon: Zap,
//       title: 'Fast AI Processing',
//       description: 'Lightning-fast analysis and recommendations in seconds'
//     },
//     {
//       icon: CheckCircle,
//       title: 'Doctor Dashboard',
//       description: 'Comprehensive management tools for healthcare professionals'
//     },
//     {
//       icon: Lock,
//       title: 'Safe & Ethical AI',
//       description: 'Responsible AI with strict ethical guidelines and compliance'
//     },
//   ];

//   const pills = [
//     { icon: '🔒', text: 'Secure & Private' },
//     { icon: '⚡', text: 'Instant Insights' },
//     { icon: '✨', text: 'AI-Powered' },
//     { icon: '📊', text: 'Personalized' },
//   ];

//   return (
//     <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100">
//       {/* Navbar */}
//       <Navbar showAuth={true} />

//       {/* Hero Section */}
//       <div className="pt-32 pb-20 px-6">
//         <div className="max-w-4xl mx-auto text-center">
//           {/* Logo Badge */}
//           <div className="inline-flex items-center justify-center mb-8">
//             <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl shadow-lg">
//               <MediAiLogo size={44} showText={false} />
//               <span className="text-2xl font-bold text-white">
//                 Medi<span>AI</span>
//               </span></div>
//           </div>

//           {/* Main Heading */}
//           <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
//             Medi AI
//           </h1>

//           {/* Subheading */}
//           <p className="text-xl md:text-2xl text-gray-700 mb-8">
//             Personalized Medical Treatment Platform
//           </p>

//           {/* Description */}
//           <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
//             Combining Artificial Intelligence with medical expertise to support accurate, secure, and personalized treatment decisions.
//           </p>

//           {/* CTA Buttons */}
//           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
//             <button
//               onClick={() => navigate('/login')}
//               className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//             >
//               Get Started Free
//             </button>
//             <button
//               onClick={() => navigate('/login')}
//               className="px-8 py-4 bg-white text-gray-800 border-2 border-purple-300 rounded-xl font-bold hover:border-purple-600 hover:bg-purple-50 transition-all duration-300 flex items-center justify-center gap-2"
//             >
//               <span className="text-xl">🔐</span>
//               Continue with Google
//             </button>
//           </div>

//           {/* Search Card */}
//           <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 max-w-2xl mx-auto border border-purple-100 hover:shadow-2xl transition-all duration-300"
//             style={{
//               boxShadow: '0 8px 32px rgba(124, 58, 237, 0.15)',
//             }}
//           >
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Ask about Ayurvedic health, remedies, herbs..."
//                 className="w-full px-6 py-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
//               />
//               <button className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
//                 <ArrowRight className="w-6 h-6" />
//               </button>
//             </div>
//             <p className="text-sm text-purple-600 mt-4 flex items-center justify-center space-x-2">
//               <MediAiLogo size={44} showText={false} />
//               <span className="text-2xl font-bold text-white">
//                 Medi<span className="text-brand-cyan">AI</span>
//               </span></p>
//           </div>

//           {/* Feature Pills */}
//           <div className="flex flex-wrap justify-center gap-4">
//             {pills.map((pill, idx) => (
//               <div
//                 key={idx}
//                 className="px-6 py-3 bg-white rounded-full shadow-md border border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-purple-400"
//               >
//                 <span className="text-xl mr-2">{pill.icon}</span>
//                 <span className="font-semibold text-gray-800">{pill.text}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Features Section */}
//       <section className="py-20 px-6 bg-white/50">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//               Everything You Need for AI-Powered Personalized Healthcare
//             </h2>
//             <p className="text-xl text-gray-600">
//               Combining Artificial Intelligence with medical expertise to support accurate, secure, and personalized treatment decisions
//             </p>
//           </div>

//           {/* Features Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {features.map((feature, idx) => {
//               const Icon = feature.icon;
//               return (
//                 <div
//                   key={idx}
//                   className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-purple-100 group hover:border-purple-300"
//                   style={{
//                     boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)',
//                   }}
//                 >
//                   <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl inline-block mb-4 group-hover:bg-gradient-to-br group-hover:from-purple-200 group-hover:to-purple-300 transition">
//                     <Icon className="w-6 h-6 text-purple-700" />
//                   </div>
//                   <h3 className="text-lg font-bold text-gray-900 mb-3">
//                     {feature.title}
//                   </h3>
//                   <p className="text-gray-600 text-sm leading-relaxed">
//                     {feature.description}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 px-6">
//         <div className="max-w-3xl mx-auto">
//           <div
//             className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-3xl p-12 text-center text-white shadow-2xl"
//             style={{
//               boxShadow: '0 15px 50px rgba(124, 58, 237, 0.3)',
//             }}
//           >
//             <h2 className="text-4xl font-bold mb-6">
//               Ready to Begin Your AI-Assisted Healthcare Journey?
//             </h2>
//             <p className="text-lg text-purple-100 mb-8">
//               Experience smarter diagnosis support with secure and ethical AI
//             </p>
//             <button
//               onClick={() => navigate('/login')}
//               className="px-10 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
//             >
//               Start Free Consultation
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Stats Section */}
//       <section className="py-20 px-6 bg-gradient-to-r from-purple-50 to-transparent">
//         <div className="max-w-7xl mx-auto">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               { number: '50K+', label: 'Patients Helped' },
//               { number: '500+', label: 'Certified Doctors' },
//               { number: '99.9%', label: 'Uptime Guarantee' }
//             ].map((stat, idx) => (
//               <div key={idx} className="text-center">
//                 <div className="text-5xl md:text-6xl font-bold text-purple-700 mb-2">{stat.number}</div>
//                 <p className="text-gray-600 text-lg">{stat.label}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Feedback Button */}
//       <button
//         onClick={() => setShowFeedback(true)}
//         className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center z-40"
//         title="Send us feedback"
//       >
//         <MessageCircle size={24} />
//       </button>

//       {/* Feedback Modal */}
//       <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

//       {/* Footer */}
//       <footer className="border-t border-purple-200 py-12 px-6 bg-white/50">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center text-gray-600 space-y-4">
//             <p className="text-sm">
//               For educational purposes only. Consult a qualified Ayurvedic practitioner for medical advice.
//             </p>
//             <div className="flex justify-center space-x-6 flex-wrap">
//               <a href="#" className="hover:text-purple-600 font-medium transition">Terms & Conditions</a>
//               <span>|</span>
//               <a href="#" className="hover:text-purple-600 font-medium transition">Privacy Policy</a>
//             </div>
//             <p className="text-xs text-gray-500">
//               © 2026 Medi AI. All rights reserved.
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default LandingPage;
