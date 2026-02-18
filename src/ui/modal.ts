export const buildModalBackdrop = (closeAction: string): string => `
  <div class="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm">
    <button
      type="button"
      data-action="${closeAction}"
      class="h-full w-full cursor-default"
      aria-label="Close modal"
    ></button>
  </div>
`
