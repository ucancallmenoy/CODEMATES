import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { GroupService, Message } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, AfterViewChecked, OnDestroy {
  messageText = '';
  messages: Message[] = [];
  showInfoPanel = false;
  isTyping = false;
  typingTimeout: any;
  sending = false;

  selectedGroup: any = null;
  groupMembers: any[] = [];

  private subscriptions: Subscription[] = [];

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor(
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Subscribe to selected group changes
    this.subscriptions.push(
      this.groupService.selectedGroup$.subscribe(group => {
        this.selectedGroup = group;
      })
    );

    // Subscribe to messages
    this.subscriptions.push(
      this.groupService.messages$.subscribe(messages => {
        this.messages = messages;
      })
    );

    // Subscribe to group members
    this.subscriptions.push(
      this.groupService.members$.subscribe(members => {
        this.groupMembers = members;
      })
    );
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
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
  
    try {
      // Check if we're logged in and have a selected group
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        console.error('Not logged in');
        // Redirect to login if needed
        return;
      }
      
      if (!this.selectedGroup) {
        console.error('No group selected');
        return;
      }
      
      const success = await this.groupService.sendMessage(this.messageText.trim());
      if (success) {
        this.messageText = '';
      } else {
        console.error('Failed to send message');
        // Display an error to the user
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add user-friendly error handling
      // e.g., this.errorMessage = 'Failed to send message. Please try again.';
    } finally {
      this.sending = false;
    }
  }

  toggleInfo() {
    this.showInfoPanel = !this.showInfoPanel;
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
    
    // You could implement a "user is typing" feature here
    // using Firebase Realtime Database or Firestore
  }
}