import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { GroupService, Message, Group } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { HostListener } from '@angular/core';
import { TimeAgoPipe } from '../../components/pipe/time-ago';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 }))
      ])
    ])
  ]
})
export class ChatRoomComponent implements OnInit, AfterViewChecked, OnDestroy {
  messageText = '';
  messages: Message[] = [];
  showInfoPanel = false;
  isTyping = false;
  typingTimeout: any;
  sending = false;
  errorMessage: string | null = null;
  showEmojiPicker = false;
  showDropdown = false;
  selectedGroup: Group | null = null;
  groupMembers: any[] = [];

  private shouldScrollToBottom = true;
  private scrollThreshold = 100; // pixels from bottom to trigger auto-scroll

  
  commonEmojis = ['😊', '👍', '❤️', '🎉', '🔥', '🙌', '😂', '🤔', '👏', '✅', '👀', '💯', '🚀', '🤦‍♂️', '🙏', '💪'];
  userColors: {[key: string]: string} = {}; // Cache for user colors
  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: Event) {
    if (this.showDropdown && !(event.target as HTMLElement).closest('.dropdown-container')) {
      this.showDropdown = false;
    }
    
    // Also handle emoji picker outside clicks here
    if (this.showEmojiPicker && 
        !(event.target as HTMLElement).closest('.emoji-picker') &&
        !(event.target as HTMLElement).closest('.attachment-btn')) {
      this.showEmojiPicker = false;
    }
  }

  @HostListener('scroll', ['$event.target'])
onScroll(target: HTMLElement) {
  if (!this.scrollContainer) return;
  
  const element = this.scrollContainer.nativeElement;
  const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < this.scrollThreshold;
  this.shouldScrollToBottom = atBottom;
}

