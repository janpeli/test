import { FieldValues } from "react-hook-form";

export function getObjVal(obj: FieldValues, path: string) {
  try {
    return path
      .split(".")
      .reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  } catch (e) {
    return undefined;
  }
}
