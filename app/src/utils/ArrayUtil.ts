class ArrayUtil {
  accessByBracket = <S, T extends keyof S>(obj: S, key: T) => obj[key]
}

export default new ArrayUtil