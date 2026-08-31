"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon,
      iconRight,
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />
        )}
        {children}
        {iconRight && !loading && (
          <Icon name={iconRight} size={size === "sm" ? 16 : 18} />
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
