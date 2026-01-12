///@ts-expect-error polyfill
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// fixes Bun standalone executable Error#message being non-writable
Object.defineProperty(Error.prototype, "message", { writable: true, configurable: true });
