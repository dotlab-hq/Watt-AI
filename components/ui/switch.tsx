"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef, useCallback, useId } from "react";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const id = useId();
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onCheckedChange?.(e.target.checked);
      },
      [onCheckedChange]
    );

    return (
      <label
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border/60 bg-input/40 transition-colors",
          "data-[checked=true]:bg-primary/80",
          className
        )}
        data-checked={checked}
        htmlFor={id}
      >
        <span
          className={cn(
            "pointer-events-none block h-3.5 w-3.5 rounded-full bg-muted-foreground shadow-sm transition-transform",
            "translate-x-0.5 data-[checked=true]:translate-x-[18px] data-[checked=true]:bg-primary-foreground"
          )}
          data-checked={checked}
        />
        <input
          ref={ref}
          checked={checked}
          className="sr-only"
          id={id}
          onChange={handleChange}
          type="checkbox"
          {...props}
        />
      </label>
    );
  }
);
Switch.displayName = "Switch";
