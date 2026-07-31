"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Meta (Facebook) Pixel. The ID is a public, browser-visible value, so it is
// exposed via NEXT_PUBLIC_ — but note that means it is inlined at BUILD time,
// not read from the environment at runtime. Changing it on the host requires a
// rebuild, not just a restart. Renders nothing when unset so local dev and
// preview builds don't pollute the client's ad data.
const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export default function FacebookPixel() {
  const pathname = usePathname();
  const mounted = useRef(false);

  useEffect(() => {
    if (!PIXEL_ID) return;
    // Meta's base snippet fires PageView once, when fbevents.js loads. In an
    // App Router SPA every later navigation is client-side — no new document,
    // so the snippet never runs again and the whole session collapses into a
    // single PageView. Re-fire per route, skipping the first pass so the
    // landing page isn't double-counted.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
