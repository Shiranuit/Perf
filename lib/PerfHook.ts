
import { createHook, AsyncHook, AsyncLocalStorage } from 'node:async_hooks';
import { Logger } from '../Logger';
import { PerfStorage } from './PerfStorage';
import { PerfRecord } from './PerfRecord';
import { Stacktrace } from './Stacktrace';
import { Perf } from './Perf';

export class PerfHook {

  private hook: AsyncHook;
  private asyncLocalStorage: AsyncLocalStorage<PerfStorage>;
  private enabled = false;

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
    if (this.enabled) {
      return;
    }

    this.enabled = true;
    this.hook.enable();
  }

  public disable() {
    if (!this.enabled) {
      return;
    }
    this.enabled = false;
    this.hook.disable();
  }


  private init(asyncId: number, type: string, triggerAsyncId: number, resource: object) {
    if (!this.enabled) {
      return;
    }

    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      return;
    }

    let stacktrace = Stacktrace.getStacktrace(4);
    Logger.log(`Init: ${stacktrace[0].getFunctionName()} (${asyncId}) [${triggerAsyncId}]`);
    // for (const frame of Stacktrace.getStacktrace(0)) {
    //   Logger.log(`  ${frame.toString()}`);
    // }
    store.runningPromisesInfo.set(asyncId, stacktrace[0].getFunctionName());
    store.runningPromises.add(asyncId);
  }

  private before(asyncId: number) {
    if (!this.enabled) {
      return;
    }

    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      return;
    }

    Logger.log(`Before: ${store.runningPromisesInfo.get(asyncId)} (${asyncId})`);
  }

  private after(asyncId: number) {
    if (!this.enabled) {
      return;
    }

    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      return;
    }

    Logger.log(`After: ${store.runningPromisesInfo.get(asyncId)} (${asyncId})`);
  }

  private destroy(asyncId: number) {
    if (!this.enabled) {
      return;
    }

    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      return;
    }

    Logger.log(`Destroy: ${store.runningPromisesInfo.get(asyncId)} (${asyncId})`);
    store.runningPromises.delete(asyncId);
    if (store.runningPromises.size === 0) {
      // store.resultCallback();
    }
  }

  private promiseResolve(asyncId: number) {
    if (!this.enabled) {
      return;
    }

    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      return;
    }
    Logger.log(`Resolve: ${store.runningPromisesInfo.get(asyncId)} (${asyncId})`);
    store.runningPromises.delete(asyncId);
    if (store.runningPromises.size === 0) {
      // store.resultCallback();
    }
  }
}