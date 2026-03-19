import Image from 'next/image';

interface SchoolLogoProps {
  logoUrl?: string | null;
  schoolName: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-14 w-14', text: 'text-lg' },
} as const;

export function SchoolLogo({ logoUrl, schoolName, size = 'md' }: SchoolLogoProps) {
  const { container, text } = SIZES[size];

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${schoolName} logo`}
        width={size === 'lg' ? 56 : size === 'md' ? 40 : 32}
        height={size === 'lg' ? 56 : size === 'md' ? 40 : 32}
        className={`${container} rounded-lg object-contain`}
      />
    );
  }

  // Fallback: initials on branded background
  const initials = schoolName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`${container} flex items-center justify-center rounded-lg bg-school-primary`}
      aria-hidden="true"
    >
      <span className={`${text} font-semibold text-white`}>{initials}</span>
    </div>
  );
}
