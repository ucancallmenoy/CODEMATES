import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  pure: false // Set to false to update automatically
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '';
    
    // If not a date, return empty string
    if (!(value instanceof Date)) {
      return '';
    }
    
    const seconds = Math.floor((new Date().getTime() - value.getTime()) / 1000);
    
    // Less than 30 seconds ago will show as 'Just now'
    if (seconds < 30) return 'Just now';
    
    const intervals: { [key: string]: number } = {
      'year': 31536000,
      'month': 2592000,
      'week': 604800,
      'day': 86400,
      'hour': 3600,
      'minute': 60,
      'second': 1
    };
    
    let counter;
    for (const i in intervals) {
      counter = Math.floor(seconds / intervals[i]);
      if (counter > 0) {
        // Singular case
        if (counter === 1) {
          return counter + ' ' + i + ' ago';
        } 
        // Plural case
        else {
          return counter + ' ' + i + 's ago';
        }
      }
    }
    
    return value.toString();
  }
}