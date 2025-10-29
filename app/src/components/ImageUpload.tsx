/**
 * ImageUpload Component
 * Displays current image and allows uploading a new one
 * NOW USES SUPABASE STORAGE (no more base64!)
 */

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

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
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClass = sizeClasses[size]
  const shapeClass = circular ? 'rounded-full' : 'rounded-lg'

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true)

    try {
      // Create preview URL for immediate feedback
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      console.log('📤 Uploading to Supabase Storage:', filePath)

      // Upload to Supabase Storage (avatars bucket)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ Upload error:', error)
        throw error
      }

      console.log('✅ Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('🔗 Public URL:', publicUrl)

      // Call parent's onUpload with the public URL (NOT base64!)
      onUpload(publicUrl)

      // Clean up object URL
      URL.revokeObjectURL(objectUrl)

    } catch (error: any) {
      console.error('Failed to upload image:', error)
      alert(`Upload failed: ${error.message || 'Unknown error'}`)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsUploading(false)
    }
  }

  const displayUrl = previewUrl || currentUrl

  return (
    <div className="flex items-center gap-4">
      {/* Image Preview */}
      <div className="flex-shrink-0 relative">
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt={altText}
              className={`${sizeClass} ${shapeClass} object-cover border-2 border-neutral-300`}
            />
            {isUploading && (
              <div className={`absolute inset-0 ${shapeClass} bg-black bg-opacity-50 flex items-center justify-center`}>
                <div className="text-white text-xs font-medium">Uploading...</div>
              </div>
            )}
          </>
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
          disabled={isUploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium rounded-lg transition-colors border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : label}
        </button>
        {displayUrl && !isUploading && (
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
