/**
 * Pokemon GO Search String Parser
 * 
 * Parses Pokemon GO search strings according to official operator precedence:
 * 1. NOT (!) - highest precedence
 * 2. AND (&, |) - medium precedence  
 * 3. OR (,, ;, :) - lowest precedence
 * 
 * Key insight from Pokemon GO: "Grass & Poison, Psychic" becomes:
 * ((Grass AND Poison) OR (Grass AND Psychic))
 * This means comma distributes over the AND on its left!
 */

// Token types
const TokenType = {
  FILTER: 'FILTER',
  NOT: 'NOT',
  AND: 'AND',
  OR: 'OR',
  EOF: 'EOF'
};

// AST Node types
const NodeType = {
  FILTER: 'FILTER',
  NOT: 'NOT',
  AND: 'AND',
  OR: 'OR'
};

/**
 * Tokenizer - converts string into tokens
 */
class Tokenizer {
  constructor(input) {
    this.input = input.toLowerCase().trim();
    this.pos = 0;
    this.current = this.input[0];
  }

  advance() {
    this.pos++;
    this.current = this.pos < this.input.length ? this.input[this.pos] : null;
  }

  skipWhitespace() {
    while (this.current && /\s/.test(this.current)) {
      this.advance();
    }
  }

  readFilter() {
    let result = '';
    // Read until we hit an operator or end
    while (this.current && !/[,;&|!]/.test(this.current)) {
      result += this.current;
      this.advance();
    }
    return result.trim();
  }

  getNextToken() {
    while (this.current) {
      this.skipWhitespace();

      if (!this.current) {
        return { type: TokenType.EOF, value: null };
      }

      // Check for operators
      if (this.current === '!') {
        this.advance();
        return { type: TokenType.NOT, value: '!' };
      }

      if (this.current === '&' || this.current === '|') {
        const op = this.current;
        this.advance();
        return { type: TokenType.AND, value: op };
      }

      if (this.current === ',' || this.current === ';' || this.current === ':') {
        const op = this.current;
        this.advance();
        return { type: TokenType.OR, value: op };
      }

      // Read filter term
      const filter = this.readFilter();
      if (filter) {
        return { type: TokenType.FILTER, value: filter };
      }
    }

    return { type: TokenType.EOF, value: null };
  }
}

/**
 * Parser - converts tokens into Abstract Syntax Tree
 * 
 * Grammar (order of precedence):
 * expression := or_expr
 * or_expr    := and_expr ( (,|;|:) and_expr )*
 * and_expr   := not_expr ( (&||) not_expr )*
 * not_expr   := ! filter | filter
 * filter     := FILTER_TOKEN
 */
class Parser {
  constructor(tokenizer) {
    this.tokenizer = tokenizer;
    this.currentToken = this.tokenizer.getNextToken();
  }

  eat(tokenType) {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.tokenizer.getNextToken();
    } else {
      throw new Error(`Expected ${tokenType} but got ${this.currentToken.type}`);
    }
  }

  // Parse NOT expression (highest precedence)
  not_expr() {
    if (this.currentToken.type === TokenType.NOT) {
      this.eat(TokenType.NOT);
      const filter = this.filter();
      return {
        type: NodeType.NOT,
        filter: filter
      };
    }
    return this.filter();
  }

  // Parse filter (lowest level)
  filter() {
    const token = this.currentToken;
    this.eat(TokenType.FILTER);
    return {
      type: NodeType.FILTER,
      value: token.value
    };
  }

  // Parse AND expression (medium precedence)
  and_expr() {
    let node = this.not_expr();

    while (this.currentToken.type === TokenType.AND) {
      this.eat(TokenType.AND);
      node = {
        type: NodeType.AND,
        left: node,
        right: this.not_expr()
      };
    }

    return node;
  }

  // Parse OR expression (lowest precedence)
  or_expr() {
    let node = this.and_expr();

    while (this.currentToken.type === TokenType.OR) {
      this.eat(TokenType.OR);
      node = {
        type: NodeType.OR,
        left: node,
        right: this.and_expr()
      };
    }

    return node;
  }

  parse() {
    if (this.currentToken.type === TokenType.EOF) {
      return null;
    }
    return this.or_expr();
  }
}

/**
 * Extract all filters from AST
 */
function extractFilters(node, included = [], excluded = []) {
  if (!node) return { included, excluded };

  if (node.type === NodeType.FILTER) {
    included.push(node.value);
  } else if (node.type === NodeType.NOT) {
    if (node.filter.type === NodeType.FILTER) {
      excluded.push(node.filter.value);
    }
  } else if (node.type === NodeType.AND || node.type === NodeType.OR) {
    extractFilters(node.left, included, excluded);
    extractFilters(node.right, included, excluded);
  }

  return { included, excluded };
}

/**
 * Detect conflicts in the parsed AST
 */
