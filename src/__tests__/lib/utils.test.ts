import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('returns a single class name unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('merges multiple class names', () => {
    const result = cn('text-red-500', 'bg-blue-200');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-200');
  });

  it('handles conditional class names', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('omits falsy conditional class names', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).not.toContain('active-class');
  });

  it('merges conflicting Tailwind classes, keeping the last one', () => {
    // tailwind-merge should resolve conflicts; the later class wins
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
    expect(result).not.toContain('text-red-500');
  });

  it('handles undefined and null values gracefully', () => {
    const result = cn('text-red-500', undefined, null as unknown as string);
    expect(result).toBe('text-red-500');
  });

  it('handles object syntax', () => {
    const result = cn({ 'text-red-500': true, 'bg-blue-200': false });
    expect(result).toContain('text-red-500');
    expect(result).not.toContain('bg-blue-200');
  });

  it('handles array syntax', () => {
    const result = cn(['text-red-500', 'bg-blue-200']);
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-200');
  });

  it('returns an empty string when no classes are provided', () => {
    expect(cn()).toBe('');
  });

  it('merges padding utilities correctly', () => {
    const result = cn('p-4', 'px-6');
    // px-6 should override the horizontal padding from p-4
    expect(result).toContain('px-6');
  });
});
