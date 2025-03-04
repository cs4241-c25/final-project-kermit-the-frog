'use client';
import { useEffect, useRef } from 'react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message, 
  confirmText = 'Yes', 
  cancelText = 'No' 
}) {
  const modalRef = useRef(null);
  
  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle keyboard events (Escape to close)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-primary max-w-md w-full rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-4 border-b border-text/10">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        
        <div className="p-4">
          <p className="text-text/80">{message}</p>
        </div>
        
        <div className="flex justify-end gap-2 p-4 bg-secondary/10">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-500 hover:bg-gray-600 text-white transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-md bg-accent hover:bg-accent/80 text-white transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 