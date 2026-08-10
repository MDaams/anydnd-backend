/**
 * Logger utility that only logs when not in test environment
 * Prevents console spam during test runs
 */
export class AppLogger {
  private static isTestMode(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  static log(message: string): void {
    if (!this.isTestMode()) {
      console.log(message);
    }
  }

  static error(message: string, error?: any): void {
    if (!this.isTestMode()) {
      console.error(message, error);
    }
  }

  static warn(message: string): void {
    if (!this.isTestMode()) {
      console.warn(message);
    }
  }

  static debug(message: string): void {
    if (!this.isTestMode()) {
      console.debug(message);
    }
  }
}
