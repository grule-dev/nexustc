import type React from "react";
import { useFormContext } from "@/hooks/use-app-form";
import { Button } from "../ui/button";

export function SubmitButton(
  props: Omit<React.ComponentProps<typeof Button>, "type">
) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button
          {...props}
          disabled={!canSubmit}
          loading={isSubmitting}
          type="submit"
        />
      )}
    </form.Subscribe>
  );
}
