# bracketeer

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=davidohnee_bracketeer&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=davidohnee_bracketeer)

bracketeer is a versatile and user-friendly tool designed to generate and manage tournaments for your social evenings. Whether you're organising beer pong, foosball, or other games, bracketeer ensures your tournaments are structured and fun.

![bracketeer Screenshot](docs/screenshot.png)

## Features

- **Tournament Generation**: Quickly create brackets for any type of game.
- **Team Management**: Easily add, remove, and organise teams.
- **Sharing & Tracking**: Keep track of scores and progress in real-time.
- **Sets and Phases**: Easily test different tournament formats with support for sets and multiple phases.

### Sharing

Tournaments by default are persisted locally in your browser. Please note that on WebKit-based browsers (Safari, iOS), the local storage may be [cleared after 7 days of inactivity](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/).

You can also share your tournament (specifically the match plan and scores) with others, such as participants:

### GitHub Gists

Through GitHub Gists, your tournament state can be shared with others. The host device does not need to be online for others to access the tournament, as the tournament state is stored in the Gist. However, Gists are cached for 5 minutes by clients, which means that changes made to the tournament may not be immediately visible to others. To share a tournament via Gist, you need to enter a GitHub personal access token.

### Peer-to-Peer

Peer-to-peer sharing (powered by [PeerJS](https://peerjs.com/)) allows you to share your tournament state with others in real-time. This means that changes made to the tournament are immediately visible to all participants. This requires that the host device is online and connected to the internet. No login is required. P2P sharing is offered in three modes:

- **Permanent**: The link is valid whenever the host device is online. (That way you can safely share the link beforehand)
- **Session**: The link changes whenever the host device is re-opens the browser.
- **Random**: The link changes whenever the host device reloads or re-opens the browser.

### Using Gists and P2P sharing together

It is recommended to use Gists and P2P sharing together. Use the Gist share link to share the tournament with participants. bracketeer automatically switches to P2P sharing when available.

## Use

### Online

You can use bracketeer online [here](https://bracketeer.davidohnee.com/). This version is hosted via Cloudflare Pages.

### Self-Hosted

You can also self-host bracketeer using a reverse proxy such as Caddy or Nginx. The application works client-side and offline.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

### Development

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
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to access the application.

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

#### Type Checking, Linting

```bash
# Type check
npm run type-check

# Lint code
npm run lint
```

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please [create an issue](https://github.com/davidohnee/bracketeer/issues/new).
