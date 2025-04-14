import { Component } from '@angular/core';
import { GroupService } from '../../../services/group.service';

@Component({
  selector: 'app-side-navbar',
  templateUrl: './side-navbar.component.html',
  styleUrl: './side-navbar.component.css'
})
export class SideNavbarComponent {
  staticGroups = [
    { name: 'Dev Squad', lastMessage: 'Let’s deploy by noon.' },
    { name: 'UI/UX Team', lastMessage: 'Updated the wireframe.' },
    { name: 'Project X', lastMessage: 'Meeting at 3PM.' },
    { name: 'Beta Testers', lastMessage: 'Feedback sent.' }
  ];

  constructor(private groupService: GroupService) {}

  selectGroup(group: { name: string; lastMessage: string }) {
    this.groupService.selectGroup(group);
  }
}
