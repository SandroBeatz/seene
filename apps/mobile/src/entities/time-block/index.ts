/** Time-block entity — public barrel. */
export {
  timeBlockKeys,
  useTimeBlocksRangeQuery,
  useTimeBlocksRangesQuery,
  useTimeBlockQuery,
  useDaysOffQuery,
  useCreateTimeBlockMutation,
  useUpdateTimeBlockMutation,
  useDeleteTimeBlockMutation,
} from './model/queries';
export type {
  TimeBlock,
  TimeBlockKind,
  CreateTimeBlockDto,
  UpdateTimeBlockDto,
} from './model/types';
