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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Smartphone, Save, Loader2, Banknote, QrCode, Copy, Check } from 'lucide-react';

export default function PaymentSettingsPage() {
  const config = useQuery(api.fees.mobileMoneyConfig.getMobileMoneyConfig);
  const updateConfig = useMutation(api.fees.mobileMoneyConfig.updateMobileMoneyConfig);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    airtelEnabled: false,
    airtelMerchantCode: '',
    airtelClientId: '',
    airtelClientSecret: '',
    mtnEnabled: false,
    mtnMerchantCode: '',
    mtnApiUser: '',
    mtnApiKey: '',
    mtnSubscriptionKey: '',
    paymentInstructions: '',
  });

  // Load config when available
  if (config && formData.airtelMerchantCode === '' && config.airtelMerchantCode) {
    setFormData({
      airtelEnabled: config.airtelEnabled || false,
      airtelMerchantCode: config.airtelMerchantCode || '',
      airtelClientId: config.airtelClientId || '',
      airtelClientSecret: '', // Don't show secret
      mtnEnabled: config.mtnEnabled || false,
      mtnMerchantCode: config.mtnMerchantCode || '',
      mtnApiUser: config.mtnApiUser || '',
      mtnApiKey: '', // Don't show key
      mtnSubscriptionKey: config.mtnSubscriptionKey || '',
      paymentInstructions: config.paymentInstructions || '',
    });
  }

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateConfig({
        airtelEnabled: formData.airtelEnabled,
        airtelMerchantCode: formData.airtelMerchantCode || undefined,
        airtelClientId: formData.airtelClientId || undefined,
        airtelClientSecret: formData.airtelClientSecret || undefined,
        mtnEnabled: formData.mtnEnabled,
        mtnMerchantCode: formData.mtnMerchantCode || undefined,
        mtnApiUser: formData.mtnApiUser || undefined,
        mtnApiKey: formData.mtnApiKey || undefined,
        mtnSubscriptionKey: formData.mtnSubscriptionKey || undefined,
        paymentInstructions: formData.paymentInstructions || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyWebhook = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/payments`;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (config === undefined) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Settings"
        description="Configure mobile money and payment gateway settings"
      />

      <Tabs defaultValue="airtel" className="space-y-6">
        <TabsList className="bg-white border border-border-panel">
          <TabsTrigger value="airtel" className="gap-2 text-[13px]">
            <Smartphone className="h-4 w-4" />
            Airtel Money
          </TabsTrigger>
          <TabsTrigger value="mtn" className="gap-2 text-[13px]">
            <Smartphone className="h-4 w-4" />
            MTN MoMo
          </TabsTrigger>
          <TabsTrigger value="instructions" className="gap-2 text-[13px]">
            <CreditCard className="h-4 w-4" />
            Instructions
          </TabsTrigger>
        </TabsList>

        {/* Airtel Money */}
        <TabsContent value="airtel">
          <SectionCard
            title="Airtel Money Configuration"
            description="Set up Airtel Money merchant account for receiving payments"
          >
            <div className="p-5 space-y-6">
              <div className="flex items-center justify-between p-4 bg-accent-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-[13px] font-medium text-text-primary">Enable Airtel Money</p>
                    <p className="text-[11px] text-text-secondary">Allow guardians to pay via Airtel Money</p>
                  </div>
                </div>
                <Switch
                  checked={formData.airtelEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, airtelEnabled: checked })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[12px] text-text-secondary">Merchant Code</Label>
                  <Input
                    value={formData.airtelMerchantCode}
                    onChange={(e) => setFormData({ ...formData, airtelMerchantCode: e.target.value })}
                    placeholder="Airtel Money merchant code"
                    className="text-[13px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] text-text-secondary">Client ID</Label>
                  <Input
                    value={formData.airtelClientId}
                    onChange={(e) => setFormData({ ...formData, airtelClientId: e.target.value })}
                    placeholder="API Client ID"
                    className="text-[13px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] text-text-secondary">Client Secret</Label>
                <Input
                  type="password"
                  value={formData.airtelClientSecret}
                  onChange={(e) => setFormData({ ...formData, airtelClientSecret: e.target.value })}
                  placeholder="API Client Secret (leave blank to keep current)"
                  className="text-[13px]"
                />
                <p className="text-[11px] text-text-tertiary">
                  Your Airtel Money API credentials from the merchant portal
                </p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* MTN MoMo */}
        <TabsContent value="mtn">
          <SectionCard
            title="MTN MoMo Configuration"
            description="Set up MTN Mobile Money for receiving payments"
          >
            <div className="p-5 space-y-6">
              <div className="flex items-center justify-between p-4 bg-accent-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-[13px] font-medium text-text-primary">Enable MTN MoMo</p>
                    <p className="text-[11px] text-text-secondary">Allow guardians to pay via MTN MoMo</p>
                  </div>
                </div>
                <Switch
                  checked={formData.mtnEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, mtnEnabled: checked })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[12px] text-text-secondary">Merchant Code</Label>
                  <Input
                    value={formData.mtnMerchantCode}
                    onChange={(e) => setFormData({ ...formData, mtnMerchantCode: e.target.value })}
                    placeholder="MTN MoMo merchant code"
                    className="text-[13px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] text-text-secondary">API User</Label>
                  <Input
                    value={formData.mtnApiUser}
                    onChange={(e) => setFormData({ ...formData, mtnApiUser: e.target.value })}
                    placeholder="API User ID"
                    className="text-[13px]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[12px] text-text-secondary">API Key</Label>
                  <Input
                    type="password"
                    value={formData.mtnApiKey}
                    onChange={(e) => setFormData({ ...formData, mtnApiKey: e.target.value })}
                    placeholder="API Key (leave blank to keep current)"
                    className="text-[13px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] text-text-secondary">Subscription Key</Label>
                  <Input
                    value={formData.mtnSubscriptionKey}
                    onChange={(e) => setFormData({ ...formData, mtnSubscriptionKey: e.target.value })}
                    placeholder="OCP APIM Subscription Key"
                    className="text-[13px]"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Instructions & Webhook */}
        <TabsContent value="instructions">
          <SectionCard
            title="Payment Instructions"
            description="Custom message shown to parents when making payments"
          >
            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <Label className="text-[12px] text-text-secondary">Payment Instructions</Label>
                <textarea
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                  placeholder="Enter instructions for parents on how to make payments..."
                  className="w-full min-h-[100px] p-3 text-[13px] border border-border-inner rounded-md focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-y"
                />
                <p className="text-[11px] text-text-tertiary">
                  This will be displayed to parents in the payment interface
                </p>
              </div>

              <div className="p-4 bg-surface-subtle rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-5 w-5 text-text-secondary" />
                  <p className="text-[13px] font-medium text-text-primary">Webhook URL</p>
                </div>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-white border border-border-inner rounded text-[12px] font-mono text-text-secondary truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/payments` : 'Loading...'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyWebhook}
                    className="gap-1"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[11px] text-text-tertiary mt-2">
                  Configure this webhook URL in your Airtel/MTN merchant portal
                </p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

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
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96" />
    </div>
  );
}
