import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onResult: (text: string) => void;
}

export function QrScanner({ onResult }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          onResult(decodedText);
        },
        () => {}
      )
      .catch((err) => {
        setError("Camera access denied. Please allow camera permissions.");
        console.error("QR Scanner error:", err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onResult]);

  return (
    <div>
      <div id="qr-reader" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden" />
      {error && <p className="text-destructive text-sm text-center mt-2">{error}</p>}
    </div>
  );
}
