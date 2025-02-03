import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LoginResponse } from '../models/login-response.model';
import { LocalStoreManager } from './local-store-manager.service';
import { DBKeys } from './db-keys';
import { environment } from '../../environment/environment'

@Injectable({
  providedIn: 'root'
})
export class OideHelperService {

  private http = inject(HttpClient);
  private localStorage = inject(LocalStoreManager);

  private readonly client_id = 'NgWeb_WebApp'
  private readonly scope = 'openid email phone profile offline_access roles';

  private get tokenEndpoint() { return `${environment.baseUrl}/connect/token`}

  loginWithPassword(userName: string, password: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const params = new HttpParams()
      .append('username', userName)
      .append('password', password)
      .append('client_id', this.client_id)
      .append('grant_type', 'password')
      .append('scope', this.scope);

    return this.http.post<LoginResponse>(this.tokenEndpoint,params, {headers: headers} );
  }

  get accessTokenExpiyDate(): Date | null {
    return this.localStorage.getDataObject<Date>(DBKeys.TOKEN_EXPIRES_IN, true);
  }

  get isSessionExpired(): boolean {
    if(this.accessTokenExpiyDate == null) {
      return false;
    }

    return this.accessTokenExpiyDate.valueOf() < new Date().valueOf();
  }
}
