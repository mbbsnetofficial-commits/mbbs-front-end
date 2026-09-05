import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Icon, IconName } from '../../../../shared/ui/icon/icon';
import { UniversityHeaderComponent } from '../../../shared/components/university-header/university-header';
import { UniversityNotification } from '../../models/university-notification.model';
import { UniversityNotificationsService } from '../../services/university-notifications.service';

@Component({
  selector: 'app-university-notifications',
  standalone: true,
  imports: [CommonModule, Icon, UniversityHeaderComponent],
  templateUrl: './university-notifications.html',
  styleUrl: './university-notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversityNotificationsComponent implements OnInit {
  private readonly notificationsService = inject(
    UniversityNotificationsService
  );

  readonly notifications = this.notificationsService.notifications;
  readonly pagination = this.notificationsService.pagination;
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly loading = this.notificationsService.loading;
  readonly countLoading = this.notificationsService.countLoading;
  readonly markingReadId = this.notificationsService.markingReadId;
  readonly markingAllRead = this.notificationsService.markingAllRead;
  readonly error = this.notificationsService.error;

  readonly currentPage = signal<number>(1);
  readonly unreadOnlyFilter = signal<boolean>(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadNotifications(1);
    this.loadUnreadCount();
  }

  loadNotifications(page = 1): void {
    this.currentPage.set(page);
    this.notificationsService
      .getNotifications({
        page,
        limit: 20,
        unreadOnly: this.unreadOnlyFilter(),
      })
      .subscribe({
        error: () => {
          // Error handled in service signal
        },
      });
  }

  loadUnreadCount(): void {
    this.notificationsService.getUnreadCount().subscribe({
      error: () => {
        // Error handled in service signal
      },
    });
  }

  setFilter(unreadOnly: boolean): void {
    if (this.unreadOnlyFilter() === unreadOnly && !this.loading()) return;
    this.unreadOnlyFilter.set(unreadOnly);
    this.loadNotifications(1);
  }

  goToPage(page: number): void {
    const pag = this.pagination();
    if (!pag || page < 1 || page > pag.totalPages || this.loading()) return;
    this.loadNotifications(page);
  }

  retry(): void {
    this.loadNotifications(this.currentPage());
    this.loadUnreadCount();
  }

  // API #15: Mark Single Notification as Read
  onNotificationClick(notification: UniversityNotification): void {
    if (
      notification.read ||
      this.markingReadId() === notification._id
    ) {
      return;
    }

    this.notificationsService.markAsRead(notification._id).subscribe({
      error: () => {
        // Error handled in service signal
      },
    });
  }

  // API #16: Mark All Notifications as Read
  onMarkAllAsRead(): void {
    if (this.unreadCount() === 0 || this.markingAllRead()) {
      return;
    }

    this.notificationsService.markAllAsRead().subscribe({
      error: () => {
        // Error handled in service signal
      },
    });
  }

  getNotificationIcon(type: string): IconName {
    const normalized = (type || '').toUpperCase();
    if (normalized.includes('INVITE') || normalized.includes('OFFER_SENT')) {
      return 'share';
    }
    if (normalized.includes('ACCEPT') || normalized.includes('APPROVED')) {
      return 'check';
    }
    if (
      normalized.includes('DECLIN') ||
      normalized.includes('CANCEL') ||
      normalized.includes('REJECT')
    ) {
      return 'close';
    }
    return 'bell';
  }
}
