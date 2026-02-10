
// Safe import for Google Signin
// This ensures the app doesn't crash on environments without the native module (like general Expo Go or web)

let GoogleSigninModule: any = {
    configure: () => { console.warn("Google Signin: configure (mock)") },
    hasPlayServices: async () => { console.warn("Google Signin: hasPlayServices (mock false)"); return false; },
    signIn: async () => { throw new Error("Google Sign In not initialized (Mock)") },
    signOut: async () => { console.warn("Google Signin: signOut (mock)") },
    getTokens: async () => { throw new Error("Google Sign In not initialized (Mock)") },
    statusCodes: {
        SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
        IN_PROGRESS: 'IN_PROGRESS',
        PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    }
};

try {
    const googleModule = require("@react-native-google-signin/google-signin");
    GoogleSigninModule = googleModule.GoogleSignin;
    // statusCodes is often a separate export or property
    if (googleModule.statusCodes) {
        GoogleSigninModule.statusCodes = googleModule.statusCodes;
    } else {
        GoogleSigninModule.statusCodes = {
            SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
            IN_PROGRESS: 'IN_PROGRESS',
            PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
        }
    }
} catch (e) {
    console.warn("Google Signin Native Module not found in lib/google-auth.ts.");
}

export const GoogleSignin = GoogleSigninModule;
export const statusCodes = GoogleSigninModule.statusCodes;

export const configureGoogleSignin = () => {
    try {
        GoogleSignin.configure({
            webClientId: "789108762087-tn2pm7614ihn18bc1fh1enjq3si162bn.apps.googleusercontent.com",
            offlineAccess: true,
        });
    } catch (e) {
        console.warn("Error configuring Google Signin:", e);
    }
}
