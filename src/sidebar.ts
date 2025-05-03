import { browserApi } from './browser-api';

interface Tweet {
  id: string;
  text: string;
  author: string;
}

class SidebarUI {
  private tweetList: HTMLElement;

  constructor() {
    this.tweetList = document.getElementById('tweetList')!;
    this.initialize();
  }

  private initialize() {
    // Listen for messages from the background script
    browserApi.runtime.onMessage.addListener((message) => {
      if (message.type === 'TWEETS_UPDATED') {
        this.updateTweets(message.tweets);
      }
    });

    // Request initial tweets
    browserApi.runtime.sendMessage({ type: 'GET_TWEETS' });
  }

  private updateTweets(tweets: Tweet[]) {
    this.tweetList.innerHTML = '';
    tweets.forEach(tweet => {
      const tweetElement = this.createTweetElement(tweet);
      this.tweetList.appendChild(tweetElement);
    });
  }

  private createTweetElement(tweet: Tweet): HTMLElement {
    const div = document.createElement('div');
    div.className = 'tweet-item';
    div.innerHTML = `
      <div style="margin-bottom: 8px;">${tweet.text}</div>
      <div style="font-size: 12px; color: #536471; margin-bottom: 8px;">@${tweet.author}</div>
      <button class="copy-button" data-tweet-id="${tweet.id}">Copy Tweet</button>
    `;

    const button = div.querySelector('button')!;
    button.addEventListener('click', () => this.copyTweet(tweet));

    return div;
  }

  private async copyTweet(tweet: Tweet) {
    try {
      await navigator.clipboard.writeText(tweet.text);
      // Show success feedback
      const button = document.querySelector(`button[data-tweet-id="${tweet.id}"]`) as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.style.background = '#00ba7c';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#1d9bf0';
      }, 2000);
    } catch (error) {
      console.error('Failed to copy tweet:', error);
    }
  }
}

// Initialize the sidebar UI
new SidebarUI(); 