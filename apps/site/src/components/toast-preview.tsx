"use client";

import { Button, toast, Toaster } from "@cadence-clinical/ui";

/** A live toast for the docs. The toasts appear in the corner of the window, as in an app. */
export function ToastPreview() {
  return (
    <div className="not-prose preview-surface my-6 flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-lg border p-6">
      <Toaster>
        <Button
          onClick={() => {
            toast.add({
              title: "Letter saved",
              description: "The referrer's copy is in the outbox.",
              type: "success",
            });
          }}
        >
          Save letter
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.add({
              title: "Letter archived",
              actionProps: {
                children: "Undo",
                onClick: () => {
                  toast.add({ title: "Letter restored", type: "info" });
                },
              },
            });
          }}
        >
          Archive letter
        </Button>
      </Toaster>
    </div>
  );
}
