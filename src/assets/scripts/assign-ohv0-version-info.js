function timeAgo(timestamp, prefix = "released ") {
  const date = new Date(timestamp);
  const now = new Date;
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (let interval in intervals)
    if (seconds >= intervals[interval]) {
      const count = Math.floor(seconds / intervals[interval]);
      return `${prefix}${count} ${interval}${count !== 1 ? "s" : ""} ago`;
    }

  return `${prefix}${seconds} second${seconds !== 1 ? "s" : ""} ago`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const repoAPI = "https://api.github.com/repos/fishy-studioz/overheat";
  const ohv0Version = document.getElementById("ohv0-version");
  const commitsSinceOhv0Release = document.getElementById("commits-since-ohv0-release");
  const timeSinceOhv0Release = document.getElementById("time-since-ohv0-release");
  const headers = { "authorization": `token ${ghpat}` };

  const [tag] = await fetch(`${repoAPI}/tags`, { headers }).then(response => response.json());
  const tagName = tag?.name ?? "Not Found";
  ohv0Version.textContent = tagName;

  const { commit } = await fetch(`${repoAPI}/commits/${tag.commit.sha}`, { headers }).then(response => response.json());
  ohv0Version.textContent = `${tagName} (${timeAgo(commit.committer.date)})`;

  const commitsSinceRelease = await fetch(`${repoAPI}/commits?sha=master&since=${commit.committer.date}`, { headers }).then(response => response.json());
  if (commitsSinceRelease.length > 0)
    commitsSinceRelease.pop();

  const [latestCommit] = commitsSinceRelease.map(ref => ref.commit);
  commitsSinceOhv0Release.textContent = commitsSinceRelease.length;
  timeSinceOhv0Release.textContent = timeAgo(latestCommit.committer.date, "");
});