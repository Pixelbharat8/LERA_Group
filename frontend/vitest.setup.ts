import "@testing-library/jest-dom";

// jsdom doesn't implement layout methods like scrollIntoView; stub it so components
// that auto-scroll (e.g. chat threads) don't crash under test.
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
