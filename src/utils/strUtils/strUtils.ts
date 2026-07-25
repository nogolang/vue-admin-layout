/**
 * 获取字符串的字节长度（UTF-8 编码）
 * @param str 要计算长度的字符串
 * @returns 字节数
 */
export const GetStrByteLength = (str: string): number => {
  const encoder = new TextEncoder();
  return encoder.encode(str).byteLength;
};
