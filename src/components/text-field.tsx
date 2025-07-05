import type { ComponentProps, FC, ReactElement } from "react";
import { Label } from "./ui/label";

export interface TextFieldProps extends ComponentProps<"label"> {
  label: string;
  htmlFor: string;
  required?: boolean;
  input?: ReactElement;
  error?: string | null;
}

export const TextField: FC<TextFieldProps> = ({
  label,
  htmlFor,
  required = false,
  input,
  className,
  error,
  ...labelProps
}) => {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1 block text-sm" {...labelProps}>
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </Label>
      {input}
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
    </div>
  );
};
