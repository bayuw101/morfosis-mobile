
import React, { createContext, useContext, useState, useCallback } from 'react';

interface TransactionModalContextType {
    isOpen: boolean;
    initialType: "expense" | "income" | "transfer";
    openModal: (type?: "expense" | "income" | "transfer") => void;
    closeModal: () => void;
    lastRefresh: number;
    triggerRefresh: () => void;
}

const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);

export function TransactionModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialType, setInitialType] = useState<"expense" | "income" | "transfer">("expense");
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    const openModal = useCallback((type: "expense" | "income" | "transfer" = "expense") => {
        setInitialType(type);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    const triggerRefresh = useCallback(() => {
        setLastRefresh(Date.now());
    }, []);

    return (
        <TransactionModalContext.Provider value={{ isOpen, initialType, openModal, closeModal, lastRefresh, triggerRefresh }}>
            {children}
        </TransactionModalContext.Provider>
    );
}

export function useTransactionModal() {
    const context = useContext(TransactionModalContext);
    if (context === undefined) {
        throw new Error('useTransactionModal must be used within a TransactionModalProvider');
    }
    return context;
}
