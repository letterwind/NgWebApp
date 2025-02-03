import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Utilities } from './utilities.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStoreManager {

  private static syncListenerInitialized = false;

  public static readonly DBKEY_USER_DATA = 'user_data';
  public static readonly DBKEY_SYNC_KEYS = 'sync_keys';

  private initEvent = new Subject<void>();

  private reservedKeys: string[] = [
    'sync_keys',
    'addToSyncKeys',
    'removeFromSyncKeys',
    'getSessionStorage',
    'setSessionStorage',
    'addToSessionStorage',
    'removeFromSessionStorage',
    'clearAllSessionStorage'
  ];

  private syncKeys: string[] = [];
  constructor() { }


  public initialiseStorageSyncListener() {
    if (LocalStoreManager.syncListenerInitialized === true) {
      return;
    }

    LocalStoreManager.syncListenerInitialized = true;

    window.addEventListener('storage', this.sessionStorageTransferHandler, false);
    this.syncSessionStorage();
  }

  private syncSessionStorage() {
    localStorage.setItem('getSessionStorage', '_dummy');
    localStorage.removeItem('getSessionStorage');
  }

  private localStorageSetItem(key: string, data: unknown) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private sessionStorageSetItem(key: string, data: unknown) {
    sessionStorage.setItem(key, JSON.stringify(data));
  }

  private loadSyncKeys() {
    if (this.syncKeys.length) {
      return;
    }

    this.syncKeys = this.getSyncKeysFromStorage();
  }

  private getSyncKeysFromStorage(defaultValue: string[] = []): string[] {
    const data = this.localStorageGetItem(LocalStoreManager.DBKEY_SYNC_KEYS);

    if (data == null) {
      return defaultValue;
    } else {
      return data as string[];
    }
  }

  private sessionStorageTransferHandler = (event: StorageEvent) => {
    console.log(event);
    if (event.newValue == null) {
      return;
    }

    if (event.key === 'getSessionStorage') {
      if (sessionStorage.length) {
        this.localStorageSetItem('setSessionStorage', sessionStorage);
        localStorage.removeItem('setSessionStorage');
      }
    } else if (event.key === 'setSessionStorage') {
      if (!this.syncKeys.length) {
        this.loadSyncKeys();
      }

      const data = JSON.parse(event.newValue);

      for (const key in data) {
        if (this.syncKeyContains(key)) {
          this.sessionStorageSetItem(key, JSON.parse(data[key]));
        }
      }

      this.OnInit();
    } else if(event.key === 'addToSessionStorage') {
      const data = JSON.parse(event.newValue);
      this.addToSessionStorageHelper(data.data, data.key);
    } else if(event.key === 'removeFromSessionStorage') {
      this.removeFromSessionStorageHelper(event.newValue);
    } else if(event.key === 'clearAllSessionStorage' && sessionStorage.length) {
      this.clearInstanceSessionStorage();
    } else if(event.key === 'addToSyncKeys') {
      this.addToSyncKeysHelper(event.newValue);
    } else if(event.key === 'removeFromSyncKeys') {
      this.removeFromSyncKeysHelper(event.newValue);
    }

  }

  private clearInstanceSessionStorage() {
    sessionStorage.clear();
    this.syncKeys = [];
  }

  private removeFromSessionStorage(key: string) {
    this.removeFromSessionStorageHelper(key);

    this.removeFromSyncKeysBackup(key);
    localStorage.setItem('removeFromSessionStorage', key);
    localStorage.removeItem('removeFromSessionStorage');

  }

  private removeFromSyncKeysBackup(key: string) {
    const storedSyncKeys = this.getSyncKeysFromStorage();

    const index = storedSyncKeys.indexOf(key);

    if(index > -1) {
      storedSyncKeys.slice(index ,1);
      this.localStorageSetItem(LocalStoreManager.DBKEY_SYNC_KEYS, storedSyncKeys);
    }
  }

  private removeFromSessionStorageHelper(keyToRemove: string) {
    sessionStorage.removeItem(keyToRemove);
    this.removeFromSyncKeysHelper(keyToRemove);
  }

  private removeFromSyncKeysHelper(keyToRemove: string) {
    const index = this.syncKeys.indexOf(keyToRemove);

    if(index !== -1) {
      this.syncKeys.splice(index, 1);
    }
  }

  private addToSessionStorage(key: string, data: unknown) {
    this.addToSessionStorageHelper(data, key);

    this.addToSyncKeysBackup(key);

    this.localStorageSetItem('addToSessionStorage', {key, data});
    localStorage.removeItem('addToSessionStorage');
  }

  private addToSyncKeysBackup(key: string) {
    const storedSyncKeys = this.getSyncKeysFromStorage();
    if(!storedSyncKeys.some(x=>x === key)){
      storedSyncKeys.push(key);

      this.localStorageSetItem(LocalStoreManager.DBKEY_SYNC_KEYS, storedSyncKeys);
    }
  }

  private addToSessionStorageHelper(data: unknown, key: string) {
    this.addToSyncKeysHelper(key);
    this.sessionStorageSetItem(key, data);
  }

  private addToSyncKeysHelper(key: string) {
    if(!this.syncKeyContains(key)){
      this.syncKeys.push(key);
    }
  }

  private syncKeyContains(key: string) {
    return this.syncKeys.some(x => x === key);
  }

  private OnInit() {
    setTimeout(() =>{
      this.initEvent.next();
      this.initEvent.complete();
    });
  }

  public getInitEvent(): Observable<void> {
    return this.initEvent.asObservable();
  }

  public savePermanentData(data: unknown, key = LocalStoreManager.DBKEY_USER_DATA) {
    this.testForInvalidKeys(key);

    this.removeFromSessionStorage(key);
    this.sessionStorageSetItem(key, data);
  }

  public saveSyncedSessionData(data: unknown, key = LocalStoreManager.DBKEY_USER_DATA) {
    this.testForInvalidKeys(key);

    localStorage.removeItem(key);
    this.addToSessionStorage(key, data);

  }

  public getDataObject<T>(key = LocalStoreManager.DBKEY_USER_DATA, isDateType = false): T | null {
    let data = this.getData(key);

    if (data != null) {
      if (isDateType) {
        data = new Date(data);
      }
      return data as T;
    } else {
      return null;
    }

  }

  private getData(key = LocalStoreManager.DBKEY_USER_DATA) {
    this.testForInvalidKeys(key);

    let data = this.sessionStorageGetItem(key);

    if (data == null) {
      data = this.localStorageGetItem(key);
    }

    return data;
  }

  private localStorageGetItem(key: string) {
    let item = localStorage.getItem(key);

    if (item == null) {
      return null;
    }

    return Utilities.JsonTryparse(item);
  }

  private sessionStorageGetItem(key: string) {
    let data = sessionStorage.getItem(key);

    if (data == null) {
      return null;
    }

    return Utilities.JsonTryparse(data);
  }

  private testForInvalidKeys(key: string) {
    if (!key) {
      throw new Error('key can not be null or empty');
    }

    if (this.reservedKeys.some(x => x === key)) {
      throw new Error(`The storage key ${key} is reserved and cnanot be used. Please use a different key`);
    }
  }

  public deleteData(key: string) {
    this.testForInvalidKeys(key);

    this.removeFromSessionStorage(key);
    localStorage.removeItem(key);
  }
}
