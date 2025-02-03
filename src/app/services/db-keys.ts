import { Injectable } from "@angular/core";

@Injectable()
export class DBKeys {
  public static readonly CURRENT_USER = "current_user";
  public static readonly REMEMBER_ME = "remember_me";
  public static readonly ACCESS_TOKEN = 'access_token';
  public static readonly REFRESH_TOKEN = 'refresh_token';
  public static readonly TOKEN_EXPIRES_IN = 'expires_in';
}
