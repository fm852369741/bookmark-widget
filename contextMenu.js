const contextMenuItem = {
  title: "Add Bookmark",
  contexts: ["all"],
  id: "mjubpwfexdjixcvyofrbniecaxyeqcnjqqkripdsumcgoegvefaqyngbsxdvdsla",
};

chrome.contextMenus.create(contextMenuItem);

chrome.contextMenus.onClicked.addListener(function (clickedItem) {
  clickedItem.menuItemId = contextMenuItem.id ? AddBookmark() : null;
});

function AddBookmark() {
  chrome.tabs.query({ active: true }, function (tab) {
    const bookmarkObject = {
      title: tab[0].title,
      url: tab[0].url,
    };

    chrome.bookmarks.getTree((bookmarksBar) => {
      const bookmarkExists = isBookmarkAlreadyAdded(
        bookmarksBar,
        bookmarkObject.title
      );

      if (!bookmarkExists) {
        const tags = prompt("Enter tags seperated with commas:").split(",");
        const tagsObject = {};

        chrome.bookmarks.create(bookmarkObject, function (bookmark) {
          tagsObject[`bookmark_${bookmark.id}`] = {
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            tags: tags,
            rank: 0,
          };

          setBookmarkTags(tagsObject);
        });
      }
    });
  });
}

function setBookmarkTags(tagsObject) {
  chrome.storage.local.set(tagsObject);
}

function isBookmarkAlreadyAdded(bookmarksBar, title) {
  const bookmarks = bookmarksBar[0].children[1].children;

  return bookmarks
    .flatMap((bookmark) => {
      if (bookmark.title === title) {
        return true;
      }
    })
    .indexOf(true) === -1
    ? false
    : true;
}

chrome.bookmarks.getTree((bookmarksBar) => {
  const bookmarks = bookmarksBar[0].children[1].children;
  const tags = [];

  bookmarks.forEach((bookmark, idx) => {
    chrome.storage.local.get([`bookmark_${bookmark.id}`], function (tag) {
      tags[idx] = tag[`bookmark_${bookmark.id}`];

      if (idx + 1 === bookmarks.length) {
        chrome.storage.local.set({
          widgetDetails: {
            bookmarks: bookmarks,
            tags: tags,
          },
        });
      }
    });
  });
});
