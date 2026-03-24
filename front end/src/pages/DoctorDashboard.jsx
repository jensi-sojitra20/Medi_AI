import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, FileText, Activity, LogOut, Stethoscope, AlertCircle, CheckCircle2,
  Clock, Search, RefreshCw, Eye, X, Edit, Download, Share2, Settings, HelpCircle,
  MessageSquare, ChevronDown, Filter, Check, XCircle, User, Mail, Phone, MapPin,
  Calendar as CalendarIcon, Save, Camera, Bell, Lock, Palette, BookOpen, FileQuestion,
  MessageCircle, Copy, Facebook, Twitter, Linkedin
} from 'lucide-react';
import MediAiLogo from '../components/MediAiLogo';
import DoctorFeedbackForm from '../components/DoctorFeedbackSection';

// ── API Helper ────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:8000';
const apiFetch = async (path, opts = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
};

// ── Helper: Save profile to localStorage ────────────────────────────────────
const saveProfileToLocalStorage = (data) => {
  const existing = (() => {
    try {
      return JSON.parse(localStorage.getItem('doctor_profile') || '{}');
    } catch {
      return {};
    }
  })();
  const merged = { ...existing, ...data };
  localStorage.setItem('doctor_profile', JSON.stringify(merged));
  console.log('✅ Saved to localStorage:', merged);
  return merged;
};

// ── Helper: Load profile from localStorage ──────────────────────────────────
const loadProfileFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('doctor_profile') || '{}');
  } catch {
    return {};
  }
};

