const browserApiContent = typeof browser !== "undefined" ? browser : chrome;

browserApiContent.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.action === "copyTweets") {
      const jsonThread = (() => {
        function getTweet(tweet) {
          const name = tweet.querySelector("[data-testid=User-Name] a");
          const isVerified = !!name.querySelector(
            "[data-testid=icon-verified]"
          );
          const profileName = name.textContent;
          const username = name.getAttribute("href").split("/").pop();
          const tweetText = tweet.querySelector(
            "[data-testid=tweetText]"
          ).textContent;
          const time = tweet.querySelector("time").getAttribute("datetime");
          const url = tweet.querySelector(`a[href*="/status/"]`).href ?? "";
          const statusID = url.split("/").pop();

          const tweetObj = {};
          tweetObj.profileName = profileName;
          if (username) {
            tweetObj.username = "@" + username;
          }
          tweetObj.isVerified = isVerified;
          tweetObj.text = tweetText;
          tweetObj.time = time;
          tweetObj.statusID = statusID;
          return tweetObj;
        }
        const [first, ...replies] = Array.from(
          document.querySelectorAll("[data-testid=tweet]")
        );
        return { status: getTweet(first), replies: replies.map(getTweet) };
      })();
      const tweets = JSON.stringify(jsonThread, null, 2);
      // Copy to clipboard
      navigator.clipboard
        .writeText(tweets)
        .then(() => console.log("Tweets copied to clipboard."))
        .catch((err) => console.error("Failed to copy: ", err));
    }
  }
);
