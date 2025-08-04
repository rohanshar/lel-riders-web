import React from 'react';
import { isLondonStartRider } from '@/config/lel-route';

export const formatRiderName = (name: string, riderNo: string) => {
  const isLondonStart = isLondonStartRider(riderNo);
  return (
    <>
      {name}
      {isLondonStart && <sup className="text-xs text-muted-foreground ml-1">+20km</sup>}
    </>
  );
};