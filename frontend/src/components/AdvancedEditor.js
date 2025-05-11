import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Line, Rect } from 'react-konva';
import useImage from 'use-image';

const AdvancedEditor = ({ 
  image,
  prompt,
  onGenerateInpaint,
  onSave,
  className 
}) => {
  const [tool, setTool] = useState('brush');
  const [lines, setLines] = useState([]);
  const [brushSize, setBrushSize] = useState(20);
  const [color, setColor] = useState('#000000');
  const [eraseMode, setEraseMode] = useState(false);
  const [maskLayer, setMaskLayer] = useState(true);
  const [imageLayer, setImageLayer] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [selectionRect, setSelectionRect] = useState(null);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Load the image
  const [konvaImage] = useImage(image?.url || '');
  
  // Update stage size when container or image changes
  useEffect(() => {
    if (containerRef.current && konvaImage) {
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      // Calculate scale to fit the image into the container
      const scaleX = containerWidth / konvaImage.width;
      const scaleY = containerHeight / konvaImage.height;
      const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up more than 1
      
      setStageSize({
        width: containerWidth,
        height: containerHeight
      });
      setScale(newScale);
      
      // Center the image
      setPosition({
        x: (containerWidth - konvaImage.width * newScale) / 2,
        y: (containerHeight - konvaImage.height * newScale) / 2
      });
    }
  }, [containerRef, konvaImage]);
  
  // Handle mouse down
  const handleMouseDown = (e) => {
    if (tool === 'select') {
      const pos = e.target.getStage().getPointerPosition();
      setSelectionStart({
        x: (pos.x - position.x) / scale,
        y: (pos.y - position.y) / scale
      });
      setSelectionRect({
        x: (pos.x - position.x) / scale,
        y: (pos.y - position.y) / scale,
        width: 0,
        height: 0
      });
      return;
    }
    
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'brush' || tool === 'eraser') {
      setLines([...lines, { 
        tool: tool === 'eraser' ? 'eraser' : 'brush',
        points: [(pos.x - position.x) / scale, (pos.y - position.y) / scale],
        brushSize,
        color: tool === 'eraser' ? '#ffffff' : color
      }]);
    }
  };
  
  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    if (tool === 'select') {
      const newSelectionRect = {
        x: selectionStart.x,
        y: selectionStart.y,
        width: (point.x - position.x) / scale - selectionStart.x,
        height: (point.y - position.y) / scale - selectionStart.y
      };
      setSelectionRect(newSelectionRect);
      return;
    }
    
    if (tool === 'brush' || tool === 'eraser') {
      let lastLine = lines[lines.length - 1];
      // Add point to the last line
      lastLine.points = lastLine.points.concat([
        (point.x - position.x) / scale,
        (point.y - position.y) / scale
      ]);
      
      // Replace the last line
      const newLines = [...lines];
      newLines[lines.length - 1] = lastLine;
      setLines(newLines);
    }
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    isDrawing.current = false;
  };
  
  // Clear the mask
  const clearMask = () => {
    setLines([]);
    setSelectionRect(null);
  };
  
  // Handle zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale
    };
    
    // Handle zoom in/out
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    // Limit minimum and maximum scale
    const limitedScale = Math.min(Math.max(newScale, 0.1), 5);
    
    // Calculate new position
    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale
    };
    
    setScale(limitedScale);
    setPosition(newPos);
  };
  
  // Export the mask
  const exportMask = () => {
    if (!konvaImage) return null;
    
    // Create a canvas for the mask
    const canvas = document.createElement('canvas');
    canvas.width = konvaImage.width;
    canvas.height = konvaImage.height;
    const ctx = canvas.getContext('2d');
    
    // Fill with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw black lines and shapes for the mask
    lines.forEach(line => {
      if (line.tool === 'brush') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = line.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        for (let i = 0; i < line.points.length; i += 2) {
          const x = line.points[i];
          const y = line.points[i + 1];
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      } else if (line.tool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = line.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        for (let i = 0; i < line.points.length; i += 2) {
          const x = line.points[i];
          const y = line.points[i + 1];
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }
    });
    
    // Draw the selection rectangle if there's one
    if (selectionRect) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(
        selectionRect.x,
        selectionRect.y,
        selectionRect.width,
        selectionRect.height
      );
    }
    
    return canvas.toDataURL();
  };
  
  // Handle inpainting
  const handleInpaint = () => {
    if (onGenerateInpaint) {
      const maskUrl = exportMask();
      onGenerateInpaint(prompt, maskUrl);
    }
  };
  
  // Handle saving
  const handleSave = () => {
    if (onSave) {
      const stage = stageRef.current;
      const dataUrl = stage.toDataURL();
      onSave(dataUrl);
    }
  };
  
  return (
    <div className={`advanced-editor ${className || ''}`}>
      <div className="editor-toolbar">
        <div className="tool-group">
          <button 
            className={`tool-button ${tool === 'brush' ? 'active' : ''}`}
            onClick={() => setTool('brush')}
            title="Brush Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </button>
          
          <button 
            className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </button>
          
          <button 
            className={`tool-button ${tool === 'select' ? 'active' : ''}`}
            onClick={() => setTool('select')}
            title="Selection Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>
          </button>
        </div>
        
        <div className="brush-size-control">
          <label>Brush Size: {brushSize}px</label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))} 
          />
        </div>
        
        <div className="layer-controls">
          <div className="layer-toggle">
            <input 
              type="checkbox" 
              id="image-layer" 
              checked={imageLayer} 
              onChange={() => setImageLayer(!imageLayer)} 
            />
            <label htmlFor="image-layer">Image Layer</label>
          </div>
          
          <div className="layer-toggle">
            <input 
              type="checkbox" 
              id="mask-layer" 
              checked={maskLayer} 
              onChange={() => setMaskLayer(!maskLayer)} 
            />
            <label htmlFor="mask-layer">Mask Layer</label>
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            className="editor-button danger-button"
            onClick={clearMask}
            title="Clear Mask"
          >
            Clear
          </button>
          
          <button 
            className="editor-button"
            onClick={handleSave}
            title="Save Image"
          >
            Save
          </button>
          
          <button 
            className="editor-button primary-button"
            onClick={handleInpaint}
            disabled={!prompt}
            title="Generate Inpainting"
          >
            Inpaint
          </button>
        </div>
      </div>
      
      <div className="editor-canvas-container" ref={containerRef}>
        {konvaImage ? (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Background layer */}
            <Layer>
              <Rect
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
                fill="#18191c"
              />
            </Layer>
            
            {/* Image layer */}
            {imageLayer && (
              <Layer>
                <Image
                  image={konvaImage}
                  x={position.x}
                  y={position.y}
                  scaleX={scale}
                  scaleY={scale}
                />
              </Layer>
            )}
            
            {/* Mask layer */}
            {maskLayer && (
              <Layer>
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke={line.color}
                    strokeWidth={line.brushSize * (line.tool === 'eraser' ? 1.2 : 1)}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      line.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                    x={position.x}
                    y={position.y}
                    scaleX={scale}
                    scaleY={scale}
                  />
                ))}
                
                {selectionRect && (
                  <Rect
                    x={selectionRect.x * scale + position.x}
                    y={selectionRect.y * scale + position.y}
                    width={selectionRect.width * scale}
                    height={selectionRect.height * scale}
                    fill="rgba(0, 0, 0, 0.5)"
                    stroke="#ffffff"
                    strokeWidth={1 / scale}
                  />
                )}
              </Layer>
            )}
          </Stage>
        ) : (
          <div className="empty-canvas">
            <p>No image loaded</p>
          </div>
        )}
      </div>
      
      <div className="editor-prompt-container">
        <input
          type="text"
          className="prompt-input"
          placeholder="Describe what to generate in masked areas..."
          value={prompt}
          onChange={(e) => onGenerateInpaint(e.target.value, null)}
        />
      </div>
    </div>
  );
};

export default AdvancedEditor;
