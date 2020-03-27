export const formatUserNamesToLink = text => {
    const regex = /@\[([^\]]+)\]/gi;
    // Find usernames with a regular expression. They all start with '[@' and end with ']'
    const usernames = text && text.match(regex);
    if (usernames) {
      for (let i = 0; i < usernames.length; i++) {
        // Strip off the first two characters: '@['
        let username = usernames[i].substring(2, usernames[i].length);
        // Strip off the last character
        username = username.substring(0, username.length - 1);
        text = text.replace(
          usernames[i],
          '<a class="pointer blue-grey b underline" href="/users/' +
            username +
            '">' +
            username +
            '</a>',
        );
      }
    }
    return text;
  };