import { StackBuilder } from "./StackBuilder";
import { PerfRecord } from "./PerfRecord";
import { Chrono } from "./Chrono";

export type PerfStorage = {
  id: bigint;
  stack: StackBuilder<PerfRecord>;
  chrono: Chrono;
  resultCallback: Function;
  runningPromises: Set<number>;
  runningPromisesInfo: Map<number, string>;
}