import { Loader2, Server, Wallet } from "lucide-react";

/**
 * OverlayLoader Component
 * 
 * Reusable lightweight dimmed overlay loader.
 * Renders a semi-transparent dimmed background (50% opacity) that disables pointer interaction
 * with the underlying screen while showing a centered loader card with action message and subtext.
 */
function OverlayLoader({ 
    show = false, 
    message = "Processing request...", 
    subtext = "",
    isWakingUp = false
}) {
    if (!show && !isWakingUp) return null;

    const displayMessage = isWakingUp 
        ? "Server is waking up, hang tight..." 
        : message;

    const displaySubtext = isWakingUp 
        ? "Render free instances take a few seconds to start up." 
        : subtext;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto select-none transition-all duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={displayMessage}
        >
            <div className="bg-white/95 rounded-3xl p-6 sm:p-8 max-w-xs sm:max-w-sm w-full mx-4 shadow-2xl border border-slate-200/80 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
                {/* Icon Container with Theme Color Styling */}
                <div className="relative mb-4 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                        {isWakingUp ? (
                            <Server size={28} className="animate-pulse stroke-[2.2]" />
                        ) : (
                            <Wallet size={28} className="stroke-[2.2]" />
                        )}
                    </div>
                    {/* Spinning loader ring around/over icon */}
                    <div className="absolute -inset-1 rounded-3xl border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                </div>

                {/* Message Heading */}
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-snug">
                    {displayMessage}
                </h3>

                {/* Subtext info */}
                {displaySubtext && (
                    <p className="mt-2 text-xs text-slate-500 font-medium max-w-[240px] leading-relaxed">
                        {displaySubtext}
                    </p>
                )}

                {/* Status Indicator Pill */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/60 text-[11px] font-semibold text-slate-600">
                    <Loader2 size={12} className="animate-spin text-emerald-600" />
                    <span>Please wait...</span>
                </div>
            </div>
        </div>
    );
}

export default OverlayLoader;
