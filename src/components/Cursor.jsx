'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  Grid,
  Alert,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MouseIcon from '@mui/icons-material/Mouse';
import TimerIcon from '@mui/icons-material/Timer';
import AssessmentIcon from '@mui/icons-material/Assessment';

export default function ExamProctoringCursorPOC() {
  // Exam state
  const [examActive, setExamActive] = useState(false);
  const [examDuration, setExamDuration] = useState(0);
  
  // Tracking data
  const [cursorData, setCursorData] = useState([]);
  const [suspiciousEvents, setSuspiciousEvents] = useState([]);
  
  // Behavior metrics
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [idleTime, setIdleTime] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [outOfBoundsCount, setOutOfBoundsCount] = useState(0);
  const [rapidMovementCount, setRapidMovementCount] = useState(0);
  
  // Performance metrics
  const [fps, setFps] = useState(0);
  const [dataPoints, setDataPoints] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  // Activity tracking
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [inactivityWarning, setInactivityWarning] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const examAreaRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const cursorDataRef = useRef([]);
  const lastPositionRef = useRef({ x: 0, y: 0, timestamp: Date.now() });
  const examStartTimeRef = useRef(null);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Track cursor movement during exam
  useEffect(() => {
    if (!examActive) return;

    const examArea = examAreaRef.current;
    if (!examArea) return;

    const handleMouseMove = (e) => {
      const rect = examArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const timestamp = Date.now();

      // Check if cursor is out of exam area
      const isOutOfBounds = x < 0 || y < 0 || x > rect.width || y > rect.height;
      
      if (isOutOfBounds) {
        setOutOfBoundsCount(prev => prev + 1);
        logSuspiciousEvent('Cursor left exam area', { x, y, timestamp });
      }

      // Calculate speed to detect rapid movements
      const timeDiff = timestamp - lastPositionRef.current.timestamp;
      if (timeDiff > 0) {
        const dx = x - lastPositionRef.current.x;
        const dy = y - lastPositionRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = distance / timeDiff; // pixels per millisecond

        // Flag rapid movements (potential copy-paste actions)
        if (speed > 2 && distance > 100) { // Threshold: very fast movement
          setRapidMovementCount(prev => prev + 1);
          logSuspiciousEvent('Rapid cursor movement detected', { speed: speed.toFixed(2), distance: distance.toFixed(2) });
        }
      }

      const point = {
        x,
        y,
        timestamp,
        isOutOfBounds,
        speed: 0
      };

      lastPositionRef.current = { x, y, timestamp };
      cursorDataRef.current.push(point);
      setCursorData(prev => [...prev, point]);
      setDataPoints(cursorDataRef.current.length);
      setLastActivityTime(timestamp);
      setInactivityWarning(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [examActive]);

  // Monitor tab/window switches (potential cheating)
  useEffect(() => {
    if (!examActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        logSuspiciousEvent('Tab/Window switched', { 
          timestamp: Date.now(),
          duration: 'started'
        });
      }
    };

    const handleBlur = () => {
      setWindowBlurCount(prev => prev + 1);
      logSuspiciousEvent('Window lost focus', { timestamp: Date.now() });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [examActive]);

  // Monitor inactivity (student may have left)
  useEffect(() => {
    if (!examActive) return;

    const inactivityInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      const inactiveSeconds = Math.floor(timeSinceActivity / 1000);
      
      setIdleTime(inactiveSeconds);

      // Warn after 30 seconds of inactivity
      if (inactiveSeconds > 30) {
        setInactivityWarning(true);
      }

      // Log if inactive for more than 60 seconds
      if (inactiveSeconds > 60 && inactiveSeconds % 60 === 0) {
        logSuspiciousEvent('Prolonged inactivity', { duration: `${inactiveSeconds}s` });
      }
    }, 1000);

    return () => clearInterval(inactivityInterval);
  }, [examActive, lastActivityTime]);

  // Update exam duration
  useEffect(() => {
    if (!examActive) return;

    const durationInterval = setInterval(() => {
      if (examStartTimeRef.current) {
        const duration = Math.floor((Date.now() - examStartTimeRef.current) / 1000);
        setExamDuration(duration);
      }
    }, 1000);

    return () => clearInterval(durationInterval);
  }, [examActive]);

  // Animation loop for heatmap visualization
  useEffect(() => {
    if (!examActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw heatmap of cursor activity
      if (cursorDataRef.current.length > 0) {
        const recentPoints = cursorDataRef.current.slice(-200);
        
        // Create gradient heatmap effect
        recentPoints.forEach((point, index) => {
          const opacity = (index / recentPoints.length) * 0.3;
          const color = point.isOutOfBounds ? '255, 0, 0' : '33, 150, 243';
          
          ctx.fillStyle = `rgba(${color}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw current cursor position
        const lastPoint = recentPoints[recentPoints.length - 1];
        if (lastPoint) {
          ctx.fillStyle = lastPoint.isOutOfBounds ? '#f44336' : '#2196f3';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Calculate FPS
      frameCountRef.current++;
      const now = Date.now();
      const elapsed = now - lastFrameTimeRef.current;
      
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      // Memory usage
      if (performance.memory) {
        const usedMemory = performance.memory.usedJSHeapSize / (1024 * 1024);
        setMemoryUsage(usedMemory.toFixed(2));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [examActive]);

  const logSuspiciousEvent = (eventType, data) => {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };
    setSuspiciousEvents(prev => [...prev, event]);
  };

  const handleStartExam = () => {
    setExamActive(true);
    examStartTimeRef.current = Date.now();
    setLastActivityTime(Date.now());
    cursorDataRef.current = [];
    setCursorData([]);
    setSuspiciousEvents([]);
    setDataPoints(0);
    setWindowBlurCount(0);
    setIdleTime(0);
    setTabSwitchCount(0);
    setOutOfBoundsCount(0);
    setRapidMovementCount(0);
    frameCountRef.current = 0;
    lastFrameTimeRef.current = Date.now();
  };

  const handleEndExam = () => {
    setExamActive(false);
    setInactivityWarning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSuspicionLevel = () => {
    const totalSuspicious = windowBlurCount + tabSwitchCount + outOfBoundsCount + rapidMovementCount;
    if (totalSuspicious === 0) return { level: 'Low', color: 'success' };
    if (totalSuspicious < 5) return { level: 'Medium', color: 'warning' };
    return { level: 'High', color: 'error' };
  };

  const suspicionLevel = getSuspicionLevel();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Exam Proctoring - Cursor Tracking POC
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Real-time student behavior monitoring during online examinations
      </Typography>

      {/* Control Panel */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: examActive ? 'success.50' : 'grey.50' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              color={examActive ? 'error' : 'success'}
              onClick={examActive ? handleEndExam : handleStartExam}
              startIcon={examActive ? <StopIcon /> : <PlayArrowIcon />}
              size="large"
            >
              {examActive ? 'End Exam' : 'Start Exam'}
            </Button>

            {examActive && (
              <>
                <Chip
                  icon={<TimerIcon />}
                  label={`Duration: ${formatTime(examDuration)}`}
                  color="primary"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip
                  icon={<AssessmentIcon />}
                  label={`Tracking: ${dataPoints} points`}
                  color="info"
                />
              </>
            )}
          </Stack>

          <Chip
            label={`Suspicion Level: ${suspicionLevel.level}`}
            color={suspicionLevel.color}
            icon={<WarningIcon />}
            sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Exam Area with Cursor Tracking */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={3} sx={{ p: 0, height: '100%' }}>
            <Box
              ref={examAreaRef}
              sx={{
                position: 'relative',
                bgcolor: 'grey.900',
                height: 600,
                overflow: 'hidden',
                border: '3px solid',
                borderColor: examActive ? 'success.main' : 'grey.700',
              }}
            >
              {/* Canvas for cursor heatmap */}
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />

              {/* Mock Exam Content */}
              <Box sx={{ p: 4, position: 'relative', zIndex: 2, color: 'white' }}>
                <Typography variant="h4" gutterBottom>
                  Sample Exam Question
                </Typography>
                <Typography variant="body1" paragraph>
                  This is a simulated exam area. During an actual exam, this would contain:
                </Typography>
                <ul>
                  <li>Multiple choice questions</li>
                  <li>Text input fields</li>
                  <li>Code editors</li>
                  <li>Essay writing areas</li>
                </ul>
                <Typography variant="body2" sx={{ mt: 3, opacity: 0.7 }}>
                  <MouseIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Move your cursor around this area to simulate exam activity
                </Typography>

                {inactivityWarning && (
                  <Alert severity="warning" sx={{ mt: 3 }}>
                    <strong>Inactivity Detected!</strong> No cursor movement for {idleTime} seconds.
                  </Alert>
                )}
              </Box>

              {!examActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.7)',
                    zIndex: 3
                  }}
                >
                  <Typography variant="h5" color="white">
                    Click "Start Exam" to begin tracking
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Performance Bar */}
            {examActive && (
              <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="caption">Performance:</Typography>
                  <Chip size="small" label={`${fps} FPS`} color={fps >= 55 ? 'success' : 'warning'} />
                  <Chip size="small" label={`${memoryUsage} MB`} />
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (fps / 60) * 100)} 
                      color={fps >= 55 ? 'success' : 'warning'}
                    />
                  </Box>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Monitoring Panel */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Behavior Alerts */}
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  ⚠️ Suspicious Activities
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={1.5}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Tab/Window Switches</Typography>
                      <Chip 
                        label={tabSwitchCount} 
                        size="small" 
                        color={tabSwitchCount > 0 ? 'error' : 'default'}
                      />
                    </Stack>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Window Focus Lost</Typography>
                      <Chip 
                        label={windowBlurCount} 
                        size="small" 
                        color={windowBlurCount > 0 ? 'error' : 'default'}
                      />
                    </Stack>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Cursor Left Exam Area</Typography>
                      <Chip 
                        label={outOfBoundsCount} 
                        size="small" 
                        color={outOfBoundsCount > 3 ? 'error' : 'warning'}
                      />
                    </Stack>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Rapid Movements</Typography>
                      <Chip 
                        label={rapidMovementCount} 
                        size="small" 
                        color={rapidMovementCount > 5 ? 'warning' : 'default'}
                      />
                    </Stack>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Idle Time</Typography>
                      <Chip 
                        label={`${idleTime}s`} 
                        size="small" 
                        color={idleTime > 30 ? 'warning' : 'default'}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Events
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {suspiciousEvents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No suspicious events detected
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {suspiciousEvents.slice(-10).reverse().map((event, index) => (
                        <Alert key={index} severity="warning" sx={{ py: 0 }}>
                          <Typography variant="caption">
                            <strong>{event.type}</strong>
                            <br />
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Alert>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>

         

            {/* System Status */}
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Performance
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={1}>
                  <Chip 
                    label={`Tracking Rate: ${fps} FPS`} 
                    color={fps >= 55 ? 'success' : 'warning'}
                    sx={{ justifyContent: 'space-between' }}
                  />
                  <Chip 
                    label={`Data Points: ${dataPoints}`} 
                    color="info"
                    sx={{ justifyContent: 'space-between' }}
                  />
                  <Chip 
                    label={`Memory: ${memoryUsage} MB`} 
                    color="default"
                    sx={{ justifyContent: 'space-between' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}   