// SVG imports are transformed into React components by SVGR (see next.config.mjs).
declare module "*.svg" {
  import type { FC, SVGProps } from "react";
  const content: FC<SVGProps<SVGSVGElement>>;
  export default content;
}
