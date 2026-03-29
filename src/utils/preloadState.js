// src/utils/preloadState.js

export function setPreloaded(value) {
  sessionStorage.setItem("hasPreloaded", value ? "true" : "false");
}

export function hasPreloadedOnce() {
  return sessionStorage.getItem("hasPreloaded") === "true";
}
