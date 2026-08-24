import { isExpiredDate } from './utils/dateUtils';

test('las fechas futuras no se consideran vencidas y las pasadas sí', () => {
  const today = new Date();

  const future = new Date(today);
  future.setDate(today.getDate() + 2);
  const futureString = `${String(future.getDate()).padStart(2, '0')}/${String(future.getMonth() + 1).padStart(2, '0')}/${future.getFullYear()}`;

  const past = new Date(today);
  past.setDate(today.getDate() - 2);
  const pastString = `${String(past.getDate()).padStart(2, '0')}/${String(past.getMonth() + 1).padStart(2, '0')}/${past.getFullYear()}`;

  expect(isExpiredDate(futureString)).toBe(false);
  expect(isExpiredDate(pastString)).toBe(true);
  expect(isExpiredDate('02/09/2026')).toBe(false);
});
