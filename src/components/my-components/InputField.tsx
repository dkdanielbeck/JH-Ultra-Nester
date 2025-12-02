import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { ReactNode } from "react";

interface InputFieldProps {
  id: string;
  label?: ReactNode;
  placeholder?: string;
  number?: boolean;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export default function InputField({
  id,
  label,
  number,
  placeholder,
  value,
  onChange,
  className,
}: InputFieldProps) {
  return (
    <div>
      <Label className="mb-1 ml-1" htmlFor={id}>
        {label}
      </Label>
      <Input
        className={className}
        id={id}
        placeholder={placeholder}
        type="text"
        inputMode={number ? "decimal" : undefined}
        lang="da"
        pattern={number ? "[0-9]+([,.][0-9]+)?" : undefined}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
