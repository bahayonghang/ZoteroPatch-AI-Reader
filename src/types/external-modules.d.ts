declare module 'vitest' {
  export interface PromiseMatchers {
    toThrow(message?: string | RegExp): void;
    not: PromiseMatchers;
  }

  export interface Matchers<T = unknown> {
    toBe(expected: T): void;
    toBeCloseTo(expected: number, numDigits?: number): void;
    not: Matchers<T>;
    resolves: PromiseMatchers;
    rejects: PromiseMatchers;
  }

  export function expect<T = unknown>(actual: T | Promise<T>): Matchers<T>;

  export function describe(name: string, fn: () => unknown | Promise<unknown>): void;
  export function it(name: string, fn: () => unknown | Promise<unknown>): void;
  export function beforeEach(fn: () => unknown | Promise<unknown>): void;
}

declare module 'fast-check' {
  export interface Arbitrary<T = unknown> {
    filter(predicate: (value: T) => boolean): Arbitrary<T>;
  }

  export function string(params?: { minLength?: number; maxLength?: number }): Arbitrary<string>;

  export function double(params: { min: number; max: number; noNaN?: boolean }): Arbitrary<number>;

  export function boolean(): Arbitrary<boolean>;

  export function webUrl(): Arbitrary<string>;

  export function constant<T>(value: T): Arbitrary<T>;

  export function constantFrom<T>(...values: readonly T[]): Arbitrary<T>;

  export function oneof<T>(...arbs: Arbitrary<T>[]): Arbitrary<T>;

  export function record(spec: unknown): Arbitrary<unknown>;

  export function asyncProperty(...args: unknown[]): unknown;

  export function assert(property: unknown, params?: { numRuns?: number }): Promise<void>;
}
