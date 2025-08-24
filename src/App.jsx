import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Loader from "./Loader";

const App = () => {
  const [model, setModel] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState({
    name: null,
    confidence: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [showSplash, setShowSplash] = useState(true);

  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);

  const showMessage = (text, error = false) => {
    setMessage(text);
    setIsError(error);
    setTimeout(() => {
      setMessage("");
      setIsError(false);
    }, 3000);
  };

  // Load TensorFlow scripts
  useEffect(() => {
    const loadScript = (src, cb) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = cb;
      script.onerror = () => showMessage(`Error loading script: ${src}`, true);
      document.body.appendChild(script);
    };

    showMessage("Sit back, we’re preparing the best experience for you!");
    loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest", () => {
      loadScript(
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@1.0.0",
        () => {
          setScriptsLoaded(true);
          showMessage("Get ready for the best experience!");
        }
      );
    });
  }, []);

  // Load MobileNet model
  useEffect(() => {
    if (scriptsLoaded) {
      const loadModel = async () => {
        try {
          showMessage("Sit back, we’re preparing the best experience for you!");
          const mobilenet = window.mobilenet;
          if (mobilenet) {
            const loadedModel = await mobilenet.load();
            setModel(loadedModel);
            setIsLoading(false);
            showMessage("All set! The AI model is loaded and ready to go.");
            setShowSplash(false);
          }
        } catch (err) {
          console.error("Error loading model:", err);
          showMessage("Could not load the model. Try again.", true);
          setIsLoading(false);
          setShowSplash(false);
        }
      };
      loadModel();
    }
  }, [scriptsLoaded]);

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            animationFrameRef.current = requestAnimationFrame(recognizeImage);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        showMessage("Cannot access webcam. Check permissions.", true);
        setIsRecognizing(false);
      }
    };

    if (isRecognizing && model) {
      startWebcam();
    } else {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecognizing, model, facingMode]);

  // Recognition loop
  const recognizeImage = async () => {
    if (!model || !videoRef.current || !isRecognizing) return;

    try {
      const predictions = await model.classify(videoRef.current);
      const top = predictions[0];
      if (top.probability > 0.8) {
        setRecognitionResult({
          name: top.className,
          confidence: (top.probability * 100).toFixed(2),
        });
      } else {
        setRecognitionResult({
          name: null,
          confidence:
            "⚠️ Limited dataset: This AI app is still learning and may not give accurate results for this object.",
        });
      }
    } catch (err) {
      // ignore recognition error
    }

    animationFrameRef.current = requestAnimationFrame(recognizeImage);
  };

  const startRecognition = () => {
    setIsRecognizing(true);
    showMessage("Recognition started! Looking for objects...");
  };
  const stopRecognition = () => {
    setIsRecognizing(false);
    showMessage("Recognition stopped.");
  };
  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    showMessage("Camera flipped!");
  };

  return (
    <div>
      <header className="app-header">
        <h1 className="app-title">AI Object Recognition</h1>
        <p className="app-subtitle">Made with ❤️ by Nagesh Jaunjal</p>
      </header>
      {/* Splash */}
      {showSplash && (
        <div className="splash-screen">
          <h1 className="splash-title">Made with ❤️ by Nagesh Jaunjal</h1>
          <p className="splash-subtitle">
            This is an AI-based application for live object recognition.
          </p>
          <p className="splash-subtitle">
            Sit back, we’re preparing the best experience for you!
          </p>
          <div className="loader-wrapper">
            <Loader />
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`fixed-message ${isError ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {/* Camera */}
      <div className="camera-section">
        <video ref={videoRef} autoPlay playsInline />
        {isLoading && (
          <div className="camera-overlay">
            <div className="video-loader"></div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="button-group">
          {!isRecognizing ? (
            <button
              onClick={startRecognition}
              disabled={isLoading}
              className="start-btn"
            >
              ▶️ Start
            </button>
          ) : (
            <button onClick={stopRecognition} className="stop-btn">
              ⏹ Stop
            </button>
          )}
          <button onClick={flipCamera} className="flip-btn">
            🔄 Flip
          </button>
        </div>

        <div
          className={`results-card ${
            document.body.classList.contains("dark") ? "dark" : ""
          }`}
        >
          <h2>Recognition Results</h2>
          <div className="text-center min-h-[50px]">
            {recognitionResult.name ? (
              <>
                <p className="font-bold">Detected:</p>
                <p className="text-xl font-semibold">
                  {recognitionResult.name}
                </p>
              </>
            ) : recognitionResult.confidence &&
              recognitionResult.confidence.startsWith("⚠️") ? (
              <p className="limited-dataset">{recognitionResult.confidence}</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                {isLoading
                  ? "Sit back, we’re preparing the best experience for you!"
                  : "Looking for objects..."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
