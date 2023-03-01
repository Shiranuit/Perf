export class Stacktrace {
  public static getStacktrace(extra: number = 0): NodeJS.CallSite[] {
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack as unknown as NodeJS.CallSite[];
    Error.prepareStackTrace = orig;

    if (stack !== null && typeof stack === 'object') {
      return stack.slice(2 + extra); // remove getStacktrace() and the caller + extra
    }

    return [];
  }
}