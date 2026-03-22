'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, CheckCircle, AlertTriangle, Save, Loader2 } from 'lucide-react';

export default function ZraSettingsPage() {
  const settings = useQuery(api.schools.queries.getSchoolSettings);
  const updateSettings = useMutation(api.schools.mutations.updateSchoolSettings);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    zraTpin: '',
    zraVsdSerial: '',
    zraBranchCode: '',
    zraEnabled: false,
    zraMockMode: true,
  });

  // Load settings when available
  if (settings && formData.zraTpin === '' && settings.zraTpin) {
    setFormData({
      zraTpin: settings.zraTpin || '',
      zraVsdSerial: settings.zraVsdSerial || '',
      zraBranchCode: settings.zraBranchCode || '',
      zraEnabled: settings.zraEnabled || false,
      zraMockMode: settings.zraMockMode !== false, // default true
    });
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateSettings({
        zraTpin: formData.zraTpin || undefined,
        zraVsdSerial: formData.zraVsdSerial || undefined,
        zraBranchCode: formData.zraBranchCode || undefined,
        zraEnabled: formData.zraEnabled,
        zraMockMode: formData.zraMockMode,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const testConnection = async () => {
    // Would call a test endpoint
    alert('ZRA connection test would be implemented here');
  };

  if (settings === undefined) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ZRA Settings"
        description="Configure Smart Invoice integration with ZRA VSDC"
      />

      <SectionCard
        title="ZRA VSDC Configuration"
        description="Enter your TaxPayer Identification Number (TPIN) and VSDC details"
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.zraMockMode}
                onCheckedChange={(checked) => setFormData({ ...formData, zraMockMode: checked })}
                id="mockMode"
              />
              <Label htmlFor="mockMode" className="text-[13px] cursor-pointer">Mock Mode</Label>
            </div>
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={!formData.zraTpin || !formData.zraVsdSerial}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Test Connection
            </Button>
          </div>
        }
      >
        <div className="p-5 space-y-6">
          {/* TPIN */}
          <div className="space-y-2">
            <Label htmlFor="tpin" className="text-[12px] text-text-secondary">
              TPIN (TaxPayer Identification Number)
            </Label>
            <Input
              id="tpin"
              value={formData.zraTpin}
              onChange={(e) => setFormData({ ...formData, zraTpin: e.target.value })}
              placeholder="10-digit TPIN"
              maxLength={10}
              className="text-[13px] max-w-md"
            />
            <p className="text-[11px] text-text-tertiary">
              Your 10-digit TPIN issued by ZRA
            </p>
          </div>

          {/* VSDC Serial */}
          <div className="space-y-2">
            <Label htmlFor="vsdSerial" className="text-[12px] text-text-secondary">
              VSDC Serial Number
            </Label>
            <Input
              id="vsdSerial"
              value={formData.zraVsdSerial}
              onChange={(e) => setFormData({ ...formData, zraVsdSerial: e.target.value })}
              placeholder="VSDC device serial number"
              className="text-[13px] max-w-md"
            />
            <p className="text-[11px] text-text-tertiary">
              The serial number of your VSDC fiscal device
            </p>
          </div>

          {/* Branch Code */}
          <div className="space-y-2">
            <Label htmlFor="branchCode" className="text-[12px] text-text-secondary">
              Branch Code (Optional)
            </Label>
            <Input
              id="branchCode"
              value={formData.zraBranchCode}
              onChange={(e) => setFormData({ ...formData, zraBranchCode: e.target.value })}
              placeholder="000"
              className="text-[13px] max-w-md"
            />
            <p className="text-[11px] text-text-tertiary">
              Default is 000 for main branch
            </p>
          </div>

          {/* Enable ZRA */}
          <div className="flex items-center gap-3 p-4 bg-accent-bg rounded-lg">
            <Shield className="h-5 w-5 text-accent" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-text-primary">Enable ZRA Fiscalisation</p>
              <p className="text-[11px] text-text-secondary">
                Automatically submit invoices to ZRA for fiscalisation
              </p>
            </div>
            <Switch
              checked={formData.zraEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, zraEnabled: checked })}
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-warning-bg border border-warning-border rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-warning">Important</p>
                <p className="text-[12px] text-text-secondary mt-1">
                  In mock mode, invoices will be assigned mock fiscal codes for testing. 
                  Disable mock mode and enter production credentials when going live.
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
                <><Save className="h-4 w-4" /> Save Settings</>
              )}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-96" />
    </div>
  );
}
