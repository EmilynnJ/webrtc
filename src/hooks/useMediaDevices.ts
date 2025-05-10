import { useState, useEffect, useCallback } from 'react';

type MediaPermissionStatus = 'prompt' | 'granted' | 'denied';

export default function useMediaDevices() {
  const [availableDevices, setAvailableDevices] = useState<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }>({
    audioInputs: [],
    videoInputs: []
  });
  
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaPermissionStatus, setMediaPermissionStatus] = useState<MediaPermissionStatus>('prompt');

  // Get available media devices
  const getAvailableDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      setAvailableDevices({
        audioInputs: devices.filter(device => device.kind === 'audioinput'),
        videoInputs: devices.filter(device => device.kind === 'videoinput')
      });
      
      // Set defaults if not already selected
      if (devices.some(device => device.kind === 'audioinput') && !selectedAudioInput) {
        const defaultAudio = devices.find(device => device.kind === 'audioinput');
        if (defaultAudio) {
          setSelectedAudioInput(defaultAudio.deviceId);
        }
      }
      
      if (devices.some(device => device.kind === 'videoinput') && !selectedVideoInput) {
        const defaultVideo = devices.find(device => device.kind === 'videoinput');
        if (defaultVideo) {
          setSelectedVideoInput(defaultVideo.deviceId);
        }
      }
    } catch (error) {
      console.error('Error getting media devices:', error);
    }
  }, [selectedAudioInput, selectedVideoInput]);

  // Request permission and initialize media stream
  const requestMediaPermissions = useCallback(async () => {
    try {
      let stream: MediaStream;
      
      if (selectedAudioInput && selectedVideoInput) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedAudioInput },
          video: { 
            deviceId: selectedVideoInput,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
      }
      
      setLocalStream(stream);
      setMediaPermissionStatus('granted');
      
      // After getting permissions, refresh device list to get labels
      await getAvailableDevices();
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      setMediaPermissionStatus('denied');
    }
  }, [selectedAudioInput, selectedVideoInput, getAvailableDevices]);

  // Check permission status
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setMediaPermissionStatus(permissions.state as MediaPermissionStatus);
        
        if (permissions.state === 'granted') {
          await requestMediaPermissions();
        }
      } catch (error) {
        // Some browsers don't support permission queries, fall back to requesting permissions
        try {
          await requestMediaPermissions();
        } catch (err) {
          console.error('Failed to get media permissions:', err);
        }
      }
    };
    
    checkPermissions();
  }, [requestMediaPermissions]);

  // Effect for device monitoring
  useEffect(() => {
    getAvailableDevices();
    
    // Monitor for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAvailableDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAvailableDevices);
      
      // Clean up stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [getAvailableDevices, localStream]);

  // Effect to update stream when device selection changes
  useEffect(() => {
    const updateStream = async () => {
      if (mediaPermissionStatus !== 'granted' || !selectedAudioInput || !selectedVideoInput) {
        return;
      }
      
      try {
        // Stop current tracks
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        
        // Get new stream with selected devices
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedAudioInput },
          video: { 
            deviceId: selectedVideoInput,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        setLocalStream(newStream);
      } catch (error) {
        console.error('Error updating media stream:', error);
      }
    };
    
    if (mediaPermissionStatus === 'granted') {
      updateStream();
    }
  }, [selectedAudioInput, selectedVideoInput, mediaPermissionStatus]);

  return {
    availableDevices,
    selectedAudioInput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    localStream,
    mediaPermissionStatus,
    requestMediaPermissions
  };
}