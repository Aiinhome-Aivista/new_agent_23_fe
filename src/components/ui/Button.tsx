import * as React from "react"
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger" | "success" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "xs";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-primary text-primary-foreground hover:bg-hover-orange shadow-sm',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-hover-orange shadow-sm',
  outline:
    'border border-light-border bg-secondary text-primary-foreground hover:bg-primary-hover shadow-sm',
  ghost: 'bg-transparent text-foreground hover:bg-primary-hover',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  success: 'bg-green-500 text-white hover:bg-green-600 shadow-sm',
  link: 'text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto shadow-none',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-1.5',
  default: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-8 text-base gap-2',
  icon: 'h-9 w-9 p-0 items-center justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'default',
    size = 'default',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    disabled,
    children,
    asChild,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        // base
        'inline-flex items-center justify-center font-medium rounded-md whitespace-nowrap',
        'transition-colors duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
      ) : (
        leftIcon && <span className="inline-flex shrink-0 mr-2">{leftIcon}</span>
      )}
      {children && <span className="truncate">{children}</span>}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0 ml-2">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = "Button";
