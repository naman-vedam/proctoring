'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import MouseIcon from '@mui/icons-material/Mouse';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Landing() {
  const router = useRouter();

  const handleNavigateFullscreen = () => {
    router.push('/fullscreen');
  };

  const handleNavigateCursor = () => {
    router.push('/cursor');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        // background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={6}
          sx={{
            p: 4,
            mb: 6,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mb={2}>
            <SecurityIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h3" component="h1" fontWeight="bold">
              Proctoring POC Dashboard
            </Typography>
          </Stack>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Test and Monitor User Behavior
          </Typography>
          
          <Stack direction="row" spacing={1} justifyContent="center" mt={3}>
            <Chip label="Fullscreen Detection" color="primary" size="small" />
            <Chip label="Cursor Tracking" color="secondary" size="small" />
            <Chip label="Real-time Monitoring" color="success" size="small" />
          </Stack>
        </Paper>

        {/* Feature Cards */}
        <Grid container spacing={4}>
          {/* Fullscreen Card */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={8}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                }
              }}
            >
              <CardContent sx={{  p: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'white',
                      mr: 2
                    }}
                  >
                    <FullscreenIcon sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="h4" component="h2" fontWeight="bold">
                    Fullscreen Mode
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                

              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleNavigateFullscreen}
                  startIcon={<FullscreenIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  Test Fullscreen
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Cursor Tracking Card */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={8}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'secondary.main',
                      color: 'white',
                      mr: 2
                    }}
                  >
                    <MouseIcon sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="h4" component="h2" fontWeight="bold">
                    Cursor Tracking
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  color="secondary"
                  onClick={handleNavigateCursor}
                  startIcon={<MouseIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  Test Cursor Tracking
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}