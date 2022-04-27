import { selectUnit } from '../selectUnit';

describe('selectUnit returns', () => {
  it('1 week interval', () => {
    expect(selectUnit(new Date(2020, 12, 25), new Date(2021, 1, 1))).toEqual({
      value: -1,
      unit: 'week',
    });
    expect(selectUnit(new Date(2021, 1, 1), new Date(2021, 1, 8))).toEqual({
      value: -1,
      unit: 'week',
    });
    expect(selectUnit(new Date(2020, 12, 1), new Date(2020, 12, 10))).toEqual({
      value: -1,
      unit: 'week',
    });
  });
  it('12 month interval', () => {
    expect(selectUnit(new Date(2021, 12, 25), new Date(2022, 12, 23))).toEqual({
      value: -12,
      unit: 'month',
    });
    expect(selectUnit(new Date(2021, 12, 25), new Date(2022, 12, 12))).toEqual({
      value: -12,
      unit: 'month',
    });
  });
  it('1 year interval', () => {
    expect(selectUnit(new Date(2021, 12, 25), new Date(2022, 12, 26))).toEqual({
      value: -1,
      unit: 'year',
    });
    expect(selectUnit(new Date(2021, 1, 25), new Date(2022, 12, 26))).toEqual({
      value: -2,
      unit: 'year',
    });
  });
  it('some months interval', () => {
    expect(selectUnit(new Date(2020, 12, 25), new Date(2021, 1, 26))).toEqual({
      value: -1,
      unit: 'month',
    });
    expect(selectUnit(new Date(2020, 12, 25), new Date(2021, 2, 22))).toEqual({
      value: -2,
      unit: 'month',
    });
  });
  it('some weeks interval', () => {
    expect(selectUnit(new Date(2020, 12, 1), new Date(2020, 12, 29))).toEqual({
      value: -4,
      unit: 'week',
    });
    expect(selectUnit(new Date(2020, 2, 23), new Date(2020, 1, 25))).toEqual({
      value: 4,
      unit: 'week',
    });
  });
  it('some days interval', () => {
    expect(selectUnit(new Date(2020, 12, 1), new Date(2020, 12, 6))).toEqual({
      value: -5,
      unit: 'day',
    });
    expect(selectUnit(new Date(2021, 1, 1), new Date(2021, 1, 7))).toEqual({
      value: -6,
      unit: 'day',
    });
  });
  it('some hours interval', () => {
    expect(selectUnit(new Date(2020, 12, 1, 13, 47), new Date(2020, 12, 1, 14, 47))).toEqual({
      value: -1,
      unit: 'hour',
    });
    expect(selectUnit(new Date(2020, 12, 1, 1, 47), new Date(2020, 12, 1, 23, 47))).toEqual({
      value: -22,
      unit: 'hour',
    });
    expect(selectUnit(new Date(2020, 12, 1, 0, 48), new Date(2020, 12, 1, 23, 47))).toEqual({
      value: -23,
      unit: 'hour',
    });
  });
  it('1 day interval', () => {
    expect(selectUnit(new Date(2020, 12, 1, 0, 47), new Date(2020, 12, 1, 23, 47))).toEqual({
      value: -1,
      unit: 'day',
    });
    expect(selectUnit(new Date(2020, 12, 1, 0, 1), new Date(2020, 12, 1, 23, 59))).toEqual({
      value: -1,
      unit: 'day',
    });
  });
});
