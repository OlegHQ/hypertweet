// Twitter scraper - raw vanilla JS for console debugging
// Copy-paste this entire file into browser console to test selectors

window.__twitter = (function () {
  var TWEET_SELECTOR = '[data-testid=tweet]';
  var MAX_WAIT_MS = 10000;

  function waitForSelector(selector, timeout) {
    timeout = timeout || MAX_WAIT_MS;
    return new Promise(function (resolve) {
      console.log('Waiting for selector: ' + selector);
      var startTime = Date.now();

      var existing = document.querySelector(selector);
      if (existing) {
        console.log('Found existing element immediately');
        resolve(existing);
        return;
      }

      console.log('Element not found, setting up MutationObserver...');
      var timeoutId;
      var observer = new MutationObserver(function () {
        var element = document.querySelector(selector);
        if (element) {
          var elapsed = Date.now() - startTime;
          console.log('Element found after ' + elapsed + 'ms');
          observer.disconnect();
          window.clearTimeout(timeoutId);
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      timeoutId = window.setTimeout(function () {
        console.warn(
          'Timeout after ' + timeout + 'ms waiting for: ' + selector
        );
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  function extractTweetData(tweet) {
    var nameEl = tweet.querySelector('[data-testid=User-Name] a');
    var isVerified =
      !!nameEl && !!nameEl.querySelector('[data-testid=icon-verified]');
    var name = nameEl ? nameEl.textContent : undefined;
    var href = nameEl ? nameEl.getAttribute('href') : null;
    var userName = href ? '@' + href.split('/').pop() : undefined;

    var tweetTextEl = tweet.querySelector('[data-testid=tweetText]');
    var text = tweetTextEl ? tweetTextEl.textContent : undefined;

    var timeEl = tweet.querySelector('time');
    var time = timeEl ? timeEl.getAttribute('datetime') : undefined;

    var linkElement = tweet.querySelector('a[href*="/status/"]');
    var url = linkElement ? linkElement.href : '';
    var statusID = url ? url.split('/').pop() : undefined;

    function checkNextIsReply(tweet) {
      var userAvatar = tweet.querySelector(
        '[data-testid="Tweet-User-Avatar"]'
      )?.parentElement;
      const nextElementCouldBeReply = userAvatar?.childElementCount ?? 1;
      if (nextElementCouldBeReply == 1) {
        return false;
      }
      /**@type{HTMLElement} */
      const tweetHolder = tweet.closest('[data-testid="cellInnerDiv"]');
      const sibling = tweetHolder?.nextSibling;
      if (!sibling) {
        return false;
      }
      const showRepliesSpan = Array.from(sibling.querySelectorAll('span')).find(
        el => el.textContent.trim() === 'Show replies'
      );
      if (!showRepliesSpan) {
        return true;
      }
      return false;
    }
    let nextIsReply = checkNextIsReply(tweet);
    return [
      {
        Author: {
          Name: name,
          UserName: userName,
          IsVerified: isVerified,
        },
        Text: text,
        Time: time,
        StatusID: statusID,
        Replies: [],
      },
      nextIsReply,
    ];
  }

  function readPage() {
    console.log('Starting page read...');
    console.log('URL: ' + window.location.href);

    return waitForSelector(TWEET_SELECTOR).then(function (firstTweet) {
      if (!firstTweet) {
        console.warn('No tweets found after waiting');
      }

      var tweets = Array.prototype.slice.call(
        document.querySelectorAll(TWEET_SELECTOR)
      );
      console.log('Found ' + tweets.length + ' tweets');

      var posts = [];
      var mainPost = null;

      if (tweets.length > 0) {
        [mainPost] = extractTweetData(tweets[0]);
        if (mainPost.Text) {
          posts.push(mainPost);
          console.log('Main post: "' + mainPost.Text.substring(0, 50) + '..."');

          // Process replies
          if (tweets.length > 1) {
            console.log('Processing ' + (tweets.length - 1) + ' replies...');
            var validReplies = 0;
            let nextIsReply = false;
            for (var i = 1; i < tweets.length; i++) {
              let isReplyOfPrevious = nextIsReply;
              let replyData = null;
              [replyData, nextIsReply] = extractTweetData(tweets[i]);
              if (replyData.Text) {
                let prev = mainPost.Replies[mainPost.Replies.length - 1];
                if (isReplyOfPrevious && prev) {
                  prev.Replies.push(replyData);
                } else {
                  mainPost.Replies.push(replyData);
                }

                validReplies++;
              }
            }
            console.log('Converted ' + validReplies + ' valid reply posts');
          }
        } else {
          mainPost = null;
        }
      } else {
        console.warn('No tweets found on page');
      }

      var activePost = null;
      var replyForm = document.querySelector('[data-testid="tweetTextarea_0"]');
      if (replyForm) {
        console.log('Reply form detected');
        if (posts.length > 0) {
          activePost = posts[0];
          var draftText = replyForm.textContent.trim();
          if (draftText) {
            activePost.CurrentReplyDraft = draftText;
            console.log('Draft text captured: ' + draftText.substring(0, 50));
          }
          console.log('Active post set to first post');
        }
      } else {
        console.log('No reply form detected');
      }

      var page = {
        Site: 'x.com',
        Url: window.location.href,
        Posts: posts,
        ActivePost: activePost,
      };

      console.log(
        'Page read complete. Posts: ' +
          posts.length +
          ', Active: ' +
          (activePost ? 'yes' : 'no')
      );
      return page;
    });
  }

  function insertReply(text) {
    console.log('Inserting reply: "' + text.substring(0, 50) + '..."');

    var editor = document.querySelector(
      'div[contenteditable="true"][data-testid="tweetTextarea_0"]'
    );

    if (!editor) {
      console.warn('Reply editor not found');
      return false;
    }

    console.log('Editor found, inserting text...');

    try {
      editor.focus();
      var sel = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }

      document.execCommand('selectAll', false, undefined);
      document.execCommand('insertText', false, text);

      console.log('Reply inserted successfully');
      return true;
    } catch (error) {
      console.warn('Failed to insert reply:', error);
      return false;
    }
  }

  var CONTAINER_CLASS = 'hypertweet-keyboard';
  var INLINE_REPLY_SELECTOR = '[data-testid="inline_reply_offscreen"]';

  function createKeyboardContainer(inlineReply) {
    if (!inlineReply || !inlineReply.parentElement) {
      return null;
    }

    var existing = inlineReply.parentElement.querySelector(
      '.' + CONTAINER_CLASS
    );
    if (existing) {
      return existing;
    }

    var container = document.createElement('div');
    container.className = CONTAINER_CLASS;
    inlineReply.parentElement.insertBefore(container, inlineReply.nextSibling);
    console.log('Keyboard container inserted after inline_reply_offscreen');
    return container;
  }

  function onReplyFormRendered(callback) {
    function checkAndNotify() {
      var inlineReplies = document.querySelectorAll(INLINE_REPLY_SELECTOR);
      for (const inlineReply of inlineReplies) {
        if (inlineReply) {
          var container = createKeyboardContainer(inlineReply);
          if (container) {
            // Pass insertReply and readPage functions
            callback(container, insertReply, readPage);
          }
        }
      }
    }

    // Check immediately
    checkAndNotify();

    // Set up observer for dynamic loading
    var observer = new MutationObserver(function () {
      checkAndNotify();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  return {
    readPage: readPage,
    insertReply: insertReply,
    onReplyFormRendered: onReplyFormRendered,
    waitForSelector: waitForSelector,
    extractTweetData: extractTweetData,
    TWEET_SELECTOR: TWEET_SELECTOR,
  };
})();

// Quick test in console:
// window.__twitter.readPage().then(console.log)
// window.__twitter.insertReply("Hello!")
