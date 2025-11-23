# bracketeer

bracketeer is a versatile and user-friendly tool designed to generate and manage tournaments for your social evenings. Whether you're organizing beer pong, foosball, or other games, bracketeer ensures your tournaments are structured and fun.

## Features

- **Tournament Generation**: Quickly create brackets for any type of game.
- **Player Management**: Easily add, remove, and organize participants.
- **Game Tracking**: Keep track of scores and progress in real-time.
- **Multi-Game Support**: Works with various games and activities.
- **Sets and Phases**: Supports multiple sets per game and flexible tournament structures.

## Use

### Online

You can use bracketeer online [here](https://bracketeer.davidohnee.com/). This version is hosted via GitHub Pages.

### Self-Hosted

#### Installation

Clone the repository:

```bash
git clone https://github.com/davidohnee/bracketeer.git
cd bracketeer
```

Install dependencies:

```bash
npm i
```

#### Usage

Run bracketeer

```bash
node run dev
```

Open your browser and navigate to `http://localhost:5173` to access the application.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

### Development

#### Testing

This project uses [Vitest](https://vitest.dev/) for unit testing. To run tests:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

#### Building

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Lint code
npm run lint
```

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please reach out to [dxstiny.gh@gmail.com](mailto:dxstiny.gh@gmail.com).
