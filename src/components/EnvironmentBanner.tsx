type BannerKind = "none" | "staging" | "local";

interface Props {
  kind: BannerKind;
}

export function EnvironmentBanner({ kind }: Props) {
  if (kind === "none") return null;
  const label = kind === "staging" ? "Staging" : "Local";
  const cls =
    kind === "staging"
      ? "bg-amber-400 text-neutral-900"
      : "bg-orange-500 text-neutral-900";
  return (
    <div
      className={`w-full px-4 py-1 text-center text-sm font-medium ${cls}`}
      data-testid="environment-banner"
    >
      {label}
    </div>
  );
}
