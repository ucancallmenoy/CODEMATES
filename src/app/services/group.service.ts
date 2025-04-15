import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { 
  collection, addDoc, getDocs, query, where, onSnapshot,
  doc, updateDoc, arrayUnion, serverTimestamp, orderBy
} from 'firebase/firestore';
import { AuthService } from './auth.service';

export interface Group {
  id?: string;
  name: string;
  lastMessage: string;
  createdBy?: string;
  createdAt?: any;
  members?: string[];
  code?: string; // For joining a group
}

export interface Message {
  id?: string;
  content: string;
  senderName: string;
  senderId: string;
  timestamp: any;
  groupId: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private selectedGroupSource = new BehaviorSubject<Group | null>(null);
  selectedGroup$ = this.selectedGroupSource.asObservable();
  
  private messagesSource = new BehaviorSubject<Message[]>([]);
  messages$ = this.messagesSource.asObservable();
  
  private membersSource = new BehaviorSubject<any[]>([]);
  members$ = this.membersSource.asObservable();
  
  private unsubscribeMessages: any;
  private unsubscribeMembers: any;

  constructor(
    private firebaseService: FirebaseService, 
    private authService: AuthService
  ) {}

  // Get user's groups
  async getUserGroups(): Promise<Group[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return [];
    
    try {
      const q = query(
        collection(this.firebaseService.db, 'groups'),
        where('members', 'array-contains', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const groups: Group[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Group;
        groups.push({ ...data, id: doc.id });
      });
      
      return groups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      return [];
    }
  }

  // Create a new group
  async createGroup(name: string): Promise<string | null> {
    const user = this.authService.getCurrentUser();
    if (!user) return null;
    
    try {
      // Generate a random 6-digit code for joining
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const docRef = await addDoc(collection(this.firebaseService.db, 'groups'), {
        name,
        lastMessage: 'Group created',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        members: [user.uid],
        code
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }

  // Join a group using a code
  async joinGroup(code: string): Promise<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    
    try {
      const q = query(
        collection(this.firebaseService.db, 'groups'),
        where('code', '==', code)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return false; // No group found with that code
      }
      
      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data() as Group;
      
      // Check if user is already a member
      if (groupData.members?.includes(user.uid)) {
        return true; // Already a member
      }
      
      // Add user to members
      await updateDoc(doc(this.firebaseService.db, 'groups', groupDoc.id), {
        members: arrayUnion(user.uid),
        lastMessage: `${user.displayName || 'A user'} joined the group`
      });
      
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  }

  // Select a group for chat view
  selectGroup(group: Group) {
    this.selectedGroupSource.next(group);
    
    // Unsubscribe from previous listeners if any
    if (this.unsubscribeMessages) this.unsubscribeMessages();
    if (this.unsubscribeMembers) this.unsubscribeMembers();
    
    if (group && group.id) {
      this.listenToMessages(group.id);
      this.listenToMembers(group.id);
    }
  }

  // Send message in the selected group
  async sendMessage(content: string): Promise<boolean> {
    const user = this.authService.getCurrentUser();
    const group = this.selectedGroupSource.getValue();
    
    if (!user || !group || !group.id) {
      console.error('Cannot send message: user or group is missing');
      return false;
    }
    
    try {
      console.log('Sending message to group:', group.id);
      
      // First add the message document
      const messageRef = await addDoc(collection(this.firebaseService.db, 'messages'), {
        content,
        senderName: user.displayName || 'Anonymous',
        senderId: user.uid,
        timestamp: serverTimestamp(),
        groupId: group.id
      });
      
      console.log('Message added with ID:', messageRef.id);
      
      // Then update the last message in the group document
      const groupRef = doc(this.firebaseService.db, 'groups', group.id);
      await updateDoc(groupRef, {
        lastMessage: content
      });
      
      console.log('Group updated with last message');
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Listen to messages in real-time
  private listenToMessages(groupId: string) {
    const q = query(
      collection(this.firebaseService.db, 'messages'),
      where('groupId', '==', groupId),
      orderBy('timestamp', 'asc')
    );
    
    this.unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Message;
        
        // Convert Firebase timestamp to JavaScript Date
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          data.timestamp = data.timestamp.toDate();
        }
        
        messages.push({ ...data, id: doc.id });
      });
      
      this.messagesSource.next(messages);
    });
  }

  // Listen to group members in real-time
  private listenToMembers(groupId: string) {
    const groupRef = doc(this.firebaseService.db, 'groups', groupId);
    
    this.unsubscribeMembers = onSnapshot(groupRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Group;
        const memberIds = data.members || [];
        
        // Get member details
        const members = await Promise.all(
          memberIds.map(async (uid) => {
            // In a real app, you would get user details from a users collection
            // For now, we'll just return the ID
            return { id: uid, name: uid };
          })
        );
        
        this.membersSource.next(members);
      }
    });
  }
}