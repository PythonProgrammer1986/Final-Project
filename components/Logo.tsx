
import React from 'react';
import { BRAND } from '../constants';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-20 w-auto" }) => {
  return (
    <svg viewBox="0 0 300 120" className={className} fill={BRAND.DARK_GRAY}>
      {/* Wordmark shifted to start */}
      <g transform="translate(10, 28)">
        {/* E */}
        <path d="M0 0H35V12H13V24H32V36H13V48H36V60H0V0Z"/>
        {/* p */}
        <path d="M48 18V76H60V62H61C64 67 69 70 75 70C86 70 95 61 95 44C95 27 86 18 75 18C69 18 64 21 61 26H60V18H48ZM72 30C78 30 82 34 82 44C82 54 78 58 72 58C66 58 62 54 62 44C62 34 66 30 72 30Z"/>
        {/* i */}
        <path d="M108 0H120V12H108V0ZM108 18H120V70H108V18Z"/>
        {/* r */}
        <path d="M133 18H145V28H146C148 22 153 18 160 18V31C154 31 148 34 146 39V70H133V18Z"/>
        {/* o */}
        <path d="M190 18C177 18 168 28 168 44C168 60 177 70 190 70C203 70 212 60 212 44C212 28 203 18 190 18ZM190 30C196 30 200 34 200 44C200 54 196 58 190 58C184 58 180 54 180 44C180 34 184 30 190 30Z"/>
        {/* c */}
        <path d="M255 38C253 33 249 30 243 30C237 30 233 35 233 44C233 53 237 58 243 58C249 58 253 55 255 50H268C265 62 255 70 243 70C229 70 220 60 220 44C220 28 229 18 243 18C255 18 265 26 268 38H255Z"/>
      </g>
    </svg>
  );
};
