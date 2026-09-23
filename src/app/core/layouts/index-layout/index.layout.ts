import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-index-layout',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  templateUrl: './index.layout.html',
  styleUrl: './index.layout.scss',
})
export class IndexLayout {}