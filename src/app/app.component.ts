import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LocalStoreManager } from './services/local-store-manager.service';
import { ToastaConfig, ToastaModule, ToastaService, ToastData, ToastOptions } from 'ngx-toasta';
import { AlertCommand, AlertService, MessageSeverity } from './services/alert.service';
import { Notyf, INotyfOptions, INotyfIcon } from 'notyf';
// import 'notyf/notyf.min.css';

@Component({
  selector: 'app-root',
  imports: [ToastaModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private toastaService = inject(ToastaService);
  private toastaConfig = inject(ToastaConfig);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  appTitle = 'NG Web App'

  isUserLoggedIn = false;

  stickyToasties: number[] = [];

  private notyf = new Notyf({
    duration: 3000,
    position: {
      x: 'right',
      y: 'top',
    },
    types: [
      {
        type: 'info',
        background: '#518be1',
        icon: {
          className: 'fas fa-fw fa-exclamation-circle',
          tagName: 'i',
          color:'white',
          text: ''
        }
      },
      {
        type: 'warning',
        background: 'orange',
        icon: {
          className: 'fas fa-fw fa-exclamation-triangle',
          tagName: 'i',
          color:'white',
          text: ''
        }
      }
    ]
  });

  constructor() {
    const storageManager = inject(LocalStoreManager);

    storageManager.initialiseStorageSyncListener();

  }

  ngOnInit(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn;
    this.alertService.getMessageEvent().subscribe(message => this.showToast(message));

    // setTimeout(() => {
    // this.alertService.logInfo('isUserloggedIn:'+this.isUserLoggedIn);
    if (!this.isUserLoggedIn) {
      this.logout();
    } else {
      this.alertService.resetStickyMessage();
      this.alertService.showMessage('登入', '歡迎:' + this.username, MessageSeverity.info);
      // this.alertService.showMessage('登入1', '歡迎:' + this.username, MessageSeverity.default);
    }
    // }, 2000);


    this.authService.getLoginStatusEvent().subscribe(isLoggedIn => {
      this.isUserLoggedIn = isLoggedIn;

      setTimeout(() => {
        if (this.authService.isSessionExpired) {
          this.alertService.showMessage('', '登入時間已逾時,請重新登入', MessageSeverity.default);
        }
      }, 500);

    });
  }

  showToast(alert: AlertCommand) {
    if (alert.operation === 'clear') {
      // for (const id of this.stickyToasties.slice(0)) {
      //   this.toastaService.clear(id);
      // }
    }


    // const toastOptions: ToastOptions = {
    //   title: alert.message?.summary,
    //   msg: alert.message?.detail
    // };

    if (alert.operation === 'add_sticky') {
      this.notyf.options.duration = 0;
      this.notyf.options.dismissible = true;
      // toastOptions.timeout = 0;

      // toastOptions.onAdd = (toast: ToastData) => {
      //   this.stickyToasties.push(toast.id);
      // }

      // toastOptions.onRemove = (toast: ToastData) => {
      //   const index = this.stickyToasties.indexOf(toast.id, 0);

      //   if (index > -1) {
      //     this.stickyToasties.splice(index, 1);
      //   }

      //   if (alert.onRemove) {
      //     alert.onRemove();
      //   }

      //   toast.onAdd = undefined;
      //   toast.onRemove = undefined;
      // };
    } else {
      // toastOptions.timeout = 30000;
      this.notyf.options.duration = 3000;
    }

    switch (alert.message?.severity) {
      case MessageSeverity.default: this.notyf.open({type: 'info', message: alert.message?.detail!}); break;
      case MessageSeverity.info: this.notyf.open({type: 'info', message: alert.message?.detail!}); break;
      case MessageSeverity.success: this.notyf.open({type: 'success', message: alert.message?.detail!}); break;
      case MessageSeverity.error: this.notyf.open({type: 'error', message: alert.message?.detail!}); break;
      case MessageSeverity.warn: this.notyf.open({type: 'warning', message: alert.message?.detail!}); break;
      case MessageSeverity.wait: this.notyf.open({type: 'info', message: alert.message?.detail!}); break;
    }

  }

  logout() {
    this.authService.logout();
    this.authService.redirectLogoutUser();
  }

  get username() {
    return this.authService.currentUser?.userName;
  }

}
