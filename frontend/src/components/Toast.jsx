import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, isError = false, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`app-toast ${isError ? 'error' : ''}`} role="status" aria-live="polite">
      {isError ? (
        <AlertCircle size={18} className="text-warning flex-shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="text-success flex-shrink-0" />
      )}
      <div className="flex-grow-1" style={{ fontSize: '0.88rem' }}>
        {message}
      </div>
      <button
        type="button"
        className="btn-close btn-close-white p-1"
        style={{ fontSize: '0.75rem' }}
        onClick={onClose}
        aria-label="Close"
      />
    </div>
  );
}
