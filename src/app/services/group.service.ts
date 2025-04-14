import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class GroupService {
  constructor() { }

  private selectedGroupSource = new BehaviorSubject<{ name: string, lastMessage: string } | null>(null);
  selectedGroup$ = this.selectedGroupSource.asObservable();

  selectGroup(group: { name: string; lastMessage: string }) {
    this.selectedGroupSource.next(group);
  }
}
