window.AppUtils = {
  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  stripTypeScript(code) {
    return code
      .replace(/:\s*\w+\[\]/g, '')
      .replace(/:\s*(string|number|boolean|unknown|any|void)\b/g, '')
      .replace(/\)\s*:\s*(void|string|number|boolean|unknown|any)\s*{/g, ') {')
      .replace(/\binterface\s+\w+\s*{[\s\S]*?}\s*/g, '')
      .replace(/\btype\s+\w+\s*=\s*[^;]+;/g, '');
  },
};
