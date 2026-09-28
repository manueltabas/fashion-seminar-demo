export {
  detectBrand,
  normalizeHost,
  registrableDomain,
  brandNameFromDomain,
  type BrandDetectionInput,
  type DetectedBrand,
} from "./detect";
export {
  addPdpWithBrand,
  getBrand,
  getPdp,
  listBrands,
  listPdps,
  mergeBrands,
  renameBrand,
  MergeError,
  type AddPdpInput,
  type AddPdpResult,
} from "./repository";
