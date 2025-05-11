import React, { useEffect } from 'react';

/**
 * Toast component for displaying messages
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Type of toast ('info', 'success', 'error', 'warning')
 * @param {Function} props.onClose - Function to call when closing the toast
 * @param {number} props.duration - Duration in ms before auto-closing (default: 3000)
 */
const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    // Auto close after duration
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`toast-container`}>
      <div className={`toast ${type}`}>
        <span>{message}</span>
        <button className="toast-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default Toast;