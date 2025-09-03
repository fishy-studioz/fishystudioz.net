document.addEventListener("DOMContentLoaded", function() {
  const playBtn = document.getElementById("playBtn");
  const videoOverlay = document.getElementById("videoOverlay");
  const ytplayer = document.getElementById("ytplayer");
  const closeVideo = document.getElementById("closeVideo");

  playBtn.addEventListener("click", function() {
    // Animate play arrow to circles (GSAP example)
    gsap.to(playBtn.querySelector("polygon"), {
      duration: 0.4,
      opacity: 0,
      scale: 0.5,
      transformOrigin: "center",
      onComplete: () => {
        // Animate circle to center and expand
        gsap.to(playBtn.querySelector("circle"), {
          duration: 0.5,
          scale: 1.5,
          transformOrigin: "center",
          opacity: 0,
          onComplete: () => {
            videoOverlay.style.display = "flex";
            ytplayer.src = "https://www.youtube.com/embed/wP9TVDIVUwI?autoplay=1";
          }
        });
      }
    });
  });

  closeVideo.addEventListener("click", function() {
    videoOverlay.style.display = "none";
    ytplayer.src = "";
    // Reset play button animation
    gsap.set(playBtn.querySelector("polygon"), {opacity: 1, scale: 1});
    gsap.set(playBtn.querySelector("circle"), {opacity: 0.8, scale: 1});
  });
});