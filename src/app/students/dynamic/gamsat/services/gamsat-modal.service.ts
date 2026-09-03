import { Injectable, signal } from '@angular/core';

export interface GamsatSavedTestPayload {
  title: string;
  sections: string[];
  units?: string[];
  topic_ids?: (number | string)[];
  questionCount: number;
  duration: number;
  difficulty?: string;
  level?: string;
  sessionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GamsatModalService {
  readonly buildTestModalOpen = signal(false);
  readonly newlySavedTest = signal<GamsatSavedTestPayload | null>(null);

  openBuildTestModal(): void {
    this.buildTestModalOpen.set(true);
  }

  closeBuildTestModal(): void {
    this.buildTestModalOpen.set(false);
  }

  saveTest(payload: GamsatSavedTestPayload): void {
    this.newlySavedTest.set(payload);
    this.closeBuildTestModal();
  }
}
