import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firebaseDate'
})
export class FirebaseDatePipe implements PipeTransform {
  transform(timestamp: any): Date | null {
    if (!timestamp) {
      return null;
    }
    
    // Check if it's a Firebase Timestamp (has seconds and nanoseconds)
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // If it's already a Date or a number, convert to Date
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    return null;
  }
}