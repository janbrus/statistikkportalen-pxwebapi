// When bumping this version, also update all ?v= query strings in index.html to match
// (the script tags and the three CSS links). This ensures browsers re-fetch all JS and
// CSS files and avoids "X is not a function" errors, or new markup with old styles,
// caused by a mix of cached old files and freshly served new ones.
const VERSION = 'v1.5.0';
