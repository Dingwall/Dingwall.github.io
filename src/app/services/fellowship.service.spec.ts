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
});
