# Project Overview

This project is a web extension called Hypertweet v2. It is designed to provide AI-powered contextual replies for social media platforms. The project consists of two main components:

*   **Extension:** A browser extension built with React and TypeScript. It uses `bun` for package management and `esbuild` for bundling. The extension is the client-side component that interacts with the user on social media platforms.
*   **Server:** A backend server built with Rust and the `axum` framework. It handles user authentication, manages "tones" for generating replies, and provides the AI-powered responses. It appears to be designed to work with Cloudflare D1, a serverless database.

## Building and Running

The project uses a `justfile` to provide a convenient way to run common development tasks.

### Extension

To build and run the extension, you will need to have `bun` installed.

*   **Install dependencies:**
    ```bash
    just install
    ```
*   **Run in development mode (with watching):**
    ```bash
    just watch
    ```
*   **Build for production:**
    ```bash
    just build
    ```

### Server

The `justfile` does not contain commands for the server. To run the server, you will need to have Rust installed.

*   **Run the server:**
    ```bash
    cd server
    cargo run
    ```

## Development Conventions

*   **Code Formatting:** The project uses `prettier` for code formatting. You can format the code by running:
    ```bash
    just format
    ```
*   **Linting:** The project uses `eslint` for linting. You can lint the code by running:
    ```bash
    just lint
    ```
*   **Type Checking:** The project uses TypeScript for static type checking. You can check the types by running:
    ```bash
    just typecheck
    ```
*   **All Checks:** To run all checks (linting, formatting, and type checking) together, you can use:
    ```bash
    just check
    ```
