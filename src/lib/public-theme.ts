import type { Viewport } from "next";

/**
 * Browser chrome for the public pages, which are black (the `theme-black`
 * scope in globals.css). The root layout's #ffffff is right for the dashboard
 * behind the login and wrong here: on a phone it painted a white bar above a
 * black page. Each public page and layout exports this as its `viewport`;
 * Next merges it over the root's, so width and scale still come from there.
 */
export const PUBLIC_VIEWPORT: Viewport = { themeColor: "#000000" };
