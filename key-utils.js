import { getBoundingBox } from "@the-via/reader";
export const CSSVarObject = {
  keyWidth: 80,
  keyXSpacing: 8,
  keyHeight: 80,
  keyYSpacing: 8,
  keyXPos: 80 + 8,
  keyYPos: 80 + 8,
};

export function calculatePointPosition({
  x = 0,
  y = 0,
  r = 0,
  rx = 0,
  ry = 0,
  w = 0,
  h = 0,
}) {
  // We express the radians in counter-clockwise form, translate the point by the origin, rotate it, then reverse the translation
  const rRadian = (r * (2 * Math.PI)) / 360;
  const cosR = Math.cos(rRadian);
  const sinR = Math.sin(rRadian);
  const originX = CSSVarObject.keyXPos * rx;
  const originY = CSSVarObject.keyYPos * ry;
  const xPos =
    CSSVarObject.keyXPos * x +
    (w * CSSVarObject.keyWidth) / 2 +
    ((w - 1) * CSSVarObject.keyXSpacing) / 2;
  const yPos =
    CSSVarObject.keyYPos * y +
    (h * CSSVarObject.keyHeight) / 2 +
    ((h - 1) * CSSVarObject.keyYSpacing) / 2;
  const transformedXPos =
    xPos * cosR - yPos * sinR - originX * cosR + originY * sinR + originX;
  const transformedYPos =
    xPos * sinR + yPos * cosR - originX * sinR - originY * cosR + originY;

  return [transformedXPos, transformedYPos];
}

export const calculateKeyboardFrameDimensions = (keys) => {
  const boundingBoxes = keys.map(getBoundingBox);
  const minX = Math.min(...boundingBoxes.map((b) => b.xStart));
  const minY = Math.min(...boundingBoxes.map((b) => b.yStart));
  const width = Math.max(...boundingBoxes.map((b) => b.xEnd)) - minX;
  const height = Math.max(...boundingBoxes.map((b) => b.yEnd)) - minY;
  return {
    width,
    height,
  };
};
