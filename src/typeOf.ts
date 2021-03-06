import { Type, TArray, TAsyncFunction, TFunction, TIterable, TNull, TPromise } from './types'
import { CustomType, getCustomTypes, enableCustomTypes } from './customTypes'

/** Returns the given type of a value.
 * @category Strong TypeOf
 */
export function typeOf (value: string): 'string'
export function typeOf (value: number): 'number'
export function typeOf (value: bigint): 'bigint'
export function typeOf (value: boolean): 'boolean'
export function typeOf (value: symbol): 'symbol'
export function typeOf (value: undefined): 'undefined'
export function typeOf (value: Function): 'function'
export function typeOf (value: object): 'object'
export function typeOf (value: null): 'null'
export function typeOf (value: Array<any>): 'array'
export function typeOf (value: Promise<any>): 'promise'
export function typeOf (value: Iterable<any>): 'iterable'
export function typeOf (value: any): Type | CustomType<string>
export function typeOf (value: any): Type | CustomType<string> {
  let actualType: Type | CustomType<string> = typeof value

  switch (actualType) {
    case 'object':
      if (value === null) {
        actualType = TNull
        break
      }
      if (Array.isArray(value)) {
        actualType = TArray
        break
      }
      if (value.constructor && value.constructor.name === 'Promise') {
        actualType = TPromise
        break
      }
      if (typeof value[Symbol.iterator] === TFunction) {
        actualType = TIterable
        break
      }
      break
    case TFunction:
      if (value.constructor && value.constructor.name === 'AsyncFunction') actualType = TAsyncFunction
      break
  }

  if (enableCustomTypes()) {
    const typeMap = getCustomTypes(actualType as Type)

    for (const [customType, typeCheck] of typeMap.entries()) {
      if (typeCheck(value) === customType) {
        actualType = customType
        break
      }
    }
  }

  return actualType
}

/** Checks the given value against one or more types.
 * @category Strong TypeOf
 */
export function isType (value: any, ...types: Type[] | CustomType<string>[]): boolean {
  const type: Type | CustomType<string> = typeOf(value)

  if (type === TArray && types.includes(TIterable)) return true

  return types.includes(type as any)
}

/**
 * Constrains the given values to the array of types provided.
 * @category Strong TypeOf
 * @private
 */
export function constrainTypes (
  types: Array<Type | Type[] | CustomType<string> | CustomType<string>[]>,
  ...values: any[]
): Error | void {
  const trailingValues = types.length - values.length

  for (let i = 0; i < trailingValues; i += 1) {
    values.push(undefined)
  }

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i]
    const type = types[i]
    let result = false

    if (typeof type === 'undefined') {
      return new Error(`Argument at position ${i} is out of bounds and cannot be type-checked.`)
    } else if (typeof type === 'string') {
      result = isType(value, type)
    } else if (Array.isArray(type)) {
      result = isType(value, ...type)
    }

    if (!result) {
      return new TypeError(`Argument at position ${i} is not of type ${type}.`)
    }
  }
}

/**
 * Looser constraint of each given value to one or more provided types.
 * @category Strong TypeOf
 * @private
 */
export function looseType (type: Type | Type[] | CustomType<string> | CustomType<string>[], ...values: any[]) {
  const types = typeof type === 'string' ? [type] : type

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i]
    let result = isType(value, ...types)

    if (!result) {
      return new TypeError(`Argument at position ${i} is not of type ${type}.`)
    }
  }
}
