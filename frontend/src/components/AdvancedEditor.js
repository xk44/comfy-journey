import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Line, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

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
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isFlippedX, setIsFlippedX] = useState(false);
  const [isFlippedY, setIsFlippedY] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [filter, setFilter] = useState('none');
  
  // Refs
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const transformerRef = useRef(null);
   
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

  // Update transformer when cropMode or cropRect changes
  useEffect(() => {
    if (cropMode && cropRect && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [cropMode, cropRect]);
   
  // Handle mouse down 
  const handleMouseDown = (e) => { 
    if (cropMode) {
      return; // Don't handle mouse events in crop mode
    }

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
    if (cropMode) {
      return; // Don't handle mouse events in crop mode
    }
    
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
    if (cropMode) {
      return; // Don't handle wheel events in crop mode
    }
    
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
      const imgUrl = stageRef.current.toDataURL();
      onGenerateInpaint(prompt, maskUrl, imgUrl);
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

  // Toggle crop mode
  const toggleCropMode = () => {
    if (cropMode) {
      // Apply crop
      if (cropRect && konvaImage) {
        // Logic for applying crop would go here
        // For now, we'll just turn off crop mode
        setCropMode(false);
        setCropRect(null);
      } else {
        setCropMode(false);
      }
    } else {
      // Enter crop mode
      if (konvaImage) {
        setCropMode(true);
        setCropRect({
          x: 0,
          y: 0,
          width: konvaImage.width,
          height: konvaImage.height
        });
      }
    }
  };

  // Handle rotation
  const handleRotate = (direction = 'right') => {
    setRotation(prev => {
      const newRotation = direction === 'right' ? prev + 90 : prev - 90;
      return newRotation % 360;
    });
  };

  // Handle flip
  const handleFlip = (axis) => {
    if (axis === 'x') {
      setIsFlippedX(!isFlippedX);
    } else if (axis === 'y') {
      setIsFlippedY(!isFlippedY);
    }
  };

  // Handle transformer change
  const handleTransformerChange = () => {
    if (imageRef.current) {
      const node = imageRef.current;
      setCropRect({
        x: node.x(),
        y: node.y(),
        width: node.width() * node.scaleX(),
        height: node.height() * node.scaleY()
      });
    }
  };

  // Apply filter
  const getFilterStyle = () => {
    let filterStr = '';
    
    if (brightness !== 0) {
      filterStr += `brightness(${100 + brightness * 2}%) `;
    }
    
    if (contrast !== 0) {
      filterStr += `contrast(${100 + contrast * 2}%) `;
    }
    
    if (saturation !== 0) {
      filterStr += `saturate(${100 + saturation * 2}%) `;
    }

    if (filter !== 'none') {
      switch (filter) {
        case 'grayscale':
          filterStr += 'grayscale(100%) ';
          break;
        case 'sepia':
          filterStr += 'sepia(80%) ';
          break;
        case 'blur':
          filterStr += 'blur(3px) ';
          break;
        case 'invert':
          filterStr += 'invert(100%) ';
          break;
        default:
          break;
      }
    }
    
    return filterStr.trim();
  };

  const resetFilters = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setFilter('none');
    setRotation(0);
    setIsFlippedX(false);
    setIsFlippedY(false);
  };

  return (
    <div className="advanced-editor-container">
      <div className="advanced-editor-toolbar">
        <div className="advanced-editor-toolbar-group">
          <button
            className={`advanced-editor-btn ${tool === 'brush' ? 'active' : ''}`}
            onClick={() => { setTool('brush'); setCropMode(false); }}
            title="Brush Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </button>
          
          <button
            className={`advanced-editor-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => { setTool('eraser'); setCropMode(false); }}
            title="Eraser Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </button>
          
          <button
            className={`advanced-editor-btn ${tool === 'select' ? 'active' : ''}`}
            onClick={() => { setTool('select'); setCropMode(false); }}
            title="Selection Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>
          </button>
        </div>
        
        <div className="advanced-editor-toolbar-group">
          <button
            className={`advanced-editor-btn ${cropMode ? 'active' : ''}`}
            onClick={toggleCropMode}
            title="Crop Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </button>
          
          <button
            className="advanced-editor-btn"
            onClick={() => handleRotate('right')}
            title="Rotate Right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          
          <button
            className="advanced-editor-btn"
            onClick={() => handleFlip('x')}
            title="Flip Horizontal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </button>
          
          <button
            className="advanced-editor-btn"
            onClick={() => handleFlip('y')}
            title="Flip Vertical"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </button>
        </div>
        
        <div className="advanced-editor-toolbar-group">
          <button
            className={`advanced-editor-btn ${showColorPanel ? 'active' : ''}`}
            onClick={() => setShowColorPanel(!showColorPanel)}
            title="Adjust Colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </button>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="advanced-editor-filter-select"
            title="Apply Filter"
          >
            <option value="none">No Filter</option>
            <option value="grayscale">Grayscale</option>
            <option value="sepia">Sepia</option>
            <option value="blur">Blur</option>
            <option value="invert">Invert</option>
          </select>
          
          <button
            className="advanced-editor-btn"
            onClick={resetFilters}
            title="Reset All Adjustments"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
        
        <div className="advanced-editor-toolbar-group">
          <div className="brush-size-control">
            <label>Size: {brushSize}px</label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))} 
            />
          </div>
        </div>
        
        <div className="advanced-editor-toolbar-group">
          <button
            className="advanced-editor-btn"
            onClick={clearMask}
            title="Clear Mask"
          >
            Clear
          </button>
          
          <button
            className="advanced-editor-btn"
            onClick={handleSave}
            title="Save Image"
          >
            Save
          </button>
          
          <button
            className="advanced-editor-btn primary-button"
            onClick={handleInpaint}
            disabled={!prompt}
            title="Generate Inpainting"
          >
            Inpaint
          </button>
        </div>
      </div>
      
      <div className="advanced-editor-main">
        <div className="advanced-editor-canvas-container" ref={containerRef}>
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
                    ref={imageRef}
                    image={konvaImage}
                    x={position.x}
                    y={position.y}
                    scaleX={scale * (isFlippedX ? -1 : 1)}
                    scaleY={scale * (isFlippedY ? -1 : 1)}
                    rotation={rotation}
                    offsetX={konvaImage.width / 2}
                    offsetY={konvaImage.height / 2}
                    x={position.x + (konvaImage.width * scale) / 2}
                    y={position.y + (konvaImage.height * scale) / 2}
                    filters={[
                      Konva.Filters.Brighten,
                      Konva.Filters.Contrast,
                      Konva.Filters.HSL
                    ]}
                    brightness={brightness / 100}
                    contrast={contrast / 100}
                    saturation={saturation / 100}
                  />
                  
                  {cropMode && (
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        // Limit the minimum size
                        if (newBox.width < 10 || newBox.height < 10) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                      onTransform={handleTransformerChange}
                      onTransformEnd={handleTransformerChange}
                    />
                  )}
                </Layer>
              )}
              
              {/* Mask layer */}
              {maskLayer && !cropMode && (
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
        
        {showColorPanel && (
          <div className="color-panel">
            <h3>Color Adjustments</h3>
            
            <div className="advanced-editor-slider">
              <label>
                <span>Brightness</span>
                <span>{brightness}%</span>
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
              />
            </div>
            
            <div className="advanced-editor-slider">
              <label>
                <span>Contrast</span>
                <span>{contrast}%</span>
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
              />
            </div>
            
            <div className="advanced-editor-slider">
              <label>
                <span>Saturation</span>
                <span>{saturation}%</span>
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
              />
            </div>
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