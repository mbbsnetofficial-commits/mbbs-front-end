import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  OrganizationInviteItem,
  OrganizationInvitesPagination,
} from '../../models/university-invites.model';
import { UniversityInvitesService } from '../../services/university-invites.service';
import { UniversityInvitesComponent } from './university-invites';

describe('UniversityInvitesComponent', () => {
  let component: UniversityInvitesComponent;
  let fixture: ComponentFixture<UniversityInvitesComponent>;
  let invitesServiceMock: {
    invitations: ReturnType<typeof signal<OrganizationInviteItem[]>>;
    pagination: ReturnType<typeof signal<OrganizationInvitesPagination | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    cancelling: ReturnType<typeof signal<boolean>>;
    getInvitations: ReturnType<typeof vi.fn>;
    cancelInvitation: ReturnType<typeof vi.fn>;
  };

  const mockInvites: OrganizationInviteItem[] = [
    {
      _id: '67b36f1c4e9b8a0012345678',
      studentId: 'STU17869056359535Q01Q3',
      organizationId: 'ORG_TSMU_001',
      subject: 'Direct MBBS Admission Offer - Tbilisi State Medical University',
      message: 'We are pleased to offer you admission.',
      course: 'MBBS',
      tuitionFeeUsd: 25000,
      status: 'PENDING',
      createdAt: '2026-08-19T01:00:00.000Z',
      student: {
        fullName: 'Ananya Sharma',
        city: 'Delhi',
        country: 'India',
        neetScore: 610,
        pcbPercentage: 94,
      },
    },
    {
      _id: '67b36f1c4e9b8a0012345679',
      studentId: 'STU17869056359535Q01Q4',
      organizationId: 'ORG_TSMU_001',
      subject: 'Direct MBBS Admission Offer - Fall 2026',
      message: 'Admission offer for MBBS.',
      course: 'MBBS',
      tuitionFeeUsd: 28000,
      status: 'ACCEPTED',
      createdAt: '2026-08-18T10:00:00.000Z',
      student: {
        fullName: 'Rahul Verma',
        city: 'Mumbai',
        country: 'India',
        neetScore: 590,
        pcbPercentage: 91,
      },
    },
  ];

  const mockPagination: OrganizationInvitesPagination = {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  };

  beforeEach(async () => {
    invitesServiceMock = {
      invitations: signal<OrganizationInviteItem[]>(mockInvites),
      pagination: signal<OrganizationInvitesPagination | null>(mockPagination),
      loading: signal(false),
      error: signal<string | null>(null),
      cancelling: signal(false),
      getInvitations: vi.fn().mockReturnValue(
        of({
          success: true,
          data: {
            items: mockInvites,
            pagination: mockPagination,
          },
        })
      ),
      cancelInvitation: vi.fn().mockReturnValue(
        of({
          success: true,
          message: 'Invitation cancelled successfully',
          data: {
            _id: '67b36f1c4e9b8a0012345678',
            status: 'CANCELLED',
            cancelledAt: '2026-08-21T08:00:00.000Z',
          },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [UniversityInvitesComponent],
      providers: [
        provideRouter([]),
        { provide: UniversityInvitesService, useValue: invitesServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UniversityInvitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create UniversityInvitesComponent and fetch invitations on init', () => {
    expect(component).toBeTruthy();
    expect(invitesServiceMock.getInvitations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it('should render invitations cards with student ID, candidate name, subject, and status', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.invite-card');
    expect(cards.length).toBe(2);

    const firstCard = cards[0];
    expect(firstCard.textContent).toContain('STU17869056359535Q01Q3');
    expect(firstCard.textContent).toContain('Ananya Sharma');
    expect(firstCard.textContent).toContain('Direct MBBS Admission Offer');
    expect(firstCard.textContent).toContain('PENDING');
  });

  it('should filter by status and reload invitations on tab click', () => {
    component.filterByStatus('PENDING');

    expect(component.currentStatus()).toBe('PENDING');
    expect(invitesServiceMock.getInvitations).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING', page: 1 })
    );
  });

  it('should trigger debounced search on input', () => {
    vi.useFakeTimers();
    try {
      component.onSearchInput('Sharma');
      vi.advanceTimersByTime(400);

      expect(invitesServiceMock.getInvitations).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Sharma', page: 1 })
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('should open cancel confirmation modal on PENDING invite and execute cancel on confirm', () => {
    const targetInvite = mockInvites[0];
    component.promptCancel(targetInvite);
    fixture.detectChanges();

    expect(component.selectedInviteToCancel()).toEqual(targetInvite);
    const compiled = fixture.nativeElement as HTMLElement;
    const modal = compiled.querySelector('.modal-card');
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain('Cancel Admission Offer?');

    component.confirmCancel();

    expect(invitesServiceMock.cancelInvitation).toHaveBeenCalledWith(
      targetInvite._id
    );
    expect(component.selectedInviteToCancel()).toBeNull();
    expect(component.cancelSuccessMessage()).toContain('cancelled successfully');
  });

  it('should render error alert and allow retry on API failure', () => {
    invitesServiceMock.invitations.set([]);
    invitesServiceMock.error.set('Failed to load invitations.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorAlert = compiled.querySelector('.alert-card.error');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert?.textContent).toContain('Failed to load invitations.');

    const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();

    retryBtn.click();
    expect(invitesServiceMock.getInvitations).toHaveBeenCalledTimes(2);
  });

  it('should render clean empty state when no invitations are found', () => {
    invitesServiceMock.invitations.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No Invitations Found');
  });
});