const DoctorDashboard = () => {
  const navigate = useNavigate();

  // ── Page & UI State ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal States ───────────────────────────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // ── Notification State ─────────────────────────────────────────────────────
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState({ type: '', message: '' });

  // ── Review State ───────────────────────────────────────────────────────────
  const [reviewMode, setReviewMode] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [modifiedReport, setModifiedReport] = useState({});
  const [rxForm, setRxForm] = useState({ medicines: '', dosage: '', notes: '' });

  // ── Form States ────────────────────────────────────────────────────────────
  const [prescription, setPrescription] = useState({
    patientName: '', doctorName: '', diagnosis: '', medicines: '', dosage: '', instructions: ''
  });

  // ── PROFILE DATA: Load from localStorage on mount ─────────────────────────
  // This ensures that on every login, saved profile data (including avatar)
  // is immediately restored from localStorage before any API call runs.
  const [profileData, setProfileData] = useState(() => {
    const stored = loadProfileFromLocalStorage();
    return {
      name: stored.name || '',
      email: stored.email || '',
      phone: stored.phone || '',
      specialization: stored.specialization || '',
      licenseId: stored.licenseId || '',
      hospital: stored.hospital || '',
      experience: stored.experience || '',
      qualification: stored.qualification || '',
      status: stored.status || 'PENDING',
      verified: stored.verified || false,
      avatar: stored.avatar || null, // ✅ Avatar loaded immediately from localStorage
    };
  });

  const [settings, setSettings] = useState({
    notifications: { email: true, push: true, sms: false, newPatient: true, aiReport: true, prescription: true },
    privacy: { profileVisible: true, showEmail: false, showPhone: false },
    appearance: { theme: 'dark', language: 'English' }
  });

  // ── Real Data ──────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState([]);
  const [aiReports, setAiReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [stats, setStats] = useState({ pendingReviews: 0, approvedPrescriptions: 0, totalPatients: 0 });

  // ── Derived ────────────────────────────────────────────────────────────────
  const isVerified = profileData.verified;
  const pendingReports = aiReports;
  const processedReports = allReports.filter(r => r.status !== 'PENDING');
  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Notification helpers ───────────────────────────────────────────────────
  const showSuccessNotification = (message) => {
    setNotificationMessage({ type: 'success', message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };
  const showErrorNotification = (message) => {
    setNotificationMessage({ type: 'error', message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };
  const showInfoNotification = (message) => {
    setNotificationMessage({ type: 'info', message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // ── Update profile: saves to BOTH React state and localStorage atomically ──
  const updateProfile = useCallback((data) => {
    saveProfileToLocalStorage(data);
    setProfileData(prev => ({ ...prev, ...data }));
  }, []);

  // ── BUG FIX: loadDashboard reads localStorage FRESH inside the callback ────
  // Previously it closed over `profileData` state which was stale at mount
  // time (empty strings), causing avatar and locally-edited fields to be lost.
  // Now we call loadProfileFromLocalStorage() directly so we always get the
  // latest persisted values — no stale closure possible.
  const loadDashboard = useCallback(async () => {
    try {
      const data = await apiFetch('/doctor/dashboard');

      if (data.doctor) {
        // Read from localStorage for fallback
        const stored = loadProfileFromLocalStorage();

        updateProfile({
          // Server-authoritative fields
          name: data.doctor.name || stored.name || '',
          email: data.doctor.email || stored.email || '',
          phone: data.doctor.phone || stored.phone || '',
          specialization: data.doctor.specialization || stored.specialization || '',
          licenseId: data.doctor.license || stored.licenseId || '',
          hospital: data.doctor.hospital || stored.hospital || '',
          experience: data.doctor.experience || stored.experience || '',
          qualification: data.doctor.qualification || stored.qualification || '',
          status: data.doctor.status || stored.status || 'PENDING',
          verified: String(data.doctor.status || '').toUpperCase() === 'VERIFIED',
          // ✅ Use server profile_image_url if available, else fallback to localStorage
          avatar: data.doctor.profile_image_url || stored.avatar || null,
        });
      }

      setStats(data.stats || {});
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) navigate('/login');
    }
  }, [navigate, updateProfile]); // ✅ FIX: profileData removed from deps

  const loadPending = useCallback(async () => {
    try {
      const data = await apiFetch('/doctor/pending-predictions');
      setAiReports(data.predictions || []);
    } catch { }
  }, []);

  const loadAllReports = useCallback(async () => {
    try {
      const data = await apiFetch('/doctor/all-predictions');
      setAllReports(data.predictions || []);
    } catch { }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const data = await apiFetch('/doctor/my-patients');
      setPatients(data.patients || []);
    } catch { }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    (async () => {
      setPageLoading(true);
      await loadDashboard();
      loadPending();
      setPageLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (currentPage === 'dashboard') { loadPending(); }
    if (currentPage === 'ai-review') { loadPending(); loadAllReports(); }
    if (currentPage === 'patients') { loadPatients(); }
    if (currentPage === 'prescriptions') { loadPatients(); loadAllReports(); }
  }, [currentPage]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    // ✅ INTENTIONALLY keep 'doctor_profile' in localStorage
    // This is what makes profile persist across login sessions
    showSuccessNotification('Logged out successfully');
    setTimeout(() => navigate('/login'), 1000);
  };

  // ── View Patient ───────────────────────────────────────────────────────────
  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handleReviewReport = (report) => {
    setSelectedPatient({
      ...report,
      id: `P${report.patient_id}`,
      name: report.patient_name,
      age: report.patient_age,
      subscriptionStatus: 'Active',
      aiReport: report,
      vitalSigns: {
        bloodPressure: report.blood_pressure || 'N/A',
        heartRate: 'N/A',
        temperature: report.temperature ? `${report.temperature}°C` : 'N/A',
        weight: 'N/A',
      },
    });
    setModifiedReport({
      disease: report.disease || '',
      symptoms: Array.isArray(report.symptoms) ? report.symptoms : [],
      treatment: report.treatment || '',
      confidence: report.confidence != null ? `${Math.round(report.confidence * 100)}%` : 'N/A',
    });
    setRxForm({ medicines: '', dosage: 'As prescribed', notes: '' });
    setRejectionComment('');
    setReviewMode(null);
    setShowReviewModal(true);
  };

  const handleApproveReport = async () => {
    setLoading(true);
    try {
      await apiFetch('/doctor/prescribe', {
        method: 'POST',
        body: JSON.stringify({
          prediction_id: selectedPatient.aiReport.id,
          final_treatment: modifiedReport.treatment || modifiedReport.disease,
          medicine_details: rxForm.medicines,
          dosage: rxForm.dosage || 'As prescribed',
          notes: rxForm.notes,
          status: 'approved',
        }),
      });
      showSuccessNotification('✅ AI Report approved successfully!');
      setShowReviewModal(false);
      setReviewMode(null);
      loadPending(); loadAllReports(); loadDashboard();
    } catch (err) {
      showErrorNotification(err.message);
    } finally { setLoading(false); }
  };

  const handleRejectReport = async () => {
    if (!rejectionComment.trim()) {
      showErrorNotification('Please provide a reason for rejection');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/doctor/reject-prediction', {
        method: 'POST',
        body: JSON.stringify({
          prediction_id: selectedPatient.aiReport.id,
          reason: rejectionComment,
        }),
      });
      showSuccessNotification('❌ AI Report rejected with comments');
      setShowReviewModal(false);
      setReviewMode(null);
      setRejectionComment('');
      loadPending(); loadAllReports(); loadDashboard();
    } catch (err) {
      showErrorNotification(err.message);
    } finally { setLoading(false); }
  };

  const handleModifyReport = () => {
    setReviewMode('modify');
    showInfoNotification('📝 You can now edit the AI predictions');
  };

  const handleSaveModifications = async () => {
    setLoading(true);
    try {
      await apiFetch('/doctor/prescribe', {
        method: 'POST',
        body: JSON.stringify({
          prediction_id: selectedPatient.aiReport.id,
          final_treatment: modifiedReport.disease,
          medicine_details: rxForm.medicines,
          dosage: rxForm.dosage || 'As prescribed',
          notes: rxForm.notes,
          status: 'approved',
        }),
      });
      showSuccessNotification('✅ Modifications saved and approved!');
      setShowReviewModal(false);
      setReviewMode(null);
      loadPending(); loadAllReports(); loadDashboard();
    } catch (err) {
      showErrorNotification(err.message);
    } finally { setLoading(false); }
  };

  const handleGeneratePrescription = (patient) => {
    setPrescription({
      patientName: patient.name || '',
      doctorName: profileData.name,
      diagnosis: patient.last_disease || patient.disease || '',
      medicines: '',
      dosage: 'As prescribed',
      instructions: 'Take as prescribed. Follow up in 2 weeks.',
    });
    setShowPrescriptionModal(true);
  };

  const handleDownloadPrescription = () => {
    setLoading(true);
    setTimeout(() => {
      const pdfContent = `
═══════════════════════════════════════════
              PRESCRIPTION
═══════════════════════════════════════════

Date: ${new Date().toLocaleDateString()}

Patient Information:
  Name: ${prescription.patientName}
  
Doctor Information:
  Name: ${prescription.doctorName}
  License: ${profileData.licenseId}

Diagnosis: ${prescription.diagnosis}

Medications: ${prescription.medicines}

Dosage & Duration: ${prescription.dosage}

Instructions: ${prescription.instructions}

═══════════════════════════════════════════
Doctor's Signature: ${prescription.doctorName}
Date: ${new Date().toLocaleDateString()}
═══════════════════════════════════════════
      `;
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Prescription_${prescription.patientName.replace(/\s/g, '_')}_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setLoading(false);
      showSuccessNotification('📄 Prescription downloaded successfully!');
      setShowPrescriptionModal(false);
    }, 1500);
  };

  // ── Save Profile to API + localStorage ──────────────────────────────────
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const experienceNum = parseInt(profileData.experience) || 0;

      const res = await apiFetch('/doctor/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          hospital: profileData.hospital,
          qualification: profileData.qualification,
          experience: experienceNum,
        }),
      });

      // ✅ Persist full profile to localStorage including avatar
      updateProfile({
        name: res.doctor?.name || profileData.name,
        email: res.doctor?.email || profileData.email,
        phone: res.doctor?.phone || profileData.phone,
        hospital: res.doctor?.hospital || profileData.hospital,
        qualification: res.doctor?.qualification || profileData.qualification,
        experience: res.doctor?.experience || experienceNum,
        specialization: profileData.specialization,
        licenseId: profileData.licenseId,
        status: profileData.status,
        verified: profileData.verified,
        avatar: profileData.avatar, // ✅ Always persist avatar
      });

      showSuccessNotification('✅ Profile updated successfully!');
      setCurrentPage('dashboard');
    } catch (err) {
      showErrorNotification(err.message);
    } finally { setLoading(false); }
  };

  const handleSaveSettings = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccessNotification('⚙️ Settings saved successfully!');
      setShowSettingsModal(false);
    }, 1000);
  };

  const handleShare = (platform) => {
    const shareUrl = window.location.href;
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        showSuccessNotification('🔗 Link copied to clipboard!');
        break;
      case 'email':
        window.location.href = `mailto:?subject=MediAI&body=${shareUrl}`;
        showSuccessNotification('📧 Opening email client...');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${shareUrl}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank');
        break;
    }
    setShowShareModal(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    showInfoNotification('🔄 Refreshing data...');
    await loadDashboard();
    await loadPending();
    await loadAllReports();
    await loadPatients();
    setLoading(false);
    showSuccessNotification('✅ Data refreshed successfully!');
  };

  // ── Avatar Upload — saves to uploads/doctors/images/ on backend ─────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg','image/png','image/jpg','image/webp'];
    if (!allowed.includes(file.type)) {
      showSuccessNotification('❌ Only JPG, PNG, or WebP images allowed');
      return;
    }

    // Show instant preview from local file
    const reader = new FileReader();
    reader.onloadend = () => updateProfile({ avatar: reader.result });
    reader.readAsDataURL(file);

    // Upload to backend → saved to uploads/doctors/images/
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/doctor/profile/picture', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      // Store real server URL so it persists after page refresh
      updateProfile({ avatar: data.profile_image_url });
      showSuccessNotification('📷 Profile picture saved to server!');
    } catch (err) {
      showSuccessNotification(`❌ Upload failed: ${err.message}`);
    }
  };

  // ── Loading Screen ─────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center flex-col gap-4">
        <RefreshCw className="w-12 h-12 text-brand-blue animate-spin" />
        <p className="text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER FUNCTIONS
  // ══════════════════════════════════════════════════════════════════

  const renderDashboard = () => (
    <div className="space-y-6">
      {!isVerified && (
        <div className={`p-4 rounded-xl border ${String(profileData.status).toUpperCase() === 'REJECTED'
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-6 h-6 ${String(profileData.status).toUpperCase() === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}`} />
            <div>
              <p className={`font-semibold ${String(profileData.status).toUpperCase() === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}`}>
                {String(profileData.status).toUpperCase() === 'REJECTED'
                  ? '❌ Registration Rejected by Admin'
                  : '⏳ Awaiting Admin Verification'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {String(profileData.status).toUpperCase() === 'REJECTED'
                  ? 'Your application was rejected. Please contact admin at support@mediai.com.'
                  : 'Your account is under review. You will be notified once approved. Patient reports will be visible after approval.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-brand-blue transition-all hover:shadow-lg hover:shadow-brand-blue/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Patients</p>
              <p className="text-4xl font-bold text-white">{stats.totalPatients || patients.length || 0}</p>
            </div>
            <div className="p-4 bg-brand-blue/20 rounded-xl">
              <Users className="w-8 h-8 text-brand-blue" />
            </div>
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-yellow-500 transition-all hover:shadow-lg hover:shadow-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Pending AI Reports</p>
              <p className="text-4xl font-bold text-white">{stats.pendingReviews || pendingReports.length || 0}</p>
            </div>
            <div className="p-4 bg-yellow-500/20 rounded-xl">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setCurrentPage('patients')} className="px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all hover:scale-105">
          View Patients
        </button>
        <button onClick={handleRefresh} disabled={loading} className="px-6 py-3 bg-dark-card border border-dark-border text-white rounded-lg font-semibold hover:border-brand-blue transition-colors flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-xl font-bold text-white">Recent Patients</h3>
        </div>
        <div className="overflow-x-auto">
          {!isVerified ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-400">Patient data is available after admin approves your account.</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No patients yet. Patients appear here after they submit AI reports.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Patient ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Patient Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Last Condition</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Pending Reports</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {patients.slice(0, 4).map((patient) => (
                  <tr key={patient.id} className="hover:bg-dark-bg transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">#{patient.id}</td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{patient.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                        {patient.last_disease || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${patient.pending_reports > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        {patient.pending_reports || 0} pending
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleViewPatient(patient)} className="text-brand-cyan hover:text-brand-blue transition-colors flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const renderPatientManagement = () => (
    <div className="space-y-6">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ID, or email..."
              className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-xl font-bold text-white">All Patients ({filteredPatients.length})</h3>
        </div>
        {!isVerified ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-400">Available after admin verification.</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No patients yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Patient ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Age</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Gender</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Last Disease</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Subscription</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-dark-bg transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">#{patient.id}</td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{patient.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{patient.age || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{patient.gender || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{patient.last_disease || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${String(patient.subscription).toUpperCase() === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>{patient.subscription || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleViewPatient(patient)} className="text-brand-cyan hover:text-brand-blue transition-colors flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderAITreatmentReview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-blue to-brand-cyan rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">AI Treatment Review</h2>
        <p className="text-white/80">Review, approve, reject, or modify AI-generated treatment recommendations</p>
      </div>

      {!isVerified ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Only verified doctors can review patient AI reports.</p>
          <p className="text-gray-500 text-sm mt-2">Please wait for admin approval.</p>
        </div>
      ) : (
        <>
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-dark-border">
              <h3 className="text-xl font-bold text-white">Pending AI Reports ({pendingReports.length})</h3>
            </div>
            <div className="divide-y divide-dark-border">
              {pendingReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-dark-bg transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">{report.patient_name}</h4>
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">Pending Review</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Patient ID:</span>
                          <span className="text-white ml-2">#{report.patient_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">AI Prediction:</span>
                          <span className="text-white ml-2">{report.disease || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Confidence:</span>
                          <span className="text-white ml-2">{report.confidence != null ? `${Math.round(report.confidence * 100)}%` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Severity:</span>
                          <span className="text-white ml-2">{report.severity || '—'}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleReviewReport(report)} className="px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all hover:scale-105">
                      Review Report
                    </button>
                  </div>
                </div>
              ))}
              {pendingReports.length === 0 && (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-400">No pending AI reports to review</p>
                </div>
              )}
            </div>
          </div>

          {processedReports.length > 0 && (
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-dark-border">
                <h3 className="text-xl font-bold text-white">Processed Reports ({processedReports.length})</h3>
              </div>
              <div className="divide-y divide-dark-border">
                {processedReports.map((report) => (
                  <div key={report.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-white">{report.patient_name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${report.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>{report.status}</span>
                          {report.has_prescription && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">Prescribed</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-gray-400">Disease:</span><span className="text-white ml-2">{report.disease || '—'}</span></div>
                          <div><span className="text-gray-400">Date:</span><span className="text-white ml-2">{report.date ? new Date(report.date).toLocaleDateString() : '—'}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderPrescriptionManagement = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Prescription Management</h2>
        <p className="text-white/80">Create, approve, and generate prescription PDFs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => patients.length > 0 && handleGeneratePrescription(patients[0])}
          className="bg-dark-card border-2 border-dark-border rounded-xl p-6 hover:border-brand-blue transition-all text-left group hover:scale-105"
        >
          <FileText className="w-12 h-12 text-brand-blue mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-2">Create New Prescription</h3>
          <p className="text-gray-400 text-sm">Generate a new prescription for a patient</p>
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-xl font-bold text-white">Approved Prescriptions ({allReports.filter(r => r.has_prescription).length})</h3>
        </div>
        <div className="divide-y divide-dark-border">
          {allReports.filter(r => r.has_prescription).length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No prescriptions yet.</p>
            </div>
          ) : allReports.filter(r => r.has_prescription).map((report) => (
            <div key={report.id} className="p-6 hover:bg-dark-bg transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">{report.patient_name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-400">Diagnosis:</span><span className="text-white ml-2">{report.disease || '—'}</span></div>
                    <div><span className="text-gray-400">Date:</span><span className="text-white ml-2">{report.prescription?.date ? new Date(report.prescription.date).toLocaleDateString() : '—'}</span></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGeneratePrescription({ name: report.patient_name, last_disease: report.disease })}
                    className="px-4 py-2 bg-brand-cyan/20 text-brand-cyan rounded-lg hover:bg-brand-cyan/30 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-blue to-brand-cyan rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
        <p className="text-white/80">Manage your profile information</p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-blue to-brand-cyan rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (profileData.name || 'D').charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-brand-blue rounded-full cursor-pointer hover:bg-brand-cyan transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div>
            <p className="text-white font-semibold">{profileData.name}</p>
            <p className="text-gray-400 text-sm">{profileData.specialization}</p>
            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>{isVerified ? '✓ Verified' : `⏳ ${profileData.status}`}</span>
          </div>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={profileData.name} onChange={(e) => setProfileData(p => ({ ...p, name: e.target.value }))} className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="email" value={profileData.email} disabled className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-500 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="tel" value={profileData.phone} onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Specialization</label>
            <input type="text" value={profileData.specialization} disabled className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Hospital / Clinic</label>
            <input type="text" value={profileData.hospital} onChange={(e) => setProfileData(p => ({ ...p, hospital: e.target.value }))} className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Experience (years)</label>
            <input type="text" value={profileData.experience} onChange={(e) => setProfileData(p => ({ ...p, experience: e.target.value }))} className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Qualification</label>
            <input type="text" value={profileData.qualification} onChange={(e) => setProfileData(p => ({ ...p, qualification: e.target.value }))} className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">License ID</label>
            <input type="text" value={profileData.licenseId} disabled className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-500 cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={handleSaveProfile} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-brand-blue/30 transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        <button onClick={() => setCurrentPage('dashboard')} className="px-6 py-3 bg-dark-bg border border-dark-border text-white rounded-lg hover:border-brand-blue transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className={`px-6 py-4 rounded-lg shadow-lg border flex items-center gap-3 ${notificationMessage.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
            notificationMessage.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
              'bg-blue-500/20 border-blue-500/50 text-blue-400'
            }`}>
            {notificationMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {notificationMessage.type === 'error' && <XCircle className="w-5 h-5" />}
            {notificationMessage.type === 'info' && <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{notificationMessage.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-dark-card border-r border-dark-border flex flex-col">
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <MediAiLogo size={40} showText={false} />
            <div>
              <h1 className="text-xl font-bold text-white">MediAI</h1>
              <p className="text-xs text-gray-400">Doctor Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentPage === 'dashboard' ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-lg' : 'text-gray-400 hover:bg-dark-bg hover:text-white'}`}>
            <Activity className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <button onClick={() => setCurrentPage('patients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentPage === 'patients' ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-lg' : 'text-gray-400 hover:bg-dark-bg hover:text-white'}`}>
            <Users className="w-5 h-5" />
            <span className="font-medium">Patient Management</span>
          </button>
          <button onClick={() => setCurrentPage('ai-review')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentPage === 'ai-review' ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-lg' : 'text-gray-400 hover:bg-dark-bg hover:text-white'}`}>
            <Stethoscope className="w-5 h-5" />
            <span className="font-medium flex-1">AI Treatment Review</span>
            {isVerified && pendingReports.length > 0 && (
              <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{pendingReports.length}</span>
            )}
          </button>
          <button onClick={() => setCurrentPage('prescriptions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentPage === 'prescriptions' ? 'bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-lg' : 'text-gray-400 hover:bg-dark-bg hover:text-white'}`}>
            <FileText className="w-5 h-5" />
            <span className="font-medium">Prescription Management</span>
          </button>
          <button onClick={() => setLogoutModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all mt-4">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        {/* Profile chip */}
        <div className="p-4 border-t border-dark-border">
          <div className="relative">
            <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-bg transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-cyan rounded-full flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (profileData.name || 'D').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{profileData.name || 'Doctor'}</p>
                <p className="text-xs text-gray-400 truncate">{profileData.specialization || 'Doctor'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden animate-fade-in-up z-10">
                <button onClick={() => { setShowProfileDropdown(false); setCurrentPage('profile'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-bg transition-colors text-left">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">Profile Settings</span>
                </button>
                <button onClick={() => { setShowProfileDropdown(false); setShowSettingsModal(true); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-bg transition-colors text-left">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">Settings</span>
                </button>
                <button onClick={() => { setShowProfileDropdown(false); setShowHelpModal(true); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-bg transition-colors text-left">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">Help & Support</span>
                </button>
                <button onClick={() => { setShowProfileDropdown(false); setShowFeedbackModal(true); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-bg transition-colors text-left border-t border-dark-border">
                  <MessageSquare className="w-4 h-4 text-brand-cyan" />
                  <span className="text-sm text-white">Send Feedback</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-dark-card border-b border-dark-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {currentPage === 'dashboard' && `Welcome, Dr. ${profileData.name || 'Doctor'}`}
                {currentPage === 'patients' && 'Patient Management'}
                {currentPage === 'ai-review' && 'AI Treatment Review'}
                {currentPage === 'prescriptions' && 'Prescription Management'}
                {currentPage === 'profile' && 'Profile Settings'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {currentPage === 'dashboard' && `${profileData.specialization || ''}${profileData.hospital ? ` · ${profileData.hospital}` : ''}`}
                {currentPage === 'patients' && 'Manage patient information'}
                {currentPage === 'ai-review' && 'Review AI recommendations'}
                {currentPage === 'prescriptions' && 'Manage prescriptions'}
                {currentPage === 'profile' && 'Update your profile'}
              </p>
            </div>
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-dark-border text-gray-400 rounded-lg hover:border-brand-blue hover:text-white transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {currentPage === 'dashboard' && renderDashboard()}
          {currentPage === 'patients' && renderPatientManagement()}
          {currentPage === 'ai-review' && renderAITreatmentReview()}
          {currentPage === 'prescriptions' && renderPrescriptionManagement()}
          {currentPage === 'profile' && renderProfileSettings()}
        </main>
      </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Patient Details</h3>
              <button onClick={() => setShowPatientModal(false)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm text-gray-400 mb-1 block">Patient ID</label><p className="text-white font-semibold">#{selectedPatient.id}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Full Name</label><p className="text-white font-semibold">{selectedPatient.name}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Age</label><p className="text-white">{selectedPatient.age ? `${selectedPatient.age} years` : '—'}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Gender</label><p className="text-white">{selectedPatient.gender || '—'}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Email</label><p className="text-white">{selectedPatient.email || '—'}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Phone</label><p className="text-white">{selectedPatient.phone || '—'}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Blood Group</label><p className="text-white">{selectedPatient.blood_group || '—'}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">BMI</label><p className="text-white">{selectedPatient.bmi ?? '—'}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Total AI Reports</label><p className="text-white">{selectedPatient.total_reports ?? '—'}</p></div>
                <div><label className="text-sm text-gray-400 mb-1 block">Last Visit</label><p className="text-white">{selectedPatient.last_visit || '—'}</p></div>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Latest Condition</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-gray-400">Disease</label><p className="text-white font-semibold">{selectedPatient.last_disease || '—'}</p></div>
                  <div><label className="text-xs text-gray-400">Subscription</label><p className="text-white font-semibold">{selectedPatient.subscription || '—'}</p></div>
                  <div><label className="text-xs text-gray-400">Height</label><p className="text-white font-semibold">{selectedPatient.height_cm ? `${selectedPatient.height_cm} cm` : '—'}</p></div>
                  <div><label className="text-xs text-gray-400">Weight</label><p className="text-white font-semibold">{selectedPatient.weight_kg ? `${selectedPatient.weight_kg} kg` : '—'}</p></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { handleGeneratePrescription(selectedPatient); setShowPatientModal(false); }} className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                  Generate Prescription
                </button>
                <button onClick={() => setShowPatientModal(false)} className="px-6 py-3 bg-dark-bg border border-dark-border text-white rounded-lg hover:border-brand-blue transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Review Modal */}
      {showReviewModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">AI Treatment Review</h3>
              <button onClick={() => { setShowReviewModal(false); setReviewMode(null); }} className="p-2 hover:bg-dark-bg rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4 bg-dark-bg border border-dark-border rounded-lg p-4">
                <div><label className="text-xs text-gray-400">Patient</label><p className="text-white font-semibold">{selectedPatient.patient_name || selectedPatient.name}</p></div>
                <div><label className="text-xs text-gray-400">Age</label><p className="text-white font-semibold">{selectedPatient.patient_age || selectedPatient.age || '—'}</p></div>
                <div><label className="text-xs text-gray-400">Date</label><p className="text-white font-semibold">{selectedPatient.aiReport?.date ? new Date(selectedPatient.aiReport.date).toLocaleDateString() : '—'}</p></div>
                <div><label className="text-xs text-gray-400">Blood Pressure</label><p className="text-white font-semibold">{selectedPatient.aiReport?.blood_pressure || '—'}</p></div>
                <div><label className="text-xs text-gray-400">Temperature</label><p className="text-white font-semibold">{selectedPatient.aiReport?.temperature ? `${selectedPatient.aiReport.temperature}°C` : '—'}</p></div>
                <div><label className="text-xs text-gray-400">Confidence</label><p className="text-white font-semibold">{modifiedReport.confidence}</p></div>
              </div>

              <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Patient has submitted this AI report for doctor review</span>
                </div>
              </div>

              {Array.isArray(modifiedReport.symptoms) && modifiedReport.symptoms.length > 0 && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Symptoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {modifiedReport.symptoms.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-brand-blue/20 text-brand-blue rounded-full text-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">
                  AI Prediction: {reviewMode === 'modify' ? '' : modifiedReport.disease}
                </h4>
                {reviewMode === 'modify' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Diagnosis / Disease</label>
                      <input type="text" value={modifiedReport.disease} onChange={(e) => setModifiedReport(prev => ({ ...prev, disease: e.target.value }))} className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Treatment / Recommendation</label>
                      <textarea value={modifiedReport.treatment} onChange={(e) => setModifiedReport(prev => ({ ...prev, treatment: e.target.value }))} rows={3} className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none resize-none" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-white font-bold text-xl">{modifiedReport.disease}</p>
                    {modifiedReport.treatment && <p className="text-gray-300 text-sm">{modifiedReport.treatment}</p>}
                  </div>
                )}
              </div>

              {(reviewMode === 'approve' || reviewMode === 'modify') && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase">Prescription Details</h4>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Medicine Details</label>
                    <textarea value={rxForm.medicines} onChange={(e) => setRxForm(p => ({ ...p, medicines: e.target.value }))} rows={2} placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg..." className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Dosage Instructions</label>
                    <input type="text" value={rxForm.dosage} onChange={(e) => setRxForm(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. Twice daily for 5 days" className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Notes</label>
                    <textarea value={rxForm.notes} onChange={(e) => setRxForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Additional notes for patient..." className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none resize-none" />
                  </div>
                </div>
              )}

              {reviewMode === 'reject' && (
                <textarea value={rejectionComment} onChange={(e) => setRejectionComment(e.target.value)} placeholder="Enter rejection reason..." className="w-full px-4 py-2 bg-dark-card border border-red-500/30 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none" rows="4" />
              )}

              <div className="flex gap-3">
                {reviewMode === 'modify' ? (
                  <>
                    <button onClick={handleSaveModifications} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                      {loading ? 'Saving...' : 'Save & Approve'}
                    </button>
                    <button onClick={() => setReviewMode(null)} className="px-6 py-3 bg-dark-bg border border-dark-border text-white rounded-lg">Cancel</button>
                  </>
                ) : reviewMode === 'reject' ? (
                  <>
                    <button onClick={handleRejectReport} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50">
                      {loading ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button onClick={() => setReviewMode(null)} className="px-6 py-3 bg-dark-bg border border-dark-border text-white rounded-lg">Cancel</button>
                  </>
                ) : reviewMode === 'approve' ? (
                  <>
                    <button onClick={handleApproveReport} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50">
                      {loading ? 'Approving...' : 'Confirm Approval'}
                    </button>
                    <button onClick={() => setReviewMode(null)} className="px-6 py-3 bg-dark-bg border border-dark-border text-white rounded-lg">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setReviewMode('approve')} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50">Approve</button>
                    <button onClick={handleModifyReport} className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg">Modify</button>
                    <button onClick={() => setReviewMode('reject')} className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg">Reject</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-2xl w-full">
            <div className="border-b border-dark-border p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Create Prescription</h3>
              <button onClick={() => setShowPrescriptionModal(false)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-400 mb-2 block">Patient</label><input type="text" value={prescription.patientName} onChange={(e) => setPrescription({ ...prescription, patientName: e.target.value })} className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" /></div>
                <div><label className="text-sm text-gray-400 mb-2 block">Doctor</label><input type="text" value={prescription.doctorName} disabled className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-400" /></div>
              </div>
              <div><label className="text-sm text-gray-400 mb-2 block">Diagnosis</label><input type="text" value={prescription.diagnosis} onChange={(e) => setPrescription({ ...prescription, diagnosis: e.target.value })} className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none" /></div>
              <div><label className="text-sm text-gray-400 mb-2 block">Medicines</label><textarea value={prescription.medicines} onChange={(e) => setPrescription({ ...prescription, medicines: e.target.value })} className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none resize-none" rows="3" /></div>
              <div><label className="text-sm text-gray-400 mb-2 block">Instructions</label><textarea value={prescription.instructions} onChange={(e) => setPrescription({ ...prescription, instructions: e.target.value })} className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-blue focus:outline-none resize-none" rows="2" /></div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleDownloadPrescription} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <><RefreshCw className="w-5 h-5 animate-spin" />Generating...</> : <><Download className="w-5 h-5" />Download PDF</>}
                </button>
                <button onClick={() => setShowPrescriptionModal(false)} className="px-6 py-3 bg-dark-bg border border-dark-border text-white rounded-lg hover:border-brand-blue transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4"><Bell className="w-5 h-5 text-brand-blue" /><h4 className="text-lg font-semibold text-white">Notifications</h4></div>
                <div className="space-y-3 pl-7">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <input type="checkbox" checked={value} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, [key]: e.target.checked } })} className="w-5 h-5 rounded border-dark-border bg-dark-bg text-brand-blue" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveSettings} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50">{loading ? 'Saving...' : 'Save Settings'}</button>
                <button onClick={() => setShowSettingsModal(false)} className="px-6 py-3 bg-dark-bg border border-dark-border text-white rounded-lg hover:border-brand-blue transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Help & Support</h3>
              <button onClick={() => setShowHelpModal(false)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">How to review AI reports?</h5>
                <p className="text-gray-400 text-sm">Navigate to AI Treatment Review, click Review Report, and choose Approve, Modify, or Reject.</p>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-2">
                <p className="text-white"><strong>Email:</strong> support@mediai.com</p>
                <p className="text-white"><strong>Phone:</strong> +1 800-MEDIAI-1</p>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="w-full px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-cyan text-white rounded-lg font-semibold hover:shadow-lg">Got it!</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-md w-full">
            <div className="border-b border-dark-border p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Share</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-3 p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-brand-blue transition-colors text-left">
                <Copy className="w-5 h-5 text-brand-blue" /><div><p className="text-white font-semibold">Copy Link</p></div>
              </button>
              <button onClick={() => handleShare('email')} className="w-full flex items-center gap-3 p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-brand-blue transition-colors text-left">
                <Mail className="w-5 h-5 text-red-400" /><div><p className="text-white font-semibold">Email</p></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal - Using DoctorFeedbackForm Component */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <div className="relative">
              <button 
                onClick={() => setShowFeedbackModal(false)} 
                className="absolute -top-10 right-0 p-2 hover:bg-dark-bg rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <DoctorFeedbackForm token={localStorage.getItem('token')} />
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {logoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-sm w-full">
            <div className="border-b border-dark-border p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Confirm Logout</h3>
              <button onClick={() => setLogoutModal(false)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6">
              <p className="text-gray-400 text-sm mb-6">Are you sure you want to logout from your account?</p>
              <div className="flex gap-3">
                <button onClick={logout} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors">Yes, Logout</button>
                <button onClick={() => setLogoutModal(false)} className="flex-1 px-4 py-2.5 bg-dark-bg border border-dark-border text-white rounded-lg hover:border-brand-blue transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;