"use client";

import React from "react";
import { m } from "framer-motion";
import { CountUp } from "@/components/ui/CountUp";
import { useLocale } from "@/i18n/LocaleContext";
import type { SiteStats } from "@/lib/stats";

const statConfig = [
  { key: "killed" as const, suffix: "+", prefix: "" },
  { key: "injured" as const, suffix: "+", prefix: "" },
  { key: "usKilled" as const, suffix: "", prefix: "" },
  { key: "israeliKilled" as const, suffix: "", prefix: "" },
  { key: "jets" as const, suffix: "", prefix: "~" },
  { key: "targets" as const, suffix: "+", prefix: "" },
  { key: "missiles" as const, suffix: "+", prefix: "" },
  { key: "countries" as const, suffix: "", prefix: "" },
];

interface StatsBarProps {
  stats: SiteStats | null;
}

export const StatsBar = ({ stats }: StatsBarProps) => {
  const { dict, locale } = useLocale();
  const isFa = locale === "fa";
  const monoClass = isFa ? "" : "font-mono";

  if (!stats) return null;

  return (
    <section className="relative py-12 border-y border-red-500/10 bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.05),transparent_70%)]" />
      <div className="relative max-w-6xl mx-auto px-4">
        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6"
        >
          {statConfig.map((stat, i) => (
            <m.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-black text-white mb-1">
                <CountUp
                  end={stats[stat.key]}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  duration={2.5}
                />
              </div>
              <div className={`text-[10px] md:text-xs ${monoClass} tracking-widest text-zinc-500 uppercase`}>
                {dict.stats[stat.key]}
              </div>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
};
