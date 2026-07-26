import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private readonly storageKey = 'mbbs-bookmarked-blogs';
  private readonly ids = signal<ReadonlySet<string>>(this.readStoredIds());

  readonly count = computed(() => this.ids().size);

  has(blogId: string): boolean {
    return this.ids().has(blogId);
  }

  toggle(blogId: string): void {
    this.ids.update((current) => {
      const next = new Set(current);
      if (next.has(blogId)) {
        next.delete(blogId);
      } else {
        next.add(blogId);
      }
      localStorage.setItem(this.storageKey, JSON.stringify([...next]));
      return next;
    });
  }

  filter<T extends { _id: string }>(items: readonly T[]): T[] {
    const ids = this.ids();
    return items.filter(({ _id }) => ids.has(_id));
  }

  private readStoredIds(): ReadonlySet<string> {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as unknown;
      return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  }
}
