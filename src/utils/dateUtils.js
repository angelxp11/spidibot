export const isExpiredDate = (value) => {
  if (!value || value === 'Fecha no disponible') return false;

  let date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date <= hoy;
};
