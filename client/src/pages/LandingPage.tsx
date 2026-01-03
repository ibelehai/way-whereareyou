import { Box } from '@mui/material';
import logo from '../assets/logo.png';

export function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        component="img"
        src={logo}
        alt="WAY logo"
        sx={{ width: 160, height: 160, objectFit: 'contain' }}
      />
    </Box>
  );
}
