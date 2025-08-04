// Route bearings for LEL (approximate)
// North leg: Going from South to North (0°)
// South leg: Going from North to South (180°)

export const getWindType = (windDirection: number, routeLeg: 'North' | 'South'): { type: 'headwind' | 'tailwind' | 'crosswind'; component: number } => {
  // Convert wind direction to the direction wind is going TO (not coming FROM)
  const windGoingTo = (windDirection + 180) % 360;
  
  // Route bearing based on leg
  const routeBearing = routeLeg === 'North' ? 0 : 180;
  
  // Calculate the angle difference
  let angleDiff = Math.abs(windGoingTo - routeBearing);
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }
  
  // Calculate wind component (positive = tailwind, negative = headwind)
  const windComponent = Math.cos((angleDiff * Math.PI) / 180);
  
  // Determine wind type
  let windType: 'headwind' | 'tailwind' | 'crosswind';
  if (angleDiff <= 45) {
    windType = 'tailwind';
  } else if (angleDiff >= 135) {
    windType = 'headwind';
  } else {
    windType = 'crosswind';
  }
  
  return {
    type: windType,
    component: Math.abs(windComponent) * 100 // Percentage of wind helping/hindering
  };
};

export const getWindDirectionName = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};