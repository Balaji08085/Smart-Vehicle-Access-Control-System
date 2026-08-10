import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, CheckCircle2, XCircle, Activity, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock chart data for now, ideally fetched from backend
const chartData = [
  { name: 'Mon', scans: 400 },
  { name: 'Tue', scans: 300 },
  { name: 'Wed', scans: 550 },
  { name: 'Thu', scans: 450 },
  { name: 'Fri', scans: 600 },
  { name: 'Sat', scans: 200 },
  { name: 'Sun', scans: 150 },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-24 p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Live statistics and overview of the Access Control System.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Users />} label="Total Users" value={stats?.totalUsers || 0} color="blue" />
          <StatCard icon={<Clock />} label="Pending Approvals" value={stats?.pendingApprovals || 0} color="amber" />
          <StatCard icon={<CheckCircle2 />} label="Approved Vehicles" value={stats?.approvedUsers || 0} color="emerald" />
          <StatCard icon={<XCircle />} label="Rejected Requests" value={stats?.rejectedUsers || 0} color="red" />
        </div>

        {/* Scan Activity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<Activity />} label="Today's Scans" value={stats?.todaysScans || 0} color="indigo" />
          <StatCard icon={<CheckCircle2 />} label="Today's Allowed" value={stats?.todaysAllowed || 0} color="emerald" />
          <StatCard icon={<XCircle />} label="Today's Denied" value={stats?.todaysDenied || 0} color="red" />
        </div>

        {/* Charts */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <BarChart2 className="text-blue-500" /> Weekly Scan Trend
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="scans" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex items-center gap-4">
      <div className={`p-4 rounded-xl border ${colorMap[color]}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
