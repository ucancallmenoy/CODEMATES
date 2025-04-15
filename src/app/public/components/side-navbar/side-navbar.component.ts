import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupService, Group, JoinGroupResult } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-side-navbar',
  templateUrl: './side-navbar.component.html',
  styleUrl: './side-navbar.component.css',
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(30px)', opacity: 0 }))
      ])
    ])
  ]
})
export class SideNavbarComponent implements OnInit, OnDestroy {
  groups: Group[] = [];
  loading = false;
  
  showCreateModal = false;
  showJoinModal = false;
  
  newGroupName = '';
  joinCode = '';
  
  error: string | null = null;
  isCollapsed = false;
  
  currentUser: User | null = null;
  selectedGroupId: string | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loading = true;
    
    // Check local storage for sidebar collapse state
    const savedState = localStorage.getItem('sidenavCollapsed');
    if (savedState) {
      this.isCollapsed = savedState === 'true';
    }
    
    // Subscribe to auth changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadGroups();
        } else {
          this.groups = [];
        }
      })
    );
    
    // Subscribe to selected group changes
    this.subscriptions.push(
      this.groupService.selectedGroup$.subscribe(group => {
        this.selectedGroupId = group?.id || null;
      })
    );
    
    // Check if window is mobile size for responsive collapse
    this.checkMobileSize();
    window.addEventListener('resize', this.checkMobileSize.bind(this));
  }
  
  ngOnDestroy() {
    // Clean up subscriptions and event listeners
    this.subscriptions.forEach(sub => sub.unsubscribe());
    window.removeEventListener('resize', this.checkMobileSize.bind(this));
  }

  async loadGroups() {
    this.loading = true;
    try {
      this.groups = await this.groupService.getUserGroups();
      
      // If we have groups but none selected, select the first one
      if (this.groups.length > 0 && !this.selectedGroupId) {
        this.selectGroup(this.groups[0]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      this.loading = false;
    }
  }

  selectGroup(group: Group) {
    this.groupService.selectGroup(group);
    
    // On mobile, collapse the sidebar after selecting a group
    if (window.innerWidth <= 768) {
      this.isCollapsed = true;
    }
  }
  
  isGroupSelected(group: Group): boolean {
    return this.selectedGroupId === group.id;
  }
  
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidenavCollapsed', this.isCollapsed.toString());
  }
  
  checkMobileSize() {
    if (window.innerWidth <= 768) {
      this.isCollapsed = true;
    }
  }
  
  getGroupColor(name: string): string {
    // Generate a consistent color based on the group name
    const colors = [
      '#4285F4', '#DB4437', '#F4B400', '#0F9D58', // Google colors
      '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', // Purple to blue
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39', // Teal to green
      '#FF9800', '#FF5722', '#795548', '#607D8B'  // Orange to grey
    ];
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Get a positive index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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
        await this.loadGroups();
        
        // Auto-select the newly created group
        const newGroup = this.groups.find(g => g.id === groupId);
        if (newGroup) {
          this.selectGroup(newGroup);
        }
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
      // Explicitly handle the boolean return type
      const success = await this.groupService.joinGroup(this.joinCode.trim());
      
      if (success) {
        this.closeJoinModal();
        await this.loadGroups();
        // Can't auto-select since we don't have the groupId from a boolean response
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
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.signOut();
    }
  }
}