// Validation function for Pokemon GO search strings
export function validateSearchString(str) {
    if (!str || str.trim() === '') {
      return { valid: true };
    }
    
    // Check for spaces
    if (str.includes(' ')) {
      return { 
        valid: false, 
        error: "Remove spaces from search string" 
      };
    }
    
    // Check for numbers followed directly by letters (missing &)
    const missingAmpersandPattern = /(?:^|&)(\d+(?:,\d+)+)([a-z])/;
    if (missingAmpersandPattern.test(str)) {
      return { 
        valid: false, 
        error: "Missing & between filters" 
      };
    }
    
    // Also check for single Pokedex number followed by letters
    const singleNumberPattern = /(?:^|&)(\d{2,})([a-z])/;
    if (singleNumberPattern.test(str)) {
      return { 
        valid: false, 
        error: "Missing & between filters" 
      };
    }
    
    // Check for & between consecutive Pokedex numbers
    const parts = str.split('&');
    for (let i = 0; i < parts.length - 1; i++) {
      const currentPart = parts[i].trim();
      const nextPart = parts[i + 1].trim();
      
      if (/^[\d,]+$/.test(currentPart) && /^[\d,]+$/.test(nextPart)) {
        return { 
          valid: false, 
          error: "Use commas between Pokedex numbers, not &" 
        };
      }
    }
    
    return { valid: true };
  }