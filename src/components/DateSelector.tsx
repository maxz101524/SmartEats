"use client";

import { formatDate, formatDateISO } from "@/lib/utils";

interface DateSelectorProps {
  selected: string;
  onChange: (date: string) => void;
  availableDates?: string[];
}

export function DateSelector({
  selected,
  onChange,
  availableDates,
}: DateSelectorProps) {
  const today = formatDateISO(new Date());
  
  // Generate dates for the next 7 days
  const dates = [];
  for (let i = -3; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(formatDateISO(date));
  }

  return (
    <div className="date-selector">
      <label htmlFor="date" className="selector-label">
        Date
      </label>
      <div className="date-buttons">
        {dates.map((date) => {
          const isToday = date === today;
          const d = new Date(date + "T12:00:00");
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = d.getDate();

          return (
            <button
              key={date}
              onClick={() => onChange(date)}
              className={`date-button ${selected === date ? "selected" : ""} ${isToday ? "today" : ""}`}
              title={formatDate(date)}
            >
              <span className="day-name">{dayName}</span>
              <span className="day-num">{dayNum}</span>
              {isToday && <span className="today-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

