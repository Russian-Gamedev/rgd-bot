///@ts-expect-error polyfill
BigInt.prototype.toJSON = function () {
  return this.toString();
};
