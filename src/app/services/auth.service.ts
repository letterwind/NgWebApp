import { inject, Injectable } from '@angular/core';
import { LocalStoreManager } from './local-store-manager.service';
import { User } from '../models/user.model';
import { DBKeys } from './db-keys';
import { map, Observable, Subject, throwIfEmpty } from 'rxjs';
import { UserLogin } from '../models/user-login.model';
import { OideHelperService } from './oide-helper.service';
import { IdToken, LoginResponse } from '../models/login-response.model';
import { JwtHelper } from './jwt-helper.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private oidcHelperService = inject(OideHelperService);

  public readonly loginUrl = '/login';
  public get homeUrl() {return '/'; }
  private localStorage = inject(LocalStoreManager);
  private router = inject(Router);
  private previousIsLoggedInCheck = false;

  public loginRedirectUrl: string | null = null;

  private loginStatus = new Subject<boolean>();


  constructor() {
    this.initializeLoginStatus();
  }

  get currentUser(): User | null {
    const user = this.localStorage.getDataObject<User>(DBKeys.CURRENT_USER);

    this.reevaluateLoginStatus(user);

    return user;
  }

  get isLoggedIn(): boolean {
    return this.currentUser != null && !this.isSessionExpired;
  }

  get rememberMe(): boolean {
    return this.localStorage.getDataObject<Boolean>(DBKeys.REMEMBER_ME) === true;
  }

  get isSessionExpired(): boolean {
    return this.oidcHelperService.isSessionExpired;
  }

  private initializeLoginStatus() {
    this.localStorage.getInitEvent().subscribe(() => {
      this.reevaluateLoginStatus();
    })
  }

  private reevaluateLoginStatus(currentUser?: User | null) {
    let user = currentUser ?? this.localStorage.getDataObject<User>(DBKeys.CURRENT_USER);

    const isLoggedIn = user != null;
    if (this.previousIsLoggedInCheck !== isLoggedIn) {
      setTimeout(() => {
        this.loginStatus.next(isLoggedIn);
      });
    }

    this.previousIsLoggedInCheck = isLoggedIn;
  }

  public getLoginStatusEvent(): Observable<boolean> {
    return this.loginStatus.asObservable();
  }

  public redirectLoginUser() {
    this.router.navigate([this.homeUrl]);
  }

  public redirectLogoutUser() {
    this.router.navigate([this.loginUrl]);
  }

  loginWithPassword(userLogin: UserLogin) {
    if (this.isLoggedIn) {
      this.logout();
    }

    return this.oidcHelperService.loginWithPassword(userLogin.userName, userLogin.password)
      .pipe(map(response => this.processLoginProcess(response, userLogin.rememberMe)));
  }

  private processLoginProcess(response: LoginResponse, remember?: boolean) {
    const idToken = response.id_token;
    const accessToken = response.access_token;
    const refreshToken = response.refresh_token;

    if (idToken == null) {
      throw new Error('idToken can not be null');
    }

    if (accessToken == null) {
      throw new Error('accessToken can not be null');
    }

    remember = remember ?? this.rememberMe;

    const accessTokenExpiry = new Date();
    accessTokenExpiry.setSeconds(accessTokenExpiry.getSeconds() + response.expires_in);

    const jwtHelper = new JwtHelper();
    const decodedIdToken = jwtHelper.decodeToken(idToken) as IdToken;

    const user = new User(
      decodedIdToken.sub,
      decodedIdToken.name,
      decodedIdToken.fullname,
      decodedIdToken.email,
      decodedIdToken.jobtitle,
      decodedIdToken.phone_number
    );

    user.isEnabled = true;

    this.saveUserData(user, accessToken, refreshToken, accessTokenExpiry, remember);

    this.reevaluateLoginStatus(user);

    return user;
  }

  private saveUserData(user: User, accessToken: string, refreshToken: string, expriedIn: Date, rememberMe?: boolean) {
    if(rememberMe === true) {
      this.localStorage.savePermanentData(accessToken, DBKeys.ACCESS_TOKEN);
      this.localStorage.savePermanentData(refreshToken, DBKeys.REFRESH_TOKEN);
      this.localStorage.savePermanentData(expriedIn, DBKeys.TOKEN_EXPIRES_IN);
      this.localStorage.savePermanentData(user, DBKeys.CURRENT_USER);
    } else {
      this.localStorage.saveSyncedSessionData(accessToken, DBKeys.ACCESS_TOKEN);
      this.localStorage.saveSyncedSessionData(refreshToken, DBKeys.REFRESH_TOKEN);
      this.localStorage.saveSyncedSessionData(expriedIn, DBKeys.TOKEN_EXPIRES_IN);
      this.localStorage.saveSyncedSessionData(user, DBKeys.CURRENT_USER);
    }

    this.localStorage.savePermanentData(rememberMe, DBKeys.REMEMBER_ME);
  }

  logout() {
    this.localStorage.deleteData(DBKeys.ACCESS_TOKEN);
    this.localStorage.deleteData(DBKeys.REFRESH_TOKEN);
    this.localStorage.deleteData(DBKeys.TOKEN_EXPIRES_IN);
    this.localStorage.deleteData(DBKeys.CURRENT_USER);

    this.reevaluateLoginStatus();
  }
}
