// Shared layout for OBS overlay pages.
// Resets body styles so overlays render edge-to-edge with no chrome.
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #000;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
      `}</style>
      {children}
    </>
  )
}
