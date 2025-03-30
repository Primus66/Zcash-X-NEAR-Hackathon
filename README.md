# Zeke - AI Agent 🤖

## 🚀 Overview

Zeke is an advanced AI agent built using Eliza, designed for processing zcash transactions seamlessly and securely.

## ✨ Features

-   🤖 Autonomous AI Agent
-   💸 Send and receive zcash
-   🛡️ Manage and protect your wallet addresses
-   📈 Manage your zcash transactions

## 🚀 Quick Start

### Prerequisites

-   [Python 3.8+](https://www.python.org/downloads/)
-   [Node.js 23+](https://nodejs.org/en/download/)
-   [pnpm](https://pnpm.io/installation)

### Setup & Installation

Clone the starter repository and get started with Zeke:

```bash
# Clone the Zeke Starter
git clone https://github.com/onajifortune/near-zcash-hackathon.git
cd near-zcash-hackathon

# Setup environment
cp .env.example .env
pnpm i && pnpm build && pnpm start
```

### Browser Interaction

Once Zeke is running, start the web client in another terminal:

```bash
pnpm start:client
```

Access the local server URL to chat with Zeke.

## 🔧 Customization

### Modify Zeke's Character

1. Open `packages/core/src/defaultCharacter.ts` and edit the character settings.
2. Use JSON-based customization to define personalities.

## 📁 Project Structure

```
zeke/
├── packages/
│   ├── core/          # Core AI logic
│   ├── clients/       # API clients
│   ├── actions/       # Custom actions
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── examples/         # Use case examples
```
