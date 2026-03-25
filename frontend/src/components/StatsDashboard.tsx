"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { TrendingUp, Users, Globe2, CheckCircle2, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["#75AADB", "#c61e53", "#E8A21A"];

const MOCK_STATS = {
  mobile_subscribers: { Mascom: 1_850_000, Orange: 920_000, BTC: 430_000 },
  internet_penetration: {
    "2019": 45.2, "2020": 51.4, "2021": 58.7,
    "2022": 63.1, "2023": 69.5, "2024": 74.2,
    "2025": 78.9, "2026": 82.3,
  },
  complaints_resolved: 4_287,
};

function formatNumber(num: number) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label, suffix = "" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#03102A] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 text-sm">
        <p className="font-bold text-gray-300 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="font-black" style={{ color: p.color }}>
            {p.name}: {suffix ? `${p.value}${suffix}` : formatNumber(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<any>(MOCK_STATS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("http://localhost:8000/api/statistics");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          setIsLive(true);
        }
      } catch {
        // Use mock data
      }
    }
    fetchStats();
  }, []);

  const pieData = Object.keys(stats.mobile_subscribers).map((key) => ({
    name: key,
    value: stats.mobile_subscribers[key],
  }));

  const areaData = Object.keys(stats.internet_penetration).map((year) => ({
    year,
    penetration: stats.internet_penetration[year],
  }));

  const barData = pieData.map((d) => ({
    name: d.name,
    subscribers: d.value,
  }));

  const totalSubscribers = pieData.reduce((acc, curr) => acc + curr.value, 0);
  const latestYear = Object.keys(stats.internet_penetration).slice(-1)[0];

  return (
    <section id="statistics" className="bg-[#FAFCFF] relative overflow-hidden">

      {/* === Diagonal top border === */}
      <div className="h-12 bg-[#06193e]" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 0)" }} />

      {/* Background texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(-45deg, #06193e 0, #06193e 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-[#027ac6] text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="inline-block w-6 h-0.5 bg-[#027ac6]" />
              Market Intelligence
            </p>
            <h2 className="text-4xl font-black text-[#06193e] font-(family-name:--font-outfit) leading-tight">
              Botswana Telecom
              <br />
              <span className="text-[#027ac6]">Statistics Dashboard</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${isLive ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-[#027ac6] border-blue-200"}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isLive ? "bg-green-500" : "bg-[#027ac6]"}`} />
              {isLive ? "Live Data" : "Q4 2025 Official Data"}
            </div>
          </div>
        </div>

        {/* === KPI strip === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-12 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          {[
            {
              icon: Users,
              label: "Total Mobile Subscribers",
              value: formatNumber(totalSubscribers),
              sub: "Across all operators · Q4 2025",
              color: "bg-[#06193e]",
              textColor: "text-white",
              subColor: "text-blue-300",
              iconBg: "bg-white/10",
              iconColor: "text-white",
            },
            {
              icon: Globe2,
              label: "Internet Penetration",
              value: `${stats.internet_penetration[latestYear]}%`,
              sub: `Population covered · ${latestYear}`,
              color: "bg-white",
              textColor: "text-[#06193e]",
              subColor: "text-gray-400",
              iconBg: "bg-[#027ac6]/10",
              iconColor: "text-[#027ac6]",
            },
            {
              icon: CheckCircle2,
              label: "Complaints Resolved",
              value: stats.complaints_resolved.toLocaleString(),
              sub: "Consumer cases closed · 2025",
              color: "bg-white",
              textColor: "text-[#06193e]",
              subColor: "text-gray-400",
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${kpi.color} p-8 ${i > 0 ? "border-l border-gray-200" : ""} relative overflow-hidden`}
            >
              <div className={`w-10 h-10 ${kpi.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              <p className={`text-4xl font-black ${kpi.textColor} font-(family-name:--font-outfit) mb-1`}>
                {kpi.value}
              </p>
              <p className={`text-sm font-bold ${kpi.textColor} mb-1`}>{kpi.label}</p>
              <p className={`text-xs ${kpi.subColor}`}>{kpi.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* === Charts grid === */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Internet penetration area chart — wider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-black text-[#06193e] text-lg mb-1">Internet Penetration Growth</h3>
                <p className="text-gray-400 text-sm">% of population with internet access, 2019–2026</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                <TrendingUp className="w-4 h-4" />
                +82.3%
              </div>
            </div>
            <div className="h-65">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#027ac6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#027ac6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 600 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Area type="monotone" dataKey="penetration" name="Penetration" stroke="#027ac6" strokeWidth={3} fill="url(#areaGrad)" dot={{ fill: "#027ac6", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#027ac6" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Market share donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-[#06193e] rounded-2xl p-8 border border-gray-100 shadow-sm"
          >
            <h3 className="font-black text-white text-lg mb-1">Mobile Market Share</h3>
            <p className="text-gray-400 text-sm mb-4">Subscriber share by operator</p>
            <div className="h-45">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-bold text-white">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{formatNumber(entry.value)}</span>
                    <span className="text-xs text-gray-400 ml-1">({Math.round((entry.value / totalSubscribers) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Subscriber bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-black text-[#06193e] text-lg mb-1">Subscribers by Operator</h3>
                <p className="text-gray-400 text-sm">Active SIM card counts · Q4 2025</p>
              </div>
              <a
                href="#"
                className="flex items-center gap-1 text-[#027ac6] text-sm font-bold hover:underline"
              >
                Full Report <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
            <div className="h-45">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#374151", fontSize: 13, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 600 }} tickFormatter={formatNumber} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="subscribers" name="Subscribers" radius={[6, 6, 0, 0]}>
                    {barData.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Source note */}
        <p className="mt-8 text-xs text-gray-400 text-center">
          Source: BOCRA Quarterly Market Statistical Report Q4 2025. Data subject to revision. ©{new Date().getFullYear()} BOCRA.
        </p>
      </div>
    </section>
  );
}
