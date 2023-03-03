export class Logger {
  private static logs: any[] = [];

  static log(...args: any[]) {
    Logger.logs.push([Date.now(), ...args]);
  }

  static showLogs() {
    for (const log of Logger.logs) {
      const date = log[0];
      const data = log.splice(1);
      console.log(`[${date}]`,...data);
    }
  }
}