function detectConflicts(node) {
  const conflicts = [];

  // First, collect all filters from the entire AST to check for shadow/purified
  // (which are invalid in ANY combination, even OR)
  function collectAllFilters(node) {
    const included = [];
    const excluded = [];

    function collect(n) {
      if (!n) return;
      if (n.type === NodeType.FILTER) {
        included.push(n.value);
      } else if (n.type === NodeType.NOT && n.filter.type === NodeType.FILTER) {
        excluded.push(n.filter.value);
      } else if (n.type === NodeType.AND || n.type === NodeType.OR) {
        collect(n.left);
        collect(n.right);
      }
    }

    collect(node);
    return { included, excluded };
  }

  // Check for shadow/purified conflict (invalid in ANY combination)
  const allFilters = collectAllFilters(node);
  if (allFilters.included.includes('shadow') && allFilters.included.includes('purified')) {
    conflicts.push({
      type: 'MUTUALLY_EXCLUSIVE',
      filters: ['shadow', 'purified'],
      message: 'Cannot be both shadow and purified - a Pokemon is either shadow, purified, or neither'
    });
  }

  // Now traverse to check for AND-specific conflicts (star ratings)
  function traverse(node, context = { inAndGroup: false }) {
    if (!node) return;

    if (node.type === NodeType.AND) {
      // We're in an AND group - check for conflicts
      const leftFilters = collectFilters(node.left);
      const rightFilters = collectFilters(node.right);
      
      // Check for mutually exclusive filters
      const allFilters = [...leftFilters.included, ...rightFilters.included];
      
      // Star ratings with AND (OR is valid, AND is invalid)
      const starRatings = ['0*', '1*', '2*', '3*', '4*'];
      const starsInAnd = allFilters.filter(f => starRatings.includes(f));
      if (starsInAnd.length > 1) {
        conflicts.push({
          type: 'MUTUALLY_EXCLUSIVE',
          filters: starsInAnd,
          message: `Cannot be both ${starsInAnd.join(' AND ')} - star ratings are mutually exclusive when using &`
        });
      }

      traverse(node.left, { inAndGroup: true });
      traverse(node.right, { inAndGroup: true });
    } else if (node.type === NodeType.OR) {
      traverse(node.left, context);
      traverse(node.right, context);
    }
  }

  function collectFilters(node) {
    const included = [];
    const excluded = [];

    function collect(n) {
      if (!n) return;
      if (n.type === NodeType.FILTER) {
        included.push(n.value);
      } else if (n.type === NodeType.NOT && n.filter.type === NodeType.FILTER) {
        excluded.push(n.filter.value);
      } else if (n.type === NodeType.AND || n.type === NodeType.OR) {
        collect(n.left);
        collect(n.right);
      }
    }

    collect(node);
    return { included, excluded };
  }

  traverse(node);
  return conflicts;
}

/**
 * Main parse function
 */
export function parseSearchString(searchString) {
  if (!searchString || searchString.trim() === '') {
    return {
      ast: null,
      included: [],
      excluded: [],
      conflicts: [],
      valid: true
    };
  }

  try {
    const tokenizer = new Tokenizer(searchString);
    const parser = new Parser(tokenizer);
    const ast = parser.parse();
    
    const { included, excluded } = extractFilters(ast);
    const conflicts = detectConflicts(ast);

    return {
      ast,
      included: [...new Set(included)], // Remove duplicates
      excluded: [...new Set(excluded)],
      conflicts,
      valid: conflicts.length === 0
    };
  } catch (error) {
    return {
      ast: null,
      included: [],
      excluded: [],
      conflicts: [{
        type: 'PARSE_ERROR',
        message: `Invalid search syntax: ${error.message}`
      }],
      valid: false
    };
  }
}

/**
 * Validate syntax (spaces, proper operators, etc.)
 */
export function validateSyntax(searchString) {
  const errors = [];

  // Check for spaces
  if (searchString.includes(' ')) {
    errors.push({
      type: 'SPACES',
      message: 'Search strings cannot contain spaces'
    });
  }

  // Check for numbers followed by letters (missing &)
  const missingAmpersand = /(?:^|&)(\d{2,})([a-z])/;
  if (missingAmpersand.test(searchString)) {
    errors.push({
      type: 'MISSING_AMPERSAND',
      message: 'Missing & between Pokedex numbers and filter terms'
    });
  }

  // Check for & between consecutive Pokedex numbers
  const parts = searchString.split('&');
  for (let i = 0; i < parts.length - 1; i++) {
    if (/^[\d,]+$/.test(parts[i]) && /^[\d,]+$/.test(parts[i + 1])) {
      errors.push({
        type: 'WRONG_OPERATOR',
        message: 'Use commas (,) not ampersands (&) between Pokedex numbers'
      });
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Full validation - syntax + logical conflicts
 */
export function validateSearchString(searchString) {
  const syntaxValidation = validateSyntax(searchString);
  
  if (!syntaxValidation.valid) {
    return syntaxValidation;
  }

  const parseResult = parseSearchString(searchString);
  
  return {
    valid: parseResult.valid,
    errors: parseResult.conflicts,
    ast: parseResult.ast,
    included: parseResult.included,
    excluded: parseResult.excluded
  };
}

/**
 * Helper to rebuild search string from filters
 * (Useful for translations or modifications)
 */
export function buildSearchString(included, excluded) {
  const parts = [];
  
  if (included.length > 0) {
    parts.push(included.join(','));
  }
  
  if (excluded.length > 0) {
    const excludedPart = excluded.map(f => `!${f}`).join('&');
    parts.push(excludedPart);
  }
  
  return parts.join('&');
}

// Example usage and tests
if (typeof window === 'undefined') {
  // Node.js environment - run tests
  console.log('=== Pokemon GO Search Parser Tests ===\n');

  const testCases = [
    '3*,4*&!shiny',
    'shadow&legendary,mythical',
    '0*&!favorite',
    'shiny&costume',
    'fire,water&flying',
    '373,409&shadow',
    '3*&4*',  // Should conflict
    'shadow&purified',  // Should conflict
  ];

  testCases.forEach(test => {
    console.log(`Input: "${test}"`);
    const result = validateSearchString(test);
    console.log('Valid:', result.valid);
    console.log('Included:', result.included);
    console.log('Excluded:', result.excluded);
    if (result.errors && result.errors.length > 0) {
      console.log('Errors:', result.errors.map(e => e.message));
    }
    console.log('---\n');
  });
}

