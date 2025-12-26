import type React from "react";
import { useFieldContext } from "@/hooks/use-app-form";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ErrorField } from "./error-field";

export function TextField(
  props: {
    label: string;
    required?: boolean;
    children?: React.ReactNode;
  } & React.ComponentProps<"input">
) {
  const field = useFieldContext<string>();

  return (
    <div className={cn("space-y-2", props.className)}>
      <Label htmlFor={field.name}>
        {props.label}
        {!!props.required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex flex-row gap-4">
        <Input
          id={field.name}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={props.label}
          type="text"
          value={field.state.value}
          {...props}
          // biome-ignore lint/correctness/noChildrenProp: override the children prop as this is an input element
          children={undefined}
        />
        {props.children}
      </div>
      <ErrorField field={field} />
    </div>
  );
}
