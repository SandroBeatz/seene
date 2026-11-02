/** Time-block entity — public barrel. */
export {
  timeBlockKeys,
  useTimeBlocksRangeQuery,
  useTimeBlocksRangesQuery,
  useTimeBlockQuery,
  useCreateTimeBlockMutation,
  useUpdateTimeBlockMutation,
  useDeleteTimeBlockMutation,
} from './model/queries';
export type { TimeBlock, CreateTimeBlockDto, UpdateTimeBlockDto } from './model/types';
