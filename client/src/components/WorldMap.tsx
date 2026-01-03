import { useMemo, useState } from 'react';
import type React from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Button, Paper, Popover, Stack, Typography } from '@mui/material';
import { heatColor } from '../lib/heatColor';
import { nameToAlpha2, numericToAlpha2 } from '../lib/countryCodes';
import { lightenColor, PRIMARY_COLOR } from '../theme';
import type { CountryHeat } from '../types';

interface WorldMapProps {
  heatData: CountryHeat[];
  mode?: 'stories' | 'people';
  primaryColor?: string;
  onSeeStories: (countryCode: string, countryName: string) => void;
  onAddStory: (countryCode: string, countryName: string) => void;
  onSelectCountry?: (countryCode: string, countryName: string) => void;
}

type PopoverInfo = {
  countryCode: string;
  countryName: string;
  count: number;
  anchorEl: HTMLElement | null;
};

function countryFlagEmoji(code: string) {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  return String.fromCodePoint(...[...upper].map(c => 127397 + c.charCodeAt(0)));
}

export function WorldMap({ heatData, onSeeStories, onAddStory, onSelectCountry, mode = 'stories', primaryColor = PRIMARY_COLOR }: WorldMapProps) {
  const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
  const [popoverInfo, setPopoverInfo] = useState<PopoverInfo | null>(null);

  // Calculate min/max for relative coloring
  const counts = heatData.map(d => d.count);
  const min = counts.length > 0 ? Math.min(...counts) : 0;
  const max = counts.length > 0 ? Math.max(...counts) : 0;

  const countryColorMap = useMemo(() => {
    return heatData.reduce((acc, { country_code, count }) => {
      acc[country_code] = heatColor(count, min, max, primaryColor);
      return acc;
    }, {} as Record<string, string>);
  }, [heatData, min, max, primaryColor]);

  const heatLookup = useMemo(() => {
    return heatData.reduce((acc, { country_code, count }) => {
      acc[country_code] = count;
      return acc;
    }, {} as Record<string, number>);
  }, [heatData]);

  const handleCountryClick = (event: React.MouseEvent<SVGPathElement, MouseEvent>, countryCode: string, countryName: string) => {
    onSelectCountry?.(countryCode, countryName);
    const count = heatLookup[countryCode] || 0;
    setPopoverInfo({
      countryCode,
      countryName,
      count,
      anchorEl: event.currentTarget as any
    });
  };

  return (
    <div className="w-full h-[70vh] relative">
      <ComposableMap projection="geoMercator" style={{ width: '100%', height: '100%' }}>
        <ZoomableGroup zoom={1} minZoom={0.9} maxZoom={8}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any }) =>
              geographies.map((geo: any) => {
                const isoFromName = nameToAlpha2(geo.properties?.name);
                const isoFromNumeric = numericToAlpha2(geo.id);
                const countryCode = isoFromName || isoFromNumeric || geo.properties?.ISO_A2 || geo.id;
                const countryName = geo.properties?.name || countryCode;
              const fillColor = countryColorMap[countryCode] || lightenColor(primaryColor, 0.5);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  onClick={(event: React.MouseEvent<SVGPathElement, MouseEvent>) => handleCountryClick(event, countryCode, countryName)}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: primaryColor, outline: 'none', cursor: 'pointer' },
                    pressed: { outline: 'none' }
                  }}
                />
              );
            })
          }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <Popover
        open={Boolean(popoverInfo?.anchorEl)}
        anchorEl={popoverInfo?.anchorEl}
        onClose={() => setPopoverInfo(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableScrollLock
      >
        {popoverInfo && (
          <Paper sx={{ p: 2, width: 260 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography variant="caption" color="text.secondary">Country</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>{popoverInfo.countryName}</Typography>
                </div>
                <Typography variant="h5">{countryFlagEmoji(popoverInfo.countryCode)}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {popoverInfo.count} {mode === 'people'
                  ? popoverInfo.count === 1 ? 'person' : 'people'
                  : popoverInfo.count === 1 ? 'story' : 'stories'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setPopoverInfo(null);
                    onSeeStories(popoverInfo.countryCode, popoverInfo.countryName);
                  }}
                >
                  {mode === 'people' ? 'See authors' : 'See all stories'}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setPopoverInfo(null);
                    onAddStory(popoverInfo.countryCode, popoverInfo.countryName);
                  }}
                >
                  {mode === 'people' ? 'Add story' : 'Add a story'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Popover>
    </div>
  );
}
