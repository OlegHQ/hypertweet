// Reddit scraper - raw vanilla JS for console debugging
// Copy-paste this entire file into browser console to test selectors

window.__reddit = (function () {
  var COMPOSER_SELECTOR = 'shreddit-composer';
  var MAX_WAIT_MS = 10000;
  var MAX_COMMENT_DEPTH = 5;

  function log() {
    var args = ['[Reddit]'].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
  }

  function warn() {
    var args = ['[Reddit]'].concat(Array.prototype.slice.call(arguments));
    console.warn.apply(console, args);
  }

  function waitForSelector(selector, timeout) {
    timeout = timeout || MAX_WAIT_MS;
    return new Promise(function (resolve) {
      log('Waiting for selector: ' + selector);
      var startTime = Date.now();

      var existing = document.querySelector(selector);
      if (existing) {
        log('Found existing element immediately');
        resolve(existing);
        return;
      }

      log('Element not found, setting up MutationObserver...');
      var timeoutId;
      var observer = new MutationObserver(function () {
        var element = document.querySelector(selector);
        if (element) {
          var elapsed = Date.now() - startTime;
          log('Element found after ' + elapsed + 'ms');
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
        warn('Timeout after ' + timeout + 'ms waiting for: ' + selector);
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  function extractCommentData(el, depth, maxDepth) {
    if (depth >= maxDepth) {
      return null;
    }

    var authorEl = el.querySelector('[noun="comment_author"]');
    var author = authorEl ? authorEl.textContent.trim() : '';

    var commentEl = el.querySelector('[slot="comment"]');
    var text = commentEl ? commentEl.textContent.trim() : '';

    // Navigate through shadow DOM to get upvotes
    var actionRow = el.querySelector('shreddit-comment-action-row');
    var upvotesText = '0';
    if (actionRow && actionRow.shadowRoot) {
      var voteButton = actionRow.shadowRoot.querySelector(
        '[slot="vote-button"]'
      );
      if (voteButton) {
        upvotesText = voteButton.textContent.trim();
      }
    }

    var upvotesParts = upvotesText.split(' ').filter(function (x) {
      return x;
    });
    var upvotes = 0;
    for (var i = 0; i < upvotesParts.length; i++) {
      var num = parseInt(upvotesParts[i], 10);
      if (!isNaN(num)) {
        upvotes = num;
      }
    }

    var post = {
      author: {
        name: author,
        userName: author,
      },
      text: text,
      upvotes: upvotes,
      isTopLevel: depth === 0,
      replies: [],
    };

    // Get nested comments
    var nestedComments = extractCommentsAtDepth(el, depth + 1, maxDepth);
    if (nestedComments.length > 0) {
      post.replies = nestedComments;
    }

    return post;
  }

  function extractCommentsAtDepth(parent, depth, maxDepth) {
    var selector = "shreddit-comment[depth='" + depth + "']";
    var elements = Array.prototype.slice.call(
      parent.querySelectorAll(selector)
    );
    var comments = [];

    for (var i = 0; i < elements.length; i++) {
      var comment = extractCommentData(elements[i], depth, maxDepth);
      if (comment) {
        comments.push(comment);
      }
    }

    return comments;
  }

  function extractPostData() {
    log('Extracting post data...');

    var titleEl = document.querySelector('h1[slot=title]');
    var authorEl = document.querySelector('span[slot=authorName]');
    var bodyEl = document.querySelector('div[property="schema:articleBody"]');

    if (!titleEl || !authorEl) {
      warn('Required post elements not found');
      return null;
    }

    var title = titleEl.textContent.trim();
    var author = authorEl.textContent.trim();
    var body = bodyEl ? bodyEl.textContent.trim() : '';

    // Extract subreddit from URL
    var urlParts = window.location.pathname.split('/');
    var subredditIndex = urlParts.indexOf('r');
    var subreddit = '';
    if (subredditIndex !== -1 && urlParts[subredditIndex + 1]) {
      subreddit = urlParts[subredditIndex + 1];
    }

    log('Found post: "' + title.substring(0, 50) + '..."');
    log('Author: ' + author + ', Subreddit: r/' + subreddit);

    return {
      title: title,
      author: author,
      body: body,
      subreddit: subreddit,
      url: window.location.href,
    };
  }

  function readPage() {
    log('Starting page read...');
    log('URL: ' + window.location.href);

    return waitForSelector('h1[slot=title]').then(function (titleEl) {
      if (!titleEl) {
        warn('No post title found after waiting');
      }

      var postData = extractPostData();
      var posts = [];
      var activePost = null;

      if (postData) {
        var mainPost = {
          author: {
            name: postData.author,
            userName: postData.author,
          },
          text: postData.body || postData.title,
          url: postData.url,
          replies: [],
        };

        // Extract comments
        log('Extracting comments...');
        var comments = extractCommentsAtDepth(document, 0, MAX_COMMENT_DEPTH);
        log('Found ' + comments.length + ' top-level comments');
        mainPost.replies = comments;

        posts.push(mainPost);

        // Check if composer is visible
        var composer = document.querySelector(COMPOSER_SELECTOR);
        if (composer) {
          log('Composer detected');
          activePost = mainPost;
        } else {
          log('No composer detected');
        }
      }

      var page = {
        site: 'reddit.com',
        url: window.location.href,
        posts: posts,
        activePost: activePost,
      };

      log(
        'Page read complete. Posts: ' +
          posts.length +
          ', Active: ' +
          (activePost ? 'yes' : 'no')
      );
      return page;
    });
  }

  function insertReply(text) {
    log('Inserting reply: "' + text.substring(0, 50) + '..."');

    var composer = document.querySelector(COMPOSER_SELECTOR);
    if (!composer) {
      warn('Composer not found');
      return false;
    }

    var textbox = composer.querySelector(
      'div[contenteditable="true"][role="textbox"]'
    );
    if (!textbox) {
      warn('Textbox not found in composer');
      return false;
    }

    log('Textbox found, inserting text...');

    try {
      // Clear existing content
      textbox.innerHTML = '';

      // Split text into lines for proper paragraph structure
      var lines = text.split('\n');

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var paragraph = document.createElement('p');
        paragraph.className = 'first:mt-0 last:mb-0';
        paragraph.setAttribute('dir', 'ltr');

        if (line.trim()) {
          var span = document.createElement('span');
          span.setAttribute('data-lexical-text', 'true');
          span.textContent = line;
          paragraph.appendChild(span);
        } else {
          paragraph.innerHTML = '<br>';
        }

        textbox.appendChild(paragraph);
      }

      // If text is empty, add a single paragraph with placeholder
      if (!text.trim()) {
        var emptyParagraph = document.createElement('p');
        emptyParagraph.className = 'first:mt-0 last:mb-0';
        emptyParagraph.innerHTML = '<br>';
        textbox.appendChild(emptyParagraph);
      }

      // Trigger input event to notify Reddit's JavaScript
      var inputEvent = new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'insertText',
        data: text,
      });
      textbox.dispatchEvent(inputEvent);

      // Focus the textbox
      textbox.focus();

      // Place cursor at the end
      var range = document.createRange();
      var selection = window.getSelection();
      if (textbox.lastChild) {
        range.selectNodeContents(textbox.lastChild);
        range.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      log('Reply inserted successfully');
      return true;
    } catch (error) {
      warn('Failed to insert reply:', error);
      return false;
    }
  }

  var CONTAINER_CLASS = 'hypertweet-keyboard';

  function createKeyboardContainer(composer) {
    if (!composer || !composer.parentElement) {
      return null;
    }

    var existing = composer.parentElement.querySelector('.' + CONTAINER_CLASS);
    if (existing) {
      return existing;
    }

    var container = document.createElement('div');
    container.className = CONTAINER_CLASS;
    composer.parentElement.insertBefore(container, composer.nextSibling);
    log('Keyboard container inserted after composer');
    return container;
  }

  function onReplyFormRendered(callback) {
    log('Setting up reply form observer...');

    function checkAndNotify() {
      var composers = document.querySelectorAll(COMPOSER_SELECTOR);
      for (var i = 0; i < composers.length; i++) {
        var composer = composers[i];
        if (composer) {
          var container = createKeyboardContainer(composer);
          if (container) {
            callback(container);
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

    log('Reply form observer started');
  }

  return {
    readPage: readPage,
    insertReply: insertReply,
    onReplyFormRendered: onReplyFormRendered,
    waitForSelector: waitForSelector,
    extractPostData: extractPostData,
    extractCommentData: extractCommentData,
    extractCommentsAtDepth: extractCommentsAtDepth,
    COMPOSER_SELECTOR: COMPOSER_SELECTOR,
    MAX_COMMENT_DEPTH: MAX_COMMENT_DEPTH,
  };
})();

// Quick test in console:
// window.__reddit.readPage().then(console.log)
// window.__reddit.insertReply("Hello!")
