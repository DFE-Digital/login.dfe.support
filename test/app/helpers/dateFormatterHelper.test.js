const { getFormattedDate, dateFormat } = require('../../../src/app/helpers/dateFormatterHelper');

describe('Date Formatter Functions', () => {
  const testDate = new Date('2024-12-13 12:00:00.447'); // Example date

  it('Should format date correctly in short format', () => {
    const formattedDate = getFormattedDate(testDate, 'DD MMM YYYY');
    expect(formattedDate).toBe('13 Dec 2024');
  });

  it('Should format date correctly in long format', () => {
    const formattedDate = getFormattedDate(testDate, 'DD MMM YYYY hh:mma');
    expect(formattedDate).toBe('13 Dec 2024 12:00pm');
  });

  it('Should throw TypeError for invalid date', () => {
    expect(() => getFormattedDate('invalid date', 'DD MMM YYYY')).toThrow(TypeError);
  });

  it('Should format date correctly in short format', () => {
    const formattedDate = dateFormat(testDate, 'shortDateFormat');
    expect(formattedDate).toBe('13 Dec 2024');
  });

  it('Should format date correctly in long format', () => {
    const formattedDate = dateFormat(testDate, 'longDateFormat');
    expect(formattedDate).toBe('13 Dec 2024 12:00pm');
  });
});
