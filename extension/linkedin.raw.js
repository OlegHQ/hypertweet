// LinkedIn scraper - raw vanilla JS for console debugging
// Copy-paste this entire file into browser console to test selectors

window.__linkedin = (function () {
  var ARTICLE_SELECTOR = '[role="article"]';
  var EDITOR_SELECTOR = 'div[data-test-ql-editor-contenteditable="true"]';
  var MAX_WAIT_MS = 10000;

  function log() {
    var args = ['[LinkedIn]'].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
  }

  function warn() {
    var args = ['[LinkedIn]'].concat(Array.prototype.slice.call(arguments));
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

  function isElementVisible(element) {
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none'
    );
  }

  function findVisibleEditor() {
    var editors = document.querySelectorAll(EDITOR_SELECTOR);
    for (var i = 0; i < editors.length; i++) {
      if (isElementVisible(editors[i])) {
        return editors[i];
      }
    }
    return null;
  }

  function extractPostFromElement(postElement) {
    if (!postElement) {
      return null;
    }

    // Extract post text
    var textEl = postElement.querySelector('.update-components-text');
    var text = textEl ? textEl.textContent.trim() : '';

    // Extract author info
    var authorEl = postElement.querySelector(
      '.update-components-actor__title span[aria-hidden="true"]'
    );
    var authorName = authorEl ? authorEl.textContent.trim() : '';

    return {
      author: {
        name: authorName,
        userName: authorName, // LinkedIn doesn't have separate usernames
      },
      text: text,
      replies: [],
    };
  }

  function extractCommentFromElement(commentEl) {
    if (!commentEl) {
      return null;
    }

    var authorEl = commentEl.querySelector(
      '.comments-comment-meta__description-title'
    );
    var authorName = authorEl ? authorEl.textContent.trim() : '';

    var textEl = commentEl.querySelector(
      '.comments-comment-item__main-content .update-components-text'
    );
    var text = textEl ? textEl.textContent.trim() : '';

    return {
      author: {
        name: authorName,
        userName: authorName,
      },
      text: text,
      replies: [],
    };
  }

  function extractCommentsWithReplies(container) {
    var comments = [];
    var parentComments = container.querySelectorAll(
      'article.comments-comment-entity:not(.comments-comment-entity--reply)'
    );

    for (var i = 0; i < parentComments.length; i++) {
      var parentEl = parentComments[i];
      var comment = extractCommentFromElement(parentEl);
      if (!comment || !comment.text) {
        continue;
      }

      // Find replies within this parent comment
      var repliesList = parentEl.querySelector('.comments-replies-list');
      if (repliesList) {
        var replyEls = repliesList.querySelectorAll(
          'article.comments-comment-entity--reply'
        );
        for (var j = 0; j < replyEls.length; j++) {
          var reply = extractCommentFromElement(replyEls[j]);
          if (reply && reply.text) {
            comment.replies.push(reply);
          }
        }
      }

      comments.push(comment);
    }

    return comments;
  }

  function extractAllPosts() {
    var postElements = Array.prototype.slice.call(
      document.querySelectorAll(ARTICLE_SELECTOR)
    );
    var posts = [];

    log('Found ' + postElements.length + ' article elements');

    for (var i = 0; i < postElements.length; i++) {
      var postData = extractPostFromElement(postElements[i]);
      if (postData && postData.text) {
        posts.push(postData);
        log(
          'Post ' + (i + 1) + ': "' + postData.text.substring(0, 50) + '..."'
        );
      }
    }

    return posts;
  }

  function findActivePostForEditor(editor) {
    if (!editor) {
      return null;
    }

    // Find the main post (article)
    var articleElement = editor.closest(ARTICLE_SELECTOR);
    if (!articleElement) {
      return null;
    }

    var mainPost = extractPostFromElement(articleElement);
    if (!mainPost) {
      return null;
    }

    // Find comments container within the article
    var commentsContainer = articleElement.querySelector('.comments-comments-list');
    if (!commentsContainer) {
      // Try alternative container
      commentsContainer = articleElement.querySelector(
        '.feed-shared-update-v2__comments-container'
      );
    }

    if (commentsContainer) {
      var comments = extractCommentsWithReplies(commentsContainer);
      if (comments.length > 0) {
        mainPost.replies = comments;
        log('Extracted ' + comments.length + ' comments with replies');
      }
    }

    return mainPost;
  }

  function findActivePost() {
    var editor = findVisibleEditor();
    return findActivePostForEditor(editor);
  }

  function readPage() {
    log('Starting page read...');
    log('URL: ' + window.location.href);

    return waitForSelector(ARTICLE_SELECTOR).then(function (firstArticle) {
      if (!firstArticle) {
        warn('No articles found after waiting');
      }

      var posts = extractAllPosts();
      log('Extracted ' + posts.length + ' posts');

      var activePost = findActivePost();
      if (activePost) {
        log('Active post found');
        var editor = findVisibleEditor();
        if (editor) {
          var draftText = editor.textContent.trim();
          if (draftText) {
            activePost.currentReplyDraft = draftText;
            log('Draft text captured: ' + draftText.substring(0, 50));
          }
        }
      } else {
        log('No active post (no visible editor)');
      }

      var page = {
        site: 'linkedin.com',
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

  function insertTextToEditor(editor, text) {
    if (!editor) {
      warn('No editor provided');
      return false;
    }

    log(
      'Inserting text to specific editor: "' + text.substring(0, 50) + '..."'
    );

    try {
      editor.focus();

      var selection = window.getSelection();
      if (!selection) {
        warn('Could not get window selection');
        return false;
      }

      // Position cursor and select all content
      var range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      // Select all content
      document.execCommand('selectAll', false, undefined);

      // Prepare HTML content for multi-line
      var lines = text.split('\n');
      var htmlParts = [];
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        htmlParts.push('<p>' + (line || '<br>') + '</p>');
      }
      var htmlContent = htmlParts.join('');

      // Insert the HTML
      var success = document.execCommand('insertHTML', false, htmlContent);
      if (!success) {
        warn('Failed to insert HTML using execCommand');
        return false;
      }

      log('Reply inserted successfully');
      return true;
    } catch (error) {
      warn('Failed to insert reply:', error);
      return false;
    }
  }

  function insertReply(text) {
    log('Inserting reply (fallback): "' + text.substring(0, 50) + '..."');

    var editor = findVisibleEditor();
    if (!editor) {
      warn('Comment editor not found');
      return false;
    }

    return insertTextToEditor(editor, text);
  }

  var CONTAINER_CLASS = 'hypertweet-keyboard';

  function createKeyboardContainer(editor) {
    if (!editor) {
      return null;
    }

    // Find the comment box form and its container
    var boxForm = editor.closest('.comments-comment-box__form');
    if (!boxForm) {
      boxForm = editor.closest('.comments-comment-box');
    }
    if (!boxForm) {
      return null;
    }

    var boxContainer = boxForm.closest('.comments-comment-box--cr');
    if (!boxContainer) {
      boxContainer = boxForm;
    }

    // Check for existing container as next sibling
    if (
      boxContainer.nextSibling &&
      boxContainer.nextSibling.classList &&
      boxContainer.nextSibling.classList.contains(CONTAINER_CLASS)
    ) {
      return boxContainer.nextSibling;
    }

    var container = document.createElement('div');
    container.className = CONTAINER_CLASS;
    boxContainer.parentNode.insertBefore(container, boxContainer.nextSibling);
    log('Keyboard container inserted after comment box');
    return container;
  }

  function createReadPageForEditor(editor) {
    return function () {
      log('Starting page read for specific editor...');
      log('URL: ' + window.location.href);

      return waitForSelector(ARTICLE_SELECTOR).then(function () {
        var posts = extractAllPosts();
        log('Extracted ' + posts.length + ' posts');

        // Find active post for THIS specific editor
        var activePost = findActivePostForEditor(editor);
        if (activePost) {
          log('Active post found for editor');
          var draftText = editor.textContent.trim();
          if (draftText) {
            activePost.currentReplyDraft = draftText;
            log('Draft text captured: ' + draftText.substring(0, 50));
          }
        } else {
          log('No active post found for this editor');
        }

        return {
          site: 'linkedin.com',
          url: window.location.href,
          posts: posts,
          activePost: activePost,
        };
      });
    };
  }

  function onReplyFormRendered(callback) {
    log('Setting up reply form observer...');

    function checkAndNotify() {
      var editors = document.querySelectorAll(EDITOR_SELECTOR);
      for (var i = 0; i < editors.length; i++) {
        var editor = editors[i];
        if (editor && isElementVisible(editor)) {
          var container = createKeyboardContainer(editor);
          if (container) {
            // Create editor-specific functions using IIFE to capture reference
            var insertText = (function (targetEditor) {
              return function (text) {
                return insertTextToEditor(targetEditor, text);
              };
            })(editor);

            var readPage = (function (targetEditor) {
              return createReadPageForEditor(targetEditor);
            })(editor);

            callback(container, insertText, readPage);
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
    extractPostFromElement: extractPostFromElement,
    extractAllPosts: extractAllPosts,
    findActivePost: findActivePost,
    findVisibleEditor: findVisibleEditor,
    isElementVisible: isElementVisible,
    ARTICLE_SELECTOR: ARTICLE_SELECTOR,
    EDITOR_SELECTOR: EDITOR_SELECTOR,
  };
})();

// Quick test in console:
// window.__linkedin.readPage().then(console.log)
// window.__linkedin.insertReply("Hello!")
