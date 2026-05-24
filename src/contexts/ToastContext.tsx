import { createContext, useContext, useState, type ReactNode } from 'react';

const ToastContext = createContext<any>(null);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: toast.type === 'error' ? '#d93025' : toast.type === 'success' ? '#105942' : '#2d2f31',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.3s ease'
        }}>
          {toast.type === 'success' && <span style={{ color: '#56e39f', fontWeight: 'bold', marginRight: '5px' }}>✓</span>}
          {toast.type === 'error' && <span style={{ color: '#ff5c5c', fontWeight: 'bold', marginRight: '5px' }}>✗</span>}
          {toast.type === 'info' && <span style={{ color: '#5cd6ff', fontWeight: 'bold', marginRight: '5px' }}>i</span>}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
