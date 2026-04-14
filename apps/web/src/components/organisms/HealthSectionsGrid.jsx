import React from "react";
import Badge from "../atoms/Badge";
import SectionHealthCard from "../molecules/SectionHealthCard";

const HealthSectionsGrid = ({
  dangerSecs,
  warningSecs,
  okSecs,
  nodataSecs,
}) => {
  return (
    <>
      {/* ── Critical Warnings First ── */}
      {dangerSecs.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-6 px-4">
            <Badge
              variant="danger"
              glow
              className="px-5 py-1 tracking-[0.4em] font-black text-[10px] rounded-full"
            >
              CRITICAL STATUS
            </Badge>
            <div className="h-px flex-1 bg-linear-to-r from-danger/30 via-danger/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {dangerSecs.map((s) => (
              <SectionHealthCard key={s.section} sec={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── Attention Warnings ── */}
      {warningSecs.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-6 px-4">
            <Badge
              variant="warning"
              glow
              className="px-5 py-1 tracking-[0.4em] font-black text-[10px] rounded-full"
            >
              OBSERVATION MODE
            </Badge>
            <div className="h-px flex-1 bg-linear-to-r from-warning/30 via-warning/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {warningSecs.map((s) => (
              <SectionHealthCard key={s.section} sec={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── OK Sections ── */}
      {okSecs.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-6 px-4">
            <Badge
              variant="success"
              glow
              className="px-5 py-1 tracking-[0.4em] font-black text-[10px] rounded-full"
            >
              OPTIMIZED ZONE
            </Badge>
            <div className="h-px flex-1 bg-linear-to-r from-success/30 via-success/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {okSecs.map((s) => (
              <SectionHealthCard key={s.section} sec={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── No Data ── */}
      {nodataSecs.length > 0 && (
        <details className="card p-0 overflow-hidden transition-all duration-500 group border-none shadow-premium opacity-50 hover:opacity-100 bg-tx-primary/[0.01]">
          <summary className="p-10 cursor-pointer list-none flex items-center justify-between hover:bg-tx-primary/[0.02]">
            <div className="flex items-center gap-6">
              <span className="text-3xl grayscale opacity-40">❄️</span>
              <span className="text-[12px] font-black text-tx-muted uppercase tracking-[0.4em]">
                Transactional Inactivity ({nodataSecs.length} Cold Sectors)
              </span>
            </div>
            <div className="text-tx-muted transition-transform group-open:rotate-180">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </summary>
          <div className="p-12 pt-6 grid grid-cols-1 md:grid-cols-3 gap-10 animate-in slide-in-from-top-4">
            {nodataSecs.map((s) => (
              <SectionHealthCard key={s.section} sec={s} />
            ))}
          </div>
        </details>
      )}
    </>
  );
};

export default HealthSectionsGrid;
