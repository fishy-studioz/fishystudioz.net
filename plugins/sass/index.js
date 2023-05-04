module.exports = {
  onPreBuild: async ({ utils: { run } }) =>
    await run.command("node-sass src/site/include/sass/style.sass > src/site/css/style.css")
};
