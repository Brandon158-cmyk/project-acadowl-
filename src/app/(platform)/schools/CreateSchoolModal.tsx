'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PROVINCE_NAMES, getDistrictsForProvince } from '@/lib/constants/zambia';
import { getDefaultFeaturesForSchoolType } from '@/lib/features/presets';

const schoolTypes = [
  { value: 'primary_day', label: 'Primary Day School' },
  { value: 'primary_boarding', label: 'Primary Boarding School' },
  { value: 'secondary_day', label: 'Secondary Day School' },
  { value: 'secondary_boarding', label: 'Secondary Boarding School' },
  { value: 'mixed_secondary', label: 'Mixed Secondary School' },
  { value: 'combined', label: 'Combined School' },
  { value: 'college', label: 'College / HEI' },
] as const;

const tiers = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
] as const;

const createSchoolSchema = z.object({
  name: z.string().min(2, 'School name is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  type: z.enum([
    'primary_day', 'primary_boarding', 'secondary_day', 'secondary_boarding',
    'mixed_secondary', 'combined', 'college',
  ]),
  subscriptionTier: z.enum(['free', 'basic', 'standard', 'premium']),
  province: z.string().optional(),
  district: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

type CreateSchoolFormData = z.infer<typeof createSchoolSchema>;

interface CreateSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSchoolModal({ isOpen, onClose }: CreateSchoolModalProps) {
  const createSchool = useMutation(api.schools.mutations.createSchool);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateSchoolFormData>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: 'secondary_day',
      subscriptionTier: 'basic',
      province: '',
      district: '',
      email: '',
      phone: '',
    },
  });

  const selectedProvince = form.watch('province');
  const selectedType = form.watch('type');
  const districts = selectedProvince ? getDistrictsForProvince(selectedProvince) : [];

  const onSubmit = async (data: CreateSchoolFormData) => {
    setIsLoading(true);
    try {
      const defaultFeatures = getDefaultFeaturesForSchoolType(data.type);

      await createSchool({
        name: data.name,
        slug: data.slug,
        type: data.type,
        enabledFeatures: defaultFeatures as string[],
        subscriptionTier: data.subscriptionTier,
        province: data.province || undefined,
        district: data.district || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });

      form.reset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create school';
      form.setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    form.setValue('slug', slug);
  };

  if (!isOpen) return null;

  const inputClass =
    'block w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary shadow-sm';
  const selectClass =
    'block w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary shadow-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-semibold text-onyx">Create School</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <div role="alert" className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="school-name" className="block text-sm font-medium text-gray-700 mb-1">
              School name
            </label>
            <input
              id="school-name"
              type="text"
              className={inputClass}
              placeholder="e.g. Kabulonga Boys Secondary"
              {...form.register('name')}
              onChange={handleNameChange}
            />
            {form.formState.errors.name && (
              <p role="alert" className="mt-1.5 text-xs text-error">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="school-slug" className="block text-sm font-medium text-gray-700 mb-1">
              URL slug
            </label>
            <input
              id="school-slug"
              type="text"
              className={inputClass}
              placeholder="kabulonga-boys"
              {...form.register('slug')}
            />
            {form.formState.errors.slug && (
              <p role="alert" className="mt-1.5 text-xs text-error">{form.formState.errors.slug.message}</p>
            )}
          </div>

          {/* Type + Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="school-type" className="block text-sm font-medium text-gray-700 mb-1">
                School type
              </label>
              <select id="school-type" className={selectClass} {...form.register('type')}>
                {schoolTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="school-tier" className="block text-sm font-medium text-gray-700 mb-1">
                Subscription tier
              </label>
              <select id="school-tier" className={selectClass} {...form.register('subscriptionTier')}>
                {tiers.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Province + District */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="school-province" className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <select id="school-province" className={selectClass} {...form.register('province')}>
                <option value="">Select province</option>
                {PROVINCE_NAMES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="school-district" className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <select id="school-district" className={selectClass} {...form.register('district')}>
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="school-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="school-email"
                type="email"
                className={inputClass}
                placeholder="info@school.edu.zm"
                {...form.register('email')}
              />
            </div>
            <div>
              <label htmlFor="school-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="school-phone"
                type="tel"
                className={inputClass}
                placeholder="+260 97..."
                {...form.register('phone')}
              />
            </div>
          </div>

          {/* Default features preview */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Default features for {schoolTypes.find((t) => t.value === selectedType)?.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {getDefaultFeaturesForSchoolType(selectedType).map((f) => (
                <span
                  key={f}
                  className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-xs text-gray-600"
                >
                  {f.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-50 text-onyx border border-gray-300 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                'Create school'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
