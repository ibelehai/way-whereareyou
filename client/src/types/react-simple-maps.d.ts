declare module 'react-simple-maps' {
  import * as React from 'react';
  export interface GeographyProps {
    geography: any;
    style?: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    onClick?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
  }
  export const ComposableMap: React.FC<any>;
  export const Geographies: React.FC<any>;
  export const Geography: React.FC<GeographyProps>;
  export const ZoomableGroup: React.FC<any>;
}