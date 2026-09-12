"""Pull the featured clips down and transcode them into small looping files.

    python scripts/fetch-clip-videos.py            # the featured 12
    python scripts/fetch-clip-videos.py --dry      # report only

Output lands in public/videos/<externalId>.mp4 and is served straight off
Vercel's CDN with the rest of the site — no blob store, no token, no second
service to keep alive. That only works because the files are made small on
purpose; see below.

── Rights ───────────────────────────────────────────────────────────────
These are creators' videos. They are re-hosted here on the owner's explicit
statement that the clipper terms grant reuse of submitted clips. If that ever
stops being true, delete public/videos and revert the wall to thumbnails — the
component falls back on its own when a file is missing.

── Why transcode rather than ship what TikTok serves ────────────────────
A source clip is 720x1280 and several megabytes. Twelve of those autoplaying
on a homepage is tens of megabytes on first paint, a mobile battery complaint,
and a Lighthouse score nobody wants to discuss. So each one is cut to a few
seconds, halved in resolution, stripped of audio entirely — the belt is muted
and always will be, so the audio track is pure weight — and encoded for the
web. The target is a couple of hundred kilobytes apiece.

Audio removal is also the conservative choice on rights: the music on these
posts is licensed separately from the video.

── TikTok blocks plain downloads ────────────────────────────────────────
A bare yt-dlp call gets "Unexpected response from webpage request". It needs
--impersonate, which needs curl_cffi installed. Both are dependencies of this
script rather than of the site, which is why they live here and not in
package.json.
"""
import json
import os
import subprocess
import sys

import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
DASH = os.path.dirname(HERE)
OUT_DIR = os.path.join(DASH, "public", "videos")
WORK = os.path.join(os.environ.get("TEMP", "/tmp"), "clip-video-work")

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
YTDLP = os.path.join(os.path.dirname(sys.executable), "Scripts", "yt-dlp.exe")
if not os.path.exists(YTDLP):
    YTDLP = "yt-dlp"

# Small enough that twelve can autoplay without anyone noticing the bandwidth.
SECONDS = 5
HEIGHT = 640          # from 1280; still sharp in a 150px-wide phone frame
CRF = "30"            # visually fine at this size, roughly a third the bytes

DRY = "--dry" in sys.argv


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=600)


def main():
    with open(os.path.join(HERE, "featured.tsv"), encoding="utf-8") as fh:
        rows = [line.rstrip("\n").split("\t") for line in fh if line.strip()]
    print(f"  {len(rows)} featured clip(s)")
    if DRY:
        for external_id, views, url in rows:
            print(f"    {external_id:>6}  {int(views):>10,}  {url}")
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(WORK, exist_ok=True)
    ok = failed = 0

    for external_id, views, url in rows:
        final = os.path.join(OUT_DIR, f"{external_id}.mp4")
        if os.path.exists(final):
            print(f"    {external_id:>6}  already have it")
            ok += 1
            continue

        raw = os.path.join(WORK, f"{external_id}.src.mp4")
        got = run([YTDLP, "--quiet", "--no-warnings", "--impersonate", "chrome",
                   "-f", "mp4", "-o", raw, url])
        if got.returncode != 0 or not os.path.exists(raw):
            print(f"    {external_id:>6}  DOWNLOAD FAILED  {got.stderr.strip()[:90]}")
            failed += 1
            continue

        # -an drops audio outright. -movflags +faststart puts the index at the
        # front so the browser can start playing before the file has arrived.
        enc = run([FFMPEG, "-y", "-loglevel", "error", "-i", raw,
                   "-t", str(SECONDS), "-an",
                   "-vf", f"scale=-2:{HEIGHT}",
                   "-c:v", "libx264", "-preset", "slow", "-crf", CRF,
                   "-pix_fmt", "yuv420p", "-movflags", "+faststart", final])
        if enc.returncode != 0 or not os.path.exists(final):
            print(f"    {external_id:>6}  ENCODE FAILED  {enc.stderr.strip()[:90]}")
            failed += 1
            continue

        src_mb = os.path.getsize(raw) / 1e6
        out_kb = os.path.getsize(final) / 1e3
        print(f"    {external_id:>6}  {src_mb:5.1f}MB -> {out_kb:6.0f}KB")
        ok += 1

    total = sum(
        os.path.getsize(os.path.join(OUT_DIR, f))
        for f in os.listdir(OUT_DIR) if f.endswith(".mp4")
    )
    print(f"\n  done: {ok} ok, {failed} failed  ·  public/videos totals {total/1e6:.1f}MB")


main()
