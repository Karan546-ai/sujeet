// Shared lightbox: window.openVideoModal(embedUrl, openUrl, title, vertical)
// (Drive blocks direct mp4 hotlinking with 403, so its preview player is the only option)
(function () {
    var modal = document.getElementById("wlModal");
    if (!modal) return;
    var frame = modal.querySelector("iframe"), mTitle = modal.querySelector(".wl-modal-title"),
        mOpen = modal.querySelector(".wl-modal-open"), box = modal.querySelector(".wl-modal-box");
    window.openVideoModal = function (src, href, title, vertical) {
        frame.src = src;
        mOpen.href = href || src;
        mOpen.textContent = /drive\.google/.test(href) ? "Open in Drive ↗" : "Open original ↗";
        mTitle.textContent = title || "";
        box.classList.toggle("vertical", !!vertical);
        modal.classList.add("open"); document.body.style.overflow = "hidden";
    };
    function close() { modal.classList.remove("open"); frame.src = "about:blank"; document.body.style.overflow = ""; }
    modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest(".wl-close")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
})();

// Local poster frames live in assets/images/posters/<driveId>.jpg; fall back to Drive's own thumbnail, then to the empty card.
window.thumbFallback = function (img) {
    var f = img.getAttribute("data-fallback");
    if (f) { img.removeAttribute("data-fallback"); img.src = f; } else img.remove();
};

// Work library: renders every Drive video from window.WORK_DATA with filters + lightbox player.
(function () {
    var data = window.WORK_DATA, root = document.getElementById("workLibrary");
    if (!data || !root) return;

    var NOTES = {
        "Best Work": "Hand-picked highlights across AI films, CGI, motion graphics and shoot-to-edit projects.",
        "AI Work": "Generative AI films, CGI ads, AI avatars, festival campaigns and episodic short films for India, UAE & US clients.",
        "Motion Graphics": "Kinetic typography and animated brand reels for Glocal, Digicots and Head Field hiring campaigns.",
        "3D Work": "3D product renders, commercials and an international gold-winning short film.",
        "Video Editing": "Event films, corporate videos and brand edits for RK Steel, Aadhiti Industries, Soho Club and more.",
        "Shoot + Edit": "Shot on location and edited end-to-end: realtor reels, hiring events and action pieces.",
        "Latest": "The newest uploads. This list updates automatically whenever new work lands in Google Drive."
    };
    var NEW_DAYS = 30, today = Date.now();
    function isNew(it) { return it[3] && (today - Date.parse(it[3])) / 864e5 <= NEW_DAYS; }
    var PAGE = 12, cat = 0, shown = PAGE;
    var grid = root.querySelector(".wl-grid"), tabs = root.querySelector(".wl-tabs"),
        note = root.querySelector(".wl-note"), more = root.querySelector(".wl-more"),
        folder = root.querySelector(".wl-folder"), stats = root.querySelector(".wl-stats");

    // Stats: unique videos (same file name appears in several folders)
    var uniq = {}, ai = {};
    data.forEach(function (c) { c.items.forEach(function (i) { uniq[i[0].toLowerCase()] = 1; if (c.name === "AI Work") ai[i[0].toLowerCase()] = 1; }); });
    var total = Object.keys(uniq).length;
    stats.innerHTML = [
        [total + "+", "Projects in the library"],
        [data.length, "Creative disciplines"],
        [Object.keys(ai).length + "+", "AI-generated films"],
        ["3", "Countries served"]
    ].map(function (s) { return '<div class="wl-stat"><span class="wl-stat-num">' + s[0] + '</span><span class="wl-stat-label">' + s[1] + "</span></div>"; }).join("");

    // "Latest" tab: newest videos across every folder (same title in several folders counts once)
    var seen = {}, latest = data.reduce(function (a, c) { return a.concat(c.items); }, [])
        .filter(function (i) { return i[3]; })
        .sort(function (a, b) { return b[3] < a[3] ? -1 : b[3] > a[3] ? 1 : 0; })
        .filter(function (i) { var k = i[0].toLowerCase(); return seen[k] ? false : (seen[k] = 1); })
        .slice(0, 24);
    if (latest.length) data = [{ name: "Latest", folder: "1fooEe5ArRjdA7RegVuvokmxkLJLbi41o", items: latest }].concat(data);

    tabs.innerHTML = data.map(function (c, i) {
        return '<button type="button" class="wl-tab' + (i ? "" : " active") + '" data-i="' + i + '">' + c.name + "<sup>" + c.items.length + "</sup></button>";
    }).join("");

    function esc(s) { return s.replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }

    function card(it, n) {
        return '<button type="button" class="wl-card" data-id="' + it[1] + '" data-title="' + esc(it[0]) + '" style="--d:' + (n % PAGE) * 50 + 'ms">' +
            '<span class="wl-thumb"><img loading="lazy" alt="' + esc(it[0]) + '" src="assets/images/posters/' + it[1] + '.jpg" data-fallback="https://drive.google.com/thumbnail?id=' + it[1] + '&sz=w640" onerror="thumbFallback(this)">' +
            (isNew(it) ? '<span class="wl-new">NEW</span>' : "") +
            '<span class="wl-play"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span></span>' +
            '<span class="wl-meta"><span class="wl-title">' + esc(it[0]) + "</span>" +
            (it[2] ? '<span class="wl-tag">' + esc(it[2]) + "</span>" : "") + "</span></button>";
    }

    function render() {
        var c = data[cat];
        note.textContent = NOTES[c.name] || "";
        folder.href = "https://drive.google.com/drive/folders/" + c.folder;
        grid.innerHTML = c.items.slice(0, shown).map(card).join("");
        more.hidden = shown >= c.items.length;
        more.textContent = "Load more (" + (c.items.length - shown) + ")";
        observe();
    }

    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -40px 0px" }) : null;
    function observe() { grid.querySelectorAll(".wl-card:not(.in)").forEach(function (el) { io ? io.observe(el) : el.classList.add("in"); }); }

    tabs.addEventListener("click", function (e) {
        var b = e.target.closest(".wl-tab"); if (!b) return;
        tabs.querySelector(".active").classList.remove("active"); b.classList.add("active");
        cat = +b.dataset.i; shown = PAGE; render();
    });
    more.addEventListener("click", function () { shown += PAGE; render(); });

    grid.addEventListener("click", function (e) {
        var c = e.target.closest(".wl-card"); if (!c) return;
        window.openVideoModal("https://drive.google.com/file/d/" + c.dataset.id + "/preview",
            "https://drive.google.com/file/d/" + c.dataset.id + "/view", c.dataset.title);
    });

    render();
})();
