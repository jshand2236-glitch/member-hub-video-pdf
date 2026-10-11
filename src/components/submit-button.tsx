"use client";

import { useFormStatus } from "react-dom";

/**
 * A form submit button that disables itself and shows `pendingLabel` while
 * its server action runs, so a click gets instant visible feedback. With
 * `confirmMessage`, asks for confirmation first (for deletes).
 */
export default function SubmitButton({
  children,
  pendingLabel,
  confirmMessage,
  className,
  disabled,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: React.ReactNode;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...rest}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${className ?? ""} ${pending ? "cursor-wait opacity-60" : ""}`}
    >
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
