import { Pipe, PipeTransform } from '@angular/core';
import { GroupMember } from '../models/fellowship-types';

@Pipe({
  name: 'getNameFromId'
})
export class GetNameFromIdPipe implements PipeTransform {
  transform(members: GroupMember[], userId: string): GroupMember | undefined {
    if (!members || !userId) return undefined;
    return members.find(m => m.user_id === userId);
  }
}
