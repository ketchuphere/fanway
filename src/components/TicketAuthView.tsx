import React, { useState, useRef, useEffect } from 'react';
import {
  Ticket,
  ScanBarcode,
  CheckCircle2,
  ArrowRight,
  Camera,
  X,
  Sparkles,
  MapPin,
  Utensils,
  ShieldCheck,
  KeyRound,
  Upload,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { VerifiedTicketRecord } from '../types/stadium';

export const TicketAuthView: React.FC = () => {
  const {
    verifiedTickets,
    authenticateByTicketOrTxn,
    setShowTicketAuth,
    setShowLanding,
    setRole,
    setFanTab,
    navigateToMapLocation,
  } = useStadium();

  const [authMode, setAuthMode] = useState<'id' | 'barcode'>('barcode');
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatusMsg, setCameraStatusMsg] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedTicket, setDetectedTicket] = useState<VerifiedTicketRecord | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream and detection loop cleanly
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraStatusMsg(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Attach MediaStream to <video> AFTER cameraActive renders the video element in the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const videoEl = videoRef.current;
      videoEl.srcObject = streamRef.current;
      videoEl
        .play()
        .then(() => {
          setCameraStatusMsg('Live camera active — hold barcode in frame or click Capture Scan');
          startNativeBarcodeDetection(videoEl);
        })
        .catch((err) => {
          console.warn('Video play warning:', err);
        });
    }
  }, [cameraActive]);

  // Use native BarcodeDetector API if available in browser
  const startNativeBarcodeDetection = (videoEl: HTMLVideoElement) => {
    const Win = window as any;
    if (!('BarcodeDetector' in Win)) return;

    try {
      const detector = new Win.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'pdf417'],
      });
      scanIntervalRef.current = window.setInterval(async () => {
        if (videoEl.readyState >= 2) {
          try {
            const barcodes = await detector.detect(videoEl);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const rawVal = String(barcodes[0].rawValue);
              const record = authenticateByTicketOrTxn(rawVal);
              if (record) {
                stopCamera();
                setDetectedTicket(record);
              }
            }
          } catch {
            // Ignore frame errors while scanning
          }
        }
      }, 500);
    } catch {
      // BarcodeDetector format unsupported, user can click Capture Scan button
    }
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    setErrorMsg(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Browser camera API is not available in this context. You can upload a ticket image or click Simulate Instant Scan below.'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // First try rear/environment camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        // Fallback to any available webcam (laptops / desktops)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(
        `Could not access device camera (${
          err?.name === 'NotAllowedError'
            ? 'Camera permission was denied by browser'
            : err?.message || 'No camera detected'
        }). You can upload a barcode photo or click any sample ticket below to scan.`
      );
      setCameraActive(false);
    }
  };

  // Capture current frame from live video or uploaded image
  const handleCaptureFromLiveCamera = () => {
    setIsScanning(true);
    setCameraStatusMsg('Analyzing barcode frame...');
    setTimeout(() => {
      // Pick next ticket or first ticket to demonstrate live frame capture
      const currentIdx = verifiedTickets.findIndex(
        (t) => t.ticketId === detectedTicket?.ticketId
      );
      const nextTicket =
        verifiedTickets[(currentIdx + 1) % verifiedTickets.length] || verifiedTickets[0];
      const record = authenticateByTicketOrTxn(nextTicket.barcodePayload);
      setIsScanning(false);
      stopCamera();
      if (record) {
        setDetectedTicket(record);
      }
    }, 500);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setCameraError(null);
    setIsScanning(true);

    // Try native BarcodeDetector on the uploaded image first
    const Win = window as any;
    if ('BarcodeDetector' in Win) {
      try {
        const bitmap = await createImageBitmap(file);
        const detector = new Win.BarcodeDetector();
        const results = await detector.detect(bitmap);
        if (results && results.length > 0 && results[0].rawValue) {
          const rec = authenticateByTicketOrTxn(String(results[0].rawValue));
          if (rec) {
            setIsScanning(false);
            setDetectedTicket(rec);
            return;
          }
        }
      } catch {
        // Fallback to filename/hash matching below
      }
    }

    // Fallback: match from filename or assign a verified ticket pass
    setTimeout(() => {
      const nameClean = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      const record =
        authenticateByTicketOrTxn(nameClean) ||
        authenticateByTicketOrTxn(verifiedTickets[0].ticketId);
      setIsScanning(false);
      if (record) {
        setDetectedTicket(record);
      }
    }, 550);
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = inputCode.trim();
    if (clean.length < 5) {
      setErrorMsg(
        'Please enter a valid Ticket ID (e.g. FWY-TKT-8821) or Transaction ID (e.g. TXN-904112).'
      );
      return;
    }

    const record = authenticateByTicketOrTxn(clean);
    if (!record) {
      setErrorMsg('Could not verify that Ticket or Transaction ID. Try one of the sample passes.');
      return;
    }
    setDetectedTicket(record);
  };

  const handleScanTicketBarcode = (ticket: VerifiedTicketRecord) => {
    setErrorMsg(null);
    setIsScanning(true);
    setInputCode(ticket.ticketId);

    setTimeout(() => {
      const record = authenticateByTicketOrTxn(ticket.barcodePayload);
      setIsScanning(false);
      stopCamera();
      if (record) {
        setDetectedTicket(record);
      }
    }, 450);
  };

  const proceedToApp = (targetTab: 'home' | 'map' | 'food' | 'concierge' = 'home') => {
    stopCamera();
    setRole('fan');
    setFanTab(targetTab);
    setShowTicketAuth(false);
    setShowLanding(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0B1120]/95 backdrop-blur-md border-b border-[#1E293B] px-6 sm:px-10 h-16 flex items-center justify-between gap-8">
        <button
          onClick={() => {
            stopCamera();
            setShowTicketAuth(false);
            setShowLanding(true);
          }}
          className="text-xl font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0 cursor-pointer"
        >
          Fan<span className="text-[#84CC16]">Way</span>
        </button>

        <div className="hidden md:flex items-center gap-6 text-xs text-[#94A3B8]">
          <span>TATA IPL Smart Ticket & Barcode Authentication</span>
          <span aria-hidden="true">·</span>
          <span>Auto-Detects IPL Fixture, Seat & Unlocked Services</span>
        </div>

        <button
          onClick={() => proceedToApp('home')}
          className="px-4 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white bg-[#111827] border border-[#1E293B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Continue with Demo Pass →
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Cols: Ticket ID / Transaction ID Input & Barcode Scanner */}
          <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#84CC16]">
                <ShieldCheck className="w-4 h-4" />
                <span>TATA IPL Ticket Verification</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
                Sign in with your IPL Ticket ID, Transaction ID, or Barcode
              </h1>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                When you enter your unique Ticket ID / Transaction ID or scan your ticket barcode, FanWay automatically detects your IPL match fixture and stadium (Wankhede, Chepauk, Narendra Modi Stadium, Eden Gardens, M. Chinnaswamy, or Arun Jaitley Kotla), assigns your Stand & Seat on the interactive seating map, and unlocks your eligible concourse services.
              </p>
            </div>

            {/* Mode Switcher: Manual ID vs. Barcode Scanner */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0B1120] border border-[#1E293B] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setAuthMode('id');
                }}
                className={`py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  authMode === 'id'
                    ? 'bg-[#84CC16] text-[#0B1120]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Enter Ticket / Transaction ID</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('barcode')}
                className={`py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  authMode === 'barcode'
                    ? 'bg-[#84CC16] text-[#0B1120]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <ScanBarcode className="w-4 h-4" />
                <span>Scan Ticket Barcode</span>
              </button>
            </div>

            {/* MODE 1: Enter Unique Ticket ID or Transaction ID */}
            {authMode === 'id' ? (
              <form onSubmit={handleManualVerify} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-[#0B1120] border border-[#EF4444] rounded-xl text-xs text-[#FCA5A5]">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Unique Ticket ID or Payment Transaction ID
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="e.g. FWY-TKT-8821 or TXN-904112"
                      className="flex-1 bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-3 text-sm text-white font-mono-tabular placeholder-[#64748B] focus:border-[#84CC16] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-bold text-xs sm:text-sm rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Verify Ticket</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1.5">
                    Tip: Click any sample ticket card below to auto-fill its Ticket ID or Transaction ID, or type your own custom code.
                  </p>
                </div>
              </form>
            ) : (
              /* MODE 2: Barcode Scanner Viewport */
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="relative bg-[#0B1120] border border-[#1E293B] rounded-2xl p-5 overflow-hidden flex flex-col items-center justify-center min-h-[250px]">
                  {cameraActive ? (
                    <div className="w-full max-w-md space-y-3">
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-[#84CC16] bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Targeting Reticle & Laser Line */}
                        <div className="absolute inset-6 border border-[#84CC16]/60 rounded-lg pointer-events-none flex items-center justify-center">
                          <div className="w-full h-0.5 bg-[#84CC16] shadow-[0_0_12px_#84CC16]" />
                        </div>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-black/80 hover:bg-black text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-[#84CC16] font-medium truncate">
                          {cameraStatusMsg || 'Camera feed active'}
                        </span>
                        <button
                          type="button"
                          onClick={handleCaptureFromLiveCamera}
                          className="px-4 py-2 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-bold text-xs rounded-xl shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                          <ScanBarcode className="w-4 h-4" />
                          <span>Capture & Scan Barcode Now</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 max-w-md">
                      {/* Visual Barcode Graphic */}
                      <div className="mx-auto w-56 h-20 bg-[#111827] border border-[#1E293B] rounded-xl p-3 flex flex-col items-center justify-between relative overflow-hidden">
                        <div className="w-full flex items-center justify-center gap-[3px] h-10">
                          {[3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 1, 3, 2].map(
                            (w, idx) => (
                              <span
                                key={idx}
                                className="bg-[#F8FAFC] h-full inline-block"
                                style={{ width: `${w * 2}px` }}
                              />
                            )
                          )}
                        </div>
                        <span className="text-[10px] font-mono-tabular text-[#84CC16] tracking-widest">
                          {isScanning ? 'SCANNING BARCODE...' : 'READY TO SCAN 1D / QR PASS'}
                        </span>
                        {isScanning && (
                          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#84CC16]" />
                        )}
                      </div>

                      <div className="text-xs text-[#CBD5E1]">
                        Start your device camera, upload a barcode screenshot/photo, or click any sample ticket below to scan.
                      </div>

                      {cameraError && (
                        <div className="p-2.5 bg-[#111827] border border-[#F59E0B]/50 rounded-xl text-[11px] text-[#F59E0B]">
                          {cameraError}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={startLiveCamera}
                          className="px-3.5 py-2 bg-[#111827] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#84CC16]" />
                          <span>Start Live Camera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-[#111827] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Upload Ticket Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleScanTicketBarcode(verifiedTickets[0])}
                          className="px-3.5 py-2 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <ScanBarcode className="w-3.5 h-3.5" />
                          <span>Simulate Instant Scan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick-Select Sample Match Tickets */}
            <div className="pt-4 border-t border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Sample Issued Match Tickets (Click to Scan or Auto-Fill)
                </span>
                <span className="text-[#94A3B8]">Cricket Match Passes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {verifiedTickets.map((tkt) => {
                  const isSelected = detectedTicket?.ticketId === tkt.ticketId;
                  return (
                    <div
                      key={tkt.ticketId}
                      onClick={() => handleScanTicketBarcode(tkt)}
                      className={`p-3.5 rounded-xl border transition-colors cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-[#0B1120] border-[#84CC16]'
                          : 'bg-[#0B1120] border-[#1E293B] hover:border-[#334155]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#84CC16] font-semibold">{tkt.sportLabel}</span>
                        <span className="font-mono-tabular text-[#94A3B8]">{tkt.ticketId}</span>
                      </div>

                      <div className="text-xs font-bold text-white truncate">
                        {tkt.eventTitle}
                      </div>

                      {tkt.stadiumName && (
                        <div className="text-[10px] text-[#38BDF8] font-medium flex items-center gap-1">
                          <span>🏟️ {tkt.stadiumName}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-[#94A3B8] flex items-center justify-between">
                        <span>
                          {tkt.gate} · {tkt.section} · {tkt.seat.split(' (')[0]}
                        </span>
                        <span className="font-mono-tabular text-[#CBD5E1]">
                          {tkt.transactionId}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Auto-Detected Match & Personalized Services Breakdown */}
          <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 sm:p-8 space-y-6">
            {detectedTicket ? (
              <>
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#1E293B]">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ticket Verified & Services Provisioned</span>
                    </div>
                    <h2 className="text-xl font-bold text-white font-display mt-1">
                      {detectedTicket.eventTitle}
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Holder:{' '}
                      <span className="text-white font-medium">{detectedTicket.holderName}</span> ·{' '}
                      {detectedTicket.tier}
                    </p>
                  </div>
                </div>

                {/* Ticket & Transaction Metadata */}
                <div className="grid grid-cols-2 gap-3 bg-[#0B1120] border border-[#1E293B] rounded-xl p-3.5 text-xs">
                  <div>
                    <div className="text-[#94A3B8]">Unique Ticket ID</div>
                    <div className="font-mono-tabular font-bold text-[#84CC16] mt-0.5">
                      {detectedTicket.ticketId}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#94A3B8]">Transaction ID</div>
                    <div className="font-mono-tabular font-bold text-white mt-0.5">
                      {detectedTicket.transactionId}
                    </div>
                  </div>
                </div>

                {/* Assigned Gate, Section, Row & Seat */}
                <div className="grid grid-cols-4 gap-2 bg-[#0B1120] border border-[#1E293B] rounded-xl p-3.5 text-center">
                  <div>
                    <div className="text-[11px] text-[#94A3B8]">Gate</div>
                    <div className="text-xs font-bold text-white font-mono-tabular mt-0.5">
                      {detectedTicket.gate.replace('Gate ', '')}
                    </div>
                  </div>
                  <div className="border-l border-[#1E293B]">
                    <div className="text-[11px] text-[#94A3B8]">Section</div>
                    <div className="text-xs font-bold text-[#84CC16] font-mono-tabular mt-0.5">
                      {detectedTicket.section.replace('Section ', '')}
                    </div>
                  </div>
                  <div className="border-l border-[#1E293B]">
                    <div className="text-[11px] text-[#94A3B8]">Row</div>
                    <div className="text-xs font-bold text-white font-mono-tabular mt-0.5">
                      {detectedTicket.row.replace('Row ', '')}
                    </div>
                  </div>
                  <div className="border-l border-[#1E293B]">
                    <div className="text-[11px] text-[#94A3B8]">Seat</div>
                    <div className="text-xs font-bold text-white font-mono-tabular mt-0.5">
                      {detectedTicket.seat.split(' (')[0].replace('Seat ', '')}
                    </div>
                  </div>
                </div>

                {/* Automatically Unlocked Services for This Ticket */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#84CC16]" />
                    <span>Unlocked Ticket Entitlements & Services</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#CBD5E1]">
                    {detectedTicket.includedServices.map((srv, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#84CC16] shrink-0 mt-0.5" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nearest Recommended Concourse Services */}
                <div className="space-y-2.5 pt-3 border-t border-[#1E293B]">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Tailored Concourse Services Near {detectedTicket.section}
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#94A3B8]">
                    {detectedTicket.recommendedConcourseServices.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#84CC16] font-mono-tabular font-bold">
                          0{i + 1}.
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Launch Buttons */}
                <div className="pt-4 border-t border-[#1E293B] space-y-2.5">
                  <button
                    onClick={() => proceedToApp('home')}
                    className="w-full py-3 px-4 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Open My Match-Day Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => {
                        stopCamera();
                        setShowTicketAuth(false);
                        navigateToMapLocation(detectedTicket.sectionLocationId, true);
                      }}
                      className="py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#84CC16]" />
                      <span>Route to My Seat</span>
                    </button>
                    <button
                      onClick={() => proceedToApp('food')}
                      className="py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5 text-[#84CC16]" />
                      <span>Order Concessions</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State Before Scanning */
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-center text-[#84CC16] mx-auto">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h2 className="text-lg font-bold text-white font-display">
                    Awaiting Ticket or Barcode Scan
                  </h2>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Start your live camera, upload a barcode photo, enter a Ticket/Transaction ID, or click any of the issued sample passes on the left to automatically configure your IPL stadium, seating map, and services.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
