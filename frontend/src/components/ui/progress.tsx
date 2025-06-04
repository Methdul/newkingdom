import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    // Ensure value is between 0 and max
    const normalizedValue = Math.min(Math.max(0, value), max);
    const percentage = (normalizedValue / max) * 100;

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800',
          className
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={normalizedValue}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 bg-blue-600 transition-all duration-300 ease-in-out dark:bg-blue-400',
            indicatorClassName
          )}
          style={{ 
            transform: `translateX(-${100 - percentage}%)`,
            transition: 'transform 0.3s ease-in-out'
          }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// Alternative circular progress component
interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = false
}) => {
  const normalizedValue = Math.min(Math.max(0, value), max);
  const percentage = (normalizedValue / max) * 100;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-600 transition-all duration-300 ease-in-out dark:text-blue-400"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
};

// Progress with label
interface ProgressWithLabelProps extends ProgressProps {
  label?: string;
  showPercentage?: boolean;
}

const ProgressWithLabel: React.FC<ProgressWithLabelProps> = ({
  label,
  showPercentage = false,
  value = 0,
  max = 100,
  className,
  ...props
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && <span className="text-gray-500">{percentage}%</span>}
        </div>
      )}
      <Progress value={value} max={max} className={className} {...props} />
    </div>
  );
};

// Stepped progress component
interface SteppedProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

const SteppedProgress: React.FC<SteppedProgressProps> = ({
  currentStep,
  totalSteps,
  className
}) => {
  return (
    <div className={cn('flex space-x-2', className)}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber <= currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div
            key={stepNumber}
            className={cn(
              'flex h-2 flex-1 rounded-full transition-colors',
              isCompleted 
                ? 'bg-blue-600' 
                : isCurrent 
                ? 'bg-blue-300' 
                : 'bg-gray-200'
            )}
          />
        );
      })}
    </div>
  );
};

export { Progress, CircularProgress, ProgressWithLabel, SteppedProgress };