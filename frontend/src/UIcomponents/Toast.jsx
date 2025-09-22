import React, { useEffect } from 'react';
import '../stylesheets/components.css';

export default function Toast({ message, type = 'info', onClose, duration = 2500 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;
  return (
    <div className={`toast toast-${type}`}>{message}</div>
  );
}


