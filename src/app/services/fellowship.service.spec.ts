import { TestBed } from '@angular/core/testing';

import { FellowshipService } from './fellowship.service';

describe('FellowshipService', () => {
  let service: FellowshipService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FellowshipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should rotate recipients so each active item is sent to a different person by default', async () => {
    spyOn(service as any, 'getGroupMembers').and.resolveTo([
      { user_id: 'u1', role: 'owner', is_active: true, user: { name: 'Alice' } },
      { user_id: 'u2', role: 'member', is_active: true, user: { name: 'Bob' } },
      { user_id: 'u3', role: 'member', is_active: true, user: { name: 'Cara' } },
    ]);

    spyOn(service as any, 'getGroupItems').and.resolveTo([
      { id: 'i1', name: 'Item 1', status: 'active', current_holder_id: 'u1', owner_id: 'u1' },
      { id: 'i2', name: 'Item 2', status: 'active', current_holder_id: 'u2', owner_id: 'u1' },
      { id: 'i3', name: 'Item 3', status: 'active', current_holder_id: 'u3', owner_id: 'u1' },
    ]);

    spyOn(service as any, 'getItemHistory').and.resolveTo([]);

    const result = await service.suggestShippingAssignments('group-1', '2026-07-29', {
      allowRepeats: false,
      optimizeRoute: false,
      sendToOwner: false,
    });

    expect(result.suggestions.map((suggestion: any) => suggestion.toUserId)).toEqual(['u2', 'u3', 'u1']);
  });

  it('should use previous senders and recipients from item history when filtering repeats', async () => {
    spyOn(service as any, 'getGroupMembers').and.resolveTo([
      { user_id: 'u1', role: 'owner', is_active: true, user: { name: 'Alice' } },
      { user_id: 'u2', role: 'member', is_active: true, user: { name: 'Bob' } },
      { user_id: 'u3', role: 'member', is_active: true, user: { name: 'Cara' } },
    ]);

    spyOn(service as any, 'getGroupItems').and.resolveTo([
      { id: 'i1', name: 'Item 1', status: 'active', current_holder_id: 'u1', owner_id: 'u1' },
    ]);

    spyOn(service as any, 'getItemHistory').and.resolveTo([
      { from_user_id: 'u2', to_user_id: 'u3' },
    ]);

    const result = await service.suggestShippingAssignments('group-1', '2026-07-29', {
      allowRepeats: false,
      optimizeRoute: false,
      sendToOwner: false,
    });

    expect(result.suggestions[0].toUserId).toBe('u1');
  });

  it('should allow repeated recipients when repeats are enabled', async () => {
    spyOn(service as any, 'getGroupMembers').and.resolveTo([
      { user_id: 'u1', role: 'owner', is_active: true, user: { name: 'Alice' } },
      { user_id: 'u2', role: 'member', is_active: true, user: { name: 'Bob' } },
      { user_id: 'u3', role: 'member', is_active: true, user: { name: 'Cara' } },
    ]);

    spyOn(service as any, 'getGroupItems').and.resolveTo([
      { id: 'i1', name: 'Item 1', status: 'active', current_holder_id: 'u1', owner_id: 'u1' },
      { id: 'i2', name: 'Item 2', status: 'active', current_holder_id: 'u2', owner_id: 'u1' },
    ]);

    spyOn(service as any, 'getItemHistory').and.resolveTo([
      { to_user_id: 'u2' },
    ]);

    const result = await service.suggestShippingAssignments('group-1', '2026-07-29', {
      allowRepeats: true,
      optimizeRoute: false,
      sendToOwner: false,
    });

    expect(result.suggestions[0].toUserId).toBe('u2');
  });

  it('should reject joining a locked group', async () => {
    spyOn(service as any, 'getCurrentUserSync').and.returnValue({ id: 'user-1', name: 'Test User' });
    spyOn(service as any, 'getGroupDetails').and.resolveTo({
      id: 'group-1',
      name: 'Locked Group',
      password_hash: 'hash',
      password_required: false,
      created_by: 'owner-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      is_locked: true,
    });

    (service as any).supabase = {
      auth: {
        getUser: jasmine.createSpy('getUser').and.resolveTo({ data: { user: { id: 'user-1' } } }),
      },
      schema: jasmine.createSpy('schema').and.returnValue({
        from: jasmine.createSpy('from').and.returnValue({
          insert: jasmine.createSpy('insert').and.callFake(() => Promise.resolve({ data: null, error: null })),
        }),
      }),
    };

    await expectAsync(service.joinGroup('group-1', '')).toBeRejectedWithError('This group is locked and not accepting new members.');
  });

  it('should hide member contact details from non-members', () => {
    const groupMember = { user_id: 'u2', role: 'member', user: { name: 'Bob', address: '123 Main St' } } as any;
    expect(service.canViewMemberContactInfo(groupMember, 'u1', ['u1', 'u2'])).toBeTrue();
    expect(service.canViewMemberContactInfo(groupMember, 'u3', ['u1', 'u2'])).toBeFalse();
  });
});
