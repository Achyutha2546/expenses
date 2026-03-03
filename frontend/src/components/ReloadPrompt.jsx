import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needUpdate: [needUpdate, setNeedUpdate],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered');
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedUpdate(false);
    };

    if (!offlineReady && !needUpdate) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-[#161821]/90 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
            <div className="flex flex-col gap-1 text-center">
                {offlineReady ? (
                    <p className="text-sm font-medium text-white/90">App is ready to work offline!</p>
                ) : (
                    <p className="text-sm font-medium text-white/90">New content available, click on reload button to update.</p>
                )}
            </div>
            <div className="flex w-full gap-2">
                {needUpdate && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:scale-95"
                    >
                        Reload
                    </button>
                )}
                <button
                    onClick={close}
                    className="flex-1 rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 active:scale-95"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

export default ReloadPrompt;
