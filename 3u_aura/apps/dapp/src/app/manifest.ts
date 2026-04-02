import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Goldmint GM",
    short_name: "Goldmint GM",
    description: "Goldmint GM DApp for daily check-in, founder card access, team rewards, and claims.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7efe2",
    theme_color: "#9b6e2f",
    icons: [
      {
        src: "/gm-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/gm-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
