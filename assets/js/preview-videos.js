// Plays the muted .preview-video loops only while they are on screen (they use preload="none").
(function () {
    var vids = document.querySelectorAll("video.preview-video");
    if (!vids.length) return;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if (reduce) return; // keep the poster frame only
    if (!("IntersectionObserver" in window)) { vids.forEach(play); return; }
    var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? play(e.target) : e.target.pause(); });
    }, { rootMargin: "200px 0px" });
    vids.forEach(function (v) { v.muted = true; io.observe(v); });
})();
