// Lets a test read a stylesheet as text through Vite, without giving library code Node types.
declare module "*.css?raw" {
  const content: string;
  export default content;
}
