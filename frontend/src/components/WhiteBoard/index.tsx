import React, { FC, useEffect, useState, useRef, useLayoutEffect, MutableRefObject } from "react";
import rough from "roughjs";
import { Point } from "roughjs/bin/geometry";

interface Element {
 type: string;
 offsetX: number;
 offsetY: number;
 width?: number; // Make width optional
 height?: number; // Make height optional
 stroke: string;
 path?: Point[];
}

interface WhiteBoardProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  ctxRef: React.RefObject<CanvasRenderingContext2D> |any;
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  tool: string;
  color: string;
  user: any;
  socket: any;
}

const roughGenerator = rough.generator();

const WhiteBoard: FC<WhiteBoardProps> = ({
  canvasRef,
  ctxRef,
  elements,
  setElements,
  tool,
  color,
  user,
  socket,
}) => {
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    socket.on("whiteBoardDataResponse", (data: { imgURL: string }) => {
      setImg(data.imgURL);
    });
  }, []);

  if (!user?.presenter) {
    return (
      <div className="border border-dark border-3 h-100 w-100 overflow-hidden">
        <img
          src={img?? undefined}
          alt="Real time white board image shared by presenter"
          style={{
            height: window.innerHeight * 2,
            width: "285%",
          }}
        />
      </div>
    );
  }

  const [isDrawing, setIsDrawing] = useState<boolean>(false);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.height = window.innerHeight * 2;
      canvas.width = window.innerWidth * 2;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctxRef.current=ctx;
      }
    }
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  useLayoutEffect(() => {
    if (canvasRef.current) {
      const roughCanvas = rough.canvas(canvasRef.current);

      //CLEAR PREVIOUS ELEMENTS FOR LINE AND RECTANGLE
      if (elements.length > 0) {
        if (ctxRef.current) {
          ctxRef.current.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      }

      elements.forEach((element) => {
        if (element.type === "rect") {
          roughCanvas.draw(
            roughGenerator.rectangle(
              element.offsetX,
              element.offsetY,
              element.width || 0,
              element.height || 0,
              {
                stroke: element.stroke,
                strokeWidth: 5,
                roughness: 0,
              }
            )
          );
        } else if (element.type === "line") {
          roughCanvas.draw(
            roughGenerator.line(
              element.offsetX,
              element.offsetY,
              element.width || 0,
              element.height || 0,
              {
                stroke: element.stroke,
                strokeWidth: 5,
                roughness: 0,
              }
            )
          );
        } else if (element.type === "pencil") {
          roughCanvas.linearPath(element.path!.map(point => ({x: point[0], y: point[1]})) as unknown as Point[], {
            stroke: element.stroke,
            strokeWidth: 5,
            roughness: 0,
          });
        }
      });

      if (canvasRef.current) {
        const canvasImage = canvasRef.current.toDataURL();
        socket.emit("whiteboardData", canvasImage);
      }
    }
  }, [elements]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "pencil") {
      setElements((prevElements) => [
        ...prevElements,
        {
          type: "pencil",
          offsetX,
          offsetY,
          path: [[offsetX, offsetY]],
          stroke: color,
        },
      ]);
    } else if (tool === "line") {
      setElements((prevElements) => [
        ...prevElements,
        {
          type: "line",
          offsetX,
          offsetY,
          width: offsetX,
          height: offsetY,
          stroke: color,
        },
      ]);
    } else if (tool === "rect") {
      setElements((prevElements) => [
        ...prevElements,
        {
          type: "rect",
          offsetX,
          offsetY,
          width: 0,
          height: 0,
          stroke: color,
        },
      ]);
    }

    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;

    if (isDrawing) {
      if (tool === "pencil") {
        const { path } = elements[elements.length - 1];
        const newPath = [...path!, [offsetX, offsetY]];
        setElements((prevElements) =>
          prevElements.map((ele, index) => {
            if (index === elements.length - 1) {
              return {
                ...ele,
                path: newPath.map(point => ({x: point[0], y: point[1]})) as unknown as Point[],
              };
            } else {
              return ele;
            }
          })
        );
      } else if (tool === "line") {
        setElements((prevElements) =>
          prevElements.map((ele, index) => {
            if (index === elements.length - 1) {
              return {
                ...ele,
                width: offsetX,
                height: offsetY,
              };
            } else {
              return ele;
            }
          })
        );
      } else if (tool === "rect") {
        setElements((prevElements) =>
          prevElements.map((ele, index) => {
            if (index === elements.length - 1) {
              return {
                ...ele,
                width: offsetX - ele.offsetX,
                height: offsetY - ele.offsetY,
              };
            } else {
              return ele;
            }
          })
        );
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDrawing(false);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="border border-dark border-3 h-100 w-100 overflow-hidden"
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default WhiteBoard;