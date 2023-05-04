module.exports = {
  onPreBuild: async ({ utils: { run } }) =>
    await run.command("node-sass src/include/sass/style.sass > src/css/style.css")
};
