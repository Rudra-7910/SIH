import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, PackageSearch } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 relative overflow-hidden group"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-xl ${color} transition-all duration-500 group-hover:scale-150`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-slate-400 font-medium text-sm mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-20 backdrop-blur-sm`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-electric/30 border-t-electric rounded-full animate-spin" /></div>;
  }

  // Dummy trend data for the chart
  const trendData = [
    { name: 'Mon', rate: 72 },
    { name: 'Tue', rate: 75 },
    { name: 'Wed', rate: 71 },
    { name: 'Thu', rate: 78 },
    { name: 'Fri', rate: Number(stats.complianceRate) },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Overview</h1>
        <p className="text-slate-400">Monitor Legal Metrology compliance metrics.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Scans" 
          value={stats.totalScans} 
          icon={<PackageSearch size={24} className="text-electric" />}
          color="bg-electric"
          delay={0.1}
        />
        <StatCard 
          title="Compliance Rate" 
          value={`${stats.complianceRate}%`} 
          icon={<Activity size={24} className="text-emerald-400" />}
          color="bg-emerald-500"
          delay={0.2}
        />
        <StatCard 
          title="Compliant Products" 
          value={stats.compliantScans} 
          icon={<CheckCircle size={24} className="text-emerald-400" />}
          color="bg-emerald-500"
          delay={0.3}
        />
        <StatCard 
          title="Non-Compliant" 
          value={stats.nonCompliantScans} 
          icon={<AlertTriangle size={24} className="text-rose-400" />}
          color="bg-rose-500"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Compliance Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-medium text-white mb-6">Compliance Rate Trend (Week)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#627d98" tick={{fill: '#627d98'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#627d98" tick={{fill: '#627d98'}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#102a43', borderColor: '#334e68', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Violations by Category */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-medium text-white mb-6">Top Missing Declarations</h3>
          <div className="space-y-4">
            {stats.violationsByCategory.slice(0, 5).map((item, idx) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-slate-200 capitalize font-medium">{item._id.replace('_', ' ')}</span>
                  <span className="text-xs text-slate-500">Violations</span>
                </div>
                <div className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-lg font-bold">
                  {item.count}
                </div>
              </div>
            ))}
            {stats.violationsByCategory.length === 0 && (
              <div className="text-slate-500 text-sm text-center py-8">No violations recorded yet.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
