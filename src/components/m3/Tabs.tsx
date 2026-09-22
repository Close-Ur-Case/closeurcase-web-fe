import type { ReactNode } from "react";
import { MdTabsEl, MdPrimaryTabEl, MdSecondaryTabEl } from "./elements";

/**
 * Controlled M3 tab bar. Unlike Radix tabs, md-tabs drives its own selection
 * UI purely off `activeTabIndex`; content panels are rendered separately by
 * the caller (matching how the app already structures tab content).
 */
export function Tabs({
  value,
  onChange,
  tabs,
  variant = "primary",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  tabs: { value: string; label: string; icon?: ReactNode }[];
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const TabEl = variant === "primary" ? MdPrimaryTabEl : MdSecondaryTabEl;
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.value === value),
  );
  return (
    <MdTabsEl
      className={className}
      activeTabIndex={activeIndex}
      onChange={(e) => {
        const idx = (e.target as unknown as { activeTabIndex: number }).activeTabIndex;
        const next = tabs[idx];
        if (next) onChange(next.value);
      }}
    >
      {tabs.map((tab) => (
        <TabEl key={tab.value}>
          {tab.icon && <span slot="icon">{tab.icon}</span>}
          {tab.label}
        </TabEl>
      ))}
    </MdTabsEl>
  );
}
