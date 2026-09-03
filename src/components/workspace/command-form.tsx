import { useState, type ReactNode, type SubmitEvent } from "react";
import type { Command } from "../../core/domain/commands";
import { useOnceState, useOnceStore } from "../../core/store/once-provider";
import { executeFromUI } from "../../core/store/ui-commands";

export const field = (data: FormData, name: string) => String(data.get(name) ?? "");

export function CommandForm({ children, command, reset = false, label }: {
  children: ReactNode; command: (data: FormData) => Command; reset?: boolean; label: string;
}) {
  const store = useOnceStore();
  const { stateVersion } = useOnceState();
  const [message, setMessage] = useState<{ ok: boolean; text: string; stateVersion: number } | null>(null);
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = executeFromUI(store, command(new FormData(form)));
    setMessage({ ok: result.ok, text: result.ok ? result.summary : result.error.message, stateVersion: result.stateVersion });
    if (result.ok && reset) form.reset();
  }
  return <form aria-label={label} onSubmit={submit} className="command-form">
    {children}
    {message && message.stateVersion === stateVersion ? <p className={message.ok ? "form-success" : "error"} role={message.ok ? "status" : "alert"}>{message.text}</p> : null}
  </form>;
}
