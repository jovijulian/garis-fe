"use client";

import React from 'react';
import DatePicker, { registerLocale, ReactDatePickerCustomHeaderProps } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { id } from 'date-fns/locale/id';
import { FiCalendar, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

registerLocale('id', id);

interface SingleDateInputProps {
  value?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  selectedDateProp?: Date | null;
  showClearFilterIcon?: boolean;
  onClearFilter?: (event: React.MouseEvent<HTMLButtonElement | HTMLSpanElement, MouseEvent>) => void;
  placeholderText?: string;
  maxDate?: Date;
}

const CustomSingleDateInput = React.forwardRef<HTMLButtonElement, SingleDateInputProps>(
  ({ value, onClick, selectedDateProp, showClearFilterIcon, onClearFilter, placeholderText = "Pilih tanggal" }, ref) => {
    let buttonText = placeholderText;
    if (selectedDateProp) {
      buttonText = selectedDateProp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
      <button
        type="button"
        onClick={onClick}
        ref={ref}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
      >
        <div className="flex items-center gap-3 truncate">
          <FiCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="truncate text-left ">{buttonText}</span>
        </div>
        {showClearFilterIcon && onClearFilter && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClearFilter(e); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClearFilter(e as any); } }}
            className="px-1 -mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full cursor-pointer"
            aria-label="Reset filter tanggal"
          >
            <FiX className="w-4 h-4" />
          </span>
        )}
      </button>
    );
  }
);
CustomSingleDateInput.displayName = "CustomSingleDateInput";


interface SingleDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  onMonthChange: (date: Date) => void;
  onCalendarOpen?: () => void;
  onCalendarClose?: () => void;
  onClearFilter: () => void;
  viewingMonthDate: Date;
  placeholderText?: string;
  maxDate?: Date;
}

export default function SingleDatePicker({
  selectedDate,
  onChange,
  onMonthChange,
  onCalendarOpen,
  onCalendarClose,
  onClearFilter,
  viewingMonthDate,
  placeholderText = "Pilih tanggal",
  maxDate
}: SingleDatePickerProps) {

  const showClearDateFilterButton = !!selectedDate;
  const years = Array.from(
    { length: new Date().getFullYear() - 1989 },
    (_, i) => new Date().getFullYear() - i
  );

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return (
    <DatePicker
      selected={selectedDate}
      onChange={onChange}
      //
      onMonthChange={onMonthChange}
      onCalendarOpen={onCalendarOpen}
      onCalendarClose={onCalendarClose}
      customInput={
        <CustomSingleDateInput
          selectedDateProp={selectedDate}
          showClearFilterIcon={showClearDateFilterButton}
          onClearFilter={onClearFilter}
          placeholderText={placeholderText}
        />}
      locale="id"
      wrapperClassName='w-full'
      dateFormat="dd/MM/yyyy"
      showPopperArrow={false}
      popperPlacement="bottom-start"
      calendarClassName="bg-white dark:!bg-slate-700 !border !border-gray-300 dark:!border-slate-600 !rounded-md !shadow-lg p-1 text-sm"
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }: ReactDatePickerCustomHeaderProps) => (
        <div className="flex items-center justify-between px-2 py-2">
          <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
            <FiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={months[date.getMonth()]}
                onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                className="appearance-none cursor-pointer rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1.5 pl-3 pr-8 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>

            <div className="relative">
              <select
                value={date.getFullYear()}
                onChange={({ target: { value } }) => changeYear(parseInt(value))}
                className="appearance-none cursor-pointer rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1.5 pl-3 pr-8 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          </div>
          <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
            <FiChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      )}
      dayClassName={d => {
        const baseDayStyle = "text-xs md:text-sm items-center !rounded-full transition-colors duration-150 !w-8 !py-[3px] mx-auto";
        const today = new Date();
        const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

        if (d.getMonth() !== viewingMonthDate.getMonth()) {
          return `${baseDayStyle} !text-gray-300 dark:!text-gray-500 !select-none !cursor-not-allowed opacity-50`;
        }

        let dayStyles = `${baseDayStyle} !text-gray-700 dark:!text-gray-200`;
        dayStyles += " hover:!bg-blue-500 hover:!text-white dark:hover:!bg-blue-600";

        if (isToday) {
          dayStyles += " !bg-blue-100 dark:!bg-blue-500/30 !font-semibold !text-blue-600 dark:!text-blue-300";
          dayStyles += " hover:!bg-blue-600 dark:hover:!bg-blue-500 hover:!text-white";
        }

        const isSelected = selectedDate && d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
        if (isSelected) {
          dayStyles += " !bg-blue-600 dark:!bg-blue-500 !text-white !font-bold";
        }

        return dayStyles;
      }}
      maxDate={maxDate}
    />
  );
}