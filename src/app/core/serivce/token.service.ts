import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TokenService {

    private readonly ACCESS_TOKEN = 'accessToken';
    private readonly REFRESH_TOKEN = 'refreshToken';
    private readonly STUDENT_ID = 'studentId';

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
    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN)
            ?? sessionStorage.getItem(this.ACCESS_TOKEN);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN)
            ?? sessionStorage.getItem(this.REFRESH_TOKEN);
    }

    getStudentId(): string | null {
        return localStorage.getItem(this.STUDENT_ID)
            ?? sessionStorage.getItem(this.STUDENT_ID);
    }

    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN);
        localStorage.removeItem(this.REFRESH_TOKEN);
        localStorage.removeItem(this.STUDENT_ID);
        sessionStorage.removeItem(this.ACCESS_TOKEN);
        sessionStorage.removeItem(this.REFRESH_TOKEN);
        sessionStorage.removeItem(this.STUDENT_ID);
    }

    isLoggedIn(): boolean {
        return !!this.getAccessToken();
    }

    getUserDisplayName(): string {
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
