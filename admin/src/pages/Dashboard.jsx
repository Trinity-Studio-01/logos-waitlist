import { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, downloadCSV } from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, thisMonth: 0 });
  const [recentSignups, setRecentSignups] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { signups } = await api.getAllSignups();

      calculateStats(signups);
      setRecentSignups(signups.slice(0, 5));
      generateChartData(signups);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const todayCount = data.filter(s => new Date(s.created_at) >= today).length;
    const weekCount = data.filter(s => new Date(s.created_at) >= weekAgo).length;
    const monthCount = data.filter(s => new Date(s.created_at) >= monthAgo).length;

    setStats({
      total: data.length,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount
    });
  };

  const generateChartData = (signups) => {
    const last7Days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const count = signups.filter(s => {
        const signupDate = new Date(s.created_at).toISOString().split('T')[0];
        return signupDate === dateStr;
      }).length;

      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        signups: count
      });
    }

    setChartData(last7Days);
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportToCSV();
      downloadCSV(blob, `waitlist-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your waitlist performance</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="text-primary" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Total Signups</p>
          <p className="text-4xl font-semibold text-primary">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Calendar className="text-success" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">This Month</p>
          <p className="text-4xl font-semibold text-success">{stats.thisMonth}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <TrendingUp className="text-accent" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">This Week</p>
          <p className="text-4xl font-semibold text-accent">{stats.thisWeek}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Today</p>
          <p className="text-4xl font-semibold text-orange-600">{stats.today}</p>
        </div>
      </div>

      {/* Chart and Recent Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary mb-6">Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" stroke="#525252" />
              <YAxis stroke="#525252" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="signups"
                stroke="#000000"
                strokeWidth={2}
                dot={{ fill: '#000000', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Signups */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary mb-6">Recent Signups</h3>
          <div className="space-y-4">
            {recentSignups.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No signups yet</p>
            ) : (
              recentSignups.map((signup) => (
                <div key={signup.id} className="pb-4 border-b border-gray-100 last:border-0">
                  <p className="font-medium text-primary text-sm">{signup.name}</p>
                  <p className="text-gray-600 text-xs mt-1">{signup.email}</p>
                  <p className="text-gray-400 text-xs mt-1">{formatDate(signup.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
