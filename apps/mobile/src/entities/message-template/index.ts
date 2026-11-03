/** Message templates entity — public barrel. */
export { createBookingLink } from './api/message-template.api';
export { DEFAULT_TEMPLATES, variablesOf } from './config/defaults';
export {
  fromEditable,
  labelToken,
  messageDateTime,
  messageLanguageFor,
  renderTemplate,
  sitePath,
  templateSegments,
  toEditable,
  usesVariable,
  type MessageValues,
  type TemplateSegment,
  type VariableLabels,
} from './lib/render';
export {
  messageTemplatesOptions,
  templateBody,
  useMessageTemplatesQuery,
  useSaveMessageTemplateMutation,
} from './model/queries';
export {
  BODY_MAX_LENGTH,
  MESSAGE_KINDS,
  MESSAGE_LANGUAGES,
  MESSAGE_VARIABLES,
  type MessageKind,
  type MessageLanguage,
  type MessageTemplate,
  type MessageVariable,
} from './model/types';
