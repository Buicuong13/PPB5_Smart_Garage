import React, { useState, useEffect, useRef } from "react";

const DetectFace = () => {
  const [isVideoStarted, setIsVideoStarted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        wsRef.current = new WebSocket(
          `ws://localhost:8000/ws/face_recognition/${localStorage.getItem(
            "username"
          )}`
        );
        wsRef.current.onmessage = (event) => {
          console.log("✅ Server response:", event.data);
        };
        let lastFrameTime = 0;

        const sendFrame = (timestamp: number) => {
          if (!isVideoStarted) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          // Chỉ gửi frame mỗi 1000ms (1 FPS)
          if (timestamp - lastFrameTime >= 1000) {
            lastFrameTime = timestamp;

            if (video && video.videoWidth && video.videoHeight && context) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              canvas.toBlob(
                (blob) => {
                  if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(blob);
                  }
                },
                "image/jpeg",
                0.7
              );
            }
          }

          animationFrameId = requestAnimationFrame(sendFrame);
        };

        animationFrameId = requestAnimationFrame(sendFrame);
      } catch (err) {
        console.error("🚨 Error accessing webcam:", err);
      }
    };

    if (isVideoStarted) {
      start();
    }

    return () => {
      // Dừng animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Đóng stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Đóng WebSocket
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Xóa video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isVideoStarted]);

  const handleStartVideo = () => {
    setIsVideoStarted(true);
  };
  const handleStopVideo = () => {
    // Dừng tất cả các track media
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Đóng kết nối WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Cập nhật trạng thái
    setIsVideoStarted(false);

    // Xóa srcObject của video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 mt-2">
      {isVideoStarted && <video ref={videoRef} autoPlay playsInline />}

      <div className="flex gap-4">
        {isVideoStarted ? (
          <button
            onClick={handleStopVideo}
            className="bg-gray-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-gray-600 transition duration-300 cursor-pointer"
          >
            Stop Recognize
          </button>
        ) : (
          <button
            onClick={handleStartVideo}
            className="bg-red-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-red-600 transition duration-300 cursor-pointer"
          >
            Start Recognize
          </button>
        )}
      </div>
    </div>
  );
};

export default DetectFace;
