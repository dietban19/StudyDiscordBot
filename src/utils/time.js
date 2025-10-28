import { DateTime } from 'luxon';
import { TZ } from '../config.js';

export const nowLocal = () => DateTime.now().setZone(TZ);

export const startEndUtcForLocalDate = (localDate) => {
  const startLocal = DateTime.fromJSDate(localDate, { zone: TZ }).startOf(
    'day',
  );
  const endLocal = DateTime.fromJSDate(localDate, { zone: TZ }).endOf('day');
  return {
    startUtc: startLocal.toUTC().toJSDate(),
    endUtc: endLocal.toUTC().toJSDate(),
  };
};

export const fmtLocal = (jsDate) =>
  DateTime.fromJSDate(jsDate, { zone: 'utc' })
    .setZone(TZ)
    .toFormat('yyyy-LL-dd HH:mm z');
