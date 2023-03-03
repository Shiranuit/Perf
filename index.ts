import { Logger } from "./Logger";
import { Perf } from "./lib/Perf";

function longRun() {
  let x = 0;
  for (let i = 0; i < 1000000000; i++) {
    x += 1;
  }
  return x;
}

async function B() {

}

async function A() {
  await B();
}

async function main() {
  A();
  await A();
  longRun();
}

Perf.enable();
Perf.trace(() => {
  return main();
}, (result) => {
  Perf.disable();
  Logger.showLogs();
  console.log('Result:', result);
});