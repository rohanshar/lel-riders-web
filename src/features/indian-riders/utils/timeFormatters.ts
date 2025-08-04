export const formatElapsedTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
};

export const getCurrentUKTime = (): string => {
  return new Date().toLocaleTimeString('en-GB', { 
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const getCurrentUKDateTime = (): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2025');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  return new Date(year, month, day, hour, minute, second);
};

export const parseCheckpointTime = (timeStr: string): number => {
  const parts = timeStr.split(' ');
  const time = parts[parts.length - 1];
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatExpectedArrival = (
  lastCheckpointTime: string,
  hoursToNext: number
): { ukTime: string; istTime: string } => {
  // Parse the checkpoint time (assuming format like "Sunday 11:56")
  const timeParts = lastCheckpointTime.split(' ');
  const dayName = timeParts[0];
  const timeOnly = timeParts[timeParts.length - 1];
  const [checkpointHours, checkpointMinutes] = timeOnly.split(':').map(Number);
  
  // Calculate expected arrival by adding travel time to checkpoint time
  const totalMinutesAtCheckpoint = checkpointHours * 60 + checkpointMinutes;
  const travelMinutes = Math.round(hoursToNext * 60);
  const totalMinutesExpected = totalMinutesAtCheckpoint + travelMinutes;
  
  // Handle day overflow
  let expectedDay = dayName;
  let expectedHours = Math.floor(totalMinutesExpected / 60);
  let expectedMinutes = totalMinutesExpected % 60;
  
  if (expectedHours >= 24) {
    expectedHours = expectedHours % 24;
    // Simple day progression
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = days.indexOf(dayName);
    expectedDay = days[(currentDayIndex + 1) % 7];
  }
  
  // Format the expected time
  const ukTime = `${expectedDay} ${expectedHours.toString().padStart(2, '0')}:${expectedMinutes.toString().padStart(2, '0')}`;
  
  // Calculate IST time (UK + 4:30 hours during BST)
  const totalMinutesIST = totalMinutesExpected + (4 * 60 + 30);
  let expectedDayIST = expectedDay;
  let expectedHoursIST = Math.floor(totalMinutesIST / 60);
  let expectedMinutesIST = totalMinutesIST % 60;
  
  if (expectedHoursIST >= 24) {
    expectedHoursIST = expectedHoursIST % 24;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = days.indexOf(expectedDay);
    expectedDayIST = days[(currentDayIndex + 1) % 7];
  }
  
  const istTime = `${expectedDayIST} ${expectedHoursIST.toString().padStart(2, '0')}:${expectedMinutesIST.toString().padStart(2, '0')} IST`;
  
  return { ukTime, istTime };
};