---
layout: page.liquid
title: Projects | Fishy Studioz
---

### Any project that is a Roblox game will be on [our Roblox group](https://www.roblox.com/groups/5684670). Some projects will be public on [our GitHub](https://www.github.com/fishy-studioz).

{% assign ghpat = env.GHPAT %}
<script>
  // TODO: move this bullshit to a separate file
  function timeAgo(timestamp, prefix = "released ") {
    const date = new Date(timestamp);
    const now = new Date;
    const seconds = Math.floor((now - date) / 1000);
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
    const commitsSinceOhv0Release  = document.getElementById("commits-since-ohv0-release");
    const timeSinceOhv0Release  = document.getElementById("time-since-ohv0-release");
    const pat = "{{ ghpat }}";
    const headers = { "authorization": `token ${pat}` };

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
</script>

<br><br>
## Overheat
### Current development version: <b><span id="ohv0-version"></span></b>
### <b><span id="commits-since-ohv0-release"></span></b> commits since last release (<b><span id="time-since-ohv0-release"></span></b>)<br><br>
Our main project! An in-dev PvE FPS game that will be UFG's successor.<br>
Join the game's Discord server on the right side of the page or follow CharSiewGuy on Twitter for more updates!<br>
<iframe width="560" height="315" src="https://www.youtube.com/embed/F1d8Q_7BMKs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>

## [Untitled FPS Game](https://www.roblox.com/games/9541558008)
Welcome to Untitled FPS Game. This movement-based chaotic experience melds multiple mechanics together into a fluid gameplay loop where you kill, move, and kill again.<br>
The game is consistently updating (somewhat), so be sure to look out for new features.
<iframe width="560" height="315" src="https://www.youtube.com/embed/w5snscTV9Jo?si=xa40DuyVc5KQfnO5" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>
<iframe width="560" height="315" src="https://www.youtube.com/embed/-Ak9i4CH4yo?si=azyIl0sT2cSpKrqd" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>
<iframe width="560" height="315" src="https://www.youtube.com/embed/odj9vMEYlFE?si=fnFKjUosQuiQOafM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br><br><br><br>