const nunjucks = require("nunjucks");
const nunjucksDate = require("nunjucks-date");

nunjucksDate.setDefaultFormat("YYYY");
module.exports = function(eleventyConfig) {
  eleventyConfig.setLibrary("njk", nunjucks.configure("views"));
  eleventyConfig.addNunjucksFilter("date", nunjucksDate);
};
