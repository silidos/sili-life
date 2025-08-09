import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import weekday from 'dayjs/plugin/weekday';
import isToday from 'dayjs/plugin/isToday';

dayjs.extend(localizedFormat);
dayjs.extend(weekday);
dayjs.extend(isToday);

export default dayjs;