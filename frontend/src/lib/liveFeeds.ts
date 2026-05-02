export interface YouTubeChannel {
  id: string;
  name: string;
  embedUrl: string;
}

export interface TwitterAccount {
  id: string;
  name: string;
  handle: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  slug: string;
}

export const YOUTUBE_CHANNELS: YouTubeChannel[] = [
  {
    id: "geo",
    name: "Geo News",
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UC_vt34wimdCzdkrzVejwX9g",
  },
  {
    id: "ary",
    name: "ARY News",
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCMmpLL2ucRHAXbNHiCPyIyg",
  },
  {
    id: "samaa",
    name: "Samaa TV",
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCJekW1Vj5fCVEGdye_mBN6Q",
  },
  {
    id: "dawn",
    name: "Dawn News",
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCqVgC_6Z_ttgPrF9ONh1I8A",
  },
  {
    id: "express",
    name: "Express News",
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCTur7oM6mLL0rM2k0znuZpQ",
  },
  {
    id: "geo-eng",
    name: "Geo English",
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCHxszOdxcvUOOrOu3z3TwUQ",
  },
];

/** Official / widely used X handles (verified style URLs at x.com/<handle>) */
export const TWITTER_ACCOUNTS: TwitterAccount[] = [
  { id: "dawn", name: "Dawn", handle: "dawn_com" },
  { id: "govt", name: "Govt of Pakistan", handle: "GovtofPakistan" },
  { id: "tribune", name: "Express Tribune", handle: "etribune" },
  { id: "ndma", name: "NDMA Pakistan", handle: "NDMAPakistan" },
  { id: "geo", name: "Geo News", handle: "geonews" },
];

export const FACEBOOK_PAGES: FacebookPage[] = [
  { id: "dawn", name: "Dawn News", slug: "dawnnewspakistan" },
  { id: "geo", name: "Geo News", slug: "geonews" },
  { id: "ary", name: "ARY News", slug: "arynews" },
  { id: "samaa", name: "Samaa TV", slug: "samaatv" },
  { id: "express", name: "Express Tribune", slug: "expresstribune" },
];

export function fbPagePluginUrl(slug: string, width = 280, height = 400): string {
  const href = encodeURIComponent(`https://www.facebook.com/${slug}`);
  return `https://www.facebook.com/plugins/page.php?href=${href}&tabs=timeline&width=${width}&height=${height}&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false&appId`;
}
