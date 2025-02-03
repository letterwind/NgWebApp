import { NgClass } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserLogin } from '../../models/user-login.model';
import { Subscription } from 'rxjs';
import { AlertService, DialogType, MessageSeverity } from '../../services/alert.service';
import { User } from '../../models/user.model';
import { Utilities } from '../../services/utilities.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgClass],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  userLogin = new UserLogin();
  isLoading = false;
  formResetToggle = true;
  loginStatusSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.userLogin.rememberMe = this.authService.rememberMe;
    if (this.getShouldRedirect()) {
      this.authService.redirectLoginUser();
    } else {
      this.loginStatusSubscription = this.authService.getLoginStatusEvent().subscribe(isLoggedIn => {
        if (this.getShouldRedirect()) {
          this.authService.redirectLoginUser();
        }
      });
    }

  }

  getShouldRedirect() {
    return this.authService.isLoggedIn && !this.authService.isSessionExpired;
  }

  login() {
    this.isLoading = true;

    this.alertService.startLoadingMessage('', '登入中...');

    this.authService.loginWithPassword(this.userLogin).subscribe({
      next: user => {
        setTimeout(() => {
          this.alertService.stopLoadingMessage();
          this.isLoading = false;

          this.reset();

          this.alertService.showMessage('登入成功',`${user.friendlyName} 你好`, MessageSeverity.success);

        }, 500);
      },
      error: (error) => {
        this.alertService.stopLoadingMessage();

        if(Utilities.checkNoNetwork(error)){

        } else {
          const errorMessage = Utilities.getHttpResponseMessage(error);

          if(errorMessage) {
            this.alertService.showStickMessage('Unable to login', this.mapLoginErrorMessage(errorMessage), MessageSeverity.error, error);
          } else {
            this.alertService.showStickMessage('Unable to login', 'An error occurred whilst logging in, please try again later.\nError: ' + Utilities.stringify(error), MessageSeverity.error, error);
          }
        }

        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      }
    });
  }

  displayErrorAlert(caption: string, message: string) {
    this.alertService.showMessage(caption, message, MessageSeverity.error);
  }

  mapLoginErrorMessage(error: string) {
    if (error === 'invalid_username_or_password') {
      return 'Invalid username or password';
    }

    return error;
  }

  loginErr() {
    alert('login error');
  }

  ngOnDestroy(): void {
    this.loginStatusSubscription?.unsubscribe();
  }

  reset() {

  }

}
