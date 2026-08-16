import { Injectable, signal } from '@angular/core';

export interface SavedTestPayload {
  title: string;
  subjects: string[];
  chapters: string[];
  questionCount: number;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NeetModalService {
  readonly buildTestModalOpen = signal(false);
  readonly newlySavedTest = signal<SavedTestPayload | null>(null);

  openBuildTestModal(): void {
    this.buildTestModalOpen.set(true);
  }

  closeBuildTestModal(): void {
    this.buildTestModalOpen.set(false);
  }

  saveTest(payload: SavedTestPayload): void {
    this.newlySavedTest.set(payload);
    this.closeBuildTestModal();
  }
}
