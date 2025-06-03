import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg h-32 w-full"></div>
      <div className="mt-4 space-y-2">
        <div className="bg-gray-200 rounded h-4 w-3/4"></div>
        <div className="bg-gray-200 rounded h-4 w-1/2"></div>
      </div>
    </div>
  )
}