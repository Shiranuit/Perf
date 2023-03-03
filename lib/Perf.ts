import { AsyncLocalStorage } from 'async_hooks';
import { PerfHook } from './PerfHook';
import { PerfStorage } from './PerfStorage';
import { Stack, StackBuilder } from './StackBuilder';
import { PerfRecord } from './PerfRecord';
import { Chrono } from './Chrono';
import { Logger } from '../Logger';

export type AsyncFunction<T> = () => Promise<T | void>;
export type ResultCallback = (result: Stack<PerfRecord>) => void;

export class Perf {
  private static enabled = false;
  private static asyncLocalStorage = new AsyncLocalStorage<PerfStorage>();
  private static hook: PerfHook = new PerfHook(Perf.asyncLocalStorage);
  private static lastId = 0n;
  public static _currentStore: PerfStorage | undefined;

  public static enable() {
    if (Perf.enabled) {
      return;
    }

    Perf.enabled = true;
    Perf.hook.enable();
  }

  public static disable() {
    if (!Perf.enabled) {
      return;
    }

    Perf.enabled = false;
    Perf.hook.disable();
  }

  public static async trace<T>(func: Function, onResult: ResultCallback | undefined): Promise<T | void> {
    if (!Perf.enabled) {
      return func();
    }

    let promise;

    const id = Perf.lastId++;

    const chrono = new Chrono();
    const stack = new StackBuilder<PerfRecord>();

    const store: PerfStorage = {
      id,
      stack,
      chrono,
      runningPromises: new Set(),
      runningPromisesInfo: new Map(),
      resultCallback: () => {
        if (onResult) {
          onResult(stack.getRoot());
        }
      }
    };

    Perf.asyncLocalStorage.run(store, () => {
      chrono.start();
      promise = func();
    });

    const result = await promise;
    if (onResult) {
      onResult(stack.getRoot());
    }
    return result;
  }

  public static async runWithTag(tag: string, func: Function, ...args: any[]): Promise<any> {
    if (!Perf.enabled) {
      return func(...args);
    }

    const store = Perf.asyncLocalStorage.getStore();
    if (!store) {
      return func(...args);
    }

    store.stack.push({ name: tag, _lastStart: store.chrono.getDuration(), duration: 0, arguments: args });
    try {
      Logger.log(`=== Start: ${tag} |${Date.now()}|`);
      const result = await func(...args);
      const current = store.stack.getCurrent();
      if (current) {
        current.duration += store.chrono.getDuration() - current._lastStart;
        Logger.log(`=== End: ${tag} ${current?.name} (${current.duration}ms) |${Date.now()}|`);
      }
      store.stack.pop();
      return result;
    } catch (e) {
      store.stack.pop();
      throw e;
    }
  }


}