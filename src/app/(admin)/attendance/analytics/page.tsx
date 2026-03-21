'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { PageHeader } from '@/components/shared/PageHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';

const STATUS_COLORS = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#3b82f6',
};

function formatDate(iso: string) {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

export default function AttendanceAnalyticsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [gradeId, setGradeId] = useState<Id<'grades'> | ''>('');
  const [sectionId, setSectionId] = useState<Id<'sections'> | ''>('');

  const data = useQuery(api.attendance.queries.getAttendanceAnalytics, {
    startDate,
    endDate,
    gradeId: gradeId || undefined,
    sectionId: sectionId || undefined,
  });

  const sectionOptions = useMemo(() => {
    if (!data) return [];
    if (!gradeId) return data.sections;
    return data.sections.filter((s) => {
      const grade = data.grades.find((g) => g._id === gradeId);
      return grade ? s.gradeId === grade._id : true;
    });
  }, [data, gradeId]);

  if (data === undefined) return <PageSkeleton />;

  const { totals, daily, bySections, topAbsentees, grades } = data;
  const attendanceRate = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0;

  const pieData = [
    { name: 'Present', value: totals.present, color: STATUS_COLORS.present },
    { name: 'Absent', value: totals.absent, color: STATUS_COLORS.absent },
    { name: 'Late', value: totals.late, color: STATUS_COLORS.late },
    { name: 'Excused', value: totals.excused, color: STATUS_COLORS.excused },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Analytics"
        description="Track attendance trends, identify patterns, and monitor student presence across your school."
      />

      {/* ── Filters ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Start Date</span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">End Date</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Grade</span>
            <select
              value={gradeId}
              onChange={(e) => { setGradeId(e.target.value as Id<'grades'>); setSectionId(''); }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">All grades</option>
              {grades.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Section</span>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value as Id<'sections'>)}
              disabled={!gradeId}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20 disabled:bg-gray-100 disabled:opacity-50"
            >
              <option value="">All sections</option>
              {sectionOptions.map((s) => (
                <option key={s._id} value={s._id}>{s.displayName ?? s.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* ── Summary cards ───────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          helper="Present / total records"
          icon={TrendingUp}
        />
        <MetricCard label="Total Records" value={String(totals.total)} helper="All attendance entries" icon={Users} />
        <MetricCard label="Present" value={String(totals.present)} helper="Marked as present" icon={UserCheck} />
        <MetricCard label="Absent" value={String(totals.absent)} helper="Marked as absent" icon={UserX} />
        <MetricCard label="Late" value={String(totals.late)} helper="Marked as late" icon={Clock} />
      </div>

      {/* ── Charts row ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Daily trend bar chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-onyx">Daily Attendance Trend</h2>
          {daily.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500">No records found for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={daily} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  labelFormatter={(v) => `Date: ${v}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Present" stackId="a" fill={STATUS_COLORS.present} radius={[0, 0, 0, 0]} />
                <Bar dataKey="absent" name="Absent" stackId="a" fill={STATUS_COLORS.absent} />
                <Bar dataKey="late" name="Late" stackId="a" fill={STATUS_COLORS.late} />
                <Bar dataKey="excused" name="Excused" stackId="a" fill={STATUS_COLORS.excused} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="mb-4 text-base font-semibold text-onyx">Overall Distribution</h2>
          {pieData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">No data</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <PieChart width={200} height={200}>
                <Pie data={pieData} cx={95} cy={95} innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              </PieChart>
              <ul className="space-y-1 text-sm">
                {pieData.map((entry) => (
                  <li key={entry.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-700">{entry.name}</span>
                    <span className="ml-auto font-medium text-gray-900">{entry.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── By Section ──────────────────────────────────── */}
      {bySections.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-onyx">By Section</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">Section</th>
                  <th className="pb-3 pr-4">Grade</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Present</th>
                  <th className="pb-3 pr-4">Absent</th>
                  <th className="pb-3">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bySections.map((row) => {
                  const rate = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
                  return (
                    <tr key={row.sectionId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-gray-900">{row.name}</td>
                      <td className="py-3 pr-4 text-gray-600">{row.gradeName}</td>
                      <td className="py-3 pr-4 text-gray-700">{row.total}</td>
                      <td className="py-3 pr-4 text-green-700">{row.present}</td>
                      <td className="py-3 pr-4 text-red-600">{row.absent}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Top Absentees ───────────────────────────────── */}
      {topAbsentees.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-onyx">Most Frequent Absences</h2>
          <div className="space-y-2">
            {topAbsentees.map((entry, index) => (
              <div key={entry.studentId} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 bg-gray-50/50">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{entry.name}</p>
                  <p className="text-xs text-gray-500">{entry.studentNumber}</p>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                  {entry.absentCount} absent{entry.absentCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
