
import { createHook, AsyncHook, AsyncLocalStorage } from 'node:async_hooks';
import { Logger } from '../Logger';
import { PerfStorage } from './PerfStorage';
import { PerfRecord } from './PerfRecord';
import { Stacktrace } from './Stacktrace';
import { Perf } from './Perf';

export class PerfHook {

  private hook: AsyncHook;
  private asyncLocalStorage: AsyncLocalStorage<PerfStorage>;
  private records: Map<number, PerfRecord> = new Map();
  private recordsByCaller: Map<string, PerfRecord> = new Map();

  constructor(asyncLocalStorage: AsyncLocalStorage<PerfStorage>) {
    this.hook = createHook({
      init: this.init.bind(this),
      before: this.before.bind(this),
      after: this.after.bind(this),
      destroy: this.destroy.bind(this),
      promiseResolve: this.promiseResolve.bind(this),
    });
    this.asyncLocalStorage = asyncLocalStorage;
  }

  public enable() {
    this.hook.enable();
  }

  public disable() {
    this.hook.disable();
  }

  private contextSwitch(asyncId: number, triggerAsyncId: number, entering: boolean, storage: PerfStorage | undefined) {
    // const record = storage.stack.getCurrent();

    if (Perf._currentStore && storage && Perf._currentStore.id === storage.id) {
      return;
    }

    if (Perf._currentStore) {
      Logger.log(`Pause chrono for ${Perf._currentStore.id} (${Perf._currentStore.chrono.getDuration()}ms) |${Date.now()}|`);
      Perf._currentStore.chrono.pause();
    }
    Perf._currentStore = storage;
    if (Perf._currentStore) {
      Logger.log(`Resume chrono for ${Perf._currentStore.id} (${Perf._currentStore.chrono.getDuration()}ms) |${Date.now()}|`);
      Perf._currentStore.chrono.resume();
    }

    // if (!record || triggerAsyncId !== -1) {
    //   return;
    // }

    // if (entering) {
    //   Logger.log(`contextSwitch: ${asyncId} -> ${record.name}`);
    //   storage.chrono.resume();
    //   record._lastStart = storage.chrono.getDuration();
    // } else {
    //   storage.chrono.pause();
    //   record.duration += storage.chrono.getDuration() - record._lastStart;
    //   record._lastStart = storage.chrono.getDuration();
    // }
  }

  private init(asyncId: number, type: string, triggerAsyncId: number, resource: object) {
    const store = this.asyncLocalStorage.getStore();
    // if (!store) {
    //   return;
    // }

    let stacktrace = Stacktrace.getStacktrace(4);
    Logger.log(`init: ${stacktrace[0].getFunctionName()} (${asyncId}) [${triggerAsyncId}]`);
    // stacktrace = Stacktrace.getStacktrace(0);
    // for (const frame of stacktrace) {
    //   Logger.log(`     ${frame.toString()}`);
    // }


    this.contextSwitch(asyncId, triggerAsyncId, true, store);
  }

  private before(asyncId: number) {
    const store = this.asyncLocalStorage.getStore();
    
    // if (!store) {
    //   return;
    // }

    Logger.log(`before: ${asyncId}`);
    let stacktrace = Stacktrace.getStacktrace(0);
    for (const frame of stacktrace) {
      Logger.log(`     ${frame.toString()}`);
    }
    this.contextSwitch(asyncId, -1, true, store);

  }

  private after(asyncId: number) {
    const store = this.asyncLocalStorage.getStore();
    // if (!store) {
    //   return;
    // }
    
    Logger.log(`after: ${asyncId}`);
    this.contextSwitch(asyncId, -1, false, store);

  }

  private destroy(asyncId: number) {
    const store = this.asyncLocalStorage.getStore();
    // if (!store) {
    //   return;
    // }

    Logger.log(`destroy: ${asyncId}`);
    this.contextSwitch(asyncId, -1, false, store);

  }

  private promiseResolve(asyncId: number) {
    const store = this.asyncLocalStorage.getStore();
    // if (!store) {
    //   return;
    // }

    Logger.log(`promiseResolve: ${asyncId}`);
    this.contextSwitch(asyncId, -1, false, store);

  }
}