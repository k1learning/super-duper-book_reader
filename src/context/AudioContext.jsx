import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AudioContext = createContext(null);

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export function AudioProvider({ children }) {
    const [track, setTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [volume, setVolume] = useState(1);
    const [minimized, setMinimized] = useState(false);
    const progressIntervalRef = useRef(null);

    const startTrack = useCallback((book) => {
        setTrack(book ? { title: book.title, author: book.author || 'Unknown', coverUrl: book.coverUrl } : null);
        if (book) {
            setCurrentTime(0);
            setDuration(300);
            setIsPlaying(false);
        }
    }, []);

    const togglePlay = useCallback(() => {
        setIsPlaying((p) => {
            const next = !p;
            if (next && track) {
                progressIntervalRef.current = setInterval(() => {
                    setCurrentTime((t) => {
                        const d = 300;
                        if (t >= d) {
                            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                            return d;
                        }
                        return t + 1;
                    });
                }, 1000 / speed);
            } else if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            return next;
        });
    }, [track, speed]);

    const seek = useCallback((time) => {
        setCurrentTime(Math.max(0, Math.min(time, duration || 300)));
    }, [duration]);

    const rewind = useCallback(() => {
        setCurrentTime((t) => Math.max(0, t - 15));
    }, []);

    const forward = useCallback(() => {
        setCurrentTime((t) => Math.min(duration || 300, t + 15));
    }, [duration]);

    const changeSpeed = useCallback(() => {
        setSpeed((s) => {
            const idx = SPEED_OPTIONS.indexOf(s);
            const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
            if (isPlaying && progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = setInterval(() => {
                    setCurrentTime((t) => {
                        const d = 300;
                        if (t >= d) {
                            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                            return d;
                        }
                        return t + 1;
                    });
                }, 1000 / next);
            }
            return next;
        });
    }, [isPlaying]);

    const value = {
        track,
        startTrack,
        isPlaying,
        togglePlay,
        currentTime,
        duration: duration || 300,
        seek,
        rewind,
        forward,
        speed,
        changeSpeed,
        volume,
        setVolume,
        minimized,
        setMinimized,
        visible: !!track,
    };
    return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
    const ctx = useContext(AudioContext);
    if (!ctx) throw new Error('useAudio must be used within AudioProvider');
    return ctx;
}

export { SPEED_OPTIONS };
