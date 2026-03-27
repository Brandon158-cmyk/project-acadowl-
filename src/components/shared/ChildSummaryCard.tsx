'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface ChildSummaryCardProps {
  studentId: string;
  name: string;
  grade?: string | null;
  section?: string | null;
  photoUrl?: string | null;
  attendanceStatus?: 'present' | 'absent' | 'late' | 'excused' | null;
  termBalanceZMW: number;
  highlight?: string | null;
  schoolName?: string | null;
}

function statusLabel(status?: 'present' | 'absent' | 'late' | 'excused' | null) {
  if (!status) return 'Not yet marked';
  if (status === 'present') return 'Present';
  if (status === 'absent') return 'Absent';
  if (status === 'late') return 'Late';
  return 'Excused';
}

function statusTone(status?: 'present' | 'absent' | 'late' | 'excused' | null) {
  if (!status) return 'bg-gray-100 text-gray-700';
  if (status === 'present') return 'bg-emerald-100 text-emerald-700';
  if (status === 'absent') return 'bg-red-100 text-red-700';
  if (status === 'late') return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

export function ChildSummaryCard(props: ChildSummaryCardProps) {
  const isCleared = props.termBalanceZMW <= 0;

  return (
    <Link
      href={`/children/${props.studentId}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-onyx">{props.name}</p>
          <p className="truncate text-xs text-slate">
            {[props.grade, props.section].filter(Boolean).join(' · ') || 'Unassigned'}
          </p>
          {props.schoolName ? <p className="mt-1 text-[11px] text-gray-500">{props.schoolName}</p> : null}
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', statusTone(props.attendanceStatus))}>
          {statusLabel(props.attendanceStatus)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
        <p className="text-xs text-gray-600">Term balance</p>
        <p className={cn('text-sm font-semibold', isCleared ? 'text-emerald-700' : 'text-amber-700')}>
          {isCleared ? 'ZMW 0 — Cleared' : `ZMW ${props.termBalanceZMW.toLocaleString()} owing`}
        </p>
      </div>

      {props.highlight ? (
        <div className="mt-3">
          <Badge variant="secondary" className="text-xs">
            {props.highlight}
          </Badge>
        </div>
      ) : null}
    </Link>
  );
}
