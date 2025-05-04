// cross_platform/sleep.js
const ms = parseInt(process.argv[2], 10) || 1000;
setTimeout(() => {}, ms);
