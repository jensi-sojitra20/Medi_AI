import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, Settings,
  LogOut, Bell, Menu, X, Upload, Shield,
  TrendingUp, Activity,
  CheckCircle, XCircle, Clock, Search,
  RefreshCw, AlertCircle, Eye, Ban, ChevronUp, Lock, Check,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import MediAiLogo from "../components/MediAiLogo";

// ── Theme Tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#0a0e1a',
  surface: '#111827',
  card: '#1a2235',
  border: 'rgba(0,153,204,0.12)',
  cyan: '#0099cc',
  cyanDim: 'rgba(0,153,204,0.12)',
  text: '#f1f5f9',
  muted: '#64748b',
  sub: '#94a3b8',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#0099cc',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const profileInputRef = useRef(null);
  const notifRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState('all');
  const [profileImage, setProfileImage] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const [themeConfig, setThemeConfig] = useState(() => {
    const s = localStorage.getItem('adminThemeConfig');
    return s ? JSON.parse(s) : { language: 'English', timezone: 'IST', emailNotifications: true, weeklyReports: true, alertAnomalies: false };
  });

  const [user, setUser] = useState({ name: 'System Admin', email: 'admin@medi.ai', role: 'Super Admin' });

  // ── API Helper ─────────────────────────────────────────────────────────────
  const BASE = 'http://localhost:8000';
  const apiFetch = async (path, opts = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${res.status}`); }
    return res.json();
  };

  const apiFetchForm = async (path, formData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${res.status}`); }
    return res.json();
  };

  // ── Real Data State ────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalPatients: 0, activeDoctors: 0, subscriptions: 0, aiAccuracy: 0,
    verifiedDoctors: 0, provisionalDoctors: 0,
    activeSubscriptions: 0, expiredSubscriptions: 0, trialSubscriptions: 0,
    totalPredictions: 0, totalPrescriptions: 0,
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Real chart data
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [subscriptionGrowth, setSubscriptionGrowth] = useState([]);
  const [aiUsageData, setAiUsageData] = useState([]);
  const [accuracyTrend, setAccuracyTrend] = useState([]);
  const [userDist, setUserDist] = useState([]);

  const loadAdminProfile = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/profile');
      setUser(u => ({ ...u, name: data.name || u.name, email: data.email || u.email, role: data.role || u.role }));
      if (data.profile_image) setProfileImage(`${BASE}/${data.profile_image.replace(/\\/g, '/')}`);
    } catch (err) { console.warn('Profile load failed:', err.message); }
  }, []); // eslint-disable-line

  const loadStats = useCallback(async () => {
    try {
      const d = await apiFetch('/admin/dashboard');
      const s = d.stats || {};
      setStats({
        totalPatients: s.totalPatients || 0,
        activeDoctors: s.verifiedDoctors || 0,
        subscriptions: s.payingPatients || 0,
        aiAccuracy: s.totalPredictions > 0 ? +(s.approvedPredictions / s.totalPredictions * 100).toFixed(1) : 0,
        verifiedDoctors: s.verifiedDoctors || 0,
        provisionalDoctors: s.pendingDoctors || 0,
        activeSubscriptions: s.payingPatients || 0,
        expiredSubscriptions: s.expiredPatients || 0,
        trialSubscriptions: s.onTrial || 0,
        totalPredictions: s.totalPredictions || 0,
        totalPrescriptions: s.totalPrescriptions || 0,
      });
    } catch (err) { console.warn('Stats load failed:', err.message); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const d = await apiFetch('/admin/analytics');
      setSubscriptionGrowth(d.subscription_growth || []);
      setAiUsageData(d.ai_usage || []);
      setAccuracyTrend(d.accuracy_trend || []);
      setUserDist(d.user_dist || []);
    } catch (err) { console.warn('Analytics load failed:', err.message); }
    finally { setAnalyticsLoading(false); }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      const d = await apiFetch('/admin/doctors');
      setDoctors((d.doctors || []).map(doc => ({
        id: doc.id, name: doc.name, email: doc.email,
        status: doc.is_blocked ? 'blocked' : doc.status,
        specialty: doc.specialization || '—', hospital: doc.hospital || '—',
        license: doc.license || '—', experience: doc.experience || 0,
        phone: doc.phone || '—', qualification: doc.qualification || '—',
        registered_at: doc.registered_at,
        id_proof_url: doc.id_proof_url ? `${BASE}${doc.id_proof_url}` : null,
      })));
    } catch (err) { console.warn('Doctors load failed:', err.message); }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const d = await apiFetch('/admin/patients');
      setPatients((d.patients || []).map(p => {
        const sub = p.subscription || {};
        const status = sub.status ? sub.status.charAt(0).toUpperCase() + sub.status.slice(1) : 'Unknown';
        return {
          id: p.id, name: p.name, email: p.email, age: p.age || '—',
          gender: p.gender || '—', phone: p.phone || '—', blood_group: p.blood_group || '—',
          subscription: status, plan: sub.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : '—',
          is_blocked: p.is_blocked, registered_at: p.registered_at,
        };
      }));
    } catch (err) { console.warn('Patients load failed:', err.message); }
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const d = await apiFetch('/admin/notifications');
      setNotifications(d.notifications || []);
    } catch (err) { console.warn('Notifications load failed:', err.message); }
    finally { setNotifLoading(false); }
  }, []);

  const markNotificationsRead = useCallback(async () => {
    try {
      await apiFetch('/admin/notifications/mark-read', { method: 'POST' });
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    } catch (err) { console.warn('Mark read failed:', err.message); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDataLoading(true);
    Promise.all([loadStats(), loadDoctors(), loadPatients(), loadAdminProfile(), loadAnalytics(), loadNotifications()])
      .finally(() => setDataLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (activeMenu === 'dashboard') { loadStats(); loadAnalytics(); }
    if (activeMenu === 'doctors') { loadDoctors(); loadStats(); }
    if (activeMenu === 'patients') { loadPatients(); loadStats(); }
  }, [activeMenu]); // eslint-disable-line

  // Close notif panel when clicking outside
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg) => { setSaveMessage(msg); setTimeout(() => setSaveMessage(''), 3500); };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('userRole'); navigate('/login'); };

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) { showToast('❌ Only JPG, PNG, or WebP images allowed'); return; }
    const reader = new FileReader(); reader.onloadend = () => setProfileImage(reader.result); reader.readAsDataURL(file);
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await apiFetchForm('/admin/profile/picture', formData);
      setProfileImage(`${BASE}/${(res.profile_image || '').replace(/\\/g, '/')}`);
      showToast('✅ Profile picture updated!');
    } catch (err) { showToast(`❌ Upload failed: ${err.message}`); }
  };

  const handleSettingChange = (key, value) => {
    const nc = { ...themeConfig, [key]: value };
    setThemeConfig(nc); localStorage.setItem('adminThemeConfig', JSON.stringify(nc)); showToast('✅ Settings saved');
  };

  const handleDoctorAction = async (id, action) => {
    try {
      if (action === 'approve') await apiFetch(`/admin/doctors/${id}/verify`, { method: 'PUT' });
      else if (action === 'reject') await apiFetch(`/admin/doctors/${id}/reject`, { method: 'PUT' });
      else if (action === 'block') await apiFetch(`/admin/doctors/${id}/block`, { method: 'PUT' });
      else if (action === 'unblock') await apiFetch(`/admin/doctors/${id}/unblock`, { method: 'PUT' });
      showToast(`✅ Doctor ${action}d successfully`);
      await loadDoctors(); await loadStats();
    } catch (err) { showToast(`❌ Error: ${err.message}`); }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.current) { showToast('❌ Enter your current password'); return; }
    if (!pwForm.newPw) { showToast('❌ Enter a new password'); return; }
    if (pwForm.newPw.length < 8) { showToast('❌ New password must be at least 8 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { showToast('❌ New passwords do not match'); return; }
    setPwSaving(true);
    try {
      await apiFetch('/admin/change-password', { method: 'POST', body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }) });
      showToast('✅ Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) { showToast(`❌ ${err.message}`); }
    finally { setPwSaving(false); }
  };

  const filteredDoctors = doctors.filter(d =>
    (doctorFilter === 'all' || d.status === doctorFilter) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredPatients = patients.filter(p =>
    (patientFilter === 'all' || p.subscription.toLowerCase() === patientFilter) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const subDistData = [
    { name: 'Active', value: stats.activeSubscriptions, color: T.green },
    { name: 'Expired', value: stats.expiredSubscriptions, color: T.red },
    { name: 'Trial', value: stats.trialSubscriptions, color: T.cyan },
  ].filter(d => d.value > 0);

  const menuItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'doctors', label: 'Doctor Management', icon: UserCheck },
    { id: 'patients', label: 'Patient Management', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  // ── Reusable Components ────────────────────────────────────────────────────
  const Card = ({ children, style = {} }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, ...style }}>{children}</div>
  );
  const StatCard = ({ label, value, icon: Icon, accent }) => (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: accent, opacity: 0.08 }} />
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={22} color={accent} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{label}</div>
    </Card>
  );
  const SectionCard = ({ title, children, style = {} }) => (
    <Card style={style}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 20 }}>{title}</div>
      {children}
    </Card>
  );
  const Badge = ({ status }) => {
    const map = { verified: [T.green, '#052e16'], pending: [T.amber, '#1c1003'], blocked: [T.red, '#1c0000'], Active: [T.green, '#052e16'], Expired: [T.red, '#1c0000'], Trial: [T.cyan, '#001c26'] };
    const [color, bg] = map[status] || [T.muted, T.surface];
    return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color, background: bg, border: `1px solid ${color}30` }}>{status}</span>;
  };
  const FilterBtn = ({ active, onClick, children, color = T.cyan }) => (
    <button onClick={onClick} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${active ? color : T.border}`, background: active ? `${color}20` : 'transparent', color: active ? color : T.sub, cursor: 'pointer', transition: 'all 0.2s' }}>
      {children}
    </button>
  );
  const EmptyChart = ({ msg = 'No data yet' }) => (
    <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <AlertCircle size={28} color={T.muted} />
      <span style={{ color: T.muted, fontSize: 13 }}>{msg}</span>
    </div>
  );
  const ChartLoader = () => (
    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <RefreshCw size={24} color={T.cyan} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );
  // Array came back = API worked. Only show empty-state when array is truly empty.
  const hasChartItems = (arr) => Array.isArray(arr) && arr.length > 0;
  const hasAnyValue = (arr, ...keys) => hasChartItems(arr) && arr.some(d => keys.some(k => (d[k] ?? 0) > 0));
  const hasRealData = hasChartItems;
  const tooltipStyle = { backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 };
  const inputStyle = { width: '100%', padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  // ── Page: Command Center ───────────────────────────────────────────────────
  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Total Patients" value={stats.totalPatients.toLocaleString()} icon={Users} accent={T.cyan} />
        <StatCard label="Verified Doctors" value={stats.verifiedDoctors} icon={UserCheck} accent={T.green} />
        <StatCard label="Paid Subscriptions" value={stats.subscriptions.toLocaleString()} icon={Activity} accent={T.purple} />
        <StatCard label="AI Predictions" value={stats.totalPredictions.toLocaleString()} icon={Shield} accent={T.amber} />
      </div>

      {/* Subscription & Revenue Growth — REAL DATA */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <SectionCard title="📈 Subscription & Revenue Growth — Real Data">
          {analyticsLoading ? <ChartLoader /> : !hasChartItems(subscriptionGrowth) ? (
            <EmptyChart msg="Could not load data — check backend." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={subscriptionGrowth}>
                <defs>
                  <linearGradient id="gSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.cyan} stopOpacity={0.3} /><stop offset="95%" stopColor={T.cyan} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.3} /><stop offset="95%" stopColor={T.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" stroke={T.muted} fontSize={12} />
                <YAxis stroke={T.muted} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => name === 'Revenue (₹)' ? [`₹${v.toLocaleString()}`, name] : [v, name]} />
                <Legend wrapperStyle={{ color: T.sub, fontSize: 12 }} />
                <Area type="monotone" dataKey="subs" stroke={T.cyan} fill="url(#gSubs)" strokeWidth={2} name="Subscriptions" />
                <Area type="monotone" dataKey="revenue" stroke={T.green} fill="url(#gRev)" strokeWidth={2} name="Revenue (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="🤖 AI Queries / Day (Last 30d)">
          {analyticsLoading ? <ChartLoader /> : !hasChartItems(aiUsageData) ? (
            <EmptyChart msg="Could not load AI usage data." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={aiUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" stroke={T.muted} fontSize={12} />
                <YAxis stroke={T.muted} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="usage" fill={T.cyan} radius={[6, 6, 0, 0]} name="Queries" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* User Distribution + Accuracy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="👥 User Distribution — Real Data">
          {analyticsLoading ? <ChartLoader /> : !hasChartItems(userDist) ? (
            <EmptyChart msg="No users registered yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={userDist} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {userDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v, name, props) => [`${props.payload.count ?? v} (${v}%)`, name]} />
                <Legend wrapperStyle={{ color: T.sub, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="🎯 AI Approval Rate Trend — Real Data">
          {analyticsLoading ? <ChartLoader /> : !hasChartItems(accuracyTrend) ? (
            <EmptyChart msg="Could not load trend data." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" stroke={T.muted} fontSize={12} />
                <YAxis domain={[0, 100]} stroke={T.muted} fontSize={12} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Approval Rate']} />
                <Line type="monotone" dataKey="acc" stroke={T.green} strokeWidth={3} dot={{ fill: T.green, r: 4 }} name="Approval %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Verified Doctors', value: stats.verifiedDoctors, color: T.green, icon: CheckCircle },
          { label: 'Pending Approval', value: stats.provisionalDoctors, color: T.amber, icon: Clock },
          { label: 'Active Plans', value: stats.activeSubscriptions.toLocaleString(), color: T.cyan, icon: Activity },
        ].map((s, i) => (
          <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.text }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(0,153,204,0.06))', border: `1px solid ${T.green}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={22} color={T.green} />
            </div>
            <div>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>Auto-Assign Doctors to Patient Reports</div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>Assigns verified doctors to unassigned AI recommendations by specialization.</div>
            </div>
          </div>
          <button onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              const res = await fetch(`${BASE}/doctor/assign-all-unassigned`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
              const data = await res.json();
              showToast(`✅ ${data.message}`);
              loadStats();
            } catch (err) { showToast(`❌ Assignment failed: ${err.message}`); }
          }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${T.green}, #059669)`, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={15} /> Run Backfill Assignment
          </button>
        </div>
      </Card>
    </div>
  );

  // ── Page: Doctor Management ────────────────────────────────────────────────
  const renderDoctorManagement = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search doctors…" style={{ ...inputStyle, paddingLeft: 38 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'pending', 'verified', 'blocked'].map(f => (
              <FilterBtn key={f} active={doctorFilter === f} onClick={() => setDoctorFilter(f)} color={f === 'pending' ? T.amber : f === 'blocked' ? T.red : T.cyan}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </FilterBtn>
            ))}
          </div>
        </div>
      </Card>

      {filteredDoctors.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <AlertCircle size={32} color={T.muted} style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ color: T.muted, fontSize: 14 }}>No doctors found</div>
        </Card>
      )}

      {filteredDoctors.map(doc => (
        <Card key={doc.id}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${T.cyan}, #0055aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>
                {doc.name.split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>{doc.name}</div>
                <div style={{ color: T.muted, fontSize: 13 }}>{doc.email}</div>
                <div style={{ color: T.cyan, fontSize: 12, marginTop: 2 }}>{doc.specialty}</div>
              </div>
            </div>
            <Badge status={doc.status} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {doc.id_proof_url && (
                <a href={doc.id_proof_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: 'rgba(0,153,204,0.12)', border: `1px solid ${T.border}`, color: T.cyan, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  <Eye size={13} /> ID Proof
                </a>
              )}
              {doc.status === 'pending' && <>
                <button onClick={() => handleDoctorAction(doc.id, 'approve')} style={aBtn(T.green)}><CheckCircle size={14} /> Approve</button>
                <button onClick={() => handleDoctorAction(doc.id, 'reject')} style={aBtn(T.red)}><XCircle size={14} /> Reject</button>
              </>}
              {doc.status === 'rejected' && <button onClick={() => handleDoctorAction(doc.id, 'approve')} style={aBtn(T.green)}><CheckCircle size={14} /> Re-Approve</button>}
              {doc.status === 'verified' && <button onClick={() => handleDoctorAction(doc.id, 'block')} style={aBtn(T.muted)}><Ban size={14} /> Block</button>}
              {doc.status === 'blocked' && <button onClick={() => handleDoctorAction(doc.id, 'unblock')} style={aBtn(T.green)}><CheckCircle size={14} /> Unblock</button>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
            {[{ label: 'Hospital', value: doc.hospital }, { label: 'License', value: doc.license }, { label: 'Qualification', value: doc.qualification }, { label: 'Experience', value: doc.experience ? `${doc.experience} yrs` : '—' }, { label: 'Phone', value: doc.phone }].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 13, color: T.text, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  // ── Page: Patient Management ───────────────────────────────────────────────
  const renderPatientManagement = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Active Subscriptions', value: stats.activeSubscriptions, color: T.green, sub: 'Premium + Basic' },
          { label: 'Expired Subscriptions', value: stats.expiredSubscriptions, color: T.red, sub: 'Renewal needed' },
          { label: 'Trial Users', value: stats.trialSubscriptions, color: T.cyan, sub: 'Convert to paid' },
        ].map((s, i) => (
          <Card key={i} style={{ borderColor: `${s.color}30` }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search patients…" style={{ ...inputStyle, paddingLeft: 38 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'active', 'expired', 'trial'].map(f => (
              <FilterBtn key={f} active={patientFilter === f} onClick={() => setPatientFilter(f)} color={f === 'expired' ? T.red : f === 'trial' ? T.purple : T.cyan}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </FilterBtn>
            ))}
          </div>
        </div>
      </Card>

      {filteredPatients.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <AlertCircle size={32} color={T.muted} style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ color: T.muted, fontSize: 14 }}>No patients found</div>
        </Card>
      )}

      {filteredPatients.map(p => (
        <Card key={p.id}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${T.purple}, #5b21b6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: T.text }}>{p.name}</div>
                <div style={{ color: T.muted, fontSize: 13 }}>{p.email}</div>
                <div style={{ color: T.purple, fontSize: 12, marginTop: 2 }}>{p.plan} Plan</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{p.registered_at ? new Date(p.registered_at).toLocaleDateString() : '—'}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Registered</div>
              </div>
              <Badge status={p.subscription} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={async () => {
                try {
                  await apiFetch(`/admin/patients/${p.id}/grant-plan`, { method: 'PUT', body: JSON.stringify({ plan: 'basic', days: 30 }) });
                  showToast(`✅ Plan granted to ${p.name}`);
                  await loadPatients(); await loadStats();
                } catch (err) { showToast(`❌ Error: ${err.message}`); }
              }} style={aBtn(T.cyan)}><Eye size={14} /> Grant Plan</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            {[{ label: 'Age', value: p.age }, { label: 'Gender', value: p.gender }, { label: 'Blood Group', value: p.blood_group }, { label: 'Phone', value: p.phone }].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: 13, color: T.text, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Subscription Distribution — Real Data */}
      <SectionCard title="📊 Subscription Distribution — Real Data">
        {subDistData.length === 0 ? (
          <EmptyChart msg="No subscription data yet — patients need active/trial/expired plans" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', minWidth: 240 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={subDistData} cx="50%" cy="50%" outerRadius={105}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: T.muted, strokeWidth: 1 }}
                  >
                    {subDistData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value} patients`, name]} />
                  <Legend wrapperStyle={{ color: T.sub, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subDistData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: T.surface, borderRadius: 12, border: `1px solid ${d.color}30` }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>patients</div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: d.color }}>{d.value}</div>
                </div>
              ))}
              <div style={{ padding: '14px 16px', background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Patients</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.text, marginTop: 4 }}>{stats.totalPatients}</div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );

  // ── Page: System Settings ──────────────────────────────────────────────────
  const renderSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Admin Profile */}
      <SectionCard title="👤 Admin Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profileImage
              ? <img src={profileImage} alt="Admin" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${T.cyan}` }} />
              : <div style={{ width: 84, height: 84, borderRadius: '50%', background: `linear-gradient(135deg, ${T.cyan}, #0055aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 30 }}>A</div>
            }
            <button onClick={() => profileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: T.cyan, border: `2px solid ${T.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={13} color="#fff" />
            </button>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{user.name}</div>
            <div style={{ fontSize: 13, color: T.muted }}>{user.email}</div>
            <div style={{ fontSize: 12, color: T.cyan, marginTop: 4, fontWeight: 600 }}>{user.role}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={user.name} onChange={e => setUser(u => ({ ...u, name: e.target.value }))} style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.cyan} onBlur={e => e.target.style.borderColor = T.border} />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input type="email" value={user.email} onChange={e => setUser(u => ({ ...u, email: e.target.value }))} style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.cyan} onBlur={e => e.target.style.borderColor = T.border} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={async () => {
            setProfileSaving(true);
            try { await apiFetch('/admin/profile', { method: 'PUT', body: JSON.stringify({ name: user.name, email: user.email }) }); showToast('✅ Profile saved!'); }
            catch (err) { showToast(`❌ Save failed: ${err.message}`); }
            finally { setProfileSaving(false); }
          }} disabled={profileSaving} style={{ padding: '10px 28px', background: profileSaving ? T.muted : T.cyan, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: profileSaving ? 'not-allowed' : 'pointer' }}>
            {profileSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </SectionCard>

      {/* System Configuration */}
      <SectionCard title="⚙️ System Configuration">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { key: 'language', label: 'Language', options: ['English', 'Spanish', 'French', 'German', 'Hindi'] },
            { key: 'timezone', label: 'Timezone', options: ['UTC', 'EST', 'PST', 'IST', 'CET'] },
          ].map(s => (
            <div key={s.key}>
              <label style={labelStyle}>{s.label}</label>
              <select value={themeConfig[s.key]} onChange={e => handleSettingChange(s.key, e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {s.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.sub, marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notification Preferences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive alerts via email' },
              { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Get weekly summary reports' },
              { key: 'alertAnomalies', label: 'Alert on Anomalies', desc: 'Notify when unusual activity is detected' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer' }}
                onClick={() => handleSettingChange(item.key, !themeConfig[item.key])}>
                <div>
                  <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{item.desc}</div>
                </div>
                <div style={{ width: 48, height: 26, borderRadius: 13, background: themeConfig[item.key] ? T.cyan : '#2d3748', border: `1px solid ${themeConfig[item.key] ? T.cyan : T.border}`, position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: themeConfig[item.key] ? 24 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Change Password — wired to real API */}
      <SectionCard title="🔑 Change Password">
        <div style={{ maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${T.cyan}0d`, border: `1px solid ${T.cyan}25`, borderRadius: 8, marginBottom: 18 }}>
            <Lock size={14} color={T.cyan} />
            <span style={{ fontSize: 12, color: T.sub }}>Your password must be at least 8 characters long</span>
          </div>
          {[
            { label: 'Current Password', field: 'current', placeholder: 'Enter your current password' },
            { label: 'New Password', field: 'newPw', placeholder: 'Enter new password (min 8 characters)' },
            { label: 'Confirm New Password', field: 'confirm', placeholder: 'Re-enter your new password' },
          ].map(({ label, field, placeholder }) => (
            <div key={field} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{label}</label>
              <input
                type="password"
                placeholder={placeholder}
                value={pwForm[field]}
                onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
                style={{
                  ...inputStyle,
                  borderColor: field === 'confirm' && pwForm.confirm && pwForm.newPw !== pwForm.confirm ? T.red : T.border,
                }}
                onFocus={e => e.target.style.borderColor = T.cyan}
                onBlur={e => e.target.style.borderColor = (field === 'confirm' && pwForm.confirm && pwForm.newPw !== pwForm.confirm) ? T.red : T.border}
              />
              {field === 'confirm' && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>Passwords do not match</div>
              )}
              {field === 'confirm' && pwForm.confirm && pwForm.newPw === pwForm.confirm && pwForm.confirm.length > 0 && (
                <div style={{ fontSize: 11, color: T.green, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={11} /> Passwords match
                </div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              onClick={handlePasswordChange}
              disabled={pwSaving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', background: pwSaving ? T.muted : `linear-gradient(135deg, ${T.green}, #059669)`, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: pwSaving ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              {pwSaving ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</> : <><Check size={14} /> Update Password</>}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderContent = () => {
    if (dataLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
          <RefreshCw size={36} color={T.cyan} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: T.sub, fontSize: 14 }}>Loading data from backend…</span>
        </div>
      );
    }
    switch (activeMenu) {
      case 'dashboard': return renderDashboard();
      case 'doctors': return renderDoctorManagement();
      case 'patients': return renderPatientManagement();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  const pageTitle = menuItems.find(m => m.id === activeMenu)?.label || 'Command Center';

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── TOP NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 60, zIndex: 50, background: `${T.surface}ee`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: 8, borderRadius: 8, background: T.cyanDim, border: 'none', cursor: 'pointer', display: 'flex' }}>
            {sidebarOpen ? <X size={18} color={T.cyan} /> : <Menu size={18} color={T.cyan} />}
          </button>
          <div className="flex items-center space-x-3 mb-4">
            <MediAiLogo size={30} showText={false} />
            <span className="text-1xl font-bold text-white">Medi<span className="text-brand-blue">AI</span></span>
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{pageTitle}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* NOTIFICATIONS */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                const opening = !notifOpen;
                setNotifOpen(opening);
                if (opening) {
                  loadNotifications();
                  if (unreadCount > 0) markNotificationsRead();
                }
              }}
              style={{ position: 'relative', padding: 8, borderRadius: 8, background: notifOpen ? T.cyanDim : 'transparent', border: `1px solid ${notifOpen ? T.cyan + '40' : 'transparent'}`, cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }}
            >
              <Bell size={18} color={notifOpen ? T.cyan : T.sub} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 3, right: 3, minWidth: 17, height: 17, borderRadius: 999, background: T.red, color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: `0 0 0 2px ${T.surface}` }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360, maxHeight: 460, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: '0 12px 48px rgba(0,0,0,0.7)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 200 }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>Notifications</span>
                    {unreadCount > 0 && <span style={{ marginLeft: 8, padding: '1px 7px', borderRadius: 999, background: `${T.red}25`, color: T.red, fontSize: 11, fontWeight: 700 }}>{unreadCount} new</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={loadNotifications} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 4 }}>
                      <RefreshCw size={13} />
                    </button>
                    {notifications.some(n => !n.is_read) && (
                      <button onClick={markNotificationsRead} style={{ fontSize: 11, color: T.cyan, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 4px' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {notifLoading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                      <RefreshCw size={22} color={T.cyan} style={{ animation: 'spin 1s linear infinite' }} />
                      <div style={{ color: T.muted, fontSize: 12, marginTop: 8 }}>Loading…</div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                      <Bell size={30} color={T.muted} style={{ margin: '0 auto 10px', display: 'block' }} />
                      <div style={{ color: T.muted, fontSize: 13, fontWeight: 500 }}>No notifications yet</div>
                      <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>You'll see alerts here when doctors register or actions occur</div>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={n.id || i} style={{ padding: '12px 18px', borderBottom: i < notifications.length - 1 ? `1px solid ${T.border}` : 'none', background: n.is_read ? 'transparent' : `${T.cyan}08` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? T.muted : T.cyan, marginTop: 5, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{n.message}</div>
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{n.time}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 28, width: 1, background: T.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {profileImage
              ? <img src={profileImage} alt="Admin" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.cyan}` }} />
              : <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${T.cyan}, #0055aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>A</div>
            }
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{user.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{user.role}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── SIDEBAR ── */}
      <aside style={{ position: 'fixed', left: 0, top: 60, bottom: 0, width: sidebarOpen ? 240 : 0, overflow: 'hidden', background: T.surface, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', zIndex: 40 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = activeMenu === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveMenu(item.id); setSearchQuery(''); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, border: 'none', borderLeft: `3px solid ${active ? T.cyan : 'transparent'}`, background: active ? T.cyanDim : 'transparent', color: active ? T.cyan : T.sub, cursor: 'pointer', marginBottom: 3, transition: 'all 0.15s', fontFamily: 'inherit' }}>
                <Icon size={18} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, padding: '8px 10px' }}>
          <div style={{ position: 'relative' }}>
            {profileMenuOpen && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 -8px 32px rgba(0,0,0,0.5)` }}>
                <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{user.email}</div>
                </div>
                <button onClick={() => { profileInputRef.current?.click(); setProfileMenuOpen(false); }} style={popBtn}><Upload size={15} color={T.sub} /> Change Photo</button>
                <button onClick={() => { setActiveMenu('settings'); setProfileMenuOpen(false); }} style={popBtn}><Settings size={15} color={T.sub} /> Settings</button>
                <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
                <button onClick={() => setLogoutModal(true)} style={{ ...popBtn, color: T.red }}><LogOut size={15} color={T.red} /> Log out</button>
              </div>
            )}
            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: 'none', background: profileMenuOpen ? T.cyanDim : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              {profileImage
                ? <img src={profileImage} alt="Profile" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.cyan}`, flexShrink: 0 }} />
                : <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${T.cyan}, #0055aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>A</div>
              }
              <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{user.role}</div>
              </div>
              <ChevronUp size={15} color={T.muted} style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>
            <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileUpload} style={{ display: 'none' }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ marginLeft: sidebarOpen ? 240 : 0, marginTop: 60, minHeight: 'calc(100vh - 60px)', transition: 'margin-left 0.25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: 24 }}>{renderContent()}</div>
        <footer style={{ borderTop: `1px solid ${T.border}`, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, background: T.surface }}>
          {['Privacy Policy', 'Terms of Service'].map(label => (
            <button key={label} onClick={() => navigate(`/${label.toLowerCase().replace(/ /g, '-')}`)}
              style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 12, padding: 0 }}
              onMouseEnter={e => e.target.style.color = T.cyan} onMouseLeave={e => e.target.style.color = T.muted}>
              {label}
            </button>
          ))}
          <span style={{ fontSize: 12, color: T.muted }}>© 2026 MediAI</span>
        </footer>
      </main>

      {/* ── TOAST ── */}
      {saveMessage && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: T.card, border: `1px solid ${saveMessage.startsWith('❌') ? T.red + '50' : T.green + '50'}`, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.6)', animation: 'slideUp 0.3s ease' }}>
          {saveMessage.startsWith('❌') ? <XCircle size={16} color={T.red} /> : <CheckCircle size={16} color={T.green} />}
          <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{saveMessage}</span>
        </div>
      )}

      {/* Logout Modal */}
      {logoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, maxWidth: 380, width: '100%', margin: 16 }}>
            <div style={{ borderBottom: `1px solid ${T.border}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Confirm Logout</span>
              <button onClick={() => setLogoutModal(false)} style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: T.sub, marginBottom: 22, fontSize: 14 }}>Are you sure you want to logout from your account?</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={logout} style={{ flex: 1, padding: '11px 0', background: T.red, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Yes, Logout</button>
                <button onClick={() => setLogoutModal(false)} style={{ flex: 1, padding: '11px 0', background: 'none', color: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,153,204,0.3); border-radius: 999px; }
        select option { background: #1a2235; color: #f1f5f9; }
      `}</style>
    </div>
  );
};

const aBtn = (color) => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${color}40`, background: `${color}15`, color, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' });
const popBtn = { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' };
const labelStyle = { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };

export default AdminDashboard;
