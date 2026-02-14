"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface InputFieldProps
  extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={inputId} className="text-foreground">
            {label}
          </Label>
        )}
        <Input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          className={cn(error && "border-destructive focus-visible:ring-destructive/20")}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export { InputField };
