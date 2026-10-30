/** "Сегодня" widget — public barrel. */
export { TodayScreen } from './ui/TodayScreen';
export { summarizeDay, type DaySummary, type DaySegment } from './model/summary';
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
export { firstSteps, greetingPeriod, type FirstStepsState } from './model/first-steps';
