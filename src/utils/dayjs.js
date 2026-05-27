import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(localizedFormat);
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

export default dayjs;
