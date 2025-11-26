"use client";

import { useState, useRef, useEffect } from "react";
import { formatDate, formatDateISO } from "@/lib/utils";

interface DateSelectorProps {
  selected: string;
  onChange: (date: string) => void;
  availableDates?: string[];
}

export function DateSelector({
  selected,
  onChange,
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date(selected + "T12:00:00"));
  const containerRef = useRef<HTMLDivElement>(null);

  const today = formatDateISO(new Date());
  const selectedDate = new Date(selected + "T12:00:00");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get calendar data for the view month
  const getCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month days to fill the grid
    const remaining = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1));
  };

  const goToToday = () => {
    const todayDate = new Date();
    setViewDate(todayDate);
    onChange(formatDateISO(todayDate));
    setIsOpen(false);
  };

  const handleDateSelect = (date: Date) => {
    // Don't allow selecting past dates
    const dateStr = formatDateISO(date);
    if (dateStr < today) return;
    
    onChange(dateStr);
    setIsOpen(false);
  };

  const calendarDays = getCalendarDays();
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const monthYear = viewDate.toLocaleDateString("en-US", { 
    month: "long", 
    year: "numeric" 
  });

  return (
    <div className="calendar-selector" ref={containerRef}>
      <label className="selector-label">Date</label>
      
      <button
        className="calendar-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg className="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
        </svg>
        <span className="selected-date">{formatDate(selected)}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? "open" : ""}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="calendar-dropdown" role="dialog" aria-label="Date picker">
          {/* Navigation header */}
          <div className="calendar-header">
            <button 
              className="nav-btn"
              onClick={() => navigateMonth(-1)}
              aria-label="Previous month"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="month-year">{monthYear}</span>
            <button 
              className="nav-btn"
              onClick={() => navigateMonth(1)}
              aria-label="Next month"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Week day headers */}
          <div className="weekday-row">
            {weekDays.map((day) => (
              <span key={day} className="weekday">{day}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="calendar-grid">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = formatDateISO(date);
              const isToday = dateStr === today;
              const isSelected = dateStr === selected;
              const isPast = dateStr < today;
              
              return (
                <button
                  key={idx}
                  className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${isPast ? "past-date" : ""}`}
                  onClick={() => handleDateSelect(date)}
                  disabled={isPast}
                  aria-disabled={isPast}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="calendar-footer">
            <button className="today-btn" onClick={goToToday}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
