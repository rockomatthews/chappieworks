"use client";

import { useActionState, useEffect, useState } from "react";
import {
  submitIntake,
  type IntakeFormType,
  type IntakeResult,
} from "../actions/intake";

export type IntakeField =
  | {
      kind: "text";
      name: string;
      label: string;
      placeholder?: string;
      required?: boolean;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      placeholder?: string;
      required?: boolean;
      rows?: number;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: string[];
      required?: boolean;
    }
  | {
      kind: "checkboxes";
      name: string;
      label: string;
      options: string[];
    };

export function IntakeForm({
  formType,
  fields,
  submitLabel,
}: {
  formType: IntakeFormType;
  fields: IntakeField[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<
    IntakeResult | null,
    FormData
  >(submitIntake, null);
  const [startedAt] = useState(() => Date.now());

  // Scroll the success banner into view when it appears.
  useEffect(() => {
    if (state?.ok) {
      const el = document.getElementById(`intake-result-${formType}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state, formType]);

  if (state?.ok) {
    return (
      <div
        id={`intake-result-${formType}`}
        className="card rounded-xl p-6 sm:p-8 ring-2 ring-[var(--color-gold)]"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3">
          Received
        </p>
        <h3 className="text-xl font-semibold mb-2">
          You&rsquo;re on the list.
        </h3>
        <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card rounded-xl p-6 sm:p-8 space-y-5">
      <input type="hidden" name="formType" value={formType} />
      <input type="hidden" name="startedAt" value={startedAt} />
      {/* Honeypot — hidden from sighted users + screen readers via aria-hidden. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label>
          Website URL
          <input
            type="text"
            name="website_url_confirm"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          kind="text"
          name="name"
          label="Your name"
          placeholder="Jane Smith"
          required
        />
        <Field
          kind="text"
          name="email"
          label="Email"
          placeholder="you@company.com"
          required
        />
      </div>

      {fields.map((f) => (
        <Field key={f.name} {...f} />
      ))}

      {state && !state.ok ? (
        <p
          role="alert"
          className="text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 rounded-md px-3 py-2"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Sending…" : submitLabel}
      </button>

      <p className="text-xs mono text-[var(--color-mute)] text-center">
        No card, no signup, no spam. Reply lands in my inbox; I reply within 24
        hours.
      </p>
    </form>
  );
}

function Field(props: IntakeField & { required?: boolean }) {
  const labelClass =
    "block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2";
  const inputClass =
    "w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50";

  if (props.kind === "text") {
    return (
      <div>
        <label className={labelClass} htmlFor={props.name}>
          {props.label}
          {props.required ? " *" : ""}
        </label>
        <input
          id={props.name}
          name={props.name}
          type={props.name === "email" ? "email" : "text"}
          placeholder={props.placeholder}
          required={props.required}
          className={inputClass}
        />
      </div>
    );
  }

  if (props.kind === "textarea") {
    return (
      <div>
        <label className={labelClass} htmlFor={props.name}>
          {props.label}
          {props.required ? " *" : ""}
        </label>
        <textarea
          id={props.name}
          name={props.name}
          placeholder={props.placeholder}
          required={props.required}
          rows={props.rows ?? 4}
          className={inputClass}
        />
      </div>
    );
  }

  if (props.kind === "select") {
    return (
      <div>
        <label className={labelClass} htmlFor={props.name}>
          {props.label}
          {props.required ? " *" : ""}
        </label>
        <select
          id={props.name}
          name={props.name}
          required={props.required}
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Choose one…
          </option>
          {props.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // checkboxes
  return (
    <fieldset>
      <legend className={labelClass}>{props.label}</legend>
      <div className="grid sm:grid-cols-2 gap-2">
        {props.options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 text-sm text-[var(--color-paper)]/90 cursor-pointer"
          >
            <input
              type="checkbox"
              name={props.name}
              value={opt}
              className="accent-[var(--color-gold)]"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
