/** "Сегодня" widget — public barrel. UI lands in Phase 2; the model is built and tested. */
export { summarizeDay, type DaySummary, type DaySegment } from './model/summary';
export { recallState, type RecallState } from './model/recall';
export {
  buildAttentionItems,
  attentionKey,
  ATTENTION_ORDER,
  ATTENTION_TONE,
  ATTENTION_ACTIONS,
  type AttentionItem,
  type AttentionKind,
  type AttentionAction,
  type RecallCandidate,
} from './model/attention';
