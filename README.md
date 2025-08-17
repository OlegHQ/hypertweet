# hypertweet

[![Hypertweet logo](https://nexo.sh/hypertweet/ogimage.png)](https://nexo.sh/hypertweet/)

> ⚠️ **Alpha Version Notice**  
> hypertweet is in early development. Some features are still in progress or subject to change. Use at your own risk—and if something breaks, let us know so we can pretend it was intentional.

> 💫 **Want to stay in the loop?**
>
> - Star this repo to show some love
> - Follow [@nexo_v1](https://x.com/nexo_v1) on X for updates and memes
> - Follow [@nexo-tech](https://github.com/nexo-tech) on GitHub for more cool stuff

**hypertweet** is your AI sidekick for dominating social media conversations. It's a browser extension that uses AI to help you craft smart, spicy, or just-not-awkward replies on Twitter/X, LinkedIn, and Reddit—without sounding like a bot or your dad trying to be cool.

Think of it as having a witty friend who's always got the perfect comeback, but they also happen to be really good at reading the room and knowing exactly what each platform's vibe is.

## ✨ What This Thing Actually Does

### 🌐 **Works Everywhere That Matters**
- **Twitter/X** - Because arguing with strangers is a full-time job now
- **LinkedIn** - For when you need to sound professional while subtly flexing
- **Reddit** - Navigate the chaos with responses that actually add value (revolutionary, we know)

### 🧠 **Three Modes of AI Genius**

#### Simple Mode (For When You're Lazy)
- Pick a vibe, get a reply. That's it.
- Custom personality types because you're unique (just like everyone else)
- One-click responses for maximum efficiency, minimum thinking

#### Complex Mode (For When You Want to Sound Smart)  
- **Basic** - Standard intelligent human being cosplay
- **Impact** - Replies that actually matter and get engagement
- **Story** - "This reminds me of the time I..." but actually interesting
- **Perspective** - Hot takes that don't get you canceled
- **Analogy** - Explain stuff like you're talking to your mom
- **Tip** - Drop knowledge bombs that people actually want
- **Clean Up** - Fix your word vomit before hitting send

#### Edit Mode (For Perfectionists)
- **Simplify** - Turn your PhD thesis into human language
- **Humanize** - Add some soul to your corporate speak
- **Challenge** - Disagree without starting World War III
- **Shorten** - TL;DR your own thoughts
- **Depth** - When 280 characters isn't enough for your genius

### 🕵️ **It Actually Gets Context (Wild, Right?)**

#### Twitter/X Intelligence
- Reads entire threads so you don't look stupid jumping in mid-conversation
- Analyzes what's getting engagement vs. what's getting ratio'd
- Understands when someone's being sarcastic (unlike your family)

#### Reddit Superpowers
- Figures out each subreddit's weird culture and unwritten rules
- Knows the difference between r/wholesomememes and r/roastme
- Identifies which comments are actually worth reading (spoiler: not many)
- Automatically adjusts for whether you're in a meme sub or discussing quantum physics

#### LinkedIn Professional Mode  
- Keeps you from accidentally posting your Twitter personality on LinkedIn
- Helps you network without sounding like a LinkedIn influencer bot
- Maintains that "thought leader" energy without the cringe

### 👤 **Knows Who You Are (In a Good Way)**
- Pulls your actual personality from your profiles instead of guessing
- 16 personality types supported because Myers-Briggs is apparently still a thing
- Multi-profile support for your various online personas
- Custom prompts because you're special and have opinions

### 🔐 **Privacy That Actually Means Something**
- Everything stays in your browser. We're not building a social media surveillance empire.
- Your data doesn't phone home to our servers (we don't even have servers)
- You bring your own OpenAI API key like a responsible adult
- Zero tracking because we're not creeps

### 💸 **Won't Bankrupt You**
- Smart about API usage so you don't accidentally spend your rent money on tweet replies
- Caches stuff intelligently 
- Shows you exactly how much you're spending (transparency is sexy)

## 🚀 Installation (The Fun Part)

### Firefox (The Cool Browser)
1. Clone this repo or download it like it's 2005
2. Run `bun install` (if you don't have Bun, get it, it's fast)
3. Run `bun build` and watch the magic happen
4. Firefox → `about:debugging` → Load the thing
5. Point it at the `manifest.json` in the `out-firefox` folder

### Chrome (For the Masses)
1. Same first 3 steps as above
2. Run `bun build --chrome` instead
3. `chrome://extensions/` → Developer mode ON → Load unpacked
4. Point it at the `out-chrome` folder
5. Feel slightly ashamed for using Chrome (jk we love you)

## 📖 How to Actually Use This Thing

### First Time Setup (Don't Skip This)
1. Install the extension (obviously)
2. Get an OpenAI API key (they're like $5/month for normal people)
3. Import your profile from Twitter/LinkedIn so it knows your vibe
4. Go forth and reply to things

### Twitter/X (The Chaos Platform)
1. Find a tweet that makes you want to respond
2. Our little panel shows up automatically (like magic, but with code)
3. Pick Simple for quick replies, Complex for when you want to sound smart
4. Generate, tweak if needed, deploy your wit

### Reddit (Where Nuance Goes to Die)  
1. Find a post that doesn't make you lose faith in humanity
2. Panel appears when you go to comment
3. Complex mode analyzes the whole thread and subreddit culture
4. Generate responses that won't get you downvoted into oblivion

### LinkedIn (Professional Twitter)
1. Find a post about "crushing it" or "thoughts?"
2. Generate responses that sound like you know what you're talking about
3. Maintain your professional brand without sounding like a robot
4. Network like a human being

## 🛠️ For the Nerds (Development)

Built with modern stuff that doesn't suck:
- **TypeScript** because JavaScript without types is just asking for trouble
- **React 19** because we like living dangerously
- **Bun** because life's too short for slow builds
- **CSS-in-JS** because we got tired of CSS conflicts

### Building Stuff
```bash
bun install          # Get the dependencies
bun dev              # Firefox dev build with hot reload
bun dev:chrome       # Chrome dev build  
bun build            # Production build for both
bun format           # Make your code pretty
```

## 🔧 Setup (The Boring But Necessary Part)

1. Get an OpenAI API key (platform.openai.com)
2. Paste it in the extension settings
3. Pick GPT-4o if you want the good stuff, GPT-3.5 if you're cheap
4. Import your profile so it knows your personality
5. Start being funnier/smarter/more professional online

## 🗺️ What's Coming Next

### ✅ Just Shipped
- Multi-platform support (because why limit yourself?)
- Complex mode that actually understands context
- Reddit support with subreddit culture detection
- Fixed a bunch of bugs you'll never know about

### 🚧 Working On It  
- Chrome Web Store (Google is slow, what else is new)
- Making the UI even prettier
- Performance improvements (it's already fast but we're perfectionists)

### 📋 The Dream List
- Analytics dashboard so you can see your social media ROI
- Custom prompt templates for your specific brand of chaos
- Batch generation for when you're feeling productive
- More platforms (Instagram, TikTok, wherever humans argue online)
- Mobile support (eventually)

## 🤝 Want to Help?

Cool! We need:
- People who know other social platforms
- UI/UX designers who can make things pretty
- Developers who like fixing things that aren't broken
- Anyone with opinions about how AI should work
- Beta testers who break stuff creatively

Check [Contributing Guidelines](CONTRIBUTING.md) for the boring details.

## 📄 Legal Stuff (The Fine Print)

**Personal-Use Source-Available License (PUSAL) v1.0**

Translation:
- ✅ Use it, modify it, make it yours
- ✅ Perfect for personal projects and learning
- ❌ Don't try to sell it (that's our job)
- ❌ Don't publish it in app stores without asking
- 🔄 If you improve it, share the love

Full legal text in [LICENSE](LICENSE) if you're into that sort of thing.

## 🆘 When Things Break

1. **GitHub Issues** - For when something's actually broken
2. **Twitter** [@nexo_v1](https://x.com/nexo_v1) - For quick questions and memes
3. **CLAUDE.md** - Technical docs for fellow developers

---

**Made with ❤️, ☕, and questionable life choices by [Oleg Pustovit](https://github.com/nexo-tech)**