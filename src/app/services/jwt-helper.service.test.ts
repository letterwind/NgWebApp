import { TestBed } from '@angular/core/testing';
import { JwtHelper } from './jwt-helper.service';

describe('JwtHelper', () => {
  let service: JwtHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtHelper);
  });

  describe('url64BaseDecode', () => {
    it('should decode a valid base64url string', () => {
      const base64url = 'SGVsbG8tV29ybGQ_';
      const expected = 'Hello-World';
      expect(service.url64BaseDecode(base64url)).toEqual(expected);
    });

    it('should decode a base64url string with padding', () => {
      const base64url = 'SGVsbG8tV29ybGQ';
      const expected = 'Hello-World';
      expect(service.url64BaseDecode(base64url)).toEqual(expected);
    });

    it('should throw an error for an invalid base64url string', () => {
      const base64url = 'SGVsbG8tV29ybGQ!';
      expect(() => service.url64BaseDecode(base64url)).toThrowError('Illegal base64url string');
    });

    it('should decode a base64url string with two padding characters', () => {
      const base64url = 'SGVsbG8tV29ybGQ==';
      const expected = 'Hello-World';
      expect(service.url64BaseDecode(base64url)).toEqual(expected);
    });

    it('should decode a base64url string with one padding character', () => {
      const base64url = 'SGVsbG8tV29ybGQ=';
      const expected = 'Hello-World';
      expect(service.url64BaseDecode(base64url)).toEqual(expected);
    });
  });
});
