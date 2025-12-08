import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Settings, Download, Music, Clock, Gauge, FileJson, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [bpm, setBpm] = useState(130);
  const [offset, setOffset] = useState(0.0);
  const [startPoint, setStartPoint] = useState(0.0);
  const [text, setText] = useState("Clase de Bachata");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Bachata logic
  const spb = 60 / bpm;
  const cycle = ["1", "2", "3", "T", "5", "6", "7", "T"];

  // Calculate current beat to display in preview
  const getBeatAtTime = (time) => {
    if (time < offset) return null;
    const relativeTime = time - offset;
    const beatIndex = Math.floor(relativeTime / spb);
    const beatInCycle = beatIndex % 8;
    return cycle[beatInCycle];
  };

  const currentBeat = getBeatAtTime(currentTime);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setDownloadUrl(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startPoint;
      setCurrentTime(startPoint);
      if (!isPlaying) {
        videoRef.current.pause(); // Ensure it stays paused if it was paused
      } else {
        videoRef.current.play(); // Ensure it keeps playing if it was playing
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleProcess = async () => {
    if (!videoFile) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', videoFile);

    try {
      // Upload
      const uploadRes = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      // Process
      const processData = new FormData();
      processData.append('filename', uploadData.filename);
      processData.append('bpm', bpm);
      processData.append('offset', offset);
      processData.append('text', text);

      const processRes = await fetch('http://localhost:8000/process', {
        method: 'POST',
        body: processData
      });

      if (!processRes.ok) throw new Error("Processing failed");

      const result = await processRes.json();
      setDownloadUrl(`http://localhost:8000${result.download_url}`);

    } catch (error) {
      console.error(error);
      alert("Error processing video");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportConfig = () => {
    const config = {
      text,
      bpm,
      offset,
      startPoint
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bachata-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result);
        if (config.text) setText(config.text);
        if (config.bpm) setBpm(Number(config.bpm));
        if (config.offset !== undefined) setOffset(Number(config.offset));
        if (config.startPoint !== undefined) setStartPoint(Number(config.startPoint));
      } catch (error) {
        console.error("Error parsing config file", error);
        alert("Error al cargar la configuración");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-rose-500 selection:text-white">
      <div className="container mx-auto px-4 py-8 max-w-[95%]">



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative group rounded-2xl overflow-hidden bg-black/50 h-[75vh] ring-1 ring-white/10 shadow-2xl">
              {videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* Overlay Preview */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
                    <div className="text-white font-bold text-4xl drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {text}
                    </div>
                    <div className="flex justify-center mb-8">
                      <AnimatePresence mode='wait'>
                        {currentBeat && (
                          <motion.div
                            key={currentBeat}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`text-8xl font-black drop-shadow-2xl ${currentBeat === 'T' ? 'text-rose-500' : 'text-white'}`}
                            style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}
                          >
                            {currentBeat}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Play overlay controls (only show when paused or hovering) */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                    onClick={togglePlay}
                  >
                    <button className="p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all transform hover:scale-110">
                      {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white ml-2" />}
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-2xl m-4">
                  <Upload className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">Sube un video para comenzar</p>
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Timeline Controls */}
            {videoUrl && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 ring-1 ring-white/10 flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={handleRestart}
                  className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                  title="Reiniciar desde punto configurado"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <span className="text-xs font-mono text-slate-400 w-12 text-right">
                  {formatTime(currentTime)}
                </span>

                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 accent-rose-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />

                <span className="text-xs font-mono text-slate-400 w-12">
                  {formatTime(duration)}
                </span>
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                  <Gauge className="w-4 h-4 text-slate-400" />
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="bg-slate-700 text-xs font-mono text-slate-300 rounded px-2 py-1 outline-none border border-slate-600 focus:border-rose-500 cursor-pointer appearance-none hover:bg-slate-650"
                    style={{ textAlignLast: 'center' }}
                  >
                    <option value="0.25">0.25x</option>
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-6">

            <header className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl shadow-lg shadow-rose-500/20">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
                  Bachata Sync
                </h1>
                <p className="text-slate-400 text-sm">Editor de Video & Contador de Pasos</p>
              </div>
            </header>

            {/* Configuration Panel */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-rose-300">
                <Settings className="w-5 h-5" /> Configuración
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">Texto del Video</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">BPM</label>
                      <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-rose-300">{bpm}</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-full accent-rose-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">Offset</label>
                      <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-rose-300">{offset.toFixed(2)}s</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setOffset(Math.max(0, offset - 0.1))} className="px-2 bg-slate-700 rounded hover:bg-slate-600">-</button>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.01"
                        value={offset}
                        onChange={(e) => setOffset(Number(e.target.value))}
                        className="flex-1 accent-purple-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer my-auto"
                      />
                      <button onClick={() => setOffset(offset + 0.1)} className="px-2 bg-slate-700 rounded hover:bg-slate-600">+</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">Punto de Reinicio</label>
                    <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-rose-300">{startPoint.toFixed(2)}s</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setStartPoint(Math.max(0, startPoint - 0.5))} className="p-2 bg-slate-700 rounded hover:bg-slate-600">-</button>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      step="0.1"
                      value={startPoint}
                      onChange={(e) => setStartPoint(Number(e.target.value))}
                      className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer my-auto"
                    />
                    <button onClick={() => setStartPoint(startPoint + 0.5)} className="p-2 bg-slate-700 rounded hover:bg-slate-600">+</button>
                  </div>
                  <p className="text-xs text-slate-500">Define dónde comienza el video al presionar reiniciar.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportConfig}
                  className="flex-1 py-2 px-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors text-slate-300 hover:text-white"
                >
                  <Save className="w-4 h-4 text-rose-400" />
                  Exportar
                </button>
                <label className="flex-1 py-2 px-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer text-slate-300 hover:text-white">
                  <FileJson className="w-4 h-4 text-purple-400" />
                  Importar
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportConfig}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleProcess}
                disabled={!videoFile || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
                         ${isProcessing
                    ? 'bg-slate-700 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:shadow-rose-500/25'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Settings className="w-5 h-5" />
                    Procesar Video
                  </>
                )}
              </button>
            </div>

            {/* Download Section */}
            <AnimatePresence>
              {downloadUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6"
                >
                  <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                    ✅ ¡Listo!
                  </h3>
                  <a
                    href={downloadUrl}
                    download
                    className="block w-full text-center bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Descargar Video Resultado
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div >
  );
}

export default App;
