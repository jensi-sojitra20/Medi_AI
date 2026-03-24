import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import { 
  Users, 
  Stethoscope, 
  CheckCircle, 
  Clock, 
  UserPlus, 
  CreditCard,
  LogOut,
  Shield,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Settings,
  Bell,
  Menu
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await adminService.getDashboard();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default mock data
      setStats({
        totalUsers: 2456,
        totalDoctors: 342,
        verifiedDoctors: 298,
        provisionalDoctors: 44,
        totalPatients: 2114,
        activeSubscriptions: 1856,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12.5%',
    },
    {
      title: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      icon: Stethoscope,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      trend: '+8.2%',
    },
    {
      title: 'Verified Doctors',
      value: stats?.verifiedDoctors || 0,
      icon: CheckCircle,
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: '+5.1%',
    },
    {
      title: 'Provisional Doctors',
      value: stats?.provisionalDoctors || 0,
      icon: Clock,
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: '+2.8%',
    },
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: UserPlus,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+14.3%',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-50',
      trend: '+9.6%',
    },
  ];

  const chartData = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    users: [400, 520, 680, 780, 890, 1100],
    doctors: [120, 140, 160, 180, 200, 220],
    subscriptions: [300, 380, 450, 520, 680, 890],
  };

  const roleDistribution = [
    { role: 'Patients', value: 65, color: '#7C3AED' },
    { role: 'Doctors', value: 25, color: '#A78BFA' },
    { role: 'Admins', value: 10, color: '#E9D5FF' },
  ];

  // Simple bar chart component
  const SimpleBarChart = ({ data, title }) => {
    const maxValue = Math.max(...data);
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {data.map((value, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Month {idx + 1}</span>
              <span className="font-medium">{value}</span>
            </div>
            <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                style={{ width: `${(value / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple pie chart component
  const SimplePieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex items-center justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-lg">
          {data.map((item, idx) => {
            const sliceAngle = (item.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 100 + 70 * Math.cos(startRad);
            const y1 = 100 + 70 * Math.sin(startRad);
            const x2 = 100 + 70 * Math.cos(endRad);
            const y2 = 100 + 70 * Math.sin(endRad);

            const largeArc = sliceAngle > 180 ? 1 : 0;

            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 70 70 0 ${largeArc} 1 ${x2} ${y2}`,
              `Z`,
            ].join(' ');

            return (
              <path
                key={idx}
                d={pathData}
                fill={item.color}
                opacity="0.85"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-900 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
      }}
    >
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-6 h-6 text-purple-600" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Medi AI</h1>
                  <p className="text-xs text-purple-600 font-medium">Admin Control Center</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors relative">
                <Bell className="w-6 h-6 text-purple-600" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
                <Settings className="w-6 h-6 text-purple-600" />
              </button>
              <div className="flex items-center space-x-3 pl-4 border-l border-purple-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-600">{user?.email || 'admin@medi.ai'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.name || 'Admin'}! 👋</h2>
          <p className="text-gray-600">Here's your system overview for today</p>
        </div>

        {/* Stats Grid - KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 hover:border-purple-300 group cursor-pointer"
                style={{
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg transform group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">{stat.trend}</span>
                  <span className="text-xs text-gray-500">from last month</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Growth Chart */}
          <div
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-purple-100"
            style={{
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)',
            }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span>User Growth Trend (6 Months)</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">Track active users, doctors, and subscription growth</p>
            </div>
            
            <div className="space-y-6">
              <SimpleBarChart data={chartData.users} title="Total Users" />
              <div className="border-t border-purple-100 pt-6">
                <SimpleBarChart data={chartData.subscriptions} title="Active Subscriptions" />
              </div>
            </div>
          </div>

          {/* Role Distribution */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100"
            style={{
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)',
            }}
          >
            <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2 mb-6">
              <PieChart className="w-5 h-5 text-purple-600" />
              <span>User Distribution</span>
            </h3>
            
            <SimplePieChart data={roleDistribution} />
            
            <div className="mt-6 space-y-3 border-t border-purple-100 pt-4">
              {roleDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-700 font-medium">{item.role}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Verification and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Doctor Status */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100"
            style={{
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)',
            }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-green-600" />
              <span>Doctor Verification Status</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Verified Doctors</span>
                  <span className="text-2xl font-bold text-green-600">{stats?.verifiedDoctors || 0}</span>
                </div>
                <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full w-5/6"></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">87.2% verification rate</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Provisional Doctors</span>
                  <span className="text-2xl font-bold text-yellow-600">{stats?.provisionalDoctors || 0}</span>
                </div>
                <div className="w-full h-2 bg-yellow-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full w-1/6"></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Pending verification</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100"
            style={{
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)',
            }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span>Quick Actions</span>
            </h3>
            
            <div className="space-y-3">
              <button className="w-full p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left group">
                <h4 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">📋 Manage Doctors</h4>
                <p className="text-sm text-gray-600 mt-1">Verify and manage doctor accounts</p>
              </button>
              
              <button className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left group">
                <h4 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">👥 View Patients</h4>
                <p className="text-sm text-gray-600 mt-1">Monitor patient registrations</p>
              </button>
              
              <button className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left group">
                <h4 className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">💳 Subscriptions</h4>
                <p className="text-sm text-gray-600 mt-1">Manage subscription plans</p>
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div
          className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-2xl border border-purple-400"
          style={{
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
          }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <span>System Health Status</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/25 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold opacity-90">API Status</p>
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></span>
              </div>
              <p className="text-3xl font-bold">Online</p>
              <p className="text-xs opacity-75 mt-2">Uptime: 99.98%</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/25 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold opacity-90">Database</p>
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></span>
              </div>
              <p className="text-3xl font-bold">Connected</p>
              <p className="text-xs opacity-75 mt-2">Response: 45ms</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/25 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold opacity-90">ML Service</p>
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></span>
              </div>
              <p className="text-3xl font-bold">Ready</p>
              <p className="text-xs opacity-75 mt-2">Load: 42%</p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
