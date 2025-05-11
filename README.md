# hypertweet

[![Hypertweet logo](https://nexo.sh/hypertweet/ogimage.png)](https://nexo.sh/hypertweet/)

> ⚠️ **Alpha Version Notice**  
> hypertweet is in early development. Some features are still in progress or subject to change. Use at your own risk—and if something breaks, let us know so we can pretend it was intentional.

> 💫 **Want to stay in the loop?**
>
> - Star this repo to show some love
> - Follow [@nexo_v1](https://x.com/nexo_v1) on X for updates and memes
> - Follow [@nexo-tech](https://github.com/nexo-tech) on GitHub for more cool stuff

**hypertweet** is your sidekick for X (formerly Twitter) replies. It's a Chrome extension (ok, Firefox for now, Chrome is being annoying) that uses AI to help you come up with smart, spicy, or just-not-awkward replies to tweets, without sounding like a bot or your dad trying to be cool.

## Features

- 🔐 **Fully Local & Private**

  - All data stored in your browser's IndexedDB
  - You own and control all your data
  - No data sent to external servers (except anonymized usage telementry (not yet implemented))

- 👤 **Smart Profile Management**

  - Pull data from X (Twitter) and LinkedIn
  - Automatic system prompt generation
  - Personalized response style based on your profile
  - Customizable reply tones and personas

- 💰 **Cost-Effective Generation**

  - Optimized token usage
  - Smart caching strategies
  - Minimal API calls
  - Cost-effective tweet generation

- 🤖 **AI-Powered Features**
  - Context-aware response crafting
  - Multiple AI model support
  - Real-time tweet analysis
  - Standalone tweet generation

## Installation

### Firefox (Currently Supported)

1. Download the extension files
2. Open Firefox and go to `about:debugging`
3. Click **This Firefox** in the sidebar
4. Click **Load Temporary Add-on** and select the `manifest.json` file from the extension folder

### Chrome (Coming Soon)

1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Pin the extension to your toolbar for easy access

## Usage

1. Navigate to any tweet on X (formerly Twitter)
2. Click the HyperTweet extension icon in your browser toolbar
3. Choose your preferred AI model and settings
4. Generate a contextual reply or create a standalone tweet
5. Review, edit if needed, and post your response

## AI Integration

HyperTweet currently supports:

- OpenAI's GPT models
- (More providers coming soon)

## Roadmap

### Short-term Goals

- [ ] Chrome Web Store publication
- [ ] Enhanced model selection interface
- [ ] Additional AI API provider integrations
- [ ] Improved response customization options
- [ ] Advanced profile data synchronization
- [ ] Enhanced prompt engineering system

### Medium-term Goals

- [ ] Standalone tweet generation mode
- [ ] Advanced prompt engineering options
- [ ] Response style customization
- [ ] Batch tweet generation
- [ ] Profile analytics dashboard
- [ ] Custom tone templates

### Long-term Vision

- [ ] Firefox extension support
- [ ] Mobile browser integration
- [ ] Advanced analytics dashboard
- [ ] Community prompt sharing
- [ ] Multi-language support
- [ ] Cross-platform profile sync
- [ ] Advanced data visualization

## Permissions Required

- `activeTab`: Access the current Twitter page
- `scripting`: Inject content scripts for tweet analysis
- `storage`: Save user preferences and settings

## Contributing

We welcome contributions! Whether it's:

- Adding new AI providers
- Improving the user interface
- Enhancing response quality
- Adding new features
- Optimizing data storage
- Improving cost efficiency

Please check our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

**Personal-Use Source-Available License (PUSAL) v1.0**

Key points:

- ✅ Free for personal, non-commercial use
- ✅ You can modify and run the software privately
- ❌ Cannot be distributed or sold
- ❌ Cannot be used in commercial products
- ❌ Cannot be published in extension marketplaces
- 🔄 Contributions become part of the project

For full details, see the [LICENSE](LICENSE) file.

## Support

For support, feature requests, or bug reports, please:

1. Open an issue in this repository
2. Follow twitter [@nexo_v1](https://x.com/nexo_v1)
