import { performance } from 'perf_hooks';
import { getJsonPointers, Traverser, Visitor, traverse, co } from './json.js';
import get from 'lodash.get';
// import * as testfile1 from '../../test/Taf_valid.json';
// import testfile2 from '../../test/taf.json';
import testfile3 from '../../test/world_firs.json';
import testfile4 from '../../test/world_firs_alt.json';

const testGetJsonPointers = (count) => {
  const predicate = (field) => field === 43.20000267000006;

  const measure = (call, ...args) => {
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      const acm = [];
      call(...args, acm);
    }
    const t1 = performance.now();
    return (t1 - t0) / count;
  };
  console.log('Timing getJsonPointers testfile3', measure(getJsonPointers, testfile3, predicate));
  const acumm = [];
  getJsonPointers(testfile3, predicate, acumm);
  console.log('getJsonPointer result', acumm[0]);
};

const testGetJsonPointers2 = (count) => {
  const predicate = (field) => field === 'Polygon';

  const measure = (call, ...args) => {
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      const acm = [];
      call(...args, acm);
    }
    const t1 = performance.now();
    return (t1 - t0) / count;
  };
  console.log('Timing getJsonPointers2 testfile2', measure(getJsonPointers, testfile3, predicate));
  const acumm = [];
  getJsonPointers(testfile3, predicate, acumm);
  console.log('getJsonPointer2 result', acumm);
};

const testTraverser = (count) => {
  const predicate = (node) => node.pointer === '/features/0/geometry/coordinates/0/0/0';
  const terminator = (node) => !'/features/0/geometry/coordinates/0/0/0'.startsWith(node.pointer);
  const reducer = (_node) => 'reducer';
  const visitor = new Visitor(predicate, terminator, reducer);
  const initiateTraverser = (node, visitr) => {
    const _traverser = new Traverser(node, '/', visitr);
    return _traverser[Symbol.iterator]().next();
  };
  const measure = (call, ...args) => {
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      call(...args);
    }
    const t1 = performance.now();
    return (t1 - t0) / count;
  };
  // console.log('Timing Traverser testfile1', measure(initiateTraverser, testfile1, visitor));
  // console.log('Timing Traverser testfile2', measure(initiateTraverser, testfile2, visitor));
  console.log('Timing Traverser testfile3', measure(initiateTraverser, testfile3, visitor));
  console.log('Traverser result', initiateTraverser(testfile3, visitor));
};

const testTraverserUpdate = () => {
  const testNode = {
    a: {
      aa: {
        aaa: [
          'aaa1', 'aaa2'
        ],
        aab: {
          aaaba: 'unchanged'
        }
      },
      ab: {
        aaaba: 'unchanged2'
      }
    }
  };
  const predicate = (node) => node.pointer.endsWith('aaaba');
  const terminator = (node) => node.pointer === null;
  const reducer = (_node) => (_node.value = 'changed');
  const visitor = new Visitor(predicate, terminator, reducer, true);
  const traverser = new Traverser(testNode, '/', visitor);
  const iter = traverser[Symbol.iterator]();
  console.log('Traverser update result', iter.next());
  console.log('Traverser update result', iter.next());
  console.log('Traverser update result', iter.next());
  const iter2 = traverser[Symbol.iterator]();
  console.log('Traverser update result2', iter2.next());
  console.log('Traverser update result2', iter2.next());
  console.log('Traverser update result2', iter2.next());
};

const testStreamingTraverse = (count) => {
  const pred = (key) => '/features/0/geometry/coordinates/0/0/0'.startsWith(key.pointer);
  const resultPred = (value) => (value.pointer === '/features/0/geometry/coordinates/0/0/0');
  const measure = (call, ...args) => {
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      call(...args)[Symbol.iterator]().next();
    }
    const t1 = performance.now();
    return (t1 - t0) / count;
  };
  console.log('Timing Streaming Traverse testfile3', measure(co, traverse, pred, resultPred, { pointer: '/', value: testfile3 }));
  const visitor = co(traverse, pred, resultPred, { pointer: '/', value: testfile3 })[Symbol.iterator]();
  console.log('Result Streaming', visitor.next());
};

const testStreamingTraverse2 = (count) => {
  const pred = null;
  const resultPred = (value) => (value.value === 'Polygon');
  const measure = (call, ...args) => {
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      call(...args)[Symbol.iterator]().next();
    }
    const t1 = performance.now();
    return (t1 - t0) / count;
  };
  console.log(typeof measure);
  // console.log('Timing Streaming Traverse2 testfile2', measure(co, traverse, pred, resultPred, { pointer: '/', value: testfile4 }));
  const visitor = co(traverse, pred, resultPred, { pointer: '/', value: testfile4 })[Symbol.iterator]();
  console.log('Result Streaming', visitor.next());
  let next = 0;
  let stop = false;
  while (next < 24 && stop === false) {
    const t1 = performance.now();
    const { value, done } = visitor.next();
    if (!done) {
      console.log(value.pointer);
    }
    const t2 = performance.now();
    console.log('Next timing', (t2 - t1));
    next++;
    stop = done;
  }
  //
  // const t3 = performance.now();
  // console.log(visitor.next().value.pointer);
  // const t4 = performance.now();
  // console.log('Timing 18', (t4 - t3));
};

const testLodash = (count) => {
  const pointer = 'features/0/geometry/coordinates/0/0/0';
  const measure = (call, ...args) => {
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      const path = pointer.split('/');
      call(...args, path);
    }
    const t1 = performance.now();
    return (t1 - t0);
  };
  console.log('Timing lodash testfile3', measure(get, testfile3));
  console.log('Result lodash', get(testfile3, pointer.split('/')));
};

testGetJsonPointers(1000);
testGetJsonPointers2(1000);
testTraverser(1000);
testTraverserUpdate(1000);
testStreamingTraverse(1000);
testStreamingTraverse2(1000);
testLodash(1000);
