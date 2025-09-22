import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  addHours,
  isAfter,
  isBefore,
  parseISO,
  setHours,
  setMinutes
} from 'date-fns';
import { FaCalendarAlt, FaClock, FaChevronLeft, FaChevronRight, FaCheck } from 'react-icons/fa';
import '../stylesheets/datetime-picker.css';

/**
 * DateTimePicker - Advanced date and time selection component
 * Provides calendar interface with available time slots for booking
 * 
 * @param {Object} props
 * @param {Date} props.selectedDate - Currently selected date
 * @param {string} props.selectedTime - Currently selected time (HH:MM format)
 * @param {number} props.duration - Duration in hours
 * @param {Function} props.onDateChange - Callback when date changes
 * @param {Function} props.onTimeChange - Callback when time changes
 * @param {Function} props.onDurationChange - Callback when duration changes
 * @param {Array} props.unavailableDates - Array of dates that are not available
 * @param {Array} props.unavailableSlots - Array of time slots not available
 * @param {Date} props.minDate - Minimum selectable date (defaults to today)
 * @param {Date} props.maxDate - Maximum selectable date
 */
export default function DateTimePicker({
  selectedDate = new Date(),
  selectedTime = '10:00',
  duration = 2,
  onDateChange,
  onTimeChange,
  onDurationChange,
  unavailableDates = [],
  unavailableSlots = [],
  minDate = new Date(),
  maxDate = addMonths(new Date(), 3)
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  
  // Format the date for display
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  
  // Time slot generation - typically 30 minute intervals
  useEffect(() => {
    // Generate time slots from 6:00 to 22:00 (business hours)
    const slots = [];
    const startHour = 6; // 6:00 AM
    const endHour = 22; // 10:00 PM
    const interval = 30; // minutes
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Skip if this time slot is unavailable for the selected date
        const isUnavailable = unavailableSlots.some(slot => {
          const [slotDate, slotTime] = slot.split('T');
          return format(selectedDate, 'yyyy-MM-dd') === slotDate && slotTime === time;
        });
        
        if (!isUnavailable) {
          slots.push(time);
        }
      }
    }
    
    setAvailableTimeSlots(slots);
  }, [selectedDate, unavailableSlots]);
  
  // Handle month navigation
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Check if a date is unavailable
  const isDateUnavailable = (date) => {
    return unavailableDates.some(unavailableDate => 
      isSameDay(parseISO(unavailableDate), date)
    );
  };
  
  // Check if a date is selectable (within min/max range and not unavailable)
  const isDateSelectable = (date) => {
    return (
      !isDateUnavailable(date) && 
      !isBefore(date, minDate) && 
      !isAfter(date, maxDate)
    );
  };
  
  // Render the calendar header
  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <motion.button 
          onClick={prevMonth}
          disabled={isBefore(startOfMonth(currentMonth), startOfMonth(minDate))}
          className="month-nav-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaChevronLeft />
        </motion.button>
        <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
        <motion.button 
          onClick={nextMonth}
          disabled={isAfter(startOfMonth(currentMonth), startOfMonth(maxDate))}
          className="month-nav-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaChevronRight />
        </motion.button>
      </div>
    );
  };
  
  // Render days of the week
  const renderDays = () => {
    const days = [];
    const start = startOfWeek(currentMonth);
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="day-name">
          {format(addDays(start, i), 'EEEEE')}
        </div>
      );
    }
    
    return <div className="days-row">{days}</div>;
  };
  
  // Render the calendar cells (dates)
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isSelectable = isDateSelectable(cloneDay);
        const isSelected = isSameDay(day, selectedDate);
        
        days.push(
          <motion.div 
            key={day}
            className={`cell ${
              !isSameMonth(day, monthStart) ? 'disabled' : 
              !isSelectable ? 'unavailable' : 
              isSelected ? 'selected' : ''
            }`}
            onClick={() => {
              if (isSelectable && isSameMonth(day, monthStart)) {
                onDateChange(cloneDay);
                setCalendarOpen(false);
              }
            }}
            whileHover={isSelectable ? { scale: 1.1, backgroundColor: '#e6f7ff' } : {}}
            whileTap={isSelectable ? { scale: 0.95 } : {}}
          >
            <span className="number">{format(day, 'd')}</span>
            {isSelected && (
              <motion.span 
                className="selected-marker"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.div>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={day} className="row">
          {days}
        </div>
      );
      
      days = [];
    }
    
    return <div className="calendar-body">{rows}</div>;
  };
  
  // Render time slot selector
  const renderTimeSlots = () => {
    return (
      <div className="time-slots">
        {availableTimeSlots.map(time => (
          <motion.div
            key={time}
            className={`time-slot ${time === selectedTime ? 'selected' : ''}`}
            onClick={() => {
              onTimeChange(time);
              setTimePickerOpen(false);
            }}
            whileHover={{ scale: 1.05, backgroundColor: '#e6f7ff' }}
            whileTap={{ scale: 0.95 }}
          >
            {time}
            {time === selectedTime && (
              <FaCheck className="time-selected-icon" />
            )}
          </motion.div>
        ))}
        {availableTimeSlots.length === 0 && (
          <div className="no-slots-message">
            No available time slots for this date.
          </div>
        )}
      </div>
    );
  };
  
  // Render duration selector
  const renderDurationPicker = () => {
    // Available duration options (in hours)
    const durations = [1, 2, 3, 4, 8, 24];
    
    return (
      <div className="duration-picker">
        <div className="duration-label">Duration:</div>
        <div className="duration-options">
          {durations.map(hours => (
            <motion.button
              key={hours}
              className={`duration-option ${duration === hours ? 'selected' : ''}`}
              onClick={() => onDurationChange(hours)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {hours} hr{hours !== 1 ? 's' : ''}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="datetime-picker">
      <h3 className="datetime-title">Select Date & Time</h3>
      
      {/* Date Selector */}
      <div className="date-selector">
        <div className="input-label">
          <FaCalendarAlt className="input-icon" />
          <span>Date</span>
        </div>
        <motion.button 
          className="date-display"
          onClick={() => {
            setCalendarOpen(!calendarOpen);
            setTimePickerOpen(false);
          }}
          whileHover={{ backgroundColor: '#f0f9ff' }}
        >
          {formattedDate}
          <FaChevronDown className={`chevron ${calendarOpen ? 'open' : ''}`} />
        </motion.button>
        
        <AnimatePresence>
          {calendarOpen && (
            <motion.div 
              className="calendar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Time Selector */}
      <div className="time-selector">
        <div className="input-label">
          <FaClock className="input-icon" />
          <span>Time</span>
        </div>
        <motion.button 
          className="time-display"
          onClick={() => {
            setTimePickerOpen(!timePickerOpen);
            setCalendarOpen(false);
          }}
          whileHover={{ backgroundColor: '#f0f9ff' }}
        >
          {selectedTime}
          <FaChevronDown className={`chevron ${timePickerOpen ? 'open' : ''}`} />
        </motion.button>
        
        <AnimatePresence>
          {timePickerOpen && (
            <motion.div 
              className="time-picker"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTimeSlots()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Duration Picker */}
      {renderDurationPicker()}
    </div>
  );
}

// Helper components
const FaChevronDown = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 448 512" 
    width="10" 
    height="10"
    fill="currentColor"
  >
    <path d="M224 416c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L224 338.8l169.4-169.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-192 192C240.4 412.9 232.2 416 224 416z" />
  </svg>
);