import { useSession } from '../contexts/SessionContext';

const DeviceSelection = () => {
  const {
    availableAudioInputs,
    availableVideoInputs,
    selectedAudioInput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedVideoInput
  } = useSession();

  return (
    <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Media Device Settings</h3>
      
      {/* Camera selection */}
      <div className="mb-4">
        <label htmlFor="camera-select" className="block text-sm font-medium text-gray-300 mb-2">
          Camera
        </label>
        <select
          id="camera-select"
          value={selectedVideoInput}
          onChange={(e) => setSelectedVideoInput(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {availableVideoInputs.length === 0 ? (
            <option value="">No cameras detected</option>
          ) : (
            availableVideoInputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
              </option>
            ))
          )}
        </select>
      </div>
      
      {/* Microphone selection */}
      <div>
        <label htmlFor="mic-select" className="block text-sm font-medium text-gray-300 mb-2">
          Microphone
        </label>
        <select
          id="mic-select"
          value={selectedAudioInput}
          onChange={(e) => setSelectedAudioInput(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {availableAudioInputs.length === 0 ? (
            <option value="">No microphones detected</option>
          ) : (
            availableAudioInputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};

export default DeviceSelection;