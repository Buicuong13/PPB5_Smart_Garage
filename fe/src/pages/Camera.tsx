import React, { useEffect, useState } from "react";
import clsx from "clsx";

function Camera() {
    const [hiddenButton, setHiddenButton] = useState<boolean>(false);
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const [imgSrc, setImgSrc] = useState<string>("");
    useEffect(() => {
        const storedShowCamera = localStorage.getItem("showCamera") === "true";
        const storedImgSrc = localStorage.getItem("imgSrc") || "";
        setShowCamera(storedShowCamera);
        setImgSrc(storedImgSrc);
    }, []);
    const handleOnclick = async () => {
        if (showCamera) {
            try {
                const response = await fetch("http://127.0.0.1:8000/stop_camera");
                if (!response.ok) {
                    console.error("Error stopping the camera");
                }
                setImgSrc("");
                localStorage.removeItem("imgSrc");
            } catch (error) {
                console.error("Connection error to the server:", error);
            }
        } else {
            const newImgSrc = `http://127.0.0.1:8000/video_feed?timestamp=${Date.now()}`;
            setImgSrc(newImgSrc);
            localStorage.setItem("imgSrc", newImgSrc);
            setHiddenButton(true);
        }

        setShowCamera(!showCamera);
        localStorage.setItem("showCamera", (!showCamera).toString());
    };

    return (
        <div className="my-2 flex flex-col gap-y-2">
            {showCamera && imgSrc && (
                <div className="flex justify-center">
                    <img
                        src={imgSrc}
                        alt="Camera Stream"
                        className="flex-1 mx-24 h-[90vh]"
                        onLoad={() => setHiddenButton(false)}
                    />
                </div>
            )}
            <div className={clsx("text-center", { hidden: hiddenButton })}>
                <button
                    onClick={handleOnclick}
                    className="bg-red-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-red-600 transition duration-300 cursor-pointer"
                >
                    {showCamera ? "📷 Turn Off Camera" : "🎥 Turn On Camera"}
                </button>
            </div>
        </div>
    );
}

export default Camera;
