import React, { useState, useEffect } from 'react';
import { format, addHours, setHours, setMinutes, isAfter, isBefore, addMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaInfoCircle } from 'react-icons/fa';
import '../../stylesheets/datetime-picker.css';

/**
 * Advanced DateTime Picker component with animation and validation
 */
const DateTimePicker = ({ 
  onDateChange,
  onTimeChange,
  onDurationChange,
  value = {
    date: null,
    time: null,
    duration: 1
  },
  minDate = new Date(),
  maxDate = addHours(new Date(), 24 * 14), // 2 weeks ahead
  businessHours = { start: 6, end: 22 }, // 6 AM to 10 PM
  availableTimeSlots = null, // Can be used to show/disable booked slots
  pricePerHour = 5.00
}) => {
  const [selectedDate, setSelectedDate] = useState(value.date ? new Date(value.date) : new Date());
  const [selectedTime, setSelectedTime] = useState(value.time || '');
  const [selectedDuration, setSelectedDuration] = useState(value.duration || 1);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [validated, setValidated] = useState(false);

  // Available durations in hours
  const durationOptions = [1, 2, 3, 4, 8, 12, 24];

  // Calculate total price
  const totalPrice = selectedDuration * pricePerHour;

  // Format date for display
  const formattedDate = selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : '';

  // Generate time slots (30 min intervals)
  const generateTimeSlots = () => {
    const slots = [];
    const { start, end } = businessHours;
    
    for (let hour = start; hour < end; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if the selected date is today
  const isToday = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Filter time slots if today (only show future times)
  const availableTimeSlots = timeSlots.filter(timeStr => {
    if (!isToday) return true;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotTime = setMinutes(setHours(new Date(), hours), minutes);
    return isAfter(slotTime, addMinutes(new Date(), 30)); // At least 30 min in the future
  });

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
    
    // Clear time if the selected date is different from the previous selection
    const prevDate = value.date ? new Date(value.date) : null;
    if (prevDate && format(prevDate, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) {
      setSelectedTime('');
    }
    
    // Validate and update parent
    validateAndUpdate({ date, time: selectedTime, duration: selectedDuration });
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setIsTimePickerOpen(false);
    
    // Validate and update parent
    validateAndUpdate({ date: selectedDate, time, duration: selectedDuration });
  };

  // Handle duration selection
  const handleDurationChange = (duration) => {
    const durationValue = parseInt(duration, 10);
    setSelectedDuration(durationValue);
    
    // Validate and update parent
    validateAndUpdate({ date: selectedDate, time: selectedTime, duration: durationValue });
  };

  // Validate selections and update parent component
  const validateAndUpdate = ({ date, time, duration }) => {
    const validationErrors = {};
    let isValid = true;
    
    // Date validation
    if (!date) {
      validationErrors.date = "Please select a date";
      isValid = false;
    } else if (isBefore(date, new Date()) && format(date, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')) {
      validationErrors.date = "Cannot select a past date";
      isValid = false;
    }
    
    // Time validation
    if (date && format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && time) {
      const [hours, minutes] = time.split(':').map(Number);
      const selectedDateTime = setMinutes(setHours(new Date(), hours), minutes);
      
      if (isBefore(selectedDateTime, addMinutes(new Date(), 30))) {
        validationErrors.time = "Must be at least 30 minutes from now";
        isValid = false;
      }
    }
    
    // Update errors state
    setErrors(validationErrors);
    setValidated(isValid);
    
    // Update parent component if valid
    if (isValid) {
      // Format date for API
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
      
      if (onDateChange) onDateChange(formattedDate);
      if (onTimeChange) onTimeChange(time);
      if (onDurationChange) onDurationChange(duration);
    }
    
    return isValid;
  };

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.date-picker-container, .time-picker-container')) {
        setIsDatePickerOpen(false);
        setIsTimePickerOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calendar grid for the date picker
  const renderCalendarGrid = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    // Days of the week headers
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Create calendar rows
    const calendarRows = [];
    let days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate && date.getDate() === selectedDate.getDate() && 
                          date.getMonth() === selectedDate.getMonth() && 
                          date.getFullYear() === selectedDate.getFullYear();
      
      const isPast = isBefore(date, today) && !format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      const isDisabled = isPast || isBefore(date, minDate) || isAfter(date, maxDate);
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? 'today' : ''}`}
          onClick={() => !isDisabled && handleDateSelect(date)}
        >
          {day}
        </div>
      );
      
      // Start a new row after Saturday (or after filling 7 days)
      if ((firstDayOfWeek + day) % 7 === 0 || day === daysInMonth) {
        calendarRows.push(<div key={`row-${calendarRows.length}`} className="calendar-row">{days}</div>);
        days = [];
      }
    }
    
    return (
      <div className="calendar-grid">
        <div className="calendar-header">
          <button 
            onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
            className="calendar-nav-btn"
          >
            &lt;
          </button>
          <span className="current-month">{format(selectedDate, 'MMMM yyyy')}</span>
          <button 
            onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
            className="calendar-nav-btn"
          >
            &gt;
          </button>
        </div>
        <div className="calendar-weekdays">
          {daysOfWeek.map(day => <div key={day} className="weekday">{day}</div>)}
        </div>
        {calendarRows}
      </div>
    );
  };

  return (
    <div className="datetime-picker-container">
      {/* Date Selection */}
      <div className="date-selection-container">
        <label className="datetime-label">
          <FaCalendarAlt className="icon" />
          Date:
        </label>
        <div className="date-picker-container">
          <div 
            className={`date-display ${errors.date ? 'has-error' : ''}`} 
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          >
            {formattedDate || 'Select Date'}
          </div>
          
          {isDatePickerOpen && (
            <motion.div 
              className="date-picker-dropdown"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderCalendarGrid()}
            </motion.div>
          )}
          
          {errors.date && (
            <div className="error-message">
              <FaInfoCircle /> {errors.date}
            </div>
          )}
        </div>
      </div>

      {/* Time Selection */}
      <div className="time-selection-container">
        <label className="datetime-label">
          <FaClock className="icon" />
          Time:
        </label>
        <div className="time-picker-container">
          <div 
            className={`time-display ${errors.time ? 'has-error' : ''}`}
            onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
          >
            {selectedTime || 'Select Time'}
          </div>
          
          {isTimePickerOpen && (
            <motion.div 
              className="time-picker-dropdown"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="time-slots-grid">
                {availableTimeSlots.map(time => (
                  <div 
                    key={time} 
                    className={`time-slot ${time === selectedTime ? 'selected' : ''}`}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {errors.time && (
            <div className="error-message">
              <FaInfoCircle /> {errors.time}
            </div>
          )}
        </div>
      </div>

      {/* Duration Selection */}
      <div className="duration-selection-container">
        <label className="datetime-label">
          Duration:
        </label>
        <div className="duration-selector">
          {durationOptions.map(duration => (
            <button
              key={duration}
              className={`duration-option ${selectedDuration === duration ? 'selected' : ''}`}
              onClick={() => handleDurationChange(duration)}
            >
              {duration}h
            </button>
          ))}
        </div>
      </div>

      {/* Price Display */}
      <motion.div 
        className="price-display"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="price-details">
          <div className="price-label">Estimated Price:</div>
          <div className="price-value">${totalPrice.toFixed(2)}</div>
        </div>
        <div className="price-breakdown">
          ${pricePerHour.toFixed(2)} × {selectedDuration} hour{selectedDuration !== 1 ? 's' : ''}
        </div>
      </motion.div>
    </div>
  );
};

export default DateTimePicker;