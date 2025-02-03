import { AlertService, MessageSeverity } from './../../services/alert.service';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private alertService = inject(AlertService);

  severity: MessageSeverity = MessageSeverity.default;

  displayToastMessage(severity: MessageSeverity, isSticky = false) {
    if(isSticky) {
      this.alertService.showStickMessage('QQQ','RRRR', severity);
    } else{
      this.alertService.showMessage('QQQ','RRRR', severity);
    }
  }
}
