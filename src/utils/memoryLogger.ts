export const logMemoryUsage = () => {
  const memory = process.memoryUsage();
  console.log(
    `Memory Usage: RSS ${(memory.rss / 1024 / 1024).toFixed(2)} MB, ` +
    `Heap Total ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB, ` +
    `Heap Used ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB, ` +
    `External ${(memory.external / 1024 / 1024).toFixed(2)} MB`
  );
};
