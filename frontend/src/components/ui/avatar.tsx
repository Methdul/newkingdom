import * as React from "react"
import { cn } from "@/lib/utils"

// Avatar Root Component
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16'
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Avatar.displayName = "Avatar"

// Avatar Image Component
interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, onLoadingStatusChange, onLoad, onError, ...props }, ref) => {
    const [imageLoadingStatus, setImageLoadingStatus] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
    
    React.useEffect(() => {
      if (props.src) {
        setImageLoadingStatus('loading')
        onLoadingStatusChange?.('loading')
      }
    }, [props.src, onLoadingStatusChange])
    
    const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setImageLoadingStatus('loaded')
      onLoadingStatusChange?.('loaded')
      onLoad?.(event)
    }
    
    const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setImageLoadingStatus('error')
      onLoadingStatusChange?.('error')
      onError?.(event)
    }
    
    if (imageLoadingStatus === 'error' || !props.src) {
      return null
    }
    
    return (
      <img
        ref={ref}
        className={cn("aspect-square h-full w-full object-cover", className)}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

// Avatar Fallback Component
interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  delayMs?: number
}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, delayMs = 0, children, ...props }, ref) => {
    const [canRender, setCanRender] = React.useState(delayMs === 0)
    
    React.useEffect(() => {
      if (delayMs > 0) {
        const timer = setTimeout(() => setCanRender(true), delayMs)
        return () => clearTimeout(timer)
      }
    }, [delayMs])
    
    if (!canRender) {
      return null
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium dark:bg-gray-800 dark:text-gray-300",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"

// Complete Avatar Component (combines Image and Fallback)
interface CompleteAvatarProps {
  src?: string
  alt?: string
  fallback: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const CompleteAvatar: React.FC<CompleteAvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  className
}) => {
  const [imageStatus, setImageStatus] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  
  return (
    <Avatar size={size} className={className}>
      <AvatarImage 
        src={src} 
        alt={alt}
        onLoadingStatusChange={setImageStatus}
      />
      {(imageStatus === 'error' || imageStatus === 'idle' || !src) && (
        <AvatarFallback>{fallback}</AvatarFallback>
      )}
    </Avatar>
  )
}

// Utility function to generate initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Avatar with status indicator
interface AvatarWithStatusProps extends CompleteAvatarProps {
  status?: 'online' | 'offline' | 'away' | 'busy'
  showStatus?: boolean
}

const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  status = 'offline',
  showStatus = false,
  ...avatarProps
}) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  }
  
  return (
    <div className="relative">
      <CompleteAvatar {...avatarProps} />
      {showStatus && (
        <div className={cn(
          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
          statusColors[status]
        )} />
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, CompleteAvatar, AvatarWithStatus }