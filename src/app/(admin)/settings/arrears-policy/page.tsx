'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Save, Loader2, GraduationCap, FileText, Bell, Clock } from 'lucide-react';

export default function ArrearsPolicyPage() {
  const policy = useQuery(api.fees.arrearsPolicy.getArrearsPolicy);
  const updatePolicy = useMutation(api.fees.arrearsPolicy.updateArrearsPolicy);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reminderDays: [-3, 0, 7, 14, 21, 30] as number[],
    holdReportCardAtDays: 30,
    blockExamAccessAtDays: 60,
    requireFeesClearedForPromotion: true,
    enableAutomaticReminders: true,
  });

  // Load policy when available
  if (policy && formData.reminderDays.length === 0) {
    setFormData({
      reminderDays: policy.reminderDays || [-3, 0, 7, 14, 21, 30],
      holdReportCardAtDays: policy.holdReportCardAtDays || 30,
      blockExamAccessAtDays: policy.blockExamAccessAtDays || 60,
      requireFeesClearedForPromotion: policy.requireFeesClearedForPromotion ?? true,
      enableAutomaticReminders: policy.enableAutomaticReminders ?? true,
    });
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updatePolicy({
        reminderDays: formData.reminderDays,
        holdReportCardAtDays: formData.holdReportCardAtDays,
        blockExamAccessAtDays: formData.blockExamAccessAtDays,
        requireFeesClearedForPromotion: formData.requireFeesClearedForPromotion,
        enableAutomaticReminders: formData.enableAutomaticReminders,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReminderDay = (index: number, value: string) => {
    const days = [...formData.reminderDays];
    days[index] = parseInt(value) || 0;
    setFormData({ ...formData, reminderDays: days });
  };

  const addReminderDay = () => {
    setFormData({ ...formData, reminderDays: [...formData.reminderDays, 30] });
  };

  const removeReminderDay = (index: number) => {
    const days = formData.reminderDays.filter((_, i) => i !== index);
    setFormData({ ...formData, reminderDays: days });
  };

  if (policy === undefined) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arrears Policy"
        description="Configure fee collection policies and restriction rules"
      />

      {/* Reminder Schedule */}
      <SectionCard
        title="Reminder Schedule"
        description="Days before/after due date to send payment reminders"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-accent" />
              <div>
                <p className="text-[13px] font-medium text-text-primary">Automatic Reminders</p>
                <p className="text-[11px] text-text-secondary">Send scheduled reminders to parents</p>
              </div>
            </div>
            <Switch
              checked={formData.enableAutomaticReminders}
              onCheckedChange={(checked) => setFormData({ ...formData, enableAutomaticReminders: checked })}
            />
          </div>

          <div className="pt-4 border-t border-border-inner">
            <p className="text-[12px] text-text-secondary mb-3">Reminder Days (relative to due date)</p>
            <div className="flex flex-wrap gap-2">
              {formData.reminderDays.map((day, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-subtle rounded-md">
                    <span className="text-[12px] text-text-secondary">
                      {day < 0 ? `${day} days` : day === 0 ? 'Due date' : `+${day} days`}
                    </span>
                    <button
                      onClick={() => removeReminderDay(index)}
                      className="text-text-tertiary hover:text-error"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addReminderDay} className="text-[12px]">
                + Add Day
              </Button>
            </div>
            <p className="text-[11px] text-text-tertiary mt-2">
              Negative numbers = days before due date, 0 = on due date, positive = days after
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Restrictions */}
      <SectionCard
        title="Access Restrictions"
        description="Configure when to restrict access based on outstanding fees"
      >
        <div className="p-5 space-y-6">
          {/* Report Card Hold */}
          <div className="flex items-start gap-4 p-4 bg-surface-subtle rounded-lg">
            <FileText className="h-5 w-5 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-text-primary">Hold Report Cards</p>
              <p className="text-[11px] text-text-secondary mt-1">
                Do not release report cards to portal if fees are overdue by more than:
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Input
                  type="number"
                  value={formData.holdReportCardAtDays}
                  onChange={(e) => setFormData({ ...formData, holdReportCardAtDays: parseInt(e.target.value) || 0 })}
                  className="w-20 text-[13px]"
                />
                <span className="text-[13px] text-text-secondary">days</span>
              </div>
            </div>
          </div>

          {/* Exam Access Block */}
          <div className="flex items-start gap-4 p-4 bg-surface-subtle rounded-lg">
            <GraduationCap className="h-5 w-5 text-error mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-text-primary">Exam Access Warning</p>
              <p className="text-[11px] text-text-secondary mt-1">
                Warn administrators if student fees are overdue by more than:
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Input
                  type="number"
                  value={formData.blockExamAccessAtDays}
                  onChange={(e) => setFormData({ ...formData, blockExamAccessAtDays: parseInt(e.target.value) || 0 })}
                  className="w-20 text-[13px]"
                />
                <span className="text-[13px] text-text-secondary">days</span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-2">
                Note: Final decision to allow exam sitting is always at administrator&apos;s discretion
              </p>
            </div>
          </div>

          {/* Promotion Requirement */}
          <div className="flex items-center justify-between p-4 bg-surface-subtle rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <p className="text-[13px] font-medium text-text-primary">Require Fees Cleared for Promotion</p>
                <p className="text-[11px] text-text-secondary">
                  Student must have zero balance to be promoted to next grade
                </p>
              </div>
            </div>
            <Switch
              checked={formData.requireFeesClearedForPromotion}
              onCheckedChange={(checked) => setFormData({ ...formData, requireFeesClearedForPromotion: checked })}
            />
          </div>
        </div>
      </SectionCard>

      {/* Info Box */}
      <div className="p-4 bg-warning-bg border border-warning-border rounded-lg">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-warning">Important Note</p>
            <p className="text-[12px] text-text-secondary mt-1">
              These settings control warnings and automated actions. School administrators can always override 
              restrictions manually for individual students when necessary.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="gap-2 bg-accent hover:bg-accent-hover"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Policy</>
          )}
        </Button>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  );
}
