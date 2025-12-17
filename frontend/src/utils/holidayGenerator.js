/**
 * Dynamic Holiday Generator
 * Calculates US Federal Holidays and common business closures for any year
 */

/**
 * Calculate Easter Sunday for a given year using the Computus algorithm
 */
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Get the nth occurrence of a weekday in a month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @param {number} weekday - Day of week (0=Sunday, 1=Monday, etc.)
 * @param {number} occurrence - Which occurrence (1=first, 2=second, etc., -1=last)
 */
function getNthWeekdayOfMonth(year, month, weekday, occurrence) {
  if (occurrence === -1) {
    // Last occurrence
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const daysBack = (lastWeekday - weekday + 7) % 7;
    return new Date(year, month, lastDay.getDate() - daysBack);
  } else {
    // Nth occurrence
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysForward = (weekday - firstWeekday + 7) % 7;
    const targetDate = 1 + daysForward + (occurrence - 1) * 7;
    return new Date(year, month, targetDate);
  }
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate all holidays for a given year
 */
export function generateHolidaysForYear(year) {
  const holidays = [];
  
  // Fixed date holidays
  holidays.push({
    date: `${year}-01-01`,
    name: "New Year's Day",
    type: 'federal'
  });
  
  holidays.push({
    date: `${year}-06-19`,
    name: 'Juneteenth',
    type: 'federal'
  });
  
  holidays.push({
    date: `${year}-07-04`,
    name: 'Independence Day',
    type: 'federal'
  });
  
  holidays.push({
    date: `${year}-11-11`,
    name: 'Veterans Day',
    type: 'federal'
  });
  
  holidays.push({
    date: `${year}-12-25`,
    name: 'Christmas Day',
    type: 'federal'
  });
  
  // MLK Day - Third Monday in January
  const mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3);
  holidays.push({
    date: formatDate(mlkDay),
    name: 'Martin Luther King Jr. Day',
    type: 'federal'
  });
  
  // Presidents' Day - Third Monday in February
  const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3);
  holidays.push({
    date: formatDate(presidentsDay),
    name: "Presidents' Day",
    type: 'federal'
  });
  
  // Memorial Day - Last Monday in May
  const memorialDay = getNthWeekdayOfMonth(year, 4, 1, -1);
  holidays.push({
    date: formatDate(memorialDay),
    name: 'Memorial Day',
    type: 'federal'
  });
  
  // Labor Day - First Monday in September
  const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1);
  holidays.push({
    date: formatDate(laborDay),
    name: 'Labor Day',
    type: 'federal'
  });
  
  // Columbus Day - Second Monday in October
  const columbusDay = getNthWeekdayOfMonth(year, 9, 1, 2);
  holidays.push({
    date: formatDate(columbusDay),
    name: 'Columbus Day',
    type: 'federal'
  });
  
  // Thanksgiving - Fourth Thursday in November
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4);
  holidays.push({
    date: formatDate(thanksgiving),
    name: 'Thanksgiving',
    type: 'federal'
  });
  
  // Black Friday - Day after Thanksgiving
  const blackFriday = new Date(thanksgiving);
  blackFriday.setDate(thanksgiving.getDate() + 1);
  holidays.push({
    date: formatDate(blackFriday),
    name: 'Black Friday',
    type: 'business'
  });
  
  // Business closure days
  holidays.push({
    date: `${year}-12-24`,
    name: 'Christmas Eve',
    type: 'business'
  });
  
  holidays.push({
    date: `${year}-12-31`,
    name: "New Year's Eve",
    type: 'business'
  });
  
  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get holidays for multiple years
 */
export function generateHolidays(startYear, endYear) {
  const allHolidays = {};
  
  for (let year = startYear; year <= endYear; year++) {
    allHolidays[year] = generateHolidaysForYear(year);
  }
  
  return allHolidays;
}

/**
 * Get holidays for current year and next year
 */
export function getCurrentAndNextYearHolidays() {
  const currentYear = new Date().getFullYear();
  return generateHolidays(currentYear, currentYear + 1);
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date) {
  const dateStr = formatDate(date);
  const year = date.getFullYear();
  const yearHolidays = generateHolidaysForYear(year);
  
  return yearHolidays.find(h => h.date === dateStr);
}

