// Google Authentication Service - Following SOLID principles
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface IAuthService {
  signIn(): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  getTokens(): Promise<AuthTokens | null>;
  isAuthenticated(): Promise<boolean>;
  refreshToken(): Promise<AuthTokens | null>;
}

export class GoogleAuthService implements IAuthService {
  private static instance: GoogleAuthService;
  private gapi: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth can only be used in browser environment'));
        return;
      }

      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2', async () => {
          try {
            await window.gapi.auth2.init({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/drive.file',
            });
            this.gapi = window.gapi;
            this.isInitialized = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<AuthUser> {
    await this.initialize();

    const authInstance = this.gapi.auth2.getAuthInstance();
    const googleUser = await authInstance.signIn();
    const profile = googleUser.getBasicProfile();

    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      photoUrl: profile.getImageUrl(),
    };
  }

  async signOut(): Promise<void> {
    await this.initialize();
    const authInstance = this.gapi.auth2.getAuthInstance();
    await authInstance.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    await this.initialize();

    const authInstance = this.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      return null;
    }

    const googleUser = authInstance.currentUser.get();
    const profile = googleUser.getBasicProfile();

    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      photoUrl: profile.getImageUrl(),
    };
  }

  async getTokens(): Promise<AuthTokens | null> {
    await this.initialize();

    const authInstance = this.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      return null;
    }

    const googleUser = authInstance.currentUser.get();
    const authResponse = googleUser.getAuthResponse();

    return {
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      expiresAt: authResponse.expires_at,
    };
  }

  async isAuthenticated(): Promise<boolean> {
    await this.initialize();
    const authInstance = this.gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  }

  async refreshToken(): Promise<AuthTokens | null> {
    await this.initialize();

    const authInstance = this.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      return null;
    }

    // Force token refresh
    const googleUser = authInstance.currentUser.get();
    await googleUser.reloadAuthResponse();

    const authResponse = googleUser.getAuthResponse();
    return {
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      expiresAt: authResponse.expires_at,
    };
  }
}

// Global auth instance
export const authService = GoogleAuthService.getInstance();