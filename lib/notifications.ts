
import {
    getMessaging,
    getToken,
    deleteToken,
    onMessage,
    onTokenRefresh,
    requestPermission,
    AuthorizationStatus
} from '@react-native-firebase/messaging';
import { API_URL } from '../constants/config';
import { getAuthHeader } from './auth';
import { Alert, Platform } from 'react-native';

// 1. Request Permission
export async function requestUserPermission() {
    const messaging = getMessaging();

    if (Platform.OS === 'android') {
        const granted = await requestPermission(messaging);
        return granted === AuthorizationStatus.AUTHORIZED || granted === AuthorizationStatus.PROVISIONAL;
    }

    const authStatus = await requestPermission(messaging);
    const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

    return enabled;
}

// 2. Register Token with Backend
export async function registerPushToken() {
    try {
        const hasPermission = await requestUserPermission();
        if (!hasPermission) return;

        // Get the token
        const messaging = getMessaging();
        const token = await getToken(messaging);

        // Send to backend
        const headers = await getAuthHeader();
        await fetch(`${API_URL}/mobile/push-tokens`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                device_info: `${Platform.OS} ${Platform.Version}`
            })
        });

        console.log('Push token registered:', token);
    } catch (error) {
        console.error('Failed to register push token:', error);
    }
}

// 3. Unregister Token (Logout)
export async function unregisterPushToken() {
    try {
        const messaging = getMessaging();
        const token = await getToken(messaging);
        const headers = await getAuthHeader();
        await fetch(`${API_URL}/mobile/push-tokens?token=${token}`, {
            method: 'DELETE',
            headers
        });
        await deleteToken(messaging);
    } catch (error) {
        console.error('Failed to unregister push token:', error);
    }
}

// 4. Update Notification Preference
export async function updateNotificationPreference(enabled: boolean) {
    try {
        const headers = await getAuthHeader();
        await fetch(`${API_URL}/mobile/users/me/preferences`, {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notifications_enabled: enabled })
        });
    } catch (error) {
        console.error('Failed to update notification preference:', error);
    }
}

// 5. Setup Foreground Handler
export function setupForegroundHandler(showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) {
    const messaging = getMessaging();
    return onMessage(messaging, async remoteMessage => {
        console.log('A new FCM message arrived!', remoteMessage);

        const { notification } = remoteMessage;

        if (notification) {
            showToast(
                `${notification.title || 'Notification'}: ${notification.body}`,
                'info'
            );
        }
    });
}

// 6. Setup Token Refresh Listener
export function setupTokenRefreshListener() {
    const messaging = getMessaging();
    return onTokenRefresh(messaging, async token => {
        try {
            const headers = await getAuthHeader();
            await fetch(`${API_URL}/mobile/push-tokens`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    device_info: `${Platform.OS} ${Platform.Version}`
                })
            });
            console.log('Token refreshed and synced');
        } catch (error) {
            console.error('Failed to sync refreshed token:', error);
        }
    });
}
