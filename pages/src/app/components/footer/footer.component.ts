import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub, faNpm, faRust } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  // Icons
  faGithub = faGithub;
  faNpm = faNpm;
  faRust = faRust;
}
