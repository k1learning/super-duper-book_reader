import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Settings, Minimize2, Maximize2 } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function ProgressSlider({ currentTime, duration, onSeek }) {
    const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
    return (
        <div className="progress-slider-wrap">
            <span>{formatTime(currentTime)}</span>
            <input
                type="range"
                className="progress-slider"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
            />
            <span>{formatTime(duration)}</span>
        </div>
    );
}

function SpeedSelector({ speed, onChange }) {
    return (
        <button type="button" className="player-speed" onClick={onChange} title="Playback speed">
            {speed}x
        </button>
    );
}

function AudioControls({ isPlaying, onTogglePlay, onRewind, onForward, speed, onSpeedChange, currentTime, duration, onSeek }) {
    return (
        <div className="player-center">
            <div className="player-controls">
                <SpeedSelector speed={speed} onChange={onSpeedChange} />
                <button type="button" className="player-btn" onClick={onRewind} aria-label="Rewind 15s">
                    <SkipBack size={20} />
                </button>
                <button type="button" className="player-btn play-pause" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 2 }} />}
                </button>
                <button type="button" className="player-btn" onClick={onForward} aria-label="Forward 15s">
                    <SkipForward size={20} />
                </button>
            </div>
            <ProgressSlider currentTime={currentTime} duration={duration} onSeek={onSeek} />
        </div>
    );
}

export default function AudioPlayerBar() {
    const {
        visible,
        track,
        isPlaying,
        togglePlay,
        currentTime,
        duration,
        seek,
        rewind,
        forward,
        speed,
        changeSpeed,
        minimized,
        setMinimized,
    } = useAudio();

    if (!visible) return null;

    return (
        <div className={`audio-player-bar ${minimized ? 'minimized' : ''}`}>
            <div className="player-inner">
                <div className="player-left">
                    <img
                        src={track?.coverUrl || 'https://via.placeholder.com/44?text=📖'}
                        alt=""
                        className="player-thumb"
                    />
                    <div className="player-info">
                        <p className="player-title">{track?.title || 'No track'}</p>
                        <p className="player-author">{track?.author || ''}</p>
                    </div>
                </div>
                {!minimized && (
                    <AudioControls
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlay}
                        onRewind={rewind}
                        onForward={forward}
                        speed={speed}
                        onSpeedChange={changeSpeed}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={seek}
                    />
                )}
                {minimized && (
                    <button type="button" className="player-btn play-pause" onClick={togglePlay} style={{ marginLeft: 'auto' }}>
                        {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 2 }} />}
                    </button>
                )}
                <div className="player-right">
                    {!minimized && (
                        <>
                            <button type="button" className="player-btn" aria-label="Volume">
                                <Volume2 size={20} />
                            </button>
                            <button type="button" className="player-btn" aria-label="Settings">
                                <Settings size={18} />
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        className="player-btn"
                        onClick={() => setMinimized((m) => !m)}
                        aria-label={minimized ? 'Expand' : 'Minimize'}
                    >
                        {minimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
