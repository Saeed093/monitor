"use client";

import { useState, useEffect, useRef } from "react";
import {
  YOUTUBE_CHANNELS,
  TWITTER_ACCOUNTS,
  FACEBOOK_PAGES,
  fbPagePluginUrl,
} from "@/lib/liveFeeds";

export default function MediaFeedsPanel() {
  const [ytIdx, setYtIdx] = useState(0);
  const [twIdx, setTwIdx] = useState(0);
  const [fbIdx, setFbIdx] = useState(0);
  const [twitterReady, setTwitterReady] = useState(false);
  const twitterRef = useRef<HTMLDivElement>(null);

  const tw = TWITTER_ACCOUNTS[twIdx];

  useEffect(() => {
    if (document.getElementById("twitter-wjs")) {
      if (window.twttr?.widgets) setTwitterReady(true);
      return;
    }
    const s = document.createElement("script");
    s.id = "twitter-wjs";
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.onload = () => setTwitterReady(true);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!twitterReady || !twitterRef.current) return;
    const el = twitterRef.current;
    const screenName = tw.handle;
    el.innerHTML = "";

    const w = window.twttr?.widgets;
    if (!w?.createTimeline) {
      el.innerHTML = `<p class="p-2 text-xs text-muted-foreground">X widget failed to load. <a class="text-primary underline" href="https://x.com/${screenName}" target="_blank" rel="noreferrer">Open @${screenName}</a></p>`;
      return;
    }

    w.createTimeline(
      { sourceType: "profile", screenName },
      el,
      {
        theme: "dark",
        chrome: "noheader nofooter noborders transparent",
        height: 340,
        dnt: true,
      }
    ).catch(() => {
      el.innerHTML = `<p class="p-2 text-xs text-muted-foreground">Could not embed this timeline (blocked network or X rate limit). <a class="text-primary underline" href="https://x.com/${screenName}" target="_blank" rel="noreferrer">Open @${screenName} in browser</a></p>`;
    });
  }, [twitterReady, twIdx, tw.handle]);

  const yt = YOUTUBE_CHANNELS[ytIdx];
  const fb = FACEBOOK_PAGES[fbIdx];

  const selectClasses =
    "h-6 px-1 text-[11px] bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer";

  return (
    <div className="flex flex-col h-full w-[300px] shrink-0 bg-card border-r border-border overflow-hidden">
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Live feeds
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium text-foreground">YouTube Live</h3>
            <select
              value={ytIdx}
              onChange={(e) => setYtIdx(Number(e.target.value))}
              className={selectClasses}
            >
              {YOUTUBE_CHANNELS.map((ch, i) => (
                <option key={ch.id} value={i}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="aspect-video w-full rounded-md overflow-hidden border border-border bg-black">
            <iframe
              key={yt.id}
              className="w-full h-full"
              src={yt.embedUrl}
              title={`${yt.name} live stream`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
            If &quot;offline&quot;, the channel is not streaming right now.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium text-foreground">X (Twitter)</h3>
            <select
              value={twIdx}
              onChange={(e) => setTwIdx(Number(e.target.value))}
              className={selectClasses}
            >
              {TWITTER_ACCOUNTS.map((a, i) => (
                <option key={a.id} value={i}>
                  @{a.handle}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1.5 leading-snug">
            This panel does <span className="text-foreground/90">not</span> use your API
            key — it embeds the public web widget. The key is only for &quot;Ingest
            Feeds&quot;. If this stays blank, your network may block X, or the widget
            is rate-limited.
          </p>
          <div
            ref={twitterRef}
            className="min-h-[340px] rounded-md border border-border bg-muted/30 p-1 overflow-hidden"
          >
            {!twitterReady ? (
              <p className="p-2 text-xs text-muted-foreground">Loading X widget…</p>
            ) : null}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium text-foreground">Facebook</h3>
            <select
              value={fbIdx}
              onChange={(e) => setFbIdx(Number(e.target.value))}
              className={selectClasses}
            >
              {FACEBOOK_PAGES.map((p, i) => (
                <option key={p.id} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-md border border-border overflow-hidden bg-muted/20">
            <iframe
              key={fb.slug}
              src={fbPagePluginUrl(fb.slug)}
              title={`${fb.name} Facebook feed`}
              className="w-full border-0"
              height={400}
              scrolling="no"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
