const { config } = require("dotenv");

config();

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("ghpat", process.env.GHPAT);
  eleventyConfig.addFilter("reverse", value => value.split("").reverse().join(""));
  eleventyConfig.addFilter("uppercase", value => value.toUpperCase());
  eleventyConfig.addFilter("titlecase", value => value.toLowerCase().replace(/(^|\s)\S/g));
  eleventyConfig.addFilter("slug", value => value.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
  eleventyConfig.addFilter("limit", (arr, limit) => arr.slice(0, limit));
  eleventyConfig.addFilter("random", arr => arr[Math.floor(Math.random() * arr.length)]);
  eleventyConfig.setBrowserSyncConfig({
    open: true
  });

  return {
    dir: {
      input: "src",
      output: "_site\\src",
      includes: "includes"
    },
    templateFormats: ["html", "md", "liquid"],
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",
    passthroughFileCopy: true,
    pathPrefix: "/"
  };
};
