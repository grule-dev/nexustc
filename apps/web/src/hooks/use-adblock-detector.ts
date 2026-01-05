import { useEffect, useState } from "react";

type AdblockDetectorState = {
  detected: boolean;
  checked: boolean;
};

declare global {
  type WindowWithAd = Window & { adLoaded?: boolean };
}

const DETECTION_THRESHOLD = 1;

function checkDomBait(): Promise<boolean> {
  return new Promise((resolve) => {
    const bait = document.createElement("div");
    bait.className =
      "ads ad adsbox ad-unit ad-container ad-wrapper sponsored advertisement";
    bait.setAttribute("data-ad-slot", "1234567890");
    bait.setAttribute("data-ad-format", "auto");
    bait.id = "ad-banner-top";
    bait.innerHTML = "&nbsp;";
    bait.style.cssText =
      "position:absolute;top:-1000px;left:-1000px;height:1px;width:1px;";
    document.body.appendChild(bait);

    requestAnimationFrame(() => {
      const style = window.getComputedStyle(bait);
      const isBlocked =
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0" ||
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0 ||
        bait.offsetParent === null;

      document.body.removeChild(bait);
      resolve(isBlocked);
    });
  });
}

function checkBaitScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(true), 3000);

    const script = document.createElement("script");
    script.src = "/oncc-adbanner.js";
    script.onerror = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    script.onload = () => {
      clearTimeout(timeout);
      setTimeout(() => {
        const markerExists = document.getElementById("38ml23f9joasl34");
        const win = window as WindowWithAd;
        const adLoadedSuccessfully =
          win.adLoaded === true && markerExists !== null;
        resolve(!adLoadedSuccessfully);
      }, 100);
    };
    document.body.appendChild(script);
  });
}

async function checkFetchBlocking(): Promise<boolean> {
  try {
    const response = await fetch("/ads/banner.gif", {
      method: "HEAD",
      cache: "no-store",
    });
    return !response.ok;
  } catch {
    return true;
  }
}

function checkCssInjection(): Promise<boolean> {
  return new Promise((resolve) => {
    const style = document.createElement("style");
    style.textContent = ".adsbox-test { height: 10px !important; }";
    document.head.appendChild(style);

    const testDiv = document.createElement("div");
    testDiv.className = "adsbox adsbox-test";
    testDiv.style.height = "10px";
    testDiv.style.position = "absolute";
    testDiv.style.top = "-1000px";
    document.body.appendChild(testDiv);

    requestAnimationFrame(() => {
      const height = testDiv.offsetHeight;
      document.body.removeChild(testDiv);
      document.head.removeChild(style);
      resolve(height === 0);
    });
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

export function useAdblockDetector() {
  const [state, setState] = useState<AdblockDetectorState>({
    detected: false,
    checked: false,
  });

  useEffect(() => {
    let mounted = true;

    const runDetection = async () => {
      const results = await Promise.all([
        withTimeout(checkDomBait(), 3000, false),
        withTimeout(checkBaitScript(), 5000, false),
        withTimeout(checkFetchBlocking(), 3000, false),
        withTimeout(checkCssInjection(), 3000, false),
      ]);

      if (!mounted) {
        return;
      }

      const positiveCount = results.filter(Boolean).length;
      const detected = positiveCount >= DETECTION_THRESHOLD;

      console.log(results);

      setState({ detected, checked: true });
    };

    runDetection();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
