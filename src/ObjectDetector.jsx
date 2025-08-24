import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";

function ObjectDetector() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  // Load the model and start the camera
  useEffect(() => {
    async function setupCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }

    async function loadModel() {
      const loadedModel = await cocossd.load();
      setModel(loadedModel);
      setLoading(false);
    }

    setupCamera();
    loadModel();
  }, []);

  // Function to process a single captured frame
  const processFrame = async () => {
    if (model && videoRef.current) {
      // Pause the live video
      setIsLive(false);
      videoRef.current.pause();

      // Get predictions from the paused video frame
      const predictions = await model.detect(videoRef.current);
      drawPredictions(predictions);
    }
  };

  // Function to draw the bounding boxes on the canvas
  const drawPredictions = (predictions) => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    const { videoWidth, videoHeight } = videoRef.current;

    // Set canvas dimensions to match video
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    // First, draw the video frame onto the canvas to create a static image
    ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

    // Now, draw the detection results on top of the image
    ctx.font = "16px Arial";
    ctx.textBaseline = "top";

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;

      // Draw bounding box
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw label
      ctx.fillStyle = "#00FFFF";
      const text = `${prediction.class} (${Math.round(
        prediction.score * 100
      )}%)`;
      ctx.fillText(text, x, y > 15 ? y - 15 : 10);
    });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "640px",
        margin: "auto",
      }}
    >
      <h1>Single Frame Object Detector</h1>
      {loading ? (
        <p>Loading model...</p>
      ) : (
        <>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "auto",
              display: isLive ? "block" : "none",
            }}
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "auto",
              display: isLive ? "none" : "block",
            }}
          />
          <button
            onClick={processFrame}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Capture and Detect
          </button>
          <button
            onClick={() => {
              setIsLive(true);
              videoRef.current.play();
            }}
            style={{
              marginTop: "10px",
              marginLeft: "10px",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Go Live
          </button>
        </>
      )}
    </div>
  );
}

export default ObjectDetector;
