"use strict";

module.exports = {
  proxy: {
    target: "http://127.0.0.1:8080",
  },
  // `listen` controls the actual socket bind; `host` only changes generated URLs.
  listen: "127.0.0.1",
  port: 3000,
  ui: false,
  open: false,
  notify: false,
  ghostMode: false,
  reloadDebounce: 250,
  files: [
    "htdocs/**/*.php",
    "htdocs/**/*.js",
    "htdocs/**/*.css",
    "htdocs/**/*.html",
    "htdocs/**/*.tpl",
    "!htdocs/includes/**",
    "!htdocs/conf/**",
  ],
  watchOptions: {
    ignoreInitial: true,
  },
};
