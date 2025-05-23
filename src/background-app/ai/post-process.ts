export function postProcess(text: string): string {
  // replace “ and ” with "
  text = text.replace(/“/g, '"');
  text = text.replace(/”/g, '"');

  // replace ’ with '
  text = text.replace(/’/g, "'");
  text = text.replace(/—/g, ",");

  return text;
}
