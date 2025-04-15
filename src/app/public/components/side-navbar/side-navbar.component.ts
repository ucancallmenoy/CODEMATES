import { Component, OnInit } from '@angular/core';
import { GroupService, Group } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-side-navbar',
  templateUrl: './side-navbar.component.html',
  styleUrl: './side-navbar.component.css'
})
export class SideNavbarComponent implements OnInit {
  groups: Group[] = [];
  loading = false;
  
  showCreateModal = false;
  showJoinModal = false;
  
  newGroupName = '';
  joinCode = '';
  
  error: string | null = null;

  constructor(
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.loadGroups();
    
    // Subscribe to auth changes to reload groups when user signs in/out
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadGroups();
      } else {
        this.groups = [];
      }
    });
  }

  async loadGroups() {
    this.loading = true;
    try {
      this.groups = await this.groupService.getUserGroups();
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      this.loading = false;
    }
  }

  selectGroup(group: Group) {
    this.groupService.selectGroup(group);
  }
  
  openCreateModal() {
    this.showCreateModal = true;
    this.newGroupName = '';
    this.error = null;
  }
  
  closeCreateModal() {
    this.showCreateModal = false;
  }
  
  openJoinModal() {
    this.showJoinModal = true;
    this.joinCode = '';
    this.error = null;
  }
  
  closeJoinModal() {
    this.showJoinModal = false;
  }
  
  async createGroup() {
    if (!this.newGroupName.trim()) {
      this.error = 'Please enter a group name';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    try {
      const groupId = await this.groupService.createGroup(this.newGroupName.trim());
      if (groupId) {
        this.closeCreateModal();
        this.loadGroups();
      } else {
        this.error = 'Failed to create group';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to create group';
    } finally {
      this.loading = false;
    }
  }
  
  async joinGroup() {
    if (!this.joinCode.trim()) {
      this.error = 'Please enter a join code';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    try {
      const success = await this.groupService.joinGroup(this.joinCode.trim());
      if (success) {
        this.closeJoinModal();
        this.loadGroups();
      } else {
        this.error = 'Invalid join code or group not found';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to join group';
    } finally {
      this.loading = false;
    }
  }
  
  signOut() {
    this.authService.signOut();
  }
}