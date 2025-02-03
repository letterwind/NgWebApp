import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtHelper {

  public url64BaseDecode(str: string) {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');

    switch(output.length % 4) {
      case 0: { break; }
      case 2: {output += '=='; break;}
      case 3: {output += '='; break;}
      default: {
        throw new Error('Illegal base64url string');
      }
    }

    return this.b64DecodeUnicode(output);
  }

  private b64DecodeUnicode(str: string) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  public decodeToken(token: string) {
    var parts = token.split('.');

    if(parts.length !== 3) {
      throw new Error('JWT must have 3 parts');
    }

    const decode = this.url64BaseDecode(parts[1]);
    if(!decode) {
      throw new Error('Can not decode token');
    }

    return JSON.parse(decode);
  }

  public getTokenExpirationDate(token: string) {
    const decode = this.decodeToken(token);

    if(!Object.prototype.hasOwnProperty.call(decode, 'exp')){
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decode.exp);

    return date;
  }

  public isTokenExpired(token: string, offsetSeconds?: number): boolean{
    const date = this.getTokenExpirationDate(token);
    offsetSeconds = offsetSeconds || 0;

    if(date == null){
      return false;
    }

    // expired?
    return date.valueOf() < (new Date().valueOf()+offsetSeconds*1000);
  }

}
