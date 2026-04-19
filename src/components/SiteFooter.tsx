"use client";

import { Mail } from "lucide-react";
import type { SiteConfig } from "@/lib/siteConfig";

export type DeploymentFooterMeta = {
  environmentLabel: string;
  gitSha: string;
  deploymentId: string;
};

type Props = {
  siteConfig: SiteConfig;
  deployment: DeploymentFooterMeta;
};

/**
 * Global footer: copyright / deployment strip / mail contact (Config Sheet).
 */
export function SiteFooter({ siteConfig, deployment }: Props) {
  const mail = siteConfig.email_contact_address.trim();
  const mailto = `mailto:${mail}`;

  return (
    <footer className="mt-auto border-t border-neutral-800 bg-neutral-950 text-neutral-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-neutral-200">{siteConfig.footer_text}</p>
        <p className="text-center font-mono text-[11px] text-neutral-500 sm:flex-1">
          {deployment.environmentLabel}
          <span className="mx-1.5 opacity-60">•</span>
          {deployment.gitSha}
          <span className="mx-1.5 opacity-60">•</span>
          {deployment.deploymentId}
        </p>
        <p className="text-sm text-neutral-200 sm:text-right">
          Questions?{" "}
          <Mail className="mx-1 inline h-4 w-4 align-text-bottom text-blue-400" aria-hidden />
          <a href={mailto} className="font-medium text-blue-400 hover:underline">
            Contact Us
          </a>
        </p>
      </div>
    </footer>
  );
}
