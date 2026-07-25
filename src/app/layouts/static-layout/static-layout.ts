import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-static-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './static-layout.html',
  styleUrl: './static-layout.scss',
})
export class StaticLayout {}

