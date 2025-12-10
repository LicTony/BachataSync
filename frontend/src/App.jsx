import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Settings, Download, Music, Clock, Gauge, FileJson, Save, RotateCcw, Type, List, Plus, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [bpm, setBpm] = useState(130);
  const [offset, setOffset] = useState(0.0);
  const [startPoint, setStartPoint] = useState(0.0);
  const [text, setText] = useState("Clase de Bachata");
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'texts'
  const [timedTexts, setTimedTexts] = useState([]); // Array of { id, content, start, end }
  const [newTextContent, setNewTextContent] = useState("");
  const [newTextStart, setNewTextStart] = useState(0);
  const [newTextEnd, setNewTextEnd] = useState(5);
  const [newTextPosition, setNewTextPosition] = useState("bottom"); // 'top' | 'center' | 'bottom'
  const [editingId, setEditingId] = useState(null);

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

  // Derive current visible texts
  const currentOverlayTexts = timedTexts.filter(
    t => currentTime >= t.start && currentTime <= t.end
  );

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const tenths = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const video = files.find(f => f.type.startsWith('video/'));
    const json = files.find(f => f.type === 'application/json' || f.name.endsWith('.json'));

    if (video) {
      setVideoFile(video);
      setVideoUrl(URL.createObjectURL(video));
      setDownloadUrl(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);

      // Check for matching JSON
      // We check if a JSON file was selected OR if the user selected a JSON with the same name
      let configToLoad = null;

      if (json) {
        // If specific json found, check name match or just load it if it's the only one?
        // User requirement: "si existe un archivo .json con el exactamente el mismo nombre... subir ese archivo tambien"
        // If the user selected sending multiple files, we try to match names.
        // If they just selected one video and one json, we assume they go together.
        const videoNameNoExt = video.name.replace(/\.[^/.]+$/, "");
        const jsonNameNoExt = json.name.replace(/\.[^/.]+$/, "");

        if (jsonNameNoExt === videoNameNoExt) {
          configToLoad = json;
        }
      }

      if (configToLoad) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target.result);
            if (config.text) setText(config.text);
            if (config.bpm) setBpm(Number(config.bpm));
            if (config.offset !== undefined) setOffset(Number(config.offset));
            if (config.startPoint !== undefined) setStartPoint(Number(config.startPoint));
            if (config.timedTexts) setTimedTexts(config.timedTexts);
            console.log("Config loaded automatically from", configToLoad.name);
          } catch (error) {
            console.error("Error parsing auto-loaded config file", error);
          }
        };
        reader.readAsText(configToLoad);
      }
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

  const handleSaveText = () => {
    if (!newTextContent.trim()) return;

    if (editingId) {
      // Update existing
      setTimedTexts(timedTexts.map(t =>
        t.id === editingId
          ? {
            ...t,
            content: newTextContent,
            start: parseFloat(newTextStart),
            end: parseFloat(newTextEnd),
            position: newTextPosition
          }
          : t
      ));
      setEditingId(null);
    } else {
      // Add new
      const newText = {
        id: Date.now().toString(),
        content: newTextContent,
        start: parseFloat(newTextStart),
        end: parseFloat(newTextEnd),
        position: newTextPosition
      };
      setTimedTexts([...timedTexts, newText]);
    }
    setNewTextContent("");
    setNewTextStart(0);
    setNewTextEnd(5);
    setNewTextPosition("bottom");
  };

  const handleEditText = (t) => {
    setNewTextContent(t.content);
    setNewTextStart(t.start);
    setNewTextEnd(t.end);
    setNewTextPosition(t.position || "bottom");
    setEditingId(t.id);
  };

  const handleCancelEdit = () => {
    setNewTextContent("");
    setNewTextStart(0);
    setNewTextEnd(5);
    setNewTextPosition("bottom");
    setEditingId(null);
  };

  const handleDeleteText = (id) => {
    setTimedTexts(timedTexts.filter(t => t.id !== id));
    if (editingId === id) {
      handleCancelEdit();
    }
  };

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
      processData.append('timed_texts', JSON.stringify(timedTexts));

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

  const handleExportConfig = async () => {
    const config = {
      text,
      bpm,
      offset,
      startPoint,
      timedTexts
    };
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Default filename based on video
    const defaultName = videoFile ? videoFile.name.replace(/\.[^/.]+$/, "") + ".json" : "bachata-config.json";

    // Try using File System Access API
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultName,
          types: [{
            description: 'JSON Config File',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("File save error:", err);
        } else {
          return; // User cancelled
        }
        // Fallback to legacy download
      }
    }

    // Fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
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
        if (config.timedTexts) setTimedTexts(config.timedTexts);
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
                    {/* Main Text (Title) */}
                    <div className="text-white font-bold text-4xl drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {text}
                    </div>

                    {/* Timed Texts Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <AnimatePresence>
                        {currentOverlayTexts.map((t) => {
                          // Determine style based on position
                          let positionStyle = "bottom-32 left-0 right-0 ";
                          if (t.position === 'top') positionStyle = "top-32 left-0 right-0";
                          if (t.position === 'center') positionStyle = "top-1/2 -translate-y-1/2 left-0 right-0";
                          if (t.position === 'bottom') positionStyle = "bottom-32 left-0 right-0";

                          return (
                            <div key={t.id} className={`absolute ${positionStyle} flex justify-center pointer-events-none`}>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="text-2xl font-semibold bg-black/60 px-4 py-2 rounded-lg text-rose-200 backdrop-blur-sm shadow-xl border border-white/10"
                              >
                                {t.content}
                              </motion.div>
                            </div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Beat Counter */}
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
                    accept="video/mp4, application/json"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Selecciona el video (y opcionalmente el .json de configuración)"
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

                <span className="text-xs font-mono text-slate-400 w-16 text-right">
                  {formatTime(currentTime)}
                </span>

                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 accent-rose-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />

                <span className="text-xs font-mono text-slate-400 w-16">
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
          <div className="space-y-6 flex flex-col h-full">

            <header className="flex items-center gap-3 mb-2 shrink-0">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl shadow-lg shadow-rose-500/20">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
                  Bachata Sync by Tony
                </h1>
                <p className="text-slate-400 text-sm">Editor de Video & Contador de Pasos</p>
              </div>
            </header>

            {/* Config & Text Tabs Container */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl ring-1 ring-white/10 flex-1 flex flex-col overflow-hidden">

              {/* Tab Headers */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('config')}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'config' ? 'bg-white/5 text-rose-300 border-b-2 border-rose-500' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Settings className="w-4 h-4" /> Configuración
                </button>
                <button
                  onClick={() => setActiveTab('texts')}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'texts' ? 'bg-white/5 text-rose-300 border-b-2 border-rose-500' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <List className="w-4 h-4" /> Textos
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">

                {/* CONFIGURATION TAB */}
                {activeTab === 'config' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.01"
                            value={offset}
                            onChange={(e) => setOffset(Number(e.target.value))}
                            className="w-full accent-purple-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
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

                    <div className="flex gap-2 pt-4 border-t border-white/10">
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
                      className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 mt-4
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
                )}

                {/* TEXTS TAB */}
                {activeTab === 'texts' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">

                      {/* Add/Edit Text Form */}
                      <div className={`p-4 rounded-xl border space-y-3 transition-colors ${editingId ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900/50 border-white/5'}`}>
                        <div className="flex justify-between items-center">
                          <h3 className={`text-xs font-bold uppercase ${editingId ? 'text-blue-300' : 'text-slate-400'}`}>
                            {editingId ? 'Editar Texto' : 'Agregar Nuevo Texto'}
                          </h3>
                          {editingId && (
                            <button
                              onClick={handleCancelEdit}
                              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded"
                            >
                              <X className="w-3 h-3" /> Cancelar
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="Contenido del texto..."
                          value={newTextContent}
                          onChange={(e) => setNewTextContent(e.target.value)}
                          className={`w-full bg-slate-800 border rounded px-3 py-2 text-sm outline-none ${editingId ? 'border-blue-500/50 focus:border-blue-500' : 'border-slate-600 focus:border-rose-500'}`}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase block mb-1">Inicio (s)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={newTextStart}
                              onChange={(e) => setNewTextStart(Number(e.target.value))}
                              className={`w-full bg-slate-800 border rounded px-2 py-1 text-sm outline-none ${editingId ? 'border-blue-500/50' : 'border-slate-600'}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase block mb-1">Fin (s)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={newTextEnd}
                              onChange={(e) => setNewTextEnd(Number(e.target.value))}
                              className={`w-full bg-slate-800 border rounded px-2 py-1 text-sm outline-none ${editingId ? 'border-blue-500/50' : 'border-slate-600'}`}
                            />
                          </div>
                        </div>

                        {/* Position Selector */}
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 uppercase block">Posición</label>
                          <div className="flex gap-2 bg-slate-800 rounded-lg p-1 border border-slate-600">
                            {['top', 'center', 'bottom'].map((pos) => (
                              <button
                                key={pos}
                                onClick={() => setNewTextPosition(pos)}
                                className={`flex-1 py-1 px-2 rounded-md text-xs font-medium capitalize transition-colors
                                  ${newTextPosition === pos
                                    ? 'bg-rose-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                              >
                                {pos === 'top' ? 'Arriba' : pos === 'center' ? 'Centro' : 'Abajo'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleSaveText}
                          className={`w-full py-2 border rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors
                            ${editingId
                              ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/50'
                              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/50'}`}
                        >
                          {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {editingId ? 'Actualizar Texto' : 'Agregar Texto'}
                        </button>
                      </div>

                      {/* Texts List */}
                      <div className="space-y-2">
                        {timedTexts.length === 0 ? (
                          <p className="text-center text-slate-500 text-sm py-4 italic">No hay textos agregados.</p>
                        ) : (
                          timedTexts.map(t => (
                            <div
                              key={t.id}
                              className={`p-3 rounded-lg border flex justify-between items-center group transition-all
                                ${editingId === t.id
                                  ? 'bg-blue-500/10 border-blue-500/50'
                                  : 'bg-slate-800/80 border-white/5 hover:border-white/20'}`}
                            >
                              <div>
                                <p className="font-medium text-white text-sm">{t.content}</p>
                                <p className="text-xs text-slate-400 font-mono mt-1">{t.start}s - {t.end}s</p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditText(t)}
                                  className={`p-2 rounded-lg transition-colors ${editingId === t.id ? 'text-blue-400 bg-blue-500/20' : 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10'}`}
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteText(t.id)}
                                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Download Section - Outside tabs so it's always visible if ready? Or inside? Keep outside/bottom */}
            <AnimatePresence>
              {downloadUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 shrink-0"
                >
                  <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2 text-sm">
                    ✅ ¡Listo!
                  </h3>
                  <a
                    href={downloadUrl}
                    download
                    className="block w-full text-center bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div >
    </div >
  );
}

export default App;
