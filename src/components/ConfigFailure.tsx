import type { SiteConfigFailure } from "@/lib/siteConfig";

interface Props {
  failure: SiteConfigFailure;
}

export function ConfigFailure({ failure }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-6">
      <div className="max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-red-800">Config Sheet error</h1>
        <p className="mt-2 text-sm text-neutral-700">
          The application could not load required configuration from Google Sheets.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-neutral-500">Reason</dt>
            <dd className="text-neutral-900">{failure.reason}</dd>
          </div>
          {failure.key ? (
            <div>
              <dt className="font-medium text-neutral-500">Key</dt>
              <dd className="font-mono text-neutral-900">{failure.key}</dd>
            </div>
          ) : null}
          {failure.detail ? (
            <div>
              <dt className="font-medium text-neutral-500">Detail</dt>
              <dd className="text-neutral-900">{failure.detail}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
