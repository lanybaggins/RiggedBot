export default (message) => {
  const now = new Date();
  const isoString = now.toISOString();
  console.log(`${isoString} - ${message}`);
}
