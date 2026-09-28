export { detectBotBlock, fetchPdpPage } from "./fetch";
export type { FetchPageOptions, FetchResult } from "./fetch";
export {
  capturePdp,
  getFetchById,
  getLatestFetch,
  getLatestFetchRow,
  listFetches,
  type FetchMetadata,
} from "./repository";
export { normalizeHtml } from "./normalize";
export type { NormalizedPdp, NormalizeOptions, PdpSignals } from "./normalize";
export {
  getLatestNormalization,
  normalizePdp,
  type NormalizePdpResult,
} from "./normalizeRepository";
export {
  AI_CRAWLERS,
  checkAgentAccess,
  evaluateRobots,
  fetchRobots,
  isPathAllowed,
  parseRobots,
  type AgentAccessResult,
  type BotAccess,
  type FetchRobotsOptions,
  type RobotsEvaluation,
  type RobotsFetchResult,
} from "./robots";
export {
  captureRobots,
  getLatestRobotsReport,
  type RobotsCaptureResult,
} from "./robotsRepository";
export { classifyPage } from "./classify";
export type {
  DetectionInput,
  DetectionResult,
  PageClassification,
} from "./classify";
export { classifyPdp, type ClassifyPdpResult } from "./classifyRepository";
