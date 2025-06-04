import * as React from 'react';
import { cn } from '@/lib/utils';

// Simple Select Context
interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

// Main Select Component
interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({ children, value, onValueChange, defaultValue }) => {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ 
      value: currentValue, 
      onValueChange: handleValueChange,
      open,
      setOpen 
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Select Trigger
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={() => context?.setOpen(!context.open)}
        {...props}
      >
        {children}
        <svg
          className={cn('h-4 w-4 opacity-50 transition-transform', context?.open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

// Select Value
interface SelectValueProps {
  placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const context = React.useContext(SelectContext);
  
  return (
    <span className={cn(!context?.value && 'text-gray-500')}>
      {context?.value || placeholder}
    </span>
  );
};

// Select Content
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const context = React.useContext(SelectContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        context?.setOpen(false);
      }
    };
    
    if (context?.open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [context?.open]);
  
  if (!context?.open) return null;
  
  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
};

// Select Item
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children, className }) => {
  const context = React.useContext(SelectContext);
  const isSelected = context?.value === value;
  
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100',
        isSelected && 'bg-blue-50 text-blue-600',
        className
      )}
      onClick={() => context?.onValueChange?.(value)}
    >
      {isSelected && (
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {children}
    </div>
  );
};

// Additional components for API compatibility
const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

const SelectLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn('px-3 py-1.5 text-sm font-semibold text-gray-900', className)}>
    {children}
  </div>
);

const SelectSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('mx-1 my-1 h-px bg-gray-200', className)} />
);

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
