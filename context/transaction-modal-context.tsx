
import React, { createContext, useContext, useState, useCallback } from 'react';

interface TransactionModalContextType {
    isOpen: boolean;
    initialType: "expense" | "income" | "transfer";
    initialAccountId: string | null;
    openModal: (type?: "expense" | "income" | "transfer", accountId?: string) => void;
    closeModal: () => void;
    lastRefresh: number;
    triggerRefresh: () => void;
}

const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);

export function TransactionModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialType, setInitialType] = useState<"expense" | "income" | "transfer">("expense");
    const [initialAccountId, setInitialAccountId] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    const openModal = useCallback((type: "expense" | "income" | "transfer" = "expense", accountId?: string) => {
        setInitialType(type);
        setInitialAccountId(accountId || null);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setInitialAccountId(null);
    }, []);

    const triggerRefresh = useCallback(() => {
        setLastRefresh(Date.now());
    }, []);

    return (
        <TransactionModalContext.Provider value={{ isOpen, initialType, initialAccountId, openModal, closeModal, lastRefresh, triggerRefresh }}>
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
