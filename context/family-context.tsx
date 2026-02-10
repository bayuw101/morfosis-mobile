
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_URL } from '../constants/config';
import { getAuthHeader } from '../lib/auth';

interface FamilyMember {
    id: string;
    name: string;
    email: string;
    role: "owner" | "admin" | "member";
    avatar_url?: string;
    status: "active" | "pending";
}

interface FamilyGroup {
    id: string;
    name: string;
    members: FamilyMember[];
    owner_id: string;
    is_default?: boolean;
}

interface FamilyContextType {
    families: FamilyGroup[];
    activeFamily: FamilyGroup | null;
    isLoading: boolean;
    isSwitching: boolean;
    switchFamily: (familyId: string) => Promise<void>;
    refreshFamilies: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
    const [families, setFamilies] = useState<FamilyGroup[]>([]);
    const [activeFamily, setActiveFamily] = useState<FamilyGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);

    const fetchFamilies = useCallback(async () => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/mobile/families`, { headers });
            if (res.ok) {
                const data = await res.json();
                setFamilies(data);

                // If we have an active family, check if it's still in the list and update it
                // Otherwise find default
                setActiveFamily(prev => {
                    if (prev) {
                        const updated = data.find((f: FamilyGroup) => f.id === prev.id);
                        return updated || data.find((f: FamilyGroup) => f.is_default) || data[0] || null;
                    }
                    return data.find((f: FamilyGroup) => f.is_default) || data[0] || null;
                });
            }
        } catch (e) {
            console.error("Failed to fetch families", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const switchFamily = useCallback(async (familyId: string) => {
        setIsSwitching(true);
        // Optimistic update
        const targetFamily = families.find(f => f.id === familyId);
        if (targetFamily) {
            setActiveFamily(targetFamily);
            // Update the is_default flag locally for consistency
            setFamilies(prev => prev.map(f => ({
                ...f,
                is_default: f.id === familyId
            })));
        }

        try {
            const headers = await getAuthHeader();
            await fetch(`${API_URL}/mobile/families/switch`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ familyId })
            });
            // We can optionally refetch here to be sure, but optimistic update makes it smooth
            // await fetchFamilies();
        } catch (e) {
            console.error("Failed to switch family", e);
            // Revert if failed (optional, but good practice)
            await fetchFamilies();
        } finally {
            setIsSwitching(false);
        }
    }, [families, fetchFamilies]);

    useEffect(() => {
        fetchFamilies();
    }, [fetchFamilies]);

    return (
        <FamilyContext.Provider value={{ families, activeFamily, isLoading, isSwitching, switchFamily, refreshFamilies: fetchFamilies }}>
            {children}
        </FamilyContext.Provider>
    );
}

export function useFamily() {
    const context = useContext(FamilyContext);
    if (context === undefined) {
        throw new Error('useFamily must be used within a FamilyProvider');
    }
    return context;
}
