// Syncs the public Google Drive portfolio folder into assets/js/work-data.js.
// Every subfolder of the root is a category; videos inside it (and its subfolders) become cards,
// newest first. A poster frame is generated for each new video (needs ffmpeg on PATH or $FFMPEG).
// Runs hourly from .github/workflows/sync-drive.yml; can also be run locally: node scripts/sync-drive.mjs
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const ROOT = "1fooEe5ArRjdA7RegVuvokmxkLJLbi41o";
const DATA = "assets/js/work-data.js";
const META = "assets/data/drive-meta.json";
const POSTERS = "assets/images/posters";
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|avi)$/i;
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function loadOld() {
    try {
        const window = {};
        new Function("window", fs.readFileSync(DATA, "utf8"))(window);
        return window.WORK_DATA || [];
    } catch { return []; }
}
function loadMeta() { try { return JSON.parse(fs.readFileSync(META, "utf8")); } catch { return {}; } }

const decode = s => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const iso = d => d.toISOString().slice(0, 10);

// "10:32 AM" (today), "Jul 14" (this year), "Jul 14, 2025"
function parseDate(s, now) {
    s = s.trim();
    if (/^\d{1,2}:\d{2}/.test(s)) return iso(now);
    const m = s.match(/^([A-Z][a-z]{2}) (\d{1,2})(?:, (\d{4}))?$/);
    if (!m || !(m[1] in MONTHS)) return null;
    let d = new Date(Date.UTC(m[3] ? +m[3] : now.getUTCFullYear(), MONTHS[m[1]], +m[2]));
    if (!m[3] && d > now) d.setUTCFullYear(d.getUTCFullYear() - 1);
    return iso(d);
}

async function listFolder(id) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`);
        if (res.ok) {
            const html = await res.text();
            // one chunk per entry, so a field missing from one entry can't bleed into the next
            return html.split('<div class="flip-entry" id="entry-').slice(1).map(chunk => {
                const get = re => (chunk.match(re) || [])[1] || "";
                return {
                    id: get(/^([\w-]+)"/),
                    folder: /href="[^"]*\/drive\/folders\//.test(chunk),
                    icon: get(/flip-entry-list-icon"><img src="([^"]*)"/),
                    title: decode(get(/flip-entry-title">([^<]*)</)),
                    modified: get(/flip-entry-last-modified"><div>([^<]*)</)
                };
            }).filter(e => e.id);
        }
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
    throw new Error("Could not list folder " + id);
}

async function walk(id, tag, now, out) {
    for (const e of await listFolder(id)) {
        if (e.folder) await walk(e.id, e.title, now, out);
        else if (e.icon.includes("/type/video/") || VIDEO_EXT.test(e.title))
            out.push({ id: e.id, title: e.title.replace(VIDEO_EXT, "").replace(/^Copy of /i, "").replace(/_/g, " ").trim(), tag, date: parseDate(e.modified, now) });
    }
    return out;
}

const titleCase = s => s.toLowerCase().replace(/(^|[\s+/-])(\w)/g, (a, b, c) => b + c.toUpperCase()).replace(/\b(Ai|3d|Cgi|Ugc)\b/g, w => w.toUpperCase());

function makePoster(id) {
    const url = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
    const probe = spawnSync(FFMPEG, ["-i", url], { encoding: "utf8", timeout: 120000 });
    const m = (probe.stderr || "").match(/Duration: (\d+):(\d+):([\d.]+)/);
    if (!m) return false;
    const dur = +m[1] * 3600 + +m[2] * 60 + +m[3];
    const out = `${POSTERS}/${id}.jpg`;
    spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-ss", String(dur * 0.35), "-i", url, "-frames:v", "1",
        "-vf", "scale=640:640:force_original_aspect_ratio=decrease", "-q:v", "6", out], { timeout: 120000 });
    return fs.existsSync(out);
}

async function main() {
    const now = new Date();
    const old = loadOld(), meta = loadMeta();
    const oldByFolder = Object.fromEntries(old.map(c => [c.folder, c]));
    const order = old.map(c => c.folder);

    const roots = (await listFolder(ROOT)).filter(e => e.folder);
    if (!roots.length) throw new Error("Root folder listing is empty; refusing to overwrite data");
    roots.sort((a, b) => ((order.indexOf(a.id) + 1) || 999) - ((order.indexOf(b.id) + 1) || 999));

    const data = [];
    for (const f of roots) {
        const prev = oldByFolder[f.id];
        let items;
        try { items = await walk(f.id, "", now, []); }
        catch (e) { console.warn(e.message); if (prev) data.push(prev); continue; }
        const prevOrder = prev ? prev.items.map(i => i[1]) : [];
        for (const it of items) {
            meta[it.id] = meta[it.id] || { first: iso(now) };
            it.date = it.date || meta[it.id].first;
        }
        items.sort((a, b) => b.date.localeCompare(a.date) || prevOrder.indexOf(a.id) - prevOrder.indexOf(b.id));
        data.push({
            name: prev ? prev.name : titleCase(f.title),
            folder: f.id,
            items: items.map(it => [it.title, it.id, it.tag && it.tag !== f.title ? it.tag : "", it.date])
        });
    }

    fs.mkdirSync(POSTERS, { recursive: true });
    const ids = new Set(data.flatMap(c => c.items.map(i => i[1])));
    let made = 0;
    for (const id of ids) {
        if (fs.existsSync(`${POSTERS}/${id}.jpg`) || meta[id]?.noPoster) continue;
        if (makePoster(id)) made++; else meta[id].noPoster = true;
    }

    const js = "// Generated by scripts/sync-drive.mjs from Google Drive folder " + ROOT + " — [title, fileId, subfolder, date]\n" +
        "window.WORK_DATA=" + JSON.stringify(data) + ";\n";
    fs.mkdirSync("assets/data", { recursive: true });
    fs.writeFileSync(META, JSON.stringify(meta, null, 1) + "\n");
    if (!fs.existsSync(DATA) || fs.readFileSync(DATA, "utf8") !== js) fs.writeFileSync(DATA, js);
    console.log(`${data.length} categories, ${ids.size} videos, ${made} new posters`);
}

main().catch(e => { console.error(e); process.exit(1); });
