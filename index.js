import {
  isKeyboardDefinitionV3,
  isKeyboardDefinitionV2,
  keyboardDefinitionV3ToVIADefinitionV3,
} from "@the-via/reader";
import {
  calculatePointPosition,
  CSSVarObject,
  calculateKeyboardFrameDimensions,
  getColor,
} from "./key-utils.js";
import { readFile } from "fs/promises";
import { createSVGWindow } from "svgdom";
import { SVG, registerWindow } from "@svgdotjs/svg.js";
import { writeFileSync } from "fs";
import glob from "glob";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getDefinitionsPath() {
  return path.join(__dirname, "node_modules/via-keyboards/v3/**/*.json");
}
const definitionsPath = getDefinitionsPath();
const paths = glob.sync(definitionsPath, { absolute: true });

const readDefinition = async (path) => {
  const file = await readFile(path, "utf-8");
  const json = JSON.parse(file);
  const fileName = `${json.name}-${json.productId.toString(16)}`;
  if (isKeyboardDefinitionV3(json)) {
    const viaDefinition = keyboardDefinitionV3ToVIADefinitionV3(json);
    const { optionKeys, keys } = viaDefinition.layouts;
    const categories = Object.values(optionKeys).map((c) => Object.values(c));
    const options = categories.flatMap((category) =>
      (category[0] || []).flatMap((a) => a)
    );
    const allKeys = [...keys, ...options];
    const positions = allKeys.map(calculatePointPosition);
    const svgKeys = positions.map(([x, y], i) => {
      const key = allKeys[i];
      return {
        x,
        y,
        r: key.r,
        ei: key.ei,
        c: getColor(key.color),
        w: key.w,
        h: key.h,
      };
    });
    const frame = calculateKeyboardFrameDimensions(allKeys);
    createSVG(fileName, frame, svgKeys);
  } else if (isKeyboardDefinitionV2(json)) {
    throw new Error("V2 Definitions are not supported");
  } else {
    throw new Error("Invalid definition");
  }
};

const createSVG = (fileName, frame, keys) => {
  const window = createSVGWindow();
  const document = window.document;
  const [unitWidth, unitHeight] = [80, 80];
  // register window and document
  registerWindow(window, document);

  // create canvas
  const canvas = SVG(document.documentElement);
  const strokeWidth = 6;
  const hPadding = 10;
  const vPadding = 10;
  const [cw, ch] = [
    hPadding * 2 +
      strokeWidth * 2 +
      CSSVarObject.keyXPos * frame.width -
      CSSVarObject.keyXSpacing,
    vPadding * 2 +
      strokeWidth * 2 +
      CSSVarObject.keyYPos * frame.height -
      CSSVarObject.keyYSpacing,
  ];
  canvas.viewbox(0, 0, cw, ch);
  canvas
    .rect(cw - strokeWidth * 2, ch - strokeWidth * 2)
    .move(strokeWidth, strokeWidth)
    .fill({ color: "whitesmoke" })
    .stroke({ color: "grey", width: strokeWidth, linejoin: "round" });
  const group = canvas.group().transform({
    translateX: hPadding + strokeWidth,
    translateY: vPadding + strokeWidth,
  });
  keys.forEach((key) => {
    const [width, height] = [
      CSSVarObject.keyXPos * key.w - CSSVarObject.keyXSpacing,
      CSSVarObject.keyYPos * key.h - CSSVarObject.keyYSpacing,
    ];
    const isEncoder = key.ei !== undefined;
    const shape = isEncoder
      ? group.ellipse(width, height)
      : group.rect(width, height);
    shape
      .move(key.x - width / 2, key.y - height / 2)
      .rotate(key.r)
      .attr({ "stroke-linejoin": "round" })
      .fill({ color: key.c })
      .stroke({ color: "grey", width: 6 });
  });

  // use svg.js as normal

  // get your svg as string
  writeFileSync(
    `previews/${fileName.replace(/[\/.]|\s+/g, "-")}.svg`,
    canvas.svg()
  );
};

paths.forEach((path) => readDefinition(path));
