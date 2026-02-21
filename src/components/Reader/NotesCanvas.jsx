import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Pen, Eraser, Trash2 } from 'lucide-react';
import { getCanvasNotes, saveCanvasNotes } from '../../db';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const AUTO_SAVE_MS = 2500;
const PEN_COLOR = '#374151';
const PEN_WIDTH = 2;
const ERASER_WIDTH = 24;

export default function NotesCanvas({ bookId, onClose }) {
    const [mode, setMode] = useState('text');
    const [tool, setTool] = useState('pen');
    const [text, setText] = useState('');
    const [strokes, setStrokes] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const textRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef(null);

    const load = useCallback(async () => {
        if (!bookId) return;
        const data = await getCanvasNotes(bookId);
        if (data) {
            setText(data.text ?? '');
            setStrokes(data.strokes ?? []);
        } else {
            setText('');
            setStrokes([]);
        }
        setLoaded(true);
    }, [bookId]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (loaded && textRef.current && mode === 'text') {
            textRef.current.innerHTML = text || '';
        }
    }, [loaded, bookId, mode]);

    const scheduleSave = useCallback(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            if (!bookId) return;
            await saveCanvasNotes(bookId, { text, strokes });
            saveTimeoutRef.current = null;
        }, AUTO_SAVE_MS);
    }, [bookId, text, strokes]);

    useEffect(() => {
        if (!loaded) return;
        scheduleSave();
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [text, strokes, loaded, scheduleSave]);

    const handleTextInput = () => {
        if (!textRef.current) return;
        setText(textRef.current.innerHTML);
    };

    const handleClear = () => {
        if (!window.confirm('Clear all notes and drawings?')) return;
        setText('');
        setStrokes([]);
        if (textRef.current) textRef.current.innerHTML = '';
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    const getCanvasPoint = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e) => {
        if (mode !== 'draw') return;
        const p = getCanvasPoint(e);
        if (!p) return;
        isDrawingRef.current = true;
        currentStrokeRef.current = {
            tool,
            color: tool === 'pen' ? PEN_COLOR : '#fafafa',
            lineWidth: tool === 'pen' ? PEN_WIDTH : ERASER_WIDTH,
            points: [p],
        };
    };

    const moveDrawing = (e) => {
        if (!isDrawingRef.current || !currentStrokeRef.current) return;
        const p = getCanvasPoint(e);
        if (!p) return;
        currentStrokeRef.current.points.push(p);
        redrawCanvas();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const s = currentStrokeRef.current;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (s.tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
        else ctx.globalCompositeOperation = 'source-over';
        const pts = s.points;
        if (pts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
            ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        if (!isDrawingRef.current || !currentStrokeRef.current) return;
        const stroke = currentStrokeRef.current;
        if (stroke.points.length > 0) {
            setStrokes((prev) => [...prev, { ...stroke }]);
        }
        isDrawingRef.current = false;
        currentStrokeRef.current = null;
    };

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        strokes.forEach((s) => {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.lineWidth;
            ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.beginPath();
            s.points.forEach((pt, i) => {
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
        });
        ctx.globalCompositeOperation = 'source-over';
        if (currentStrokeRef.current) {
            const s = currentStrokeRef.current;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.lineWidth;
            if (s.tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            s.points.forEach((pt, i) => {
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
        }
    }, [strokes]);

    useEffect(() => {
        if (!loaded) return;
        redrawCanvas();
    }, [loaded, strokes.length, redrawCanvas]);

    useEffect(() => {
        if (mode !== 'draw' || !loaded) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        redrawCanvas();
    }, [mode, loaded, redrawCanvas]);

    if (!bookId) return null;

    return (
        <div className="notes-canvas" ref={containerRef}>
            <div className="notes-canvas-header">
                <div className="notes-canvas-mode-toggle">
                    <button
                        type="button"
                        className={mode === 'text' ? 'active' : ''}
                        onClick={() => setMode('text')}
                        aria-label="Text mode"
                    >
                        <Type size={18} /> Text
                    </button>
                    <button
                        type="button"
                        className={mode === 'draw' ? 'active' : ''}
                        onClick={() => setMode('draw')}
                        aria-label="Draw mode"
                    >
                        <Pen size={18} /> Draw
                    </button>
                </div>
                <div className="notes-canvas-tools">
                    {mode === 'draw' && (
                        <>
                            <button
                                type="button"
                                className={tool === 'pen' ? 'active' : ''}
                                onClick={() => setTool('pen')}
                                aria-label="Pen"
                            >
                                <Pen size={18} />
                            </button>
                            <button
                                type="button"
                                className={tool === 'eraser' ? 'active' : ''}
                                onClick={() => setTool('eraser')}
                                aria-label="Eraser"
                            >
                                <Eraser2 size={18} />
                            </button>
                        </>
                    )}
                    <button type="button" onClick={handleClear} aria-label="Clear all" className="notes-canvas-clear">
                        <Trash2 size={18} /> Clear
                    </button>
                </div>
            </div>
            <div className="notes-canvas-body">
                {mode === 'text' && (
                    <div
                        ref={textRef}
                        className="notes-canvas-text"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleTextInput}
                    />
                )}
                {mode === 'draw' && (
                    <div className="notes-canvas-draw-wrap">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            className="notes-canvas-draw"
                            onMouseDown={startDrawing}
                            onMouseMove={moveDrawing}
                            onMouseUp={endDrawing}
                            onMouseLeave={endDrawing}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                startDrawing(e.touches[0]);
                            }}
                            onTouchMove={(e) => {
                                e.preventDefault();
                                moveDrawing(e.touches[0]);
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                endDrawing();
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
