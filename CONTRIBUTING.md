# Contributing to Privatools

Thank you for your interest in contributing to Privatools! We welcome bug
reports, feature requests, and pull requests.

## License

Privatools is licensed under the **Business Source License 1.1 (BSL 1.1)**. By
submitting a pull request, you agree that your contributions will be licensed
under the same terms as the rest of the project. On the Change Date (September
2030), all code converts to the **MIT License**.

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd "Utility Websites"

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Development Guidelines

1. **Privacy First** — All processing must remain 100% client-side. No network
   requests for data processing, no analytics SDKs, no tracking pixels. If your
   feature needs a server, it doesn't belong in Privatools.

2. **TypeScript** — All new code should be written in TypeScript with strict
   typing. Avoid `any` where possible.

3. **Accessibility** — Use semantic HTML elements, provide ARIA labels where
   needed, and ensure keyboard navigation works.

4. **Testing** — Run `npm run lint` and `npm run build` before submitting.
   Ensure the static export (`output: 'export'`) succeeds.

## Pull Request Process

1. Fork the repository and create a feature branch from `main`.
2. Make your changes with clear, descriptive commit messages.
3. Ensure `npm run build` completes successfully (static export must work).
4. Open a pull request with a description of what changed and why.

## Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:

- Browser and OS version
- Steps to reproduce (for bugs)
- Expected vs. actual behaviour
- Screenshots if applicable

## Code of Conduct

Be respectful, constructive, and inclusive. We're building privacy tools for
everyone.
