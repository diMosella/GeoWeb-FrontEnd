import { performance } from 'perf_hooks';
import { safeMerge, clearNullPointersAndAncestors, getJsonPointers, Traverser, Visitor, traverse, co } from './json';
import get from 'lodash.get';
import * as testfile1 from '../../test/Taf_valid.json';
import * as testfile2 from '../../test/taf.json';
import * as testfile3 from '../../test/world_firs.json';

describe('(Utils) json', () => {
  describe('.safeMerge', () => {
    it('should be a function', () => {
      expect(safeMerge).to.be.a('function');
    });
    it('should fail without template', () => {
      const incoming = {
        a: 0,
        b: 0
      };
      try {
        safeMerge(incoming);
        expect(true).to.eql(false);
      } catch (error) {
        expect(error.message).to.eql(`Argument 'baseTemplate' is missing a proper value`);
      };
    });
    it('should merge a \'flat\' array', () => {
      const incoming = [
        1,
        2,
        3
      ];
      const template = [null];
      let result = safeMerge(incoming, template);
      expect(template).to.eql([null]);
      expect(result).to.eql([
        1,
        2,
        3
      ]);
      const newIncoming = [4];
      newIncoming[2] = 6;
      result = safeMerge(newIncoming, template, result);
      expect(result).to.eql([
        4,
        2,
        6
      ]);
    });
    it('should merge a \'flat\' object', () => {
      const incoming = {
        a: 1,
        b: 2,
        c: 3
      };
      const template = {
        a: null,
        b: null
      };
      let result = safeMerge(incoming, template);
      expect(template).to.eql({
        a: null,
        b: null
      });
      expect(result).to.eql({
        a: 1,
        b: 2
      });
    });
    it('should merge an array of \'flat\' objects', () => {
      const incoming = [
        { a: 1 },
        { a: 2, b: 3 },
        { a: 4, b: 5, c: 6 },
        { b: 7 }
      ];
      const template = [
        { a: null }
      ];
      let result = safeMerge(incoming, template);
      expect(template).to.eql([
        { a: null }
      ]);
      expect(result).to.eql([
        { a: 1 },
        { a: 2 },
        { a: 4 }
      ]);
    });
    it('should merge a doubly nested array-objects', () => {
      const incoming = [
        { a: 1 },
        {
          a: [
            { b: 2 }
          ],
          c: 3
        },
        { a: [
          { b: 4, d: 5 }
        ] },
        {
          a: [
            { b: { c: 6 } }
          ]
        },
        {
          a: [
            { b: { c: 'value7' } }
          ]
        }
      ];
      const template = [
        { a: [
          { b: {
            c: null
          } }
        ] }
      ];
      let result = safeMerge(incoming, template);
      expect(template).to.eql([
        { a: [
          { b: {
            c: null
          } }
        ] }
      ]);
      expect(result).to.eql([
        { a: [] },
        { a: [] },
        { a: [] },
        { a: [
          { b: { c: 6 } }
        ] },
        { a: [
          { b: { c: 'value7' } }
        ] }
      ]);
    });
    it('should merge directly nested array-objects', () => {
      const incoming = [
        [{ a: 1, c: 2 }, { b: 3 }]
      ];
      const template = [
        [{ a: null, b: null }]
      ];
      let result = safeMerge(incoming, template);
      expect(template).to.eql([
        [{ a: null, b: null }]
      ]);
      expect(result).to.eql([
        [{ a: 1, b: null }, { a: null, b: 3 }]
      ]);
    });
    it('should merge deep nested array-objects', () => {
      let incoming = [
        [[[{ a: 1, c: 2 }, { b: 3 }]]]
      ];
      let template = [
        [[[{ a: null, b: null }]]]
      ];
      let result = safeMerge(incoming, template);
      expect(template).to.eql([
        [[[{ a: null, b: null }]]]
      ]);
      expect(result).to.eql([
        [[[{ a: 1, b: null }, { a: null, b: 3 }]]]
      ]);
      incoming = {
        d: [[[{ a: 1, c: 2 }, { b: 3 }]]]
      };
      template = {
        d: [[[{ a: null, b: null }]]]
      };
      result = safeMerge(incoming, template);
      expect(template).to.eql({
        d: [[[{ a: null, b: null }]]]
      });
      expect(result).to.eql({
        d: [[[{ a: 1, b: null }, { a: null, b: 3 }]]]
      });
      incoming = [{
        d: [[[{ a: 1, c: 2 }, { b: 3 }]]]
      }];
      template = [{
        d: [[[{ a: null, b: null }]]]
      }];
      result = safeMerge(incoming, template);
      expect(template).to.eql([{
        d: [[[{ a: null, b: null }]]]
      }]);
      expect(result).to.eql([{
        d: [[[{ a: 1, b: null }, { a: null, b: 3 }]]]
      }]);
    });
    it('should merge pattern properties', () => {
      const incoming = {
        a: [
          { 'TEST': [1, 2] },
          { 'TESTER': [2, 4] }
        ]
      };
      const template = {
        a: [
          { '{patternProperties}_^[A-Z]{4}$': [null] }
        ]
      };
      let result = safeMerge(incoming, template);
      expect(template).to.eql({
        a: [
          { '{patternProperties}_^[A-Z]{4}$': [null] }
        ]
      });
      expect(result).to.eql({
        a: [
          { 'TEST': [1, 2] }
        ]
      });
    });
    it('should merge oneOfSimple properties', () => {
      const incoming = {
        a: { 'testing': 'first' }
      };
      const template = {
        a: { '{oneOf}_testing': [[null], null] }
      };
      let result = safeMerge(incoming, template);
      expect(template).to.eql({
        a: { '{oneOf}_testing': [[null], null] }
      });
      expect(result).to.eql({
        a: { 'testing': 'first' }
      });
    });
    it('should merge oneOf properties', () => {
      const incoming = {
        a: [
          { 'testing': 'first' },
          { 'testing': ['second'] },
          { 'TESTER': [2, 4] }
        ]
      };
      const template = {
        a: [
          { '{oneOf}_testing': [[null], null] }
        ]
      };
      let result = safeMerge(incoming, template);
      expect(template).to.eql({
        a: [
          { '{oneOf}_testing': [[null], null] }
        ]
      });
      expect(result).to.eql({
        a: [
          { 'testing': 'first' },
          { 'testing': ['second'] }
        ]
      });
    });
    it('should merge nested array in oneOf properties', () => {
      const incoming = {
        a: [
          { 'testing': ['first'] },
          { 'testing': [['second']] }
        ]
      };
      const template = {
        a: [
          { '{oneOf}_testing': [[[null]], [null]] }
        ]
      };
      let result = safeMerge(incoming, template);
      expect(template).to.eql({
        a: [
          { '{oneOf}_testing': [[[null]], [null]] }
        ]
      });
      expect(result).to.eql({
        a: [
          { 'testing': ['first'] },
          { 'testing': [['second']] }
        ]
      });
    });
    it('should update oneOf properties', () => {
      const incoming = {
        a: [
          { 'testing': 'newfirst' },
          { 'testing': ['newsecond'] },
          { 'TESTER': [2, 4] }
        ]
      };
      const template = {
        a: [
          { '{oneOf}_testing': [[null], null] }
        ]
      };
      const existing = {
        a: [
          { 'testing': ['first', 'half'] },
          { 'testing': 'second' },
          { 'testing': 'third' },
          { 'testing': ['fourth'] }
        ]
      };
      let result = safeMerge(incoming, template, existing);
      expect(template).to.eql({
        a: [
          { '{oneOf}_testing': [[null], null] }
        ]
      });
      expect(result).to.eql({
        a: [
          { 'testing': 'newfirst' },
          { 'testing': ['newsecond'] },
          { 'testing': 'third' },
          { 'testing': ['fourth'] }
        ]
      });
    });
    it('should update nested array in oneOf properties', () => {
      const incoming = {
        a: [
          { 'testing': ['newfirst'] },
          { 'testing': [['newsecond']] }
        ]
      };
      const template = {
        a: [
          { '{oneOf}_testing': [[[null]], [null]] }
        ]
      };
      const existing = {
        a: [
          { 'testing': [['first']] },
          { 'testing': ['second'] }
        ]
      };
      let result = safeMerge(incoming, template, existing);
      expect(template).to.eql({
        a: [
          { '{oneOf}_testing': [[[null]], [null]] }
        ]
      });
      expect(result).to.eql({
        a: [
          { 'testing': ['newfirst'] },
          { 'testing': [['newsecond']] }
        ]
      });
    });
    it('should clean nested array in oneOf properties', () => {
      const incoming = {
        a: [
          { 'testing': [] },
          { 'testing': [['newsecond']] }
        ]
      };
      const template = {
        a: [
          { '{oneOf}_testing': [[[null]], [null]] }
        ]
      };
      const existing = {
        a: [
          { 'testing': [['first']] },
          { 'testing': ['second'] }
        ]
      };
      let result = safeMerge(incoming, template, existing);
      expect(template).to.eql({
        a: [
          { '{oneOf}_testing': [[[null]], [null]] }
        ]
      });
      expect(result).to.eql({
        a: [
          { 'testing': [] },
          { 'testing': [['newsecond']] }
        ]
      });
    });
    it('should clean deep nested array-objects', () => {
      let incoming = [
        [[[]]]
      ];
      let template = [
        [[[{ a: 1 }, { b: null }]]]
      ];
      let result = safeMerge(incoming, template);
      expect(template).to.eql([
        [[[{ a: 1 }, { b: null }]]]
      ]);
      expect(result).to.eql([
        [[[]]]
      ]);
    });
  });

  describe('.clearNullPointersAndAncestors', () => {
    it('should be a function', () => {
      expect(clearNullPointersAndAncestors).to.be.a('function');
    });
    it('should clear an \'empty\' object', () => {
      const incoming = {
        a: null
      };
      clearNullPointersAndAncestors(incoming);
      expect(incoming).to.eql({});
    });
    it('should clear a \'shallow\' object', () => {
      const incoming = {
        a: { b: null },
        c: 'test'
      };
      clearNullPointersAndAncestors(incoming);
      expect(incoming).to.eql({
        c: 'test'
      });
    });
    it('should clear a flat array with a single null', () => {
      const incoming = {
        a: [ null ],
        b: 'test'
      };
      clearNullPointersAndAncestors(incoming);
      expect(incoming).to.eql({
        b: 'test'
      });
    });
    it('should clear a flat array with a null at index 0', () => {
      const incoming = {
        a: [null, 1],
        b: 'test'
      };
      clearNullPointersAndAncestors(incoming);
      expect(incoming).to.eql({
        a: [1],
        b: 'test'
      });
    });
    it('should clear a flat array with a null at index 1', () => {
      const incoming = {
        a: [1, null],
        b: 'test'
      };
      clearNullPointersAndAncestors(incoming);
      expect(incoming).to.eql({
        a: [1],
        b: 'test'
      });
    });
    it('should clear a flat array with a null at two indices', () => {
      const incoming1 = {
        a: [undefined, null],
        b: 'test'
      };
      clearNullPointersAndAncestors(incoming1);
      expect(incoming1).to.eql({
        b: 'test'
      });
      const incoming2 = {
        a: [null, null],
        b: 'test'
      };
      clearNullPointersAndAncestors(incoming2);
      expect(incoming2).to.eql({
        b: 'test'
      });
      const incoming3 = {
        a: [null],
        b: 'test'
      };
      incoming3.a[4] = null;
      clearNullPointersAndAncestors(incoming3);
      expect(incoming3).to.eql({
        b: 'test'
      });
    });
  });

  describe('getJsonPointers', () => {
    it('should work', () => {
      const predicate = (_node, pointer) => typeof pointer === 'string';

      const measure = (call, ...args) => {
        const count = 10;
        const t0 = performance.now();
        for (let i = 0; i < count; i++) {
          call(...args);
        }
        const t1 = performance.now();
        return (t1 - t0);
      };
      console.log('Timing testfile1', measure(getJsonPointers, testfile1, predicate));
      console.log('Timing testfile2', measure(getJsonPointers, testfile2, predicate));
      console.log('Timing testfile3', measure(getJsonPointers, testfile3, predicate));
    });
  });

  describe('Traverser', () => {
    it('should be able to be instantiated', () => {
      const predicate = (node) => typeof node.pointer === 'string';
      const terminator = (node) => node.pointer === null;
      const reducer = (_node) => 'reducer';
      const visitor = new Visitor(predicate, terminator, reducer);
      const initiateTraverser = (node, visitr) => {
        const _traverser = new Traverser(node, '/', visitr);
        return _traverser;
        // return _traverser[Symbol.iterator]().next();
      };
      const measure = (call, ...args) => {
        const count = 10;
        const t0 = performance.now();
        for (let i = 0; i < count; i++) {
          call(...args);
        }
        const t1 = performance.now();
        return (t1 - t0);
      };
      console.log('Timing testfile1', measure(initiateTraverser, testfile1, visitor));
      console.log('Timing testfile2', measure(initiateTraverser, testfile2, visitor));
      console.log('Timing testfile3', measure(initiateTraverser, testfile3, visitor));
    });
    it('should be able to change the (sub)nodes', () => {
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
      console.log('result', iter.next());
      console.log('result', iter.next());
      console.log('result', iter.next());
      const iter2 = traverser[Symbol.iterator]();
      console.log('result2', iter2.next());
      console.log('result2', iter2.next());
      console.log('result2', iter2.next());
    });
  });

  describe('Visitor', () => {
    it('should be able to be instantiated', () => {

    });
  });
  describe('traverse', () => {
    it('should be able to be instantiated', () => {
      const pred = (key) => '/features/0/geometry/coordinates/0/0/0'.startsWith(key.pointer);
      const measure = (call, ...args) => {
        const count = 10;
        const t0 = performance.now();
        for (let i = 0; i < count; i++) {
          call(...args);
        }
        const t1 = performance.now();
        return (t1 - t0);
      };
      // console.log('Timing testfile1', measure(co, traverse, pred, { pointer: '/', value: testfile1 }));
      // console.log('Timing testfile2', measure(co, traverse, pred, { pointer: '/', value: testfile2 }));
      console.log('Timing testfile3', measure(co, traverse, pred, { pointer: '/', value: testfile3 }));
    });
    it('should work with lodash', () => {
      const path = '/features/0/geometry/coordinates/0/0/0'.split('/');
      const measure = (call, ...args) => {
        const count = 10;
        const t0 = performance.now();
        for (let i = 0; i < count; i++) {
          call(...args);
        }
        const t1 = performance.now();
        return (t1 - t0);
      };
      console.log('Timing lodash testfile3', measure(get, testfile3, path));
    });
  });
});
