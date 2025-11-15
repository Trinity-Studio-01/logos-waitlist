import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, Calendar } from 'lucide-react';
import { api } from '../utils/api';

const Analytics = () => {
  const [signups, setSignups] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [churchData, setChurchData] = useState([]);
  const [growthRate, setGrowthRate] = useState(0);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#000000', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { signups: data } = await api.getAllSignups();
      setSignups(data);
      generateMonthlyData(data);
      generateChurchData(data);
      calculateGrowthRate(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (data) => {
    const monthsData = {};
    const now = new Date();

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthsData[monthKey] = 0;
    }

    // Count signups per month
    data.forEach(signup => {
      const date = new Date(signup.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthsData[monthKey] !== undefined) {
        monthsData[monthKey]++;
      }
    });

    const chartData = Object.keys(monthsData).map(month => ({
      month,
      signups: monthsData[month]
    }));

    setMonthlyData(chartData);
  };

  const generateChurchData = (data) => {
    const churches = {};

    data.forEach(signup => {
      const church = signup.church || 'No Church Specified';
      churches[church] = (churches[church] || 0) + 1;
    });

    const chartData = Object.keys(churches)
      .map(name => ({
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        value: churches[name]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    setChurchData(chartData);
  };

  const calculateGrowthRate = (data) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthCount = data.filter(s => new Date(s.created_at) >= thisMonth).length;
    const lastMonthCount = data.filter(s => {
      const date = new Date(s.created_at);
      return date >= lastMonth && date < thisMonth;
    }).length;

    if (lastMonthCount === 0) {
      setGrowthRate(thisMonthCount > 0 ? 100 : 0);
    } else {
      const rate = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
      setGrowthRate(Math.round(rate));
    }
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
      <div>
        <h1 className="text-3xl font-semibold text-primary">Analytics</h1>
        <p className="text-gray-600 mt-1">Insights and trends from your waitlist</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Signups</p>
              <p className="text-2xl font-semibold text-primary">{signups.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <TrendingUp className="text-success" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Growth Rate</p>
              <p className={`text-2xl font-semibold ${growthRate >= 0 ? 'text-success' : 'text-red-600'}`}>
                {growthRate >= 0 ? '+' : ''}{growthRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Calendar className="text-accent" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Avg. per Month</p>
              <p className="text-2xl font-semibold text-accent">
                {Math.round(signups.length / 6)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Signups Trend */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary mb-6">Monthly Signups Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#525252" />
              <YAxis stroke="#525252" />
              <Tooltip />
              <Legend />
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

        {/* Monthly Signups Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary mb-6">Monthly Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#525252" />
              <YAxis stroke="#525252" />
              <Tooltip />
              <Bar dataKey="signups" fill="#000000" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Church Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-primary mb-6">Top Churches</h3>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={churchData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {churchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 w-full">
              <div className="space-y-3">
                {churchData.map((church, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{church.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{church.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
