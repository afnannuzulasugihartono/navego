// @last-edited: 2026-11-27 UTC+7.
// @title: site-assets - types for the two real proof screenshots the landing hero imports.
// @state: Vite turns each imported PNG or JPG into a URL string in the strict site build.
// @dependencies: none.

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}
