/**
 * ImageUpload Component
 * Displays current image and allows uploading a new one
 * For simplicity, currently accepts file input and displays preview
 */

import { useState, useRef } from 'react'

interface ImageUploadProps {
  currentUrl?: string
  altText: string
  onUpload: (newUrl: string) => void
  circular?: boolean
  size?: 'sm' | 'md' | 'lg'
  fallbackInitials?: string
  label?: string
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
}

export function ImageUpload({
  currentUrl,
  altText,
  onUpload,
  circular = true,
  size = 'md',
  fallbackInitials = '??',
  label = 'Change Image'
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClass = sizeClasses[size]
  const shapeClass = circular ? 'rounded-full' : 'rounded-lg'

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreviewUrl(result)

      // For now, we'll use the data URL directly
      // In production, you might want to upload to Supabase Storage
      onUpload(result)
    }
    reader.readAsDataURL(file)
  }

  const displayUrl = previewUrl || currentUrl

  return (
    <div className="flex items-center gap-4">
      {/* Image Preview */}
      <div className="flex-shrink-0">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={altText}
            className={`${sizeClass} ${shapeClass} object-cover border-2 border-neutral-300`}
          />
        ) : (
          <div
            className={`${sizeClass} ${shapeClass} bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold border-2 border-neutral-300`}
          >
            {fallbackInitials}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium rounded-lg transition-colors border border-neutral-300"
        >
          {label}
        </button>
        {displayUrl && (
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null)
              onUpload('')
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className="ml-2 px-3 py-2 text-neutral-600 hover:text-error text-sm font-medium transition-colors"
          >
            Remove
          </button>
        )}
        <p className="text-xs text-neutral-500 mt-2">
          PNG, JPG, or SVG (max 5MB)
        </p>
      </div>
    </div>
  )
}
