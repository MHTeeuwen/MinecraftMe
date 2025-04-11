# Cursor Rules for Minecraft Style Converter

## General Principles
- **Simplicity**: Write minimal, readable code. One job per function, <20 lines max. Clear names (e.g., `convertToMinecraft`).
- **Effectiveness**: Solve the specific problem—no unnecessary features. Reuse libraries/APIs over custom code.
- **Efficiency**: Minimize API calls (e.g., one OpenAI call per conversion). Aim for <10-second user flow. Avoid memory-heavy ops.

## Coding Standards
- **Modularity**: Use small, reusable files (e.g., `openai.js`, `Upload.js`). ES6 imports/exports.
- **Error Handling**: Try/catch for all async ops. Return meaningful errors (e.g., `{ error: "Upload failed" }`).
- **Comments**: One-line comment above each function (e.g., `// Converts photo to Minecraft style`). No inline unless complex.

## Testing Rules
- **Unit Tests**: Every function gets at least one test. Use Jest (backend) and React Testing Library (frontend). Test edge cases.
- **Pipeline Tests**: End-to-end test for critical flows (e.g., upload → payment → download). Mock external APIs.
- **Automation**: Add `test` script in `package.json`. Tests must pass before deployment.

## Workflow
- **Incremental**: Build one feature at a time (e.g., upload, then conversion). Test each individually.
- **Cursor Use**: Prompt with “Follow simplicity, effectiveness, efficiency; include test.” Use “Fix this” for bugs.
- **Deployment**: Always Vercel-ready. No hardcoded secrets—use `.env`.

## Enforcement
- Cursor must apply these rules when generating or editing code.
- If a rule is unclear, default to simplicity and ask for clarification.