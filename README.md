# hypertweet

<img src="img/copy-tweets-logo.png" width="50" height="50" />

**Copy Tweets** is a lightweight browser extension that lets you quickly copy tweets and full threads—including replies—to your clipboard with a single click.

## Features

- Copy entire tweet threads instantly
- Captures tweet metadata, including:
  - Author's display name
  - Username (@handle)
  - Verification status
  - Tweet text
  - Timestamp
  - Tweet URL
- Supports Chrome and Firefox
- Clean, intuitive user interface

## Installation

### Chrome

1. Download the extension files.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the extension directory.

### Firefox

1. Download the extension files.
2. Open Firefox and go to `about:debugging`.
3. Click **This Firefox** in the sidebar.
4. Click **Load Temporary Add-on** and select the `manifest.json` file from the extension folder.

## Usage

1. Navigate to any tweet or thread on X (formerly Twitter).
2. Click the Copy Tweets extension icon in your browser toolbar.
3. The thread (including replies) will be copied to your clipboard in structured JSON format.

## How It Works

- Detects visible tweets and replies on the current page
- Extracts structured data from each tweet
- Formats the content into a clean JSON object
- Copies the structured data to your clipboard for easy use

## Permissions Required

- `activeTab`: Access the current Twitter page.
- `scripting`: Inject content scripts to extract data.
- `clipboardWrite`: Copy the formatted data directly to your clipboard.

## License

This project is licensed under the terms specified in the LICENSE file.

## Contributing

Pull requests are welcome. If you have ideas for improvements or new features, feel free to contribute.
