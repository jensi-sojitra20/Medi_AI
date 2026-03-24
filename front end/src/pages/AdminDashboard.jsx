import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, Settings,
  LogOut, Bell, Menu, X, Upload, Shield,
  TrendingUp, Activity,
  CheckCircle, XCircle, Clock, Search,
  RefreshCw, AlertCircle, Eye, Ban, ChevronUp,
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
  borderHov: 'rgba(0,153,204,0.3)',
  cyan: '#0099cc',
  cyanDim: 'rgba(0,153,204,0.12)',
  cyanGlow: 'rgba(0,153,204,0.25)',
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

  const [themeConfig, setThemeConfig] = useState(() => {
    const s = localStorage.getItem('adminThemeConfig');
    return s ? JSON.parse(s) : { language: 'English', timezone: 'IST', emailNotifications: true, weeklyReports: true, alertAnomalies: false };
  });

  const [user, setUser] = useState({ name: 'System Admin', email: 'admin@medi.ai', role: 'Super Admin', lastLogin: new Date().toLocaleString() });

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

  const loadAdminProfile = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/profile');
      setUser(u => ({
        ...u,
        name:  data.name  || u.name,
        email: data.email || u.email,
        role:  data.role  || u.role,
      }));
      if (data.profile_image) {
        setProfileImage(`${BASE}/${data.profile_image.replace(/\\/g, '/')}`);
      }
    } catch (err) {
      console.warn('Admin profile load failed:', err.message);
    }
  }, []); // eslint-disable-line

  // ── Real Data State ────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalPatients: 0, activeDoctors: 0, subscriptions: 0, aiAccuracy: 94.2,
    verifiedDoctors: 0, provisionalDoctors: 0,
    activeSubscriptions: 0, expiredSubscriptions: 0, trialSubscriptions: 0,
    totalPredictions: 0, totalPrescriptions: 0,
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const d = await apiFetch('/admin/dashboard');
      const s = d.stats || {};
      setStats({
        totalPatients: s.totalPatients || 0,
        activeDoctors: s.verifiedDoctors || 0,
        subscriptions: s.payingPatients || 0,
        aiAccuracy: 94.2,
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

  const loadDoctors = useCallback(async () => {
    try {
      const d = await apiFetch('/admin/doctors');
      setDoctors((d.doctors || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        status: doc.is_blocked ? 'blocked' : doc.status,
        specialty: doc.specialization || '—',
        hospital: doc.hospital || '—',
        license: doc.license || '—',
        experience: doc.experience || 0,
        phone: doc.phone || '—',
        qualification: doc.qualification || '—',
        patients: 0,
        aiUsage: 0,
        registered_at: doc.registered_at,
        id_proof: doc.id_proof || null,
        id_proof_url: doc.id_proof_url ? `http://localhost:8000${doc.id_proof_url}` : null,
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
          id: p.id,
          name: p.name,
          email: p.email,
          age: p.age || '—',
          gender: p.gender || '—',
          phone: p.phone || '—',
          blood_group: p.blood_group || '—',
          subscription: status,
          plan: sub.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : '—',
          is_blocked: p.is_blocked,
          registered_at: p.registered_at,
        };
      }));
    } catch (err) { console.warn('Patients load failed:', err.message); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDataLoading(true);
    Promise.all([loadStats(), loadDoctors(), loadPatients(), loadAdminProfile()])
      .finally(() => setDataLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (activeMenu === 'dashboard') loadStats();
    if (activeMenu === 'doctors') { loadDoctors(); loadStats(); }
    if (activeMenu === 'patients') { loadPatients(); loadStats(); }
  }, [activeMenu]); // eslint-disable-line

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const subscriptionGrowth = [
    { month: 'Aug', subs: 400, revenue: 24000 }, { month: 'Sep', subs: 520, revenue: 31200 },
    { month: 'Oct', subs: 680, revenue: 40800 }, { month: 'Nov', subs: 780, revenue: 46800 },
    { month: 'Dec', subs: 890, revenue: 53400 }, { month: 'Jan', subs: 1200, revenue: 72000 },
  ];
  const aiUsageData = [
    { day: 'Mon', usage: 45 }, { day: 'Tue', usage: 52 }, { day: 'Wed', usage: 48 },
    { day: 'Thu', usage: 61 }, { day: 'Fri', usage: 55 }, { day: 'Sat', usage: 42 }, { day: 'Sun', usage: 38 },
  ];
  const accuracyTrend = [
    { month: 'Aug', acc: 89.5 }, { month: 'Sep', acc: 91.2 }, { month: 'Oct', acc: 92.8 },
    { month: 'Nov', acc: 93.5 }, { month: 'Dec', acc: 93.9 }, { month: 'Jan', acc: 94.2 },
  ];
  const userDist = [
    { name: 'Patients', value: 65, color: T.cyan },
    { name: 'Doctors', value: 25, color: T.purple },
    { name: 'Admins', value: 10, color: T.green },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg) => { setSaveMessage(msg); setTimeout(() => setSaveMessage(''), 3000); };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/jpg','image/webp'].includes(file.type)) {
      showToast('❌ Only JPG, PNG, or WebP images allowed');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetchForm('/admin/profile/picture', formData);
      setProfileImage(`${BASE}/${(res.profile_image || '').replace(/\\/g, '/')}`);
      showToast('✅ Profile picture saved to server!');
    } catch (err) {
      showToast(`❌ Upload failed: ${err.message}`);
    }
  };

  const handleSettingChange = (key, value) => {
    const nc = { ...themeConfig, [key]: value };
    setThemeConfig(nc); localStorage.setItem('adminThemeConfig', JSON.stringify(nc)); showToast('Settings saved');
  };

  const handleDoctorAction = async (id, action) => {
    try {
      if (action === 'approve') await apiFetch(`/admin/doctors/${id}/verify`, { method: 'PUT' });
      else if (action === 'reject') await apiFetch(`/admin/doctors/${id}/reject`, { method: 'PUT' });
      else if (action === 'block') await apiFetch(`/admin/doctors/${id}/block`, { method: 'PUT' });
      else if (action === 'unblock') await apiFetch(`/admin/doctors/${id}/unblock`, { method: 'PUT' });
      showToast(`Doctor ${action}d successfully`);
      await loadDoctors();
      await loadStats();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const filteredDoctors = doctors.filter(d => (doctorFilter === 'all' || d.status === doctorFilter) && (d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.email.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredPatients = patients.filter(p => (patientFilter === 'all' || p.subscription.toLowerCase() === patientFilter) && (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase())));

  // ── Menu Items (4 items only) ──────────────────────────────────────────────
  const menuItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'doctors', label: 'Doctor Management', icon: UserCheck },
    { id: 'patients', label: 'Patient Management', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  // ── Reusable Components ────────────────────────────────────────────────────
  const Card = ({ children, style = {}, className = '' }) => (
    <div className={className} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, ...style }}>{children}</div>
  );

  const StatCard = ({ label, value, trend, icon: Icon, accent }) => (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: accent, opacity: 0.08 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={accent} />
        </div>
        {trend && <span style={{ fontSize: 12, color: T.green, display: 'flex', alignItems: 'center', gap: 3 }}>
          <TrendingUp size={12} />{trend}
        </span>}
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

  const tooltipStyle = { backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 };

  // ── Page Renders ───────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Total Patients" value={stats.totalPatients.toLocaleString()} trend="+12.5%" icon={Users} accent={T.cyan} />
        <StatCard label="Active Doctors" value={stats.activeDoctors} trend="+8.2%" icon={UserCheck} accent={T.green} />
        <StatCard label="Subscriptions" value={stats.subscriptions.toLocaleString()} trend="+9.6%" icon={Activity} accent={T.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <SectionCard title="📈 Subscription & Revenue Growth">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={subscriptionGrowth}>
              <defs>
                <linearGradient id="gSubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.cyan} stopOpacity={0.3} /><stop offset="95%" stopColor={T.cyan} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.purple} stopOpacity={0.3} /><stop offset="95%" stopColor={T.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" stroke={T.muted} fontSize={12} />
              <YAxis stroke={T.muted} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: T.sub, fontSize: 12 }} />
              <Area type="monotone" dataKey="subs" stroke={T.cyan} fill="url(#gSubs)" strokeWidth={2} name="Subscriptions" />
              <Area type="monotone" dataKey="revenue" stroke={T.purple} fill="url(#gRev)" strokeWidth={2} name="Revenue ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="🤖 AI Usage / Day">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={aiUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" stroke={T.muted} fontSize={12} />
              <YAxis stroke={T.muted} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="usage" fill={T.cyan} radius={[6, 6, 0, 0]} name="Queries" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="👥 User Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={userDist} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {userDist.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="🎯 AI Model Accuracy Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={accuracyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" stroke={T.muted} fontSize={12} />
              <YAxis domain={[85, 100]} stroke={T.muted} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="acc" stroke={T.green} strokeWidth={3} dot={{ fill: T.green, r: 4 }} name="Accuracy %" />
            </LineChart>
          </ResponsiveContainer>
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

      {/* ── Doctor Assignment Utility ── */}
      <Card style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(0,153,204,0.06))', border: `1px solid ${T.green}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${T.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={22} color={T.green} />
            </div>
            <div>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>Auto-Assign Doctors to Patient Reports</div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>
                Assigns verified doctors to all unassigned AI recommendations based on specialization matching.
                Run this once after verifying new doctors.
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${BASE}/doctor/assign-all-unassigned`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                });
                const data = await res.json();
                showToast(`✅ ${data.message}`);
                loadStats();
              } catch (err) {
                showToast(`❌ Assignment failed: ${err.message}`);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: `linear-gradient(135deg, ${T.green}, #059669)`,
              color: '#fff', border: 'none', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 4px 14px ${T.green}40`,
            }}
          >
            <RefreshCw size={15} /> Run Backfill Assignment
          </button>
        </div>
      </Card>
    </div>
  );

  const renderDoctorManagement = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search doctors…"
              style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
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

      {filteredDoctors.map(doc => (
        <Card key={doc.id} style={{ transition: 'border-color 0.2s' }} className="doctor-card">
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{doc.patients}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Patients</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.cyan }}>{doc.aiUsage}%</div>
                <div style={{ fontSize: 11, color: T.muted }}>AI Usage</div>
              </div>
              <Badge status={doc.status} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {doc.id_proof_url && (
                <a href={doc.id_proof_url} target="_blank" rel="noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:'rgba(0,153,204,0.12)', border:`1px solid ${T.border}`, color:T.cyan, fontSize:12, fontWeight:600, textDecoration:'none' }}>
                  <Eye size={13} /> ID Proof
                </a>
              )}
              {doc.status === 'pending' && <>
                <button onClick={() => handleDoctorAction(doc.id, 'approve')} style={actionBtn(T.green)}>
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => handleDoctorAction(doc.id, 'reject')} style={actionBtn(T.red)}>
                  <XCircle size={14} /> Reject
                </button>
              </>}
              {doc.status === 'rejected' && (
                <button onClick={() => handleDoctorAction(doc.id, 'approve')} style={actionBtn(T.green)}>
                  <CheckCircle size={14} /> Re-Approve
                </button>
              )}
              {doc.status === 'verified' && (
                <button onClick={() => handleDoctorAction(doc.id, 'block')} style={actionBtn(T.muted)}>
                  <Ban size={14} /> Block
                </button>
              )}
              {doc.status === 'blocked' && (
                <button onClick={() => handleDoctorAction(doc.id, 'unblock')} style={actionBtn(T.green)}>
                  <CheckCircle size={14} /> Unblock
                </button>
              )}
            </div>
          </div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginTop:14, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
            {[
              { label:'Hospital',      value: doc.hospital },
              { label:'License',       value: doc.license },
              { label:'Qualification', value: doc.qualification },
              { label:'Experience',    value: doc.experience ? `${doc.experience} yrs` : '—' },
              { label:'Phone',         value: doc.phone },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize:10, color:T.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                <div style={{ fontSize:13, color:T.text, marginTop:2 }}>{value}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderPatientManagement = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Active Subscriptions', value: stats.activeSubscriptions.toLocaleString(), color: T.green, sub: 'Premium + Basic' },
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
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search patients…"
              style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
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
                  showToast(`Plan granted to ${p.name}`);
                  await loadPatients(); await loadStats();
                } catch (err) { showToast(`Error: ${err.message}`); }
              }} style={actionBtn(T.cyan)}><Eye size={14} /> Grant Plan</button>
            </div>
          </div>
        </Card>
      ))}

      <SectionCard title="Subscription Distribution">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={[
              { name: 'Active', value: stats.activeSubscriptions, color: T.green },
              { name: 'Expired', value: stats.expiredSubscriptions, color: T.red },
              { name: 'Trial', value: stats.trialSubscriptions, color: T.cyan },
            ]} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
              {[T.green, T.red, T.cyan].map((c, i) => <Cell key={i} fill={c} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: T.sub, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );

  const renderSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Admin Profile */}
      <SectionCard title="👤 Admin Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profileImage
              ? <img src={profileImage} alt="Admin" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${T.cyan}` }} />
              : <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${T.cyan}, #0055aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28 }}>A</div>
            }
            <button
              onClick={() => profileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: T.cyan, border: `2px solid ${T.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={12} color="#fff" />
            </button>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{user.name}</div>
            <div style={{ fontSize: 13, color: T.muted }}>{user.email}</div>
            <div style={{ fontSize: 12, color: T.cyan, marginTop: 4, fontWeight: 600 }}>{user.role}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name</label>
              <input
                type="text"
                value={user.name}
                onChange={e => setUser(u => ({ ...u, name: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = T.cyan}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
              <input
                type="email"
                value={user.email}
                onChange={e => setUser(u => ({ ...u, email: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = T.cyan}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={async () => {
                setProfileSaving(true);
                try {
                  await apiFetch('/admin/profile', {
                    method: 'PUT',
                    body: JSON.stringify({ name: user.name, email: user.email }),
                  });
                  showToast('✅ Profile saved successfully!');
                } catch (err) {
                  showToast(`❌ Save failed: ${err.message}`);
                } finally {
                  setProfileSaving(false);
                }
              }}
              disabled={profileSaving}
              style={{ padding: '10px 28px', background: profileSaving ? T.muted : T.cyan, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: profileSaving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
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
              <label style={{ display: 'block', fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</label>
              <select value={themeConfig[s.key]} onChange={e => handleSettingChange(s.key, e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, outline: 'none' }}>
                {s.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, color: T.sub, marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notification Preferences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive alerts via email' },
              { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Get weekly summary reports' },
              { key: 'alertAnomalies', label: 'Alert on Anomalies', desc: 'Notify when unusual activity detected' },
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{item.desc}</div>
                </div>
                <div onClick={() => handleSettingChange(item.key, !themeConfig[item.key])}
                  style={{ width: 48, height: 26, borderRadius: 13, background: themeConfig[item.key] ? T.cyan : T.card, border: `1px solid ${themeConfig[item.key] ? T.cyan : T.border}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: themeConfig[item.key] ? 24 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                </div>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard title="🔑 Change Password">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {['Current Password', 'New Password', 'Confirm New Password'].map((label, i) => (
            <div key={i}>
              <label style={{ display: 'block', fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
              <input
                type="password"
                placeholder={`Enter ${label.toLowerCase()}`}
                style={{ width: '100%', padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = T.cyan}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => showToast('✅ Password updated successfully!')}
              style={{ padding: '10px 28px', background: T.green, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Update Password
            </button>
          </div>
        </div>
      </SectionCard>

      {saveMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: `${T.green}12`, border: `1px solid ${T.green}40`, borderRadius: 12 }}>
          <CheckCircle size={18} color={T.green} />
          <span style={{ color: T.green, fontWeight: 600 }}>{saveMessage}</span>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (dataLoading && ['dashboard', 'doctors', 'patients'].includes(activeMenu)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
          <RefreshCw size={36} color={T.cyan} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: T.sub, fontSize: 14 }}>Loading real data from backend...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
            <span className="text-1xl font-bold text-white">
              Medi<span className="text-brand-blue">AI</span>
            </span>
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{pageTitle}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ position: 'relative', padding: 8, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Bell size={18} color={T.sub} />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: T.red }} />
          </button>
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
              <button key={item.id} onClick={() => setActiveMenu(item.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: active ? T.cyanDim : 'transparent', color: active ? T.cyan : T.sub, cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s', borderLeft: `3px solid ${active ? T.cyan : 'transparent'}` }}>
                <Icon size={18} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Profile Section */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '8px 10px' }}>
          <div style={{ position: 'relative' }}>
            {profileMenuOpen && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 -8px 32px rgba(0,0,0,0.5)` }}>
                <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{user.email}</div>
                </div>
                <button onClick={() => { profileInputRef.current?.click(); setProfileMenuOpen(false); }} style={popupMenuBtn}>
                  <Upload size={15} color={T.sub} /> Change Photo
                </button>
                <button onClick={() => { setActiveMenu('settings'); setProfileMenuOpen(false); }} style={popupMenuBtn}>
                  <Settings size={15} color={T.sub} /> Settings
                </button>
                <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
                <button onClick={() => setLogoutModal(true)} style={{ ...popupMenuBtn, color: T.red }}>
                  <LogOut size={15} color={T.red} /> Log out
                </button>
              </div>
            )}

            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: 'none', background: profileMenuOpen ? T.cyanDim : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}>
              {profileImage
                ? <img src={profileImage} alt="Profile" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.cyan}`, flexShrink: 0 }} />
                : <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${T.cyan}, #0055aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>A</div>
              }
              <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.role}</div>
              </div>
              <ChevronUp size={15} color={T.muted} style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>
            <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileUpload} style={{ display: 'none' }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ marginLeft: sidebarOpen ? 240 : 0, marginTop: 60, minHeight: 'calc(100vh - 60px)', transition: 'margin-left 0.25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: 24 }}>
          {renderContent()}
        </div>

        <footer style={{ borderTop: `1px solid ${T.border}`, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12, background: T.surface }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.muted }}>
            <button onClick={() => navigate('/privacy-policy')} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 12, padding: 0, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = T.cyan} onMouseLeave={e => e.target.style.color = T.muted}>
              Privacy Policy
            </button>
            <button onClick={() => navigate('/terms-of-service')} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 12, padding: 0, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = T.cyan} onMouseLeave={e => e.target.style.color = T.muted}>
              Terms of Service
            </button>
            <span>© 2026 MediAI</span>
          </div>
        </footer>
      </main>

      {/* ── TOAST ── */}
      {saveMessage && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: T.card, border: `1px solid ${T.green}50`, borderRadius: 12, boxShadow: `0 4px 24px rgba(0,0,0,0.5)`, animation: 'slideUp 0.3s ease' }}>
          <CheckCircle size={16} color={T.green} />
          <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{saveMessage}</span>
        </div>
      )}

      {/* Logout Modal */}
      {logoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, maxWidth: 380, width: '100%' }}>
            <div style={{ borderBottom: `1px solid ${T.border}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Confirm Logout</span>
              <button onClick={() => setLogoutModal(false)} style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: T.sub, marginBottom: 22, fontSize: 14 }}>Are you sure you want to logout from your account?</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={logout} style={{ flex: 1, padding: '10px 0', background: T.red, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Yes, Logout</button>
                <button onClick={() => setLogoutModal(false)} style={{ flex: 1, padding: '10px 0', background: 'none', color: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,153,204,0.3); border-radius: 999px; }
        select option { background: #1a2235; color: #f1f5f9; }
      `}</style>
    </div>
  );
};

// ── Style Helpers ─────────────────────────────────────────────────────────────
const actionBtn = (color) => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 8, border: `1px solid ${color}40`,
  background: `${color}15`, color, fontSize: 13, fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.15s'
});

const popupMenuBtn = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 14px', background: 'none', border: 'none',
  color: '#94a3b8', fontSize: 13, cursor: 'pointer', textAlign: 'left',
  transition: 'background 0.15s'
};

export default AdminDashboard;