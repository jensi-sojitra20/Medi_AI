import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users,
  UserCheck,
  Bot,
  Database,
  BarChart3,
  Lock,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Leaf,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'doctors', label: 'Doctor Management', icon: UserCheck },
    { id: 'patients', label: 'Patient Management', icon: Users },
    { id: 'ai', label: 'AI System', icon: Bot },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'security', label: 'Security & Access', icon: Lock },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  // Dummy Data
  const dashboardData = {
    stats: [
      { label: 'Total Patients', value: '2,456', trend: '+12.5%', icon: Users },
      { label: 'Active Doctors', value: '342', trend: '+8.2%', icon: UserCheck },
      { label: 'Subscriptions', value: '1,856', trend: '+9.6%', icon: TrendingUp },
      { label: 'AI Accuracy', value: '94.2%', trend: '+2.1%', icon: Activity },
    ],
    subscriptionGrowth: [
      { month: 'Jan', value: 400, users: 240 },
      { month: 'Feb', value: 520, users: 300 },
      { month: 'Mar', value: 680, users: 420 },
      { month: 'Apr', value: 780, users: 520 },
      { month: 'May', value: 890, users: 650 },
      { month: 'Jun', value: 1200, users: 856 },
    ],
    userDistribution: [
      { name: 'Patients', value: 65, color: '#7C3AED' },
      { name: 'Doctors', value: 25, color: '#A78BFA' },
      { name: 'Admins', value: 10, color: '#E9D5FF' },
    ],
    doctors: [
      { id: 1, name: 'Dr. Sarah Johnson', status: 'Verified', aiAccess: true },
      { id: 2, name: 'Dr. Michael Chen', status: 'Pending', aiAccess: false },
      { id: 3, name: 'Dr. Emma Wilson', status: 'Verified', aiAccess: true },
    ],
    patients: [
      { id: 1, name: 'John Doe', subscription: 'Active', lastVisit: '2 days ago' },
      { id: 2, name: 'Jane Smith', subscription: 'Expired', lastVisit: '20 days ago' },
      { id: 3, name: 'Robert Johnson', subscription: 'Active', lastVisit: '1 day ago' },
    ]
  };

  // Components
  const StatCard = ({ label, value, trend, Icon }) => (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition-all"
      style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          <p className="text-green-600 text-sm mt-2">↑ {trend}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
          <Icon className="w-6 h-6 text-purple-700" />
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} Icon={stat.icon} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Growth */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-purple-100"
          style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.subscriptionGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED' }} name="Revenue ($K)" />
              <Line type="monotone" dataKey="users" stroke="#A78BFA" strokeWidth={2} dot={{ fill: '#A78BFA' }} name="Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI Usage Per Day */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
          style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">AI Usage/Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.subscriptionGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#7C3AED" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Distribution */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100 max-w-md mx-auto"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">User Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dashboardData.userDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {dashboardData.userDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4">
          {dashboardData.userDistribution.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DoctorManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Doctor List</h3>
          <div className="flex gap-2">
            {['Pending', 'Verified', 'Blocked'].map((status) => (
              <button key={status} className="px-4 py-2 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 transition">
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {dashboardData.doctors.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border border-purple-100 rounded-xl hover:bg-purple-50 transition">
              <div>
                <p className="font-semibold text-gray-900">{doc.name}</p>
                <p className="text-sm text-gray-600">Status: {doc.status}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">Approve</button>
                <button className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PatientManagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6 mb-6">
        {[
          { label: 'Active', value: '1,856', color: 'from-green-500 to-green-600' },
          { label: 'Expired', value: '234', color: 'from-red-500 to-red-600' },
          { label: 'Trial', value: '145', color: 'from-blue-500 to-blue-600' },
        ].map((card, idx) => (
          <div key={idx} className={`bg-gradient-to-r ${card.color} rounded-2xl p-6 text-white shadow-lg`}>
            <p className="text-sm opacity-90">{card.label}</p>
            <h3 className="text-3xl font-bold">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-6">Patient List</h3>
        <div className="space-y-3">
          {dashboardData.patients.map((patient) => (
            <div key={patient.id} className="flex items-center justify-between p-4 border border-purple-100 rounded-xl hover:bg-purple-50 transition">
              <div>
                <p className="font-semibold text-gray-900">{patient.name}</p>
                <p className="text-sm text-gray-600">Last visit: {patient.lastVisit}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${patient.subscription === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {patient.subscription}
                </span>
                <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition">View</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AISystem = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6 mb-6">
        {[
          { label: 'Model Version', value: 'v3.2.1' },
          { label: 'Accuracy', value: '94.2%' },
          { label: 'Data Drift', value: '2.1%' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
            style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
            <p className="text-gray-600 text-sm">{card.label}</p>
            <h3 className="text-3xl font-bold text-purple-700 mt-2">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Model Accuracy Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dashboardData.subscriptionGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2} name="Accuracy %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4">
        <button className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold">
          Upload Dataset
        </button>
        <button className="flex-1 px-6 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition font-semibold">
          Retrain Model
        </button>
      </div>
    </div>
  );

  const DataManagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
          style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
          <p className="text-gray-600 text-sm mb-4">Storage Used</p>
          <h3 className="text-3xl font-bold text-purple-700 mb-4">45.2 GB / 100 GB</h3>
          <div className="w-full bg-purple-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-3 rounded-full" style={{ width: '45.2%' }}></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
          style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
          <p className="text-gray-600 text-sm mb-4">Encryption Status</p>
          <h3 className="text-3xl font-bold text-green-600">Enabled</h3>
          <p className="text-sm text-gray-600 mt-4">AES-256 Encryption Active</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
          Backup Database
        </button>
        <button className="flex-1 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition font-semibold">
          Restore Database
        </button>
      </div>
    </div>
  );

  const ReportsAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dashboardData.subscriptionGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="value" fill="#7C3AED" stroke="#7C3AED" opacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">AI Usage by Role</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardData.subscriptionGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }} />
            <Bar dataKey="users" fill="#7C3AED" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const SecurityAccess = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-6">Role Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-200">
                <th className="text-left p-3 text-gray-700 font-semibold">Permission</th>
                <th className="text-center p-3 text-gray-700 font-semibold">Admin</th>
                <th className="text-center p-3 text-gray-700 font-semibold">Doctor</th>
                <th className="text-center p-3 text-gray-700 font-semibold">Patient</th>
              </tr>
            </thead>
            <tbody>
              {['View Analytics', 'Manage Users', 'Access AI', 'View Reports'].map((perm, idx) => (
                <tr key={idx} className="border-b border-purple-100">
                  <td className="p-3 text-gray-700">{perm}</td>
                  <td className="text-center p-3">✅</td>
                  <td className="text-center p-3">✅</td>
                  <td className="text-center p-3">❌</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-6">Security Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
            <span className="text-gray-700 font-medium">Encryption</span>
            <span className="text-green-600 font-semibold">Enabled ✓</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
            <span className="text-gray-700 font-medium">Audit Logs</span>
            <span className="text-green-600 font-semibold">Active ✓</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
            <span className="text-gray-700 font-medium">2FA Authentication</span>
            <span className="text-green-600 font-semibold">Active ✓</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100"
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-6">System Configuration</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
              <option>Light Purple</option>
              <option>Dark Purple</option>
              <option>Blue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
              <option>UTC</option>
              <option>EST</option>
              <option>PST</option>
            </select>
          </div>

          <div className="space-y-3 pt-4 border-t border-purple-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-gray-700">Email Notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-gray-700">Weekly Reports</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-gray-700">Alert on Anomalies</span>
            </label>
          </div>

          <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold mt-6">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'doctors':
        return <DoctorManagement />;
      case 'patients':
        return <PatientManagement />;
      case 'ai':
        return <AISystem />;
      case 'data':
        return <DataManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'security':
        return <SecurityAccess />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    return menuItems.find(item => item.id === activeMenu)?.label || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-purple-200 h-16">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-purple-100 rounded-lg">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-bold text-gray-900">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-purple-100 rounded-lg relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-purple-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">System Admin</p>
                <p className="text-xs text-gray-500">Last login: 2h ago</p>
              </div>
              <button className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                SA
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-purple-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-purple-200 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Medi AI</h1>
              <p className="text-xs text-purple-600">Admin Panel</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeMenu === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Profile & Logout */}
          <div className="p-4 border-t border-purple-200 space-y-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-900">System Admin</p>
              <p className="text-xs text-gray-600">admin@mediclick.ai</p>
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition font-medium">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-0'} mt-16 transition-all duration-300`}>
        <div className="p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="bg-white/50 border-t border-purple-200 py-6 px-6 text-center text-gray-600 text-sm">
          <p>MediAI – Personalized Medicine AI Platform v2.0</p>
          <p className="mt-1">© 2026 All rights reserved | Last login: 2 hours ago</p>
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;
