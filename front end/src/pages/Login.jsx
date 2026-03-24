import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import MediAiLogo from "../components/MediAiLogo";

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignupRoles, setShowSignupRoles] = useState(false);

  // Forgot Password States
  const [resetStep, setResetStep] = useState('email'); // 'email', 'otp', 'newPassword'
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const roles = [
    { id: 'admin', label: 'Admin', icon: '⚙️', description: 'Manage system & users', color: 'from-purple-600 to-purple-700', demo: 'admin@medi.ai' },
    { id: 'doctor', label: 'Doctor', icon: '🩺', description: 'Manage patients & consultations', color: 'from-blue-600 to-blue-700', demo: 'doctor1@medi.ai' },
    { id: 'patient', label: 'Patient', icon: '👤', description: 'View health records', color: 'from-green-600 to-green-700', demo: 'patient1@medi.ai' },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail(role.demo);
    setPassword('test123');
    setStep('credentials');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // ✅ Map frontend role id to backend enum value
      const roleMap = {
        admin: 'ADMIN',
        doctor: 'DOCTOR',
        patient: 'PATIENT'
      };

      const response = await axios.post('http://localhost:8000/auth/login', {
        email: email,
        password: password,
        role: roleMap[selectedRole.id]
      });

      const { token, user } = response.data;

      // ✅ Save token and user info to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', selectedRole.id);
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ Navigate based on role
      if (selectedRole.id === 'admin') navigate('/admin');
      else if (selectedRole.id === 'doctor') navigate('/doctor-dashboard');
      else navigate('/patient-dashboard');

    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
  try {
    setError("");
    setLoading(true);

    const res = await axios.post("http://localhost:8000/auth/google", {
      token: credentialResponse.credential,
      role: selectedRole?.id,  // ✅ Keep lowercase: "doctor", "patient" — NOT roleMap
    });

    const { access_token, role, user } = res.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("userRole", role.toLowerCase());
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userEmail", user.email);
    }

    const normalizedRole = role.toLowerCase();
    if (normalizedRole === "doctor") navigate("/doctor-dashboard");
    else if (normalizedRole === "patient") navigate("/patient-dashboard");
    else navigate("/login");

  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;

    if (status === 404) {
      setError(`No ${selectedRole?.label} account linked to this Google email.`);
    } else {
      setError(detail || "Google login failed. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};
  // Forgot Password - Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/auth/forgot-password', {
        email: resetEmail
      });

      setResetMessage('OTP sent successfully to your email!');
      setResetStep('otp');
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setError('');

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/auth/verify-otp', {
        email: resetEmail,
        otp: otpString
      });

      setResetMessage('OTP verified successfully!');
      setResetStep('newPassword');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/auth/reset-password', {
        email: resetEmail,
        otp: otp.join(''),
        newPassword: newPassword
      });

      setResetMessage('Password reset successful! Redirecting to login...');

      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStep('email');
        setResetEmail('');
        setOtp(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmPassword('');
        setResetMessage('');
        setError('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setResetMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/auth/forgot-password', {
        email: resetEmail
      });

      setResetMessage('New OTP sent successfully!');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle OTP Input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Handle OTP Backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Handle OTP Paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    document.getElementById(`otp-${focusIndex}`)?.focus();
  };

  // Reset Forgot Password Flow
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetStep('email');
    setResetEmail('');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setResetMessage('');
    setError('');
    setResendTimer(0);
  };

  return (
    <div className="min-h-screen w-full flex bg-dark-bg overflow-hidden">
      {/* Left side - Medical Themed Background */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-blue via-[#0099cc] to-brand-cyan overflow-hidden">
        {/* Animated medical pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L50 100 M0 50 L100 50' stroke='white' stroke-width='2' fill='none'/%3E%3Ccircle cx='50' cy='50' r='20' stroke='white' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            animation: 'slideBackground 20s linear infinite'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          <div className="max-w-md text-center">
            {/* Logo and Brand */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="relative">
                <MediAiLogo size={80} showText={false} />
                <div className="absolute inset-0 blur-2xl bg-white/30"></div>
              </div>
              <h1 className="text-6xl font-bold text-white drop-shadow-lg">MediAI</h1>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
              AI-Powered Healthcare Platform
            </h2>
            <p className="text-xl text-white/90 mb-10 drop-shadow">
              Connecting patients with verified doctors through intelligent healthcare solutions
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-white">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl font-bold mb-2">500K+</div>
                <div className="text-sm opacity-90">Patients</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl font-bold mb-2">2.5K+</div>
                <div className="text-sm opacity-90">Doctors</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl font-bold mb-2">99.9%</div>
                <div className="text-sm opacity-90">Uptime</div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-10 space-y-4 text-left">
              <div className="flex items-center space-x-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                <span className="text-lg">AI-Powered Diagnostics</span>
              </div>
              <div className="flex items-center space-x-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                <span className="text-lg">24/7 Healthcare Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-dark-bg relative">
        <div className="absolute top-8 left-8">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>
        </div>

        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <MediAiLogo size={44} showText={false} />
            <h1 className="text-3xl font-bold text-white">MediAI</h1>
          </div>

          {/* Forgot Password Flow */}
          {showForgotPassword && (
            <div className="mb-8 animate-fade-in-up">
              <button
                onClick={handleBackToLogin}
                className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to login</span>
              </button>

              {/* Step 1: Enter Email */}
              {resetStep === 'email' && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                  <p className="text-gray-400 mb-6">Enter your email address and we'll send you a verification code.</p>

                  <form onSubmit={handleSendOTP} className="space-y-5">
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{error}</span>
                        </div>
                      </div>
                    )}

                    {resetMessage && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{resetMessage}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-dark-card border-2 border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none transition-colors"
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  </form>
                </>
              )}

              {/* Step 2: Enter OTP */}
              {resetStep === 'otp' && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">Enter Verification Code</h2>
                  <p className="text-gray-400 mb-6">
                    We've sent a 6-digit code to <span className="text-brand-cyan">{resetEmail}</span>
                  </p>

                  <form onSubmit={handleVerifyOTP} className="space-y-5">
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{error}</span>
                        </div>
                      </div>
                    )}

                    {resetMessage && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{resetMessage}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Verification Code</label>
                      <div className="flex gap-2 justify-between">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            className="w-full aspect-square text-center text-2xl font-bold bg-dark-card border-2 border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none transition-colors"
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-center text-sm">
                      {resendTimer > 0 ? (
                        <span className="text-gray-400">
                          Resend code in <span className="text-brand-cyan font-semibold">{resendTimer}s</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={loading}
                          className="text-brand-cyan hover:underline font-semibold disabled:opacity-50"
                        >
                          Resend verification code
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.some(digit => !digit)}
                      className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetStep('email')}
                      className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Change email address
                    </button>
                  </form>
                </>
              )}

              {/* Step 3: Set New Password */}
              {resetStep === 'newPassword' && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">Create New Password</h2>
                  <p className="text-gray-400 mb-6">Enter your new password below.</p>

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{error}</span>
                        </div>
                      </div>
                    )}

                    {resetMessage && (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm">{resetMessage}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3 bg-dark-card border-2 border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none transition-colors"
                          placeholder="Enter new password"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3 bg-dark-card border-2 border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none transition-colors"
                          placeholder="Confirm new password"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Role Selection */}
          {!showForgotPassword && step === 'role' && (
            <div className="animate-fade-in-up">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400 mb-8">Select your role to continue</p>

              <div className="space-y-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className="w-full p-6 bg-dark-card border-2 border-dark-border rounded-xl hover:border-brand-blue transition-all duration-300 hover:scale-105 group text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-lg`}>
                        {role.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">{role.label}</h3>
                        <p className="text-gray-400 text-sm">{role.description}</p>
                      </div>
                      <div className="text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity text-2xl">→</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <button
                    className="text-brand-cyan hover:underline font-semibold"
                    onClick={() => setShowSignupRoles(true)}
                  >Sign up</button>
                </p>
              </div>

              {/* Signup Role Selector Modal */}
              {showSignupRoles && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
                  onClick={() => setShowSignupRoles(false)}
                >
                  <div
                    className="rounded-2xl p-8 w-full max-w-md mx-4"
                    style={{ background: '#1a1f3a', border: '1px solid rgba(0,153,204,0.3)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <h2 className="text-white text-2xl font-bold text-center mb-2">Create Account</h2>
                    <p className="text-gray-400 text-sm text-center mb-6">Select your role to register</p>

                    <div className="space-y-3">
                      <button
                        onClick={() => { setShowSignupRoles(false); navigate('/register/patient'); }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl group transition-all duration-200 hover:scale-[1.02]"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>👤</div>
                        <div className="text-left">
                          <div className="text-white font-semibold text-lg">Patient</div>
                          <div className="text-gray-400 text-sm">Register to access health records</div>
                        </div>
                        <div className="ml-auto text-green-400 opacity-0 group-hover:opacity-100 transition-opacity text-xl">→</div>
                      </button>

                      <button
                        onClick={() => { setShowSignupRoles(false); navigate('/register/doctor'); }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl group transition-all duration-200 hover:scale-[1.02]"
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>🩺</div>
                        <div className="text-left">
                          <div className="text-white font-semibold text-lg">Doctor</div>
                          <div className="text-gray-400 text-sm">Apply as a medical professional</div>
                        </div>
                        <div className="ml-auto text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-xl">→</div>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowSignupRoles(false)}
                      className="mt-5 w-full text-gray-400 hover:text-white text-sm transition-colors"
                    >Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Login Form */}
          {!showForgotPassword && step === 'credentials' && (
            <div className="animate-fade-in-up">
              <button
                onClick={() => setStep('role')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Change role</span>
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${selectedRole.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {selectedRole.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Sign in as {selectedRole.label}</h2>
                  <p className="text-gray-400 text-sm">{selectedRole.description}</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-dark-card border-2 border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none transition-colors"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-dark-card border-2 border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none transition-colors"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-dark-border bg-dark-card text-brand-blue focus:ring-brand-blue focus:ring-offset-dark-bg" />
                    <span className="text-sm text-gray-400">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-brand-cyan hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Google Login (Doctor + Patient only) */}
                {selectedRole?.id !== "admin" && (
                  <div className="w-full">
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-[1px] bg-dark-border"></div>
                      <span className="text-gray-400 text-sm">OR</span>
                      <div className="flex-1 h-[1px] bg-dark-border"></div>
                    </div>

                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google login failed.")}
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideBackground {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 100px 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;