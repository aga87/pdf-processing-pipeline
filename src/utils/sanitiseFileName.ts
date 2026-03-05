export const sanitiseFileName = (name: string): string => {
  const input = (name ?? '').trim();

  const slug = input
    // Normalize accents (crème → creme)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace whitespace with dash
    .replace(/\s+/g, '-')
    // Keep only English letters, digits and dashes
    .replace(/[^A-Za-z0-9-]/g, '')
    // Collapse multiple dashes
    .replace(/-+/g, '-')
    // Trim leading/trailing dashes
    .replace(/^-+|-+$/g, '');

  return slug.length > 0 ? slug : 'untitled';
};
