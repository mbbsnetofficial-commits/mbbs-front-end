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
        studentId?: string
    ): void {

        localStorage.setItem(this.ACCESS_TOKEN, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN, refreshToken);

        if (studentId) {
            localStorage.setItem(this.STUDENT_ID, studentId);
        }
    }

    updateTokens(
        accessToken: string,
        refreshToken: string
    ): void {

        localStorage.setItem(this.ACCESS_TOKEN, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN, refreshToken);

    }
    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN);
    }

    getStudentId(): string | null {
        return localStorage.getItem(this.STUDENT_ID);
    }

    clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN);
        localStorage.removeItem(this.REFRESH_TOKEN);
        localStorage.removeItem(this.STUDENT_ID);
    }

    isLoggedIn(): boolean {
        return !!this.getAccessToken();
    }

}