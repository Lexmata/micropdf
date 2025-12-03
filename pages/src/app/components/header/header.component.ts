import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  menuOpen = signal(false);

  // Icons
  faGithub = faGithub;
  faBars = faBars;
  faXmark = faXmark;
}
