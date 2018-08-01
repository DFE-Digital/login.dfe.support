const { tidyIndexes } = require('./../src/app/tidyIndexes');

tidyIndexes().then(() => {
  console.info('done');
  process.exit();
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
