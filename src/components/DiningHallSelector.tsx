"use client";

import { DINING_HALLS, type DiningHallSlug } from "@/lib/scraper/config";

interface DiningHallSelectorProps {
  selected: DiningHallSlug;
  onChange: (slug: DiningHallSlug) => void;
}

export function DiningHallSelector({
  selected,
  onChange,
}: DiningHallSelectorProps) {
  const halls = Object.entries(DINING_HALLS).map(([slug, info]) => ({
    slug: slug as DiningHallSlug,
    name: info.name,
  }));

  return (
    <div className="dining-hall-selector">
      <label htmlFor="dining-hall" className="selector-label">
        Dining Hall
      </label>
      <select
        id="dining-hall"
        value={selected}
        onChange={(e) => onChange(e.target.value as DiningHallSlug)}
        className="selector-select"
      >
        {halls.map((hall) => (
          <option key={hall.slug} value={hall.slug}>
            {hall.name}
          </option>
        ))}
      </select>
    </div>
  );
}

