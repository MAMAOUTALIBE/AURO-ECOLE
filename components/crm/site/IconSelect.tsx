"use client";

import { SITE_ICON_NAMES, resolveSiteIcon } from "@/lib/site-icons";

// Sélecteur d'icône (parmi le registre CMS) avec aperçu visuel.
export function IconSelect({
  value,
  onChange,
  label = "Icône"
}: {
  value?: string;
  onChange: (icon: string) => void;
  label?: string;
}) {
  const Preview = resolveSiteIcon(value);

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-loden-50 text-loden-700">
        <Preview className="h-4 w-4" aria-hidden="true" />
      </span>
      <select
        className="field-input"
        value={value && SITE_ICON_NAMES.includes(value) ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        <option value="">— Icône —</option>
        {SITE_ICON_NAMES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
