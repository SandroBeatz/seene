/** Time-block entity — public barrel. */
export {
  timeBlockKeys,
  useTimeBlocksRangeQuery,
  useCreateTimeBlockMutation,
  useUpdateTimeBlockMutation,
  useDeleteTimeBlockMutation,
} from './model/queries';
export type { TimeBlock, CreateTimeBlockDto, UpdateTimeBlockDto } from './model/types';
