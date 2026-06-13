import { buildCenterFilterUrl } from "./center-filter";

/** JWT centre scope for academy/payment list APIs that accept {@code ?centerId=}. */
export type CenterListScope = {
  centerId: string | null;
  shouldFilterByCenter: boolean;
};

export function scopedListUrl(path: string, scope: CenterListScope): string {
  return buildCenterFilterUrl(path, scope.shouldFilterByCenter ? scope.centerId : null);
}
