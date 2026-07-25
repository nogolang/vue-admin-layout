import { dayjs } from "element-plus";

/**
 * 格式化日期时间
 * @param time 日期字符串、时间戳或 Date 对象
 * @returns 格式化后的日期时间字符串，格式：YYYY-MM-DD HH:mm:ss
 */
export const formatTime = (time: string | number | Date): string =>
  dayjs(time).format("YYYY-MM-DD HH:mm:ss");
