// Date utility functions for UTC normalization and EST rendering

export const toUTCDate = (dateInput) => {
    // Convert any date input to UTC ISO string
    const date = new Date(dateInput);
    return date.toISOString();
};

export const toLocalDate = (utcDateString) => {
    // Convert UTC string to local date (EST)
    if (!utcDateString) {
        return new Date(); // Return current date if no input
    }
    
    let utcDate;
    if (utcDateString.includes('T') || utcDateString.includes('Z')) {
        // Already looks like a UTC/ISO string
        utcDate = new Date(utcDateString + (utcDateString.includes('Z') ? '' : 'Z'));
    } else {
        // Try to parse as a regular date string
        utcDate = new Date(utcDateString);
    }
    
    // Check if the date is valid
    if (isNaN(utcDate.getTime())) {
        console.log('Invalid date in toLocalDate:', utcDateString);
        return new Date(); // Return current date as fallback
    }
    
    const localDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
    return localDate;
};

export const formatLocalDate = (utcDateString, options = {}) => {
    // Format UTC date for local display
    if (!utcDateString) {
        return 'No date';
    }
    
    try {
        const localDate = toLocalDate(utcDateString);
        if (isNaN(localDate.getTime())) {
            return 'Invalid date';
        }
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };
        return localDate.toLocaleDateString('en-US', defaultOptions);
    } catch (error) {
        console.log('Error formatting date:', utcDateString, error);
        return 'Invalid date';
    }
};

export const formatLocalDateTime = (utcDateString, options = {}) => {
    // Format UTC date with time for local display
    const localDate = toLocalDate(utcDateString);
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        ...options
    };
    return localDate.toLocaleString('en-US', defaultOptions);
};

export const isToday = (utcDateString) => {
    // Check if UTC date is today in local timezone
    const localDate = toLocalDate(utcDateString);
    const today = new Date();
    const localToday = new Date(today.getTime() + (today.getTimezoneOffset() * 60000));
    
    return localDate.getDate() === localToday.getDate() &&
           localDate.getMonth() === localToday.getMonth() &&
           localDate.getFullYear() === localToday.getFullYear();
};

export const getLocalDay = (utcDateString) => {
    // Get day of month from UTC date in local timezone
    const localDate = toLocalDate(utcDateString);
    return localDate.getDate();
};

export const getLocalMonth = (utcDateString) => {
    // Get month from UTC date in local timezone
    const localDate = toLocalDate(utcDateString);
    return localDate.getMonth();
};

export const getLocalYear = (utcDateString) => {
    // Get year from UTC date in local timezone
    const localDate = toLocalDate(utcDateString);
    return localDate.getFullYear();
};

// For form inputs that need date strings in YYYY-MM-DD format
export const toLocalDateString = (dateInput) => {
    if (!dateInput) {
        return '';
    }
    
    let localDate;
    if (dateInput instanceof Date) {
        // Handle Date objects directly
        localDate = new Date(dateInput.getTime() + (dateInput.getTimezoneOffset() * 60000));
    } else if (typeof dateInput === 'string') {
        // Handle date strings (UTC or local)
        localDate = toLocalDate(dateInput);
    } else {
        // Handle other types
        localDate = new Date(dateInput);
    }
    
    // Check if date is valid
    if (isNaN(localDate.getTime())) {
        return '';
    }
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
