import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modals, setModals] = useState({
    createApp: false,
    createSnapshot: false,
    auditLog: false,
  });

  const openModal = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: true }));
  });

  const closeModal = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: false }));
  });

  const value = useMemo(() => ({ modals, openModal, closeModal }), [modals]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
