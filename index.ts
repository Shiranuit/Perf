import { Perf } from "./lib/Perf";

async function C() {
    let x = 0;
  for (let i = 0 ; i < 1000000000; i++) {
    x += 1;
  }
}
async function B() {
  return C();
}

async function A() {
  await Perf.runWithTag('B1', B);
  await Perf.runWithTag('B2', B);
}

async function main() {
  await Perf.runWithTag('A', A);
}

async function longFunction() {
  let x = 0;
  for (let i = 0 ; i < 10000000000; i++) {
    x += 1;
  }
}

Perf.enable();
Perf.trace(main, (result) => {
  Perf.disable();
  console.log(JSON.stringify(result,null,2));
});

longFunction();

