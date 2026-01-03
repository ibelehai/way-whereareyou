import { ToggleButton, ToggleButtonGroup, Paper } from '@mui/material';
import type React from 'react';
import type { TimeFilter as TimeFilterType } from '../types';

interface TimeFilterProps {
  current: TimeFilterType;
  onChange: (filter: TimeFilterType) => void;
  inline?: boolean;
}

export function TimeFilter({ current, onChange, inline = false }: TimeFilterProps) {
  const handleChange = (_: React.MouseEvent<HTMLElement>, value: TimeFilterType | null) => {
    if (value) onChange(value);
  };

  return (
    <Paper
      elevation={inline ? 0 : 6}
      sx={{
        position: inline ? 'static' : 'fixed',
        top: inline ? 'auto' : 16,
        right: inline ? 'auto' : 16,
        zIndex: 30,
        p: 1,
        borderRadius: 2,
        boxShadow: inline ? 'none' : undefined
      }}
    >
      <ToggleButtonGroup
        value={current}
        exclusive
        onChange={handleChange}
        size="small"
      >
        <ToggleButton value="today">Today</ToggleButton>
        <ToggleButton value="month">This month</ToggleButton>
        <ToggleButton value="all">All time</ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}
