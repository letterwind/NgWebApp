import { HttpErrorResponse, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { Injectable } from '@angular/core';

type HttpMessageSearchOptions = Readonly<{
  searchInCaption?: boolean;
  searchInMessage?: boolean;
  exactMatch?: boolean;
  startsWith?: boolean;
  endsWith?: boolean;
  contains?: boolean;
  resultType?: 'caption' | 'preferMessage' | 'both';
}>;


@Injectable({
  providedIn: 'root'
})
export class Utilities {

  public static readonly captionAndMessageSeparator = ':';
  public static readonly noNetworkMessageCaption = 'No Network';
  public static readonly noNetworkMessageDetail = 'The server cannot be reached';
  public static readonly accessDeniedMessageCaption = 'Access Denied!';
  public static readonly accessDeniedMessageDetail = '';
  public static readonly notFoundMessageCaption = 'Not Found';
  public static readonly notFoundMessageDetail = 'The target resource cannot be found';

  public static readonly findHttpResponseMessageDefaultSearchOption: HttpMessageSearchOptions = {
    searchInCaption: true,
    searchInMessage: false,
    exactMatch: true,
    startsWith: false,
    endsWith: false,
    contains: false,
    resultType: 'preferMessage',
  };

  public static getResponseData(response: HttpResponseBase) {
    let results;

    if (response instanceof HttpResponse) {
      results = response.body;
    }

    if (response instanceof HttpErrorResponse) {
      results = response.error || response.message || response.statusText;
    }

    return results;
  }

  public static checkNoNetwork(response: HttpResponseBase) {
    if (response instanceof HttpResponseBase) {
      return response.status === 0;
    }

    return false;
  }

  public static checkAccessDenied(response: HttpResponseBase) {
    if (response instanceof HttpResponseBase) {
      return response.status === 403;
    }

    return false;
  }

  public static checkNotFound(response: HttpResponseBase) {
    if (response instanceof HttpResponseBase) {
      return response.status === 404;
    }

    return false;
  }

  public static checkIsLocalHost(url: string, base?: string) {
    if (url) {
      const location = new URL(url, base);
      return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    }

    return false;
  }

  public static getHttpResponseMessage(data: HttpResponseBase, ...preferredMessageKeys: string[]): string | null {
    let httpMessage =
      Utilities.findHttpResponseMessage(Utilities.noNetworkMessageCaption, data) ||
      Utilities.findHttpResponseMessage(Utilities.notFoundMessageCaption, data) ||
      Utilities.findHttpResponseMessage('error_description', data);

    if (!httpMessage) {
      for (const msgKey of preferredMessageKeys) {
        httpMessage = Utilities.findHttpResponseMessage(msgKey, data);

        if (httpMessage?.trim() !== '')
          return httpMessage;
      }
    }

    if (!httpMessage) {
      httpMessage = Utilities.findHttpResponseMessage('error', data);
    }

    if (!httpMessage) {
      const responseMessages = Utilities.getHttpResponseMessages(data);

      if (responseMessages.length)
        httpMessage = responseMessages.join('\n');
    }

    return httpMessage;
  }

  public static getHttpResponseMessages(data: HttpResponseBase): string[] {
    const responses: string[] = [];

    if (this.checkNoNetwork(data)) {
      responses.push(`${this.noNetworkMessageCaption}${this.captionAndMessageSeparator} ${this.noNetworkMessageDetail}`);
    } else {
      const responseData = this.getResponseData(data);
      if (responseData) {
        if (typeof responseData === 'object') {
          for (const key in responseData) {
            responses.push(`${key}${this.captionAndMessageSeparator} ${responseData[key]}`);
          }
        }
        else {
          responses.push(responseData);
        }
      }
    }

    if (this.checkAccessDenied(data)) {
      responses.splice(0, 0, `${this.accessDeniedMessageCaption}${this.captionAndMessageSeparator} ${this.accessDeniedMessageDetail}`);
    }

    if (this.checkNotFound(data)) {
      let message = `${this.notFoundMessageCaption}${this.captionAndMessageSeparator} ${this.notFoundMessageDetail}`;
      if (data.url) {
        message += `. ${data.url}`;
      }

      responses.splice(0, 0, message);
    }

    if (!responses.length) {
      const response = (data as HttpErrorResponse).message ?? data.statusText;

      if (response)
        responses.push(response);
    }

    return responses;
  }

  public static findHttpResponseMessage(searchString: string, data: HttpResponseBase,
    searchOptions?: HttpMessageSearchOptions): string | null {

    searchString = searchString.toUpperCase();
    searchOptions = { ...this.findHttpResponseMessageDefaultSearchOption, ...searchOptions };

    let result: string | null = null;
    let captionAndMessage = { caption: '', message: null as string | null };
    const httpMessages = this.getHttpResponseMessages(data);

    for (const httpMsg of httpMessages) {
      const splitMsg = Utilities.splitInTwo(httpMsg, this.captionAndMessageSeparator);
      captionAndMessage = { caption: splitMsg.firstPart, message: splitMsg.secondPart ?? null };

      let messageToSearch = '';

      if (searchOptions.searchInCaption && searchOptions.searchInMessage)
        messageToSearch = httpMsg;
      else if (searchOptions.searchInCaption)
        messageToSearch = captionAndMessage.caption;
      else if (searchOptions.searchInMessage)
        messageToSearch = captionAndMessage.message ?? '';

      messageToSearch = messageToSearch.toUpperCase();

      if (searchOptions.exactMatch && messageToSearch === searchString) {
        result = httpMsg;
        break;
      }

      if (searchOptions.startsWith && messageToSearch.startsWith(searchString)) {
        result = httpMsg;
        break;
      }

      if (searchOptions.endsWith && messageToSearch.endsWith(searchString)) {
        result = httpMsg;
        break;
      }

      if (searchOptions.contains && messageToSearch.includes(searchString)) {
        result = httpMsg;
        break;
      }
    }

    if (result && searchOptions.resultType)
      switch (searchOptions.resultType) {
        case 'preferMessage':
          return captionAndMessage.message ?? captionAndMessage.caption;
        case 'caption':
          return captionAndMessage.caption;
        case 'both':
          return result;
      }
    else
      return result;
  }

  public static splitInTwo(text: string, separator: string, splitFromEnd = false): { firstPart: string, secondPart: string | undefined } {
    let separatorIndex = -1;

    if (separator !== '') {
      if (!splitFromEnd)
        separatorIndex = text.indexOf(separator);
      else
        separatorIndex = text.lastIndexOf(separator);
    }

    if (separatorIndex === -1) {
      return { firstPart: text, secondPart: undefined };
    }

    const part1 = text.substring(0, separatorIndex).trim();
    const part2 = text.substring(separatorIndex + 1).trim();

    return { firstPart: part1, secondPart: part2 };
  }

  public static JsonTryparse(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  public static stringify(value: unknown, depth = 3): string {
    const worker = (value: unknown, depth: number, padding = ''): string => {
      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'object') {
        const objectobject = '[object Object]';

        const result = value.toString();
        if (result !== objectobject)
          return result;

        const keyValuePairs = [];
        let tab = `\n${padding}`;

        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            const keyEntry = value[key as keyof object];

            if (typeof keyEntry !== 'function') {
              const keyValue = depth > 0 ? worker(keyEntry, depth - 1, padding + ' ') : String(keyEntry);
              keyValuePairs.push(`${tab}${key}: ${keyValue === objectobject ? '...' : keyValue}`);
              tab = padding;
            }
          }
        }

        return keyValuePairs.join('\n');
      }

      return String(value);
    }

    return worker(value, depth); //.replace(/^\s+/, '');
  }

}
