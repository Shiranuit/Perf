export class Logger {
  private static logs: any[] = [];

  static log(...args: any[]) {
    Logger.logs.push(args);
  }

  static showLogs() {
    for (const log of Logger.logs) {
      // console.log(...log);
    }
  }
}