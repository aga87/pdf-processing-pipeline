import { sanitiseFileName } from './sanitiseFileName';

describe('sanitiseFileName', () => {
  it('formats file name to contain only English letters, digits and dashes', () => {
    const dataset = [
      {
        name: 'name with spaces',
        result: 'name-with-spaces',
      },
      {
        name: 'crème brulée',
        result: 'creme-brulee',
      },
      {
        // eslint-disable-next-line quotes
        name: 'name!@#$%^&*()_{}[]:;."|`~ 1',
        result: 'name-1',
      },
    ];

    dataset.forEach(data => {
      const result = sanitiseFileName(data.name);
      expect(result).toBe(data.result);
    });
  });

  it("falls back to 'untitled' if nothing valid remains", () => {
    expect(sanitiseFileName('%$^&')).toBe('untitled');
  });
});
