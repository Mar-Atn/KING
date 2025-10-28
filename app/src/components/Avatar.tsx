/**
 * Avatar Component
 * Displays role avatars with support for different sizes
 */

interface AvatarProps {
  src?: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
}

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size]

  if (!src) {
    // Fallback: initials in circle
    const initials = alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div
        className={`${sizeClass} ${className} rounded-full bg-neutral-300 flex items-center justify-center text-neutral-700 font-semibold`}
        title={alt}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClass} ${className} rounded-full object-cover`}
      title={alt}
    />
  )
}
