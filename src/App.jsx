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

  // Helper: Show temporary message
  const showMessage = (text, error = false) => {
    setMessage(text);
    setIsError(error);
    setTimeout(() => {
      setMessage("");
      setIsError(false);
    }, 3000);
  };

  // Load scripts
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
            setShowSplash(false); // Hide splash after model loads
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

  // Start webcam with facingMode
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
      // console.error("Recognition error:", err);
      // setRecognitionResult({
      //   name: "Error recognizing image.",
      //   confidence: null,
      // });
    }

    animationFrameRef.current = requestAnimationFrame(recognizeImage);
  };

  // Button handlers
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
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
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
      {/* Message Box */}
      {message && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg ${
            isError
              ? "bg-red-500 text-white"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          }`}
        >
          {message}
        </div>
      )}

      {/* Camera Section (75% height) */}
      <div className="relative w-full h-[75vh] bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        ></video>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-dashed border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Controls & Results (25% height) */}
      <div className="flex-1 w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl p-4 sm:p-6 overflow-y-auto">
        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {!isRecognizing ? (
            <button
              onClick={startRecognition}
              disabled={isLoading}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              ▶️ Start
            </button>
          ) : (
            <button
              onClick={stopRecognition}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition"
            >
              ⏹ Stop
            </button>
          )}

          <button
            onClick={flipCamera}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition"
          >
            🔄 Flip
          </button>
        </div>

        {/* Results */}
        <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow-inner border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Recognition Results
          </h2>
          <div className="text-gray-700 dark:text-gray-300 min-h-[50px] text-center">
            {recognitionResult.name ? (
              <>
                <p className="text-base sm:text-lg font-bold">Detected:</p>
                <p className="text-xl font-semibold">
                  {recognitionResult.name}
                </p>
              </>
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
