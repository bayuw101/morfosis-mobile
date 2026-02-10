import { getAuth, getIdToken } from "@react-native-firebase/auth";

export const getAuthHeader = async (): Promise<Record<string, string>> => {
    try {
        const currentUser = getAuth().currentUser;
        if (currentUser) {
            const token = await getIdToken(currentUser);
            return { Authorization: `Bearer ${token}` };
        }
        return {};
    } catch (e) {
        console.error("Error getting auth header:", e);
        return {};
    }
};
