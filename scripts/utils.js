/**
 * Escapes arbitrary text so it can be safely assigned to innerHTML.
 * @param {string} str - The raw value to sanitize.
 * @returns {string} HTML-safe escaped text.
 */
export function sanitize(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

window.ElectIQ = window.ElectIQ || {};
window.ElectIQ.utils = { sanitize };
