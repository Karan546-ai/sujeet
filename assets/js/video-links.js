// ==========================================================================
//  SHOWREEL / VIDEOS SECTION — apne videos yahan add karo
//  ------------------------------------------------------------------------
//  Har video ke liye ek line:  { title: "...", tag: "...", url: "..." }
//  "url" mein koi bhi link paste karo, ye sab chalte hain:
//    - YouTube    https://www.youtube.com/watch?v=XXXX  /  https://youtu.be/XXXX  /  /shorts/XXXX
//    - Google Drive https://drive.google.com/file/d/XXXX/view   (sharing: "Anyone with the link")
//    - Vimeo      https://vimeo.com/123456789
//    - Instagram  https://www.instagram.com/reel/XXXX/
//    - Direct     https://.../video.mp4
//  Pehla video bada "featured" player banta hai. Optional: thumb: "image-url" custom thumbnail ke liye.
// ==========================================================================
window.VIDEO_LINKS = [
    { title: "Bobble Head — Episode 1", tag: "AI Short-Film Series · Shelf-Life (USA)", url: "https://drive.google.com/file/d/1C1GbW5EEpo3JdH3Jhvpa97IpgOStdVqG/view" },
    { title: "Cali the Bear", tag: "AI Short Film · California", url: "https://drive.google.com/file/d/1c0-oEwpacxhd5Iw1xFNMZ3ZeCxwtwVlA/view" },
    { title: "Nissan Tekton Launch", tag: "Cinematic AI Intro Film", url: "https://drive.google.com/file/d/1842JaRLj1QVWGclRNQ5IzOQQK2nZCZXl/view" },
    { title: "MG Motor Commercial", tag: "Cinematic AI Intro Film", url: "https://drive.google.com/file/d/1JLC92Ln_RrN62oHX2Rlf2wiC8cRquFOn/view" },
    { title: "SIX6R Product Ad", tag: "AI Product Advertisement", url: "https://drive.google.com/file/d/1r0OaPRdam3BibtmDdAEJ-wOtnMrw9dZN/view" },
    { title: "Girly Pop UGC Ad", tag: "AI UGC Commercial", url: "https://drive.google.com/file/d/1uYT53d2sr_48sx70bLhPdTHj9zkCZGdE/view" },
    { title: "Gold Winner Short Film", tag: "3D · MAAC 24 FPS Next Gen", url: "https://drive.google.com/file/d/163Tj5ZhHMWuOrwPu0EhJ9PpjKxZFTel8/view" },
    { title: "Darveys", tag: "3D / CGI Commercial", url: "https://drive.google.com/file/d/1Wg5SBcevNY8MNeGHXjBztvOoL0xP48Sx/view" },
    { title: "Ganesh Chaturthi", tag: "AI Festive Brand Film", url: "https://drive.google.com/file/d/1MOeD5JihGeCHH8ZRpKvUNyJefwMyBoce/view" }
];

// Renders VIDEO_LINKS into #videoReel and plays them in the shared lightbox.
(function () {
    var list = window.VIDEO_LINKS, root = document.getElementById("videoReel");
    if (!list || !list.length || !root) return;

    // url -> { embed, open, thumb, vertical }
    function parse(url) {
        var m;
        if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)))
            return { embed: "https://www.youtube.com/embed/" + m[1] + "?autoplay=1&rel=0", open: "https://www.youtube.com/watch?v=" + m[1],
                thumb: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg", vertical: /shorts\//.test(url) };
        if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]{20,})/)))
            return { embed: "https://drive.google.com/file/d/" + m[1] + "/preview", open: "https://drive.google.com/file/d/" + m[1] + "/view",
                thumb: "assets/images/posters/" + m[1] + ".jpg", fallback: "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w1280" };
        if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
            return { embed: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1", open: "https://vimeo.com/" + m[1] };
        if ((m = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/)))
            return { embed: "https://www.instagram.com/" + (m[1] === "reels" ? "reel" : m[1]) + "/" + m[2] + "/embed", open: url, vertical: true };
        if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { embed: url, open: url, video: true };
        return { open: url };
    }

    function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

    var items = list.map(function (v) { var p = parse(v.url); p.title = v.title; p.tag = v.tag; if (v.thumb) p.thumb = v.thumb; return p; });

    function card(it, i) {
        var thumb = it.thumb ? '<img loading="lazy" alt="' + esc(it.title) + '" src="' + esc(it.thumb) + '"' + (it.fallback ? ' data-fallback="' + esc(it.fallback) + '" onerror="thumbFallback(this)">' : ' onerror="this.remove()">')
            : it.video ? '<video muted preload="metadata" src="' + esc(it.embed) + '#t=1"></video>' : "";
        return '<button type="button" class="vr-card' + (i ? "" : " vr-featured") + '" data-i="' + i + '">' +
            '<span class="vr-thumb">' + thumb +
            '<span class="wl-play"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>' +
            (i ? "" : '<span class="vr-badge">FEATURED</span>') + "</span>" +
            '<span class="vr-meta"><span class="vr-num">' + String(i + 1).padStart(2, "0") + '</span><span><span class="vr-title">' + esc(it.title) + "</span>" +
            (it.tag ? '<span class="wl-tag">' + esc(it.tag) + "</span>" : "") + "</span></span></button>";
    }
    root.querySelector(".vr-grid").innerHTML = items.map(card).join("");

    root.addEventListener("click", function (e) {
        var c = e.target.closest(".vr-card"); if (!c) return;
        var it = items[+c.dataset.i];
        if (!it.embed || !window.openVideoModal) { window.open(it.open, "_blank", "noopener"); return; }
        window.openVideoModal(it.embed, it.open, it.title, it.vertical);
    });
})();
