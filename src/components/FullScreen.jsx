'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Alert,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WarningIcon from '@mui/icons-material/Warning';

export default function FullscreenPOC() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [exitCount, setExitCount] = useState(0);
  const [browserInfo, setBrowserInfo] = useState('');
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  
  const wasFullscreenRef = useRef(false);
  const isIntentionalExitRef = useRef(false);
  const reEnterTimeoutRef = useRef(null);
  const fullscreenCheckIntervalRef = useRef(null);

  // Detect browser
  useEffect(() => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    
    if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
    else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
    
    setBrowserInfo(browser);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      }
    };
    
    requestNotificationPermission();
  }, []);

  // Aggressive fullscreen enforcement with polling
  useEffect(() => {
    if (sessionActive) {
      // Poll every 100ms to check fullscreen status
      fullscreenCheckIntervalRef.current = setInterval(() => {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        );
        
        if (!isCurrentlyFullscreen && !isIntentionalExitRef.current) {
          // Immediately re-enter fullscreen
          enterFullscreen();
        }
      }, 100);
    } else {
      if (fullscreenCheckIntervalRef.current) {
        clearInterval(fullscreenCheckIntervalRef.current);
        fullscreenCheckIntervalRef.current = null;
      }
    }

    return () => {
      if (fullscreenCheckIntervalRef.current) {
        clearInterval(fullscreenCheckIntervalRef.current);
      }
    };
  }, [sessionActive]);

  // Block ESC key when in fullscreen session
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (sessionActive && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Show warning but don't wait - immediately re-enter
        setShowWarningDialog(true);
        setExitCount(prev => prev + 1);
        showNotification();
        
        // Force re-enter after a tiny delay
        setTimeout(() => {
          enterFullscreen();
        }, 50);
        
        return false;
      }
    };

    // Capture phase to intercept before other handlers
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [sessionActive]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      
      // If session is active but fullscreen exited unexpectedly
      if (sessionActive && !isCurrentlyFullscreen && wasFullscreenRef.current && !isIntentionalExitRef.current) {
        console.log('Fullscreen exit detected - re-entering immediately');
        setExitCount(prev => prev + 1);
        showNotification();
        setShowWarningDialog(true);
        
        // Immediate re-entry without delay
        enterFullscreen();
      }
      
      wasFullscreenRef.current = isCurrentlyFullscreen;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Add listeners for all browsers
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      if (reEnterTimeoutRef.current) {
        clearTimeout(reEnterTimeoutRef.current);
      }
    };
  }, [sessionActive]);

  // Prevent right-click and context menu during session
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (sessionActive) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [sessionActive]);

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen({ navigationUI: 'hide' });
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      if (!sessionActive) {
        alert('Unable to enter fullscreen. Error: ' + error.message);
      }
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  const showNotification = () => {
    if (notificationPermission === 'granted') {
      new Notification('⚠️ Session Active - Fullscreen Required', {
        body: 'Please use the "End Session" button to exit. Re-entering fullscreen...',
        icon: '/favicon.ico',
        tag: 'fullscreen-exit',
        requireInteraction: false
      });
    }
  };

  const handleStartSession = async () => {
    setSessionActive(true);
    isIntentionalExitRef.current = false;
    wasFullscreenRef.current = false;
    await enterFullscreen();
  };

  const handleEndSession = async () => {
    isIntentionalExitRef.current = true;
    setSessionActive(false);
    setShowWarningDialog(false);
    
    // Small delay to ensure flag is set
    setTimeout(async () => {
      await exitFullscreen();
      setExitCount(0);
    }, 100);
  };

  const handleCloseWarning = () => {
    setShowWarningDialog(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Fullscreen Session - ESC Blocked
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Testing fullscreen mode with aggressive ESC key prevention
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* Status Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Current Status
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1 }}>
            <Chip 
              label={sessionActive ? 'Session Active' : 'Session Inactive'}
              color={sessionActive ? 'success' : 'default'}
              icon={sessionActive ? <FullscreenIcon /> : <FullscreenExitIcon />}
            />
            <Chip 
              label={isFullscreen ? 'Fullscreen: ON' : 'Fullscreen: OFF'}
              color={isFullscreen ? 'success' : 'warning'}
            />
            <Chip 
              label={`Browser: ${browserInfo}`}
              color="info"
            />
            <Chip 
              label={`Notifications: ${notificationPermission}`}
              color={notificationPermission === 'granted' ? 'success' : 'warning'}
              icon={<NotificationsActiveIcon />}
            />
          </Stack>
        </Box>

        {/* Control Button */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          {!sessionActive ? (
            <Button
              variant="contained"
              size="large"
              onClick={handleStartSession}
              startIcon={<FullscreenIcon />}
              sx={{ minWidth: 200, py: 1.5 }}
            >
              Start Session
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleEndSession}
              startIcon={<FullscreenExitIcon />}
              sx={{ minWidth: 200, py: 1.5 }}
            >
              End Session
            </Button>
          )}
        </Box>

        {/* Session Active Warning */}
        {sessionActive && (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>Session is active</strong> - Fullscreen mode is strictly enforced. 
              The system will automatically re-enter fullscreen if you try to exit.
            </Typography>
          </Alert>
        )}

        {/* Exit Counter */}
        {exitCount > 0 && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>Unauthorized exit attempts: {exitCount}</strong>
            </Typography>
            <Typography variant="caption">
              ESC key or other exit attempts are blocked. System automatically re-enters fullscreen.
            </Typography>
          </Alert>
        )}

       
      </Paper>

      {/* Warning Dialog - Non-blocking */}
      <Dialog 
        open={showWarningDialog} 
        onClose={handleCloseWarning}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Session Active - Fullscreen Enforced
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You cannot exit fullscreen mode while the session is active.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The system has automatically re-entered fullscreen mode to maintain session security.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Please use the <strong>"End Session"</strong> button to properly exit.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWarning} variant="contained" autoFocus>
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}