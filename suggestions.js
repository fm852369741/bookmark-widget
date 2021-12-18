chrome.bookmarks.getTree((bookmarksBar) => {
  const bookmarks = bookmarksBar[0].children[1].children;
  const tags = [];

  bookmarks.forEach((bookmark, idx) => {
    chrome.storage.local.get([`bookmark_${bookmark.id}`], function (tag) {
      tags[idx] = tag[`bookmark_${bookmark.id}`];

      if (idx + 1 === bookmarks.length) {
        chrome.storage.local.set(
          {
            widgetDetails: {
              bookmarks: bookmarks,
              tags: tags,
            },
          },
          function (oject) {
            Execute(oject);
          }
        );
      }
    });
  });
});

function Execute(widgetDetails) {
  let searchWrapper = document.querySelector(".search-input");
  let inputBox = document.querySelector("input");
  let suggBox = document.querySelector(".autocom-box");

  inputBox.onkeyup = (e) => {
    console.log(widgetDetails);
    if (widgetDetails.bookmarks.length === widgetDetails.tags.length) {
      const suggestions = [];
      const tags = [];
      const userInput = e.target.value;

      if (userInput) {
        widgetDetails.bookmarks.map((bookmark, index) => {
          suggestions[bookmark.title] = widgetDetails.tags[index];
          tags.push(...widgetDetails.tags[index].tags);

          if (index + 1 === widgetDetails.bookmarks.length) {
            const validSuggestionsTags = tags.filter((tag) => {
              return tag
                .toLocaleLowerCase()
                .startsWith(userInput.toLocaleLowerCase());
            });

            const titles = findMatchingBookmarks(
              suggestions,
              validSuggestionsTags
            );

            const filteredTitles = titles.filter((title) => {
              return title != undefined ? title : "";
            });

            const validBookmarks = findSelectedBookmarks(
              widgetDetails.bookmarks,
              filteredTitles
            );

            const rankings = rankBookmarks(suggestions);
            const sortedBookmarks = [];

            const filteredRankings = rankings.filter((bookmark) => {
              return bookmark != undefined ? bookmark : "";
            });

            const filteredBookmarks = validBookmarks.filter((bookmark) => {
              return bookmark != undefined ? bookmark : "";
            });

            filteredRankings.forEach(function (sortBookmark, sortIdx) {
              filteredBookmarks.forEach(function (filteredBookmarks) {
                if (sortBookmark.id === filteredBookmarks.id) {
                  sortedBookmarks.push(sortBookmark);
                }

                if (sortIdx + 1 === filteredRankings.length) {
                  const list = sortedBookmarks.flatMap((bookmark) => {
                    return `<li class="suggestion" title="${bookmark.title}" url=${bookmark.url}>${bookmark.title}</li>`;
                  });

                  suggBox.innerHTML = list.join("");
                  searchWrapper.classList.add("active");

                  const suggestionsList =
                    document.querySelectorAll(".suggestion");

                  suggestionsList.forEach((suggestionItem) => {
                    suggestionItem.addEventListener("click", (e) => {
                      const title = e.target.getAttribute("title");
                      const bookmark = suggestions[title];
                      const updatedBookmark = {};

                      bookmark.rank = parseInt(bookmark.rank) + 1;
                      updatedBookmark[`bookmark_${bookmark.id}`] = bookmark;

                      chrome.storage.local.set(updatedBookmark);
                      window.open(e.target.getAttribute("url"));
                    });
                  });
                }
              });
            });
          }
        });
      } else {
        searchWrapper.classList.remove("active");
      }
    }
  };

  function findMatchingBookmarks(suggestions, validSuggestionsTags) {
    const keys = Object.keys(suggestions);

    return keys.flatMap(function (key) {
      const tagValues = Object.values([...suggestions[key].tags]);

      return tagValues.flatMap((tagValue) => {
        if (validSuggestionsTags.includes(tagValue)) {
          return key;
        }
      });
    });
  }

  function findSelectedBookmarks(bookmarks, validTitles) {
    return validTitles.flatMap((title) => {
      return bookmarks.flatMap((bookmark) => {
        if (bookmark.title === title) {
          return bookmark;
        }
      });
    });
  }

  function rankBookmarks(bookmarks) {
    const keys = Object.keys(bookmarks);
    const dpBookmarks = [];

    keys.forEach(function (key) {
      dpBookmarks.push(bookmarks[key]);
    });

    const array = dpBookmarks.sort(function (a, b) {
      if (a["rank"] < b["rank"]) return -1;
      if (a["rank"] > b["rank"]) return 1;
      return 0;
    });

    return array.reverse();
  }
}
