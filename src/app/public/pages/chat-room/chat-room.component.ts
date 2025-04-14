import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { GroupService } from '../../../services/group.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, AfterViewChecked {
  messageText = '';
  messages: { senderName: string; content: string; timestamp?: Date }[] = [];
  showInfoPanel = false;
  isTyping = false;
  typingTimeout: any;

  selectedGroup: { name: string; lastMessage: string; createdDate?: Date } | null = null;
  groupMembers: { name: string; role: string }[] = [];

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor(private groupService: GroupService) {}

  ngOnInit() {
    this.groupService.selectedGroup$.subscribe(group => {
      this.selectedGroup = group;
      if (group) {
        // Load actual messages here instead of dummy data
        this.messages = [];
        // Load actual group members here
        this.groupMembers = [];
      } else {
        this.messages = [];
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendMessage() {
    if (!this.messageText.trim()) return;

    this.messages.push({
      senderName: 'You',
      content: this.messageText,
      timestamp: new Date()
    });

    this.messageText = '';
    
    // Replace with actual message sending logic
    // The code for simulating responses has been removed
  }

  toggleInfo() {
    this.showInfoPanel = !this.showInfoPanel;
  }

  getMessageTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  showTypingIndicator() {
    this.isTyping = true;
  }

  hideTypingIndicator() {
    this.isTyping = false;
  }

  onInputChange() {
    // Clear any existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Add typing indicator logic here if needed
  }
}