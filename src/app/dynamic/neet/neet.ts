import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { QodComponent } from './qod/qod';

@Component({
  selector: 'app-neet',
  standalone: true,
  imports: [
    CommonModule,
    QodComponent,
    RouterLink
  ],
  templateUrl: './neet.html',
  styleUrl: './neet.scss'
})
export class NeetComponent {

}