isNearBottom(): boolean {
  if (!this.scrollContainer) return true;
  
  const element = this.scrollContainer.nativeElement;
  return element.scrollHeight - element.scrollTop - element.clientHeight < this.scrollThreshold;
}

  
  private subscriptions: Subscription[] = [];

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('ChatRoom initialized, checking auth');
    const user = this.authService.getCurrentUser();
    console.log('Current user from auth service:', user ? user.email : 'No user');
    
    if (!user) {
      console.log('No user found, navigating to login');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('User authenticated, continuing with initialization');

    this.subscriptions.push(
      this.groupService.messages$.subscribe({
        next: messages => {
          const wasAtBottom = this.isNearBottom();
          this.messages = messages;
          this.errorMessage = null;
          
          // Only auto-scroll if user was already at the bottom
          this.shouldScrollToBottom = wasAtBottom;
        },
        error: err => {
          console.error('Error getting messages:', err);
          this.errorMessage = 'Failed to load messages. Please try again.';
        }
      })
    );

    // Subscribe to selected group changes
    this.subscriptions.push(
      this.groupService.selectedGroup$.subscribe(group => {
        this.selectedGroup = group;
        // Reset message input when changing groups
        this.messageText = '';
        // Close emoji picker when changing groups
        this.showEmojiPicker = false;
      })
    );

    // Subscribe to messages with error handling
    this.subscriptions.push(
      this.groupService.messages$.subscribe({
        next: messages => {
          this.messages = messages;
          this.errorMessage = null;
        },
        error: err => {
          console.error('Error getting messages:', err);
          this.errorMessage = 'Failed to load messages. Please try again.';
        }
      })
    );

    // Subscribe to group members
    this.subscriptions.push(
      this.groupService.members$.subscribe({
        next: members => {
          this.groupMembers = members;
        },
        error: err => {
          console.error('Error getting members:', err);
        }
      })
    );
    
    // Listen for click events outside emoji picker to close it
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Remove event listener
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    
    // Clear any pending timeouts
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private verifyAuthentication(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return false;
    }
    return true;
  }

  async sendMessage() {
    if (!this.messageText.trim() || this.sending) return;
    if (!this.verifyAuthentication()) return;
  
    this.sending = true;
    const originalText = this.messageText.trim();
    this.messageText = ''; // Clear the input field immediately for better UX
  
    try {
      // Check if we're logged in and have a selected group
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        console.error('Not logged in');
        // Show an error and restore the message text
        this.errorMessage = 'You must be logged in to send messages.';
        this.messageText = originalText;
        return;
      }
      
      if (!this.selectedGroup) {
        console.error('No group selected');
        this.errorMessage = 'Please select a group to send messages.';
        this.messageText = originalText;
        return;
      }
      
      const success = await this.groupService.sendMessage(originalText);
      if (!success) {
        console.error('Failed to send message');
        this.errorMessage = 'Failed to send message. Please try again.';
        this.messageText = originalText;
      } else {
        // Focus the input field again after successful send
        this.shouldScrollToBottom = true;
        this.focusMessageInput();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.errorMessage = 'An error occurred while sending your message.';
      this.messageText = originalText;
    } finally {
      this.sending = false;
    }
  }

  toggleInfo() {
    this.showInfoPanel = !this.showInfoPanel;
    // Close the emoji picker when info panel opens
    if (this.showInfoPanel) {
      this.showEmojiPicker = false;
    }
  }

  isCurrentUser(senderId: string): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.uid === senderId;
  }

  onInputChange() {
    // Clear any existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Set a timeout to stop the typing indicator
    this.typingTimeout = setTimeout(() => {
      // Implement "user is typing" indicator here if needed
      // this.isTyping = false;
    }, 2000);
  }
  
  dismissError() {
    this.errorMessage = null;
  }
  
  toggleEmojiPicker(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showEmojiPicker = !this.showEmojiPicker;
  }
  
  addEmoji(emoji: string) {
    this.messageText += emoji;
    this.focusMessageInput();
  }
  
  handleClickOutside(event: Event) {
    // Check if click was outside the emoji picker
    if (this.showEmojiPicker && 
        !((event.target as HTMLElement).closest('.emoji-picker')) &&
        !((event.target as HTMLElement).closest('.attachment-btn'))) {
      this.showEmojiPicker = false;
    }
  }
  
  focusMessageInput() {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 0);
  }
  
  async copyGroupCode() {
    if (!this.selectedGroup?.code) return;
    
    try {
      await navigator.clipboard.writeText(this.selectedGroup.code);
      // Show a temporary success message
      const originalErrorMessage = this.errorMessage;
      this.errorMessage = '✓ Invite code copied to clipboard!';
      
      // Restore previous error message or clear after 2 seconds
      setTimeout(() => {
        if (this.errorMessage === '✓ Invite code copied to clipboard!') {
          this.errorMessage = originalErrorMessage;
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  
  async leaveGroup() {
    if (!this.selectedGroup) return;
    
    const confirm = window.confirm(`Are you sure you want to leave ${this.selectedGroup.name}?`);
    if (!confirm) return;
    
    try {
      const success = await this.groupService.leaveGroup(this.selectedGroup.id!);
      if (success) {
        // Close info panel
        this.showInfoPanel = false;
        // The group list should update automatically via subscription
      } else {
        this.errorMessage = 'Failed to leave the group. Please try again.';
      }
    } catch (err: any) {
      console.error('Error leaving group:', err);
      this.errorMessage = err.message || 'An error occurred while leaving the group.';
    }
  }
  
  // Utility functions for UI
  formatMessageDate(timestamp: any): string {
    if (!timestamp) return '';
    
    let date;
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '';
    }
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (this.isSameDay(date, today)) {
      return 'Today';
    } else if (this.isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: today.getFullYear() !== date.getFullYear() ? 'numeric' : undefined 
      });
    }
  }
  
  getDateSeparatorText(): string {
    if (!this.messages.length) return 'Today';
    return this.formatMessageDate(this.messages[0].timestamp);
  }
  
  isDifferentDay(prev: any, current: any): boolean {
    if (!prev || !current) return false;
    
    let prevDate, currentDate;
    
    if (prev && typeof prev.toDate === 'function') {
      prevDate = prev.toDate();
    } else if (prev instanceof Date) {
      prevDate = prev;
    } else {
      return false;
    }
    
    if (current && typeof current.toDate === 'function') {
      currentDate = current.toDate();
    } else if (current instanceof Date) {
      currentDate = current;
    } else {
      return false;
    }
    
    return !this.isSameDay(prevDate, currentDate);
  }
  
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  isConsecutiveMessage(index: number): boolean {
    if (index === 0) return false;
    
    const currentMsg = this.messages[index];
    const prevMsg = this.messages[index - 1];
    
    // Check if messages are from the same sender and within 2 minutes of each other
    if (currentMsg.senderId === prevMsg.senderId) {
      const currentTime = this.getMessageTime(currentMsg.timestamp);
      const prevTime = this.getMessageTime(prevMsg.timestamp);
      
      // If messages are within 2 minutes, treat as consecutive
      if (currentTime && prevTime) {
        const diff = (currentTime.getTime() - prevTime.getTime()) / 1000 / 60;
        return diff < 2;
      }
    }
    
    return false;
  }
  
  getMessageTime(timestamp: any): Date | null {
    if (!timestamp) return null;
    
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    } else if (timestamp instanceof Date) {
      return timestamp;
    }
    
    return null;
  }
  
  // Format message content with links, mentions, etc.
  formatMessageContent(content: string): string {
    if (!content) return '';
    
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    content = content.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    
    // Add support for basic markdown if desired
    // content = this.parseMarkdown(content);
    
    return content;
  }
  
  // Get consistent color for users
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
  
  getUserColor(userIdOrName: string): string {
    if (!userIdOrName) return '#94a3b8'; // Default gray color
    
    // Check if we've already generated a color for this user
    if (this.userColors[userIdOrName]) {
      return this.userColors[userIdOrName];
    }
    
    // Generate a consistent color based on the string
    const colors = [
      '#4285F4', '#DB4437', '#F4B400', '#0F9D58', // Google colors
      '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', // Purple to blue
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39', // Teal to green
      '#FF9800', '#FF5722', '#795548', '#607D8B'  // Orange to grey
    ];
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < userIdOrName.length; i++) {
      hash = userIdOrName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Get a positive index
    const index = Math.abs(hash) % colors.length;
    const color = colors[index];
    
    // Cache the color
    this.userColors[userIdOrName] = color;
    
    return color;
  }

  toggleDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showDropdown = !this.showDropdown;
    
    // Close emoji picker if open
    if (this.showDropdown) {
      this.showEmojiPicker = false;
    }
  }

// Add these helper methods if they don't exist yet
formatEmail(email: string): string {
  if (!email) return '';
  
  // If email is too long, truncate it
  if (email.length > 25) {
    const parts = email.split('@');
    if (parts.length === 2) {
      // Truncate the username part if needed
      if (parts[0].length > 12) {
        return parts[0].substring(0, 10) + '...@' + parts[1];
      }
    }
  }
  
  return email;
}

isUserOnline(userId: string): boolean {
  // Implement your online status logic here
  return false; // Default implementation
}

isGroupAdmin(member: any): boolean {
  // Check if this member is the creator of the group
  return member && this.selectedGroup && 
         member.id === this.selectedGroup.createdBy;
}

}