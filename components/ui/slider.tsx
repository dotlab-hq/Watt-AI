"use client";

import { cn } from "@/lib/utils";
import {
  type InputHTMLAttributes,
  forwardRef,
  useCallback,
  useId,
} from "react";

interface SliderProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "type"
  > {
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, "aria-label": ariaLabel, ...props }) => {
    const id = useId();
    const sliderId = ariaLabel ? undefined : id;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange?.([Number(e.target.value)]);
      },
      [onValueChange]
    );

    return (
      <input
        type="range"
        id={sliderId}
        aria-label={ariaLabel}
        className={cn(
          "w-full h-2 rounded-full appearance-none cursor-pointer",
          "bg-white/30 accent-white",
          " [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
          className
        )}
        value={(value ?? [0])[0]}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Slider.displayName = "Slider";
