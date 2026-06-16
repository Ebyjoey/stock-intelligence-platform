# Contributing to Stock Intelligence Platform

We appreciate your interest in contributing to our financial market intelligence terminal! To maintain code excellence and architectural stability, please adhere to the following standards.

## Code Standards
- **SOLID Principles**: Maintain clean boundaries. Avoid mixing presentation markup with provider data parsing.
- **RSC Patterns**: Prefer React Server Components for heavy layout page components where data is static or revalidated globally.
- **Failovers**: Ensure any new integration contains a clear fallback structure to prevent database or terminal crashes.

## Local Development Workflow
1. Fork the repository and create a feature branch (`git checkout -b feature/amazing-indicator`).
2. Run `npm install` inside the project root.
3. Configure your local `.env` values (see `README.md` for reference keys).
4. Spin up your local database and run migrations: `npx prisma db push`.
5. Execute the development pipeline: `npm run dev`.

## Testing Rules
- Write unit tests for services using **Vitest**.
- Verify frontend layout behaviors using **Playwright**.
- Verify correct production compilation using `npm run build` prior to drafting pull requests.
