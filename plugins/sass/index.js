module.exports = {
  onPreBuild: async ({ utils: { run } }) =>
    await run.command("node-sass _includes/sass/style.sass > src/css/style.css")
};
