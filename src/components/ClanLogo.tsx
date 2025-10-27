/**
 * ClanLogo Component
 * Displays clan logos with support for different sizes
 */

interface ClanLogoProps {
  src?: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  circular?: boolean
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
}

export function ClanLogo({ src, alt, size = 'md', className = '', circular = false }: ClanLogoProps) {
  const sizeClass = sizeClasses[size]
  const shapeClass = circular ? 'rounded-full' : 'rounded-lg'

  if (!src) {
    // Fallback: initials in square/circle
    const initials = alt
      .split(' ')
      .filter(word => word.length > 2) // Skip "of" and "Clan"
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div
        className={`${sizeClass} ${shapeClass} ${className} bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold border-2 border-neutral-300`}
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
      className={`${sizeClass} ${shapeClass} ${className} object-cover`}
      title={alt}
    />
  )
}
