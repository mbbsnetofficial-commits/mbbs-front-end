import { Injectable } from '@angular/core';

import { AuthUser } from '../models/auth.model';

@Injectable({
    providedIn: 'root'
})
export class TokenService {

    private readonly ACCESS_TOKEN = 'accessToken';
    private readonly REFRESH_TOKEN = 'refreshToken';
    private readonly STUDENT_ID = 'studentId';
    private readonly USER = 'user';

    constructor() { }

    saveTokens(
        accessToken: string,
        refreshToken: string,
        studentId?: string,
        remember = true
    ): void {
        this.clearTokens();
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(this.ACCESS_TOKEN, accessToken);
        storage.setItem(this.REFRESH_TOKEN, refreshToken);

        if (studentId) {
            storage.setItem(this.STUDENT_ID, studentId);
        }
    }

    updateTokens(
        accessToken: string,
        refreshToken: string
    ): void {

        const storage = localStorage.getItem(this.ACCESS_TOKEN)
            ? localStorage
            : sessionStorage;
        storage.setItem(this.ACCESS_TOKEN, accessToken);
        storage.setItem(this.REFRESH_TOKEN, refreshToken);

    }

    saveUser(user: AuthUser, remember = true): void {
        const storage = remember ? localStorage : sessionStorage;
        localStorage.removeItem(this.USER);
        sessionStorage.removeItem(this.USER);
        storage.setItem(this.USER, JSON.stringify(user));
    }

    getCurrentUser(): AuthUser | null {
        const storedUser = localStorage.getItem(this.USER)
            ?? sessionStorage.getItem(this.USER);
        if (!storedUser) {
            return null;
        }

        try {
            return JSON.parse(storedUser) as AuthUser;
        } catch {
            localStorage.removeItem(this.USER);
            sessionStorage.removeItem(this.USER);
            return null;
        }
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN)
            ?? sessionStorage.getItem(this.ACCESS_TOKEN);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN)
            ?? sessionStorage.getItem(this.REFRESH_TOKEN);
    }

    getStudentId(): string | null {
        // 1. Direct storage under 'studentId' key (set by saveTokens after login)
        const directId = localStorage.getItem(this.STUDENT_ID)
            ?? sessionStorage.getItem(this.STUDENT_ID);
        if (directId && directId.trim()) {
            return directId.trim();
        }

        // 2. From saved user profile (set by saveUser after login)
        const user = this.getCurrentUser();
        if (user?.student_id && user.student_id.trim()) {
            return user.student_id.trim();
        }

        // 3. From JWT access token claims
        const token = this.getAccessToken();
        if (token) {
            try {
                const encodedPayload = token.split('.')[1];
                if (encodedPayload) {
                    const normalizedPayload = encodedPayload
                        .replace(/-/g, '+')
                        .replace(/_/g, '/');
                    const payload = JSON.parse(atob(normalizedPayload)) as Record<string, unknown>;
                    const sId = payload['student_id'] ?? payload['studentId'];
                    if (typeof sId === 'string' && sId.trim()) {
                        return sId.trim();
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }

        // 4. Fallback to user.id
        if (user?.id && user.id.trim()) {
            return user.id.trim();
        }

        return null;
    }

    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN);
        localStorage.removeItem(this.REFRESH_TOKEN);
        localStorage.removeItem(this.STUDENT_ID);
        localStorage.removeItem(this.USER);
        sessionStorage.removeItem(this.ACCESS_TOKEN);
        sessionStorage.removeItem(this.REFRESH_TOKEN);
        sessionStorage.removeItem(this.STUDENT_ID);
        sessionStorage.removeItem(this.USER);
    }

    isLoggedIn(): boolean {
        return !!this.getAccessToken();
    }

    getUserDisplayName(): string {
        const user = this.getCurrentUser();
        if (user?.firstName.trim()) {
            return user.firstName.trim();
        }

        const token = this.getAccessToken();
        if (!token) {
            return 'Student';
        }

        try {
            const encodedPayload = token.split('.')[1];
            if (!encodedPayload) {
                return 'Student';
            }

            const normalizedPayload = encodedPayload
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const payload = JSON.parse(atob(normalizedPayload)) as Record<string, unknown>;
            const fullName = payload['fullName'] ?? payload['name'];
            if (typeof fullName === 'string' && fullName.trim()) {
                return fullName.trim().split(' ')[0];
            }

            const firstName = payload['firstName'];
            return typeof firstName === 'string' && firstName.trim()
                ? firstName.trim()
                : 'Student';
        } catch {
            return 'Student';
        }
    }

}
