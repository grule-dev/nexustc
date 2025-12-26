import { useEffect, useState } from "react";

export function useAdblockDetector() {
  const [adblockDetected, setAdblockDetected] = useState(false);

  useEffect(() => {
    // Method 1: DOM bait element
    const bait = document.createElement("div");
    bait.className = "ads banner ad-unit ad-container sponsored";
    bait.style.position = "absolute";
    bait.style.height = "1px";
    bait.style.width = "1px";
    bait.style.top = "-1000px";
    document.body.appendChild(bait);

    const isBlocked =
      window.getComputedStyle(bait).display === "none" ||
      window.getComputedStyle(bait).visibility === "hidden" ||
      bait.offsetParent === null;

    document.body.removeChild(bait);

    if (isBlocked) {
      setAdblockDetected(true);
      return;
    }

    if (!document.getElementById("38ml23f9joasl34")) {
      setAdblockDetected(true);
    }
  }, []);

  return adblockDetected;
}
