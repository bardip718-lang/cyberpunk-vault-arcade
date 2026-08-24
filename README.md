# Neon Vault Games

Build a modern, cyberpunk-themed Web Gaming & Reward Vault Application with the following modules: and app name win1

1. Interactive Games:
   - A 3x5 Reel Spin Mini-Game with realistic animations, sound toggles, and dynamic score updating.
   - A Card-matching mini-game integrated with user score balance.

2. Authentication System:
   - Complete User Auth (Login, Sign-Up modal, and Guest mode) with state management.

3. Vault Top-Up & Payment Modal:
   - Clean Top-Up modal displaying a live QR code generated via https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=7719254845@ybl.
   - Plain text display of ID '7719254845@ybl' with an instant 'Copy to Clipboard' button.
   - Text input field for users to enter their 12-digit transaction Reference/UTR number after payment.
   - 'Submit Order' button that pushes requests to a pending queue.

4. Operator / Admin Console:
   - A dedicated Admin Dashboard tab to view all pending order reference numbers, user details, and amount requested.
   - Approve and Reject action buttons to update the user's active score balance immediately.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cyberpunk-vault-arcade.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/498c9a80-ab87-473c-97bf-9489f1394fe3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```.
