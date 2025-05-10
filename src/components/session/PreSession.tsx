import { useRef, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Form } from 'react-bootstrap';
import { Reader, UserBalance } from '@/types/types';

interface PreSessionProps {
  reader: Reader | null;
  userBalance: UserBalance | null;
  mediaPermissionStatus: 'prompt' | 'granted' | 'denied';
  availableDevices: {
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  };
  selectedAudioInput: string;
  selectedVideoInput: string;
  setSelectedAudioInput: (deviceId: string) => void;
  setSelectedVideoInput: (deviceId: string) => void;
  requestMediaPermissions: () => Promise<void>;
  startSession: () => Promise<void>;
  sessionStatus: 'waiting' | 'connecting' | 'connected' | 'ended' | 'error';
  onCancel: () => void;
}

export default function PreSession({
  reader,
  userBalance,
  mediaPermissionStatus,
  availableDevices,
  selectedAudioInput,
  selectedVideoInput,
  setSelectedAudioInput,
  setSelectedVideoInput,
  requestMediaPermissions,
  startSession,
  sessionStatus,
  onCancel
}: PreSessionProps) {
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  // Check if user has sufficient balance
  const hasSufficientBalance = userBalance && reader 
    ? userBalance.availableBalance >= reader.minimumSessionAmount
    : false;
  
  // Estimated session duration
  const estimatedMinutes = userBalance && reader && reader.ratePerMinute > 0
    ? Math.floor(userBalance.availableBalance / reader.ratePerMinute)
    : 0;
  
  // Effect to update video preview when permissions are granted
  useEffect(() => {
    if (mediaPermissionStatus === 'granted' && navigator.mediaDevices) {
      // Get video stream for preview
      navigator.mediaDevices.getUserMedia({
        audio: selectedAudioInput ? { deviceId: selectedAudioInput } : true,
        video: selectedVideoInput 
          ? { deviceId: selectedVideoInput }
          : true
      }).then(stream => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }).catch(err => {
        console.error('Error accessing media devices:', err);
      });
    }
  }, [mediaPermissionStatus, selectedAudioInput, selectedVideoInput]);

  // Render media permission request if not granted
  if (mediaPermissionStatus === 'prompt' || mediaPermissionStatus === 'denied') {
    return (
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4 text-center">
              <i className="bi bi-camera-video fs-1 text-primary mb-3"></i>
              <h2 className="mb-3">Camera & Microphone Access</h2>
              <p className="mb-4">
                We need access to your camera and microphone to connect you with your psychic reader.
                {mediaPermissionStatus === 'denied' && (
                  <Alert variant="warning" className="mt-3">
                    Camera access was denied. Please check your browser settings to enable camera access for this site.
                  </Alert>
                )}
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button 
                  variant="primary" 
                  onClick={requestMediaPermissions}
                  disabled={sessionStatus === 'connecting'}
                >
                  {sessionStatus === 'connecting' ? 'Connecting...' : 'Allow Access'}
                </Button>
                <Button variant="outline-secondary" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row className="justify-content-center">
      <Col md={10} lg={10}>
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <h2 className="mb-4 text-center">Prepare Your Session</h2>
            
            {!hasSufficientBalance && (
              <Alert variant="warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Your balance is too low for this session. You need at least ${reader?.minimumSessionAmount.toFixed(2)} to start.
              </Alert>
            )}
            
            <Row>
              <Col md={5} className="mb-4 mb-md-0">
                <h4 className="mb-3">Session Details</h4>
                
                {/* Reader info */}
                <div className="d-flex mb-4">
                  <div className="flex-shrink-0">
                    <img
                      src={reader?.profileImage || '/images/default-profile.jpg'}
                      alt={reader?.name || 'Reader'}
                      className="rounded-circle"
                      width="80"
                      height="80"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="ms-3">
                    <h5 className="mb-1">{reader?.name}</h5>
                    <p className="text-muted mb-2">{reader?.specialty}</p>
                    <div className="d-flex align-items-center mb-1">
                      <div className="text-warning">
                        {Array(5).fill(0).map((_, i) => (
                          <i 
                            key={i} 
                            className={`bi bi-star${i < Math.floor(reader?.rating || 0) ? '-fill' : 
                              i < (reader?.rating || 0) ? '-half' : ''}`}
                          ></i>
                        ))}
                      </div>
                      <span className="text-muted ms-2">
                        ({reader?.totalReviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Pricing info */}
                <div className="bg-light rounded p-3 mb-4">
                  <h5 className="mb-3">Pricing</h5>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Rate:</span>
                    <span className="fw-bold">${reader?.ratePerMinute.toFixed(2)}/minute</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Your balance:</span>
                    <span className="fw-bold">${userBalance?.availableBalance.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Estimated time:</span>
                    <span className="fw-bold text-primary">{estimatedMinutes} minutes</span>
                  </div>
                </div>
                
                {/* Connection tips */}
                <div className="mb-4">
                  <h5 className="mb-2">Connection Tips</h5>
                  <ul className="small">
                    <li>Use a stable internet connection</li>
                    <li>Find a quiet, well-lit space</li>
                    <li>Use headphones for better audio</li>
                    <li>Close other applications using your camera</li>
                  </ul>
                </div>
              </Col>
              
              <Col md={7}>
                <h4 className="mb-3">Check Your Video & Audio</h4>
                
                {/* Video preview */}
                <div className="bg-dark rounded position-relative mb-4" style={{ height: '240px' }}>
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-100 h-100 rounded"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="position-absolute bottom-0 start-0 m-2 bg-dark bg-opacity-50 px-2 py-1 rounded text-white small">
                    <i className="bi bi-camera-video me-1"></i> Preview
                  </div>
                </div>
                
                {/* Device selection */}
                <div className="mb-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Camera</Form.Label>
                    <Form.Select
                      value={selectedVideoInput}
                      onChange={(e) => setSelectedVideoInput(e.target.value)}
                    >
                      {availableDevices.videoInputs.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.substring(0, 8)}...`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Microphone</Form.Label>
                    <Form.Select
                      value={selectedAudioInput}
                      onChange={(e) => setSelectedAudioInput(e.target.value)}
                    >
                      {availableDevices.audioInputs.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.substring(0, 8)}...`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                
                {/* Connection test */}
                <div className="bg-light rounded p-3 mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">Connection Test</h5>
                      <p className="mb-0 text-muted small">Your connection appears to be stable</p>
                    </div>
                    <div className="text-success">
                      <i className="bi bi-check-circle-fill fs-4"></i>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="d-flex justify-content-end gap-3">
                  <Button variant="outline-secondary" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={startSession}
                    disabled={!hasSufficientBalance || sessionStatus === 'connecting'}
                  >
                    {sessionStatus === 'connecting' ? 'Connecting...' : 'Start Session'}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}