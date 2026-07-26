import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mediaUrl',
  standalone: true
})
export class MediaUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    if (!url) {
      return '';
    }

    return url.startsWith('http://res.cloudinary.com/')
      ? url.replace('http://', 'https://')
      : url;
  }
}