/**
 * Check if a date is close to a holiday (within X days)
 */
export function isNearHoliday(date, daysThreshold = 2) {
  const year = date.getFullYear();
  const yearHolidays = generateHolidaysForYear(year);
  
  const nearbyHolidays = [];
  
  yearHolidays.forEach(holiday => {
    const holidayDate = new Date(holiday.date);
    const daysDiff = Math.abs((date - holidayDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 0 && daysDiff <= daysThreshold) {
      nearbyHolidays.push({
        ...holiday,
        daysAway: Math.floor(daysDiff)
      });
    }
  });
  
  return nearbyHolidays;
}

/**
 * Check for scheduling warnings (day, time, and date-based)
 */
export function checkSchedulingWarnings(dateTimeString) {
  const warnings = [];
  const date = new Date(dateTimeString);
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  
  // Check for exact holiday match
  const holiday = isHoliday(date);
  
  if (holiday) {
    warnings.push({
      type: 'error',
      icon: '🎄',
      message: `This is ${holiday.name}! Most businesses are closed.`,
      suggestion: 'Nobody will check their email. Please reschedule to a business day.',
      severity: 'high'
    });
  }
  
  // Check for weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    warnings.push({
      type: 'warning',
      icon: '📅',
      message: `This is a ${dayOfWeek === 0 ? 'Sunday' : 'Saturday'}.`,
      suggestion: 'Weekend applications get 60% lower response rates. Consider Tuesday-Thursday instead.',
      severity: 'medium'
    });
  }
  
  // NEW: Check for Monday morning (before 11 AM)
  if (dayOfWeek === 1 && hour < 11) {
    warnings.push({
      type: 'warning',
      icon: '📧',
      message: 'Monday morning - inboxes are overloaded.',
      suggestion: 'People are catching up from the weekend. Consider Tuesday-Thursday 10-11 AM instead.',
      severity: 'medium'
    });
  }
  
  // NEW: Check for Friday afternoon (after 2 PM)
  if (dayOfWeek === 5 && hour >= 14) {
    warnings.push({
      type: 'warning',
      icon: '🏖️',
      message: 'Friday afternoon - people are winding down for the weekend.',
      suggestion: 'Low engagement time. Consider Tuesday-Wednesday morning instead.',
      severity: 'medium'
    });
  }
  
  // NEW: Check for very early morning (before 6 AM)
  if (hour < 6) {
    warnings.push({
      type: 'warning',
      icon: '🌙',
      message: `${hour}:00 AM is very early - most people aren't checking email yet.`,
      suggestion: 'Schedule for 10-11 AM when people are settled into their workday.',
      severity: 'medium'
    });
  }
  
  // NEW: Check for late evening (after 6 PM)
  if (hour >= 18) {
    warnings.push({
      type: 'warning',
      icon: '🌆',
      message: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'} is after business hours.`,
      suggestion: 'People check work email less after 6 PM. Schedule for next business day 10-11 AM.',
      severity: 'medium'
    });
  }
  
  // NEW: Highlight optimal time (Tuesday-Thursday, 10-11 AM)
  if ((dayOfWeek >= 2 && dayOfWeek <= 4) && (hour >= 10 && hour < 11)) {
    warnings.push({
      type: 'success',
      icon: '✅',
      message: 'Perfect timing! This is an optimal submission time.',
      suggestion: 'Tuesday-Thursday 10-11 AM has the highest response rates.',
      severity: 'low'
    });
  }
  
  // Check proximity to holidays (within 2 days)
  const nearbyHolidays = isNearHoliday(date);
  nearbyHolidays.forEach(holiday => {
    warnings.push({
      type: 'info',
      icon: 'ℹ️',
      message: `This is ${holiday.daysAway} day${holiday.daysAway > 1 ? 's' : ''} from ${holiday.name}.`,
      suggestion: 'People may have reduced availability around holidays.',
      severity: 'low'
    });
  });
  
  return warnings;
}