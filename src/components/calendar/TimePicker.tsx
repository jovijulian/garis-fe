import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  label: string;
  value: string; // 'HH:mm'
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^\d]/g, '');
    const sanitized = input.slice(0, 4);

    let formatted = sanitized;
    if (sanitized.length > 2) {
      formatted = `${sanitized.slice(0, 2)}:${sanitized.slice(2)}`;
    }
    
    setDisplayValue(formatted);
    
    if (formatted.length === 5) {
      onChange(formatted);
    }
  };

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hoursStr, minutesStr] = e.target.value.split(':');
    let hours = parseInt(hoursStr || '0', 10);
    let minutes = parseInt(minutesStr || '0', 10);

    if (hours > 23) hours = 23;
    if (minutes > 59) minutes = 59;

    const finalTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    setDisplayValue(finalTime);
    onChange(finalTime);
  };

  return (
    <div className="w-full">
      <label htmlFor={label} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Clock className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text" 
          id={label}
          name={label}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur} 
          disabled={disabled}
          required={required}
          placeholder="HH:mm"
          maxLength={5}
          className="
            block w-full rounded-md border 
            border-gray-300 bg-white py-2 pl-10 pr-3 
            text-gray-900 shadow-sm
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 
            sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-50
          "
        />
      </div>
    </div>
  );
};

export default TimePicker;