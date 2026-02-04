import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';

interface DateTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
}

function parseDateTime(value: string): { date: string; hours: number; minutes: number; hasTime: boolean } {
  if (!value) return { date: '', hours: 12, minutes: 0, hasTime: false };

  // Handle ISO datetime with timezone (e.g., "2024-01-15T14:30:00-05:00")
  if (value.includes('T')) {
    const [datePart, timePart] = value.split('T');
    const timeMatch = timePart.match(/^(\d{2}):(\d{2})/);
    if (timeMatch) {
      return {
        date: datePart,
        hours: parseInt(timeMatch[1], 10),
        minutes: parseInt(timeMatch[2], 10),
        hasTime: true,
      };
    }
    return { date: datePart, hours: 12, minutes: 0, hasTime: false };
  }

  // Date only
  return { date: value, hours: 12, minutes: 0, hasTime: false };
}

function formatDateTime(date: string, hours: number, minutes: number, includeTime: boolean): string {
  if (!date) return '';
  if (!includeTime) return date;

  // Get timezone offset in format +HH:MM or -HH:MM
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const offsetH = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
  const offsetM = (Math.abs(offset) % 60).toString().padStart(2, '0');
  const tz = `${sign}${offsetH}:${offsetM}`;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');

  return `${date}T${hh}:${mm}:00${tz}`;
}

function formatTimeDisplay(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const mm = minutes.toString().padStart(2, '0');
  return `${displayHours}:${mm} ${period}`;
}

export default function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  const parsed = parseDateTime(value);
  const [showTimePicker, setShowTimePicker] = useState(parsed.hasTime);
  const [hours, setHours] = useState(parsed.hours);
  const [minutes, setMinutes] = useState(parsed.minutes);

  const handleDateChange = (newDate: string) => {
    onChange(formatDateTime(newDate, hours, minutes, showTimePicker));
  };

  const handleHoursChange = (newHours: number) => {
    setHours(newHours);
    onChange(formatDateTime(parsed.date, newHours, minutes, true));
  };

  const handleMinutesChange = (newMinutes: number) => {
    setMinutes(newMinutes);
    onChange(formatDateTime(parsed.date, hours, newMinutes, true));
  };

  const handleToggleTime = () => {
    if (showTimePicker) {
      // Remove time
      setShowTimePicker(false);
      onChange(parsed.date);
    } else {
      // Add time
      setShowTimePicker(true);
      onChange(formatDateTime(parsed.date, hours, minutes, true));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="date"
          value={parsed.date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="flex-1 p-2 text-[11px] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--card-text)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--input-border)',
          }}
        />
        <button
          type="button"
          onClick={handleToggleTime}
          className={`px-3 rounded-xl flex items-center gap-1.5 text-[10px] font-bold transition-all ${
            showTimePicker
              ? 'bg-indigo-100 text-indigo-600'
              : 'hover:bg-indigo-50'
          }`}
          style={{
            background: showTimePicker ? undefined : 'var(--input-bg)',
            color: showTimePicker ? undefined : 'var(--card-text-muted)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: showTimePicker ? 'transparent' : 'var(--input-border)',
          }}
        >
          {showTimePicker ? <X size={12} /> : <Clock size={12} />}
          {showTimePicker ? formatTimeDisplay(hours, minutes) : 'Add time'}
        </button>
      </div>

      {showTimePicker && (
        <div className="p-3 rounded-xl space-y-3" style={{ background: 'var(--input-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--input-border)' }}>
          {/* Hours slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--card-text-muted)' }}>Hour</span>
              <span className="text-[11px] font-bold" style={{ color: 'var(--card-text)' }}>{hours.toString().padStart(2, '0')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => handleHoursChange(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{ background: `linear-gradient(to right, #6366f1 ${(hours / 23) * 100}%, var(--input-border) ${(hours / 23) * 100}%)` }}
            />
            <div className="flex justify-between text-[8px]" style={{ color: 'var(--card-text-muted)' }}>
              <span>12 AM</span>
              <span>12 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          {/* Minutes slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--card-text-muted)' }}>Minute</span>
              <span className="text-[11px] font-bold" style={{ color: 'var(--card-text)' }}>{minutes.toString().padStart(2, '0')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="59"
              step="5"
              value={minutes}
              onChange={(e) => handleMinutesChange(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{ background: `linear-gradient(to right, #6366f1 ${(minutes / 59) * 100}%, var(--input-border) ${(minutes / 59) * 100}%)` }}
            />
            <div className="flex justify-between text-[8px]" style={{ color: 'var(--card-text-muted)' }}>
              <span>00</span>
              <span>30</span>
              <span>59</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
