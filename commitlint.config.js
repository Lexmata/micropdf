/**
 * Commitlint Configuration
 *
 * Enforces conventional commit messages:
 * <type>(<scope>): <description>
 *
 * Types:
 *   feat     - New feature
 *   fix      - Bug fix
 *   docs     - Documentation only
 *   style    - Formatting, no code change
 *   refactor - Code restructuring
 *   perf     - Performance improvement
 *   test     - Adding/updating tests
 *   build    - Build system or dependencies
 *   ci       - CI/CD configuration
 *   chore    - Maintenance tasks
 *   revert   - Revert a previous commit
 *
 * Scopes (optional):
 *   rust, nodejs, python, go, ffi, docs, ci, deps
 *
 * Examples:
 *   feat(rust): add PDF compression support
 *   fix(nodejs): handle null buffer correctly
 *   docs: update API documentation
 *   chore(deps): bump dependencies
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of the allowed values
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting
        'refactor', // Code restructuring
        'perf',     // Performance
        'test',     // Tests
        'build',    // Build system
        'ci',       // CI/CD
        'chore',    // Maintenance
        'revert',   // Revert commit
      ],
    ],
    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Type cannot be empty
    'type-empty': [2, 'never'],
    // Scope must be lowercase
    'scope-case': [2, 'always', 'lower-case'],
    // Subject cannot be empty
    'subject-empty': [2, 'never'],
    // Subject must not end with period
    'subject-full-stop': [2, 'never', '.'],
    // Subject must be sentence case or lower case
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    // Header max length
    'header-max-length': [2, 'always', 100],
    // Body max line length
    'body-max-line-length': [2, 'always', 100],
    // Footer max line length
    'footer-max-line-length': [2, 'always', 100],
  },
};

