import { Injectable, signal } from '@angular/core';

export interface UcatSavedTestPayload {
  title: string;
  subjects: string[];
  chapters: string[];
  questionCount: number;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class UcatModalService {
  readonly buildTestModalOpen = signal(false);
  readonly newlySavedTest = signal<UcatSavedTestPayload | null>(null);

  openBuildTestModal(): void {
    this.buildTestModalOpen.set(true);
  }

  closeBuildTestModal(): void {
    this.buildTestModalOpen.set(false);
  }

  saveTest(payload: UcatSavedTestPayload): void {
    this.newlySavedTest.set(payload);
    this.closeBuildTestModal();
  }
}
