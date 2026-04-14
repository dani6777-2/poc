import React from "react";
import { PageHeader } from "../molecules";
import { Spinner, Text } from "../atoms";

export default function DashboardTemplate({
  title,
  subtitle,
  icon,
  badge,
  headerAction,
  loading = false,
  loadingText = "Processing data vectors...",
  children,
  className = "",
}) {
  return (
    <div
      className={`pb-20 space-y-10 animate-in fade-in duration-500 w-full min-w-0 ${className}`}
    >
      {(title || subtitle) && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          badge={badge}
          actions={headerAction}
        />
      )}

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4 animate-pulse">
          <Spinner size="lg" />
          <Text
            variant="caption"
            className="tracking-[0.3em] font-black uppercase text-tx-muted"
          >
            {loadingText}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:p-10 w-full min-w-0">{children}</div>
      )}
    </div>
  );
}